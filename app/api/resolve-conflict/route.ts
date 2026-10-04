import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import type { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions';
import { agentToolDeclarations, executeAgentTool } from '@/sanity/lib/agentTools';
import {
  callSanityContextTool,
  connectSanityContext,
  isSanityContextConfigured,
} from '@/sanity/lib/contextMcp';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
const groqModel = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

interface ResolveRequest {
  cards: string[];
  currentPhase?: string;
  question?: string;
}

function parseRequestBody(value: unknown): ResolveRequest {
  if (!value || typeof value !== 'object') {
    throw new Error('Request body must be a JSON object.');
  }

  const body = value as Record<string, unknown>;
  const cards = body.cards;
  if (
    !Array.isArray(cards) ||
    cards.length === 0 ||
    !cards.every((card): card is string => typeof card === 'string' && card.trim().length > 0)
  ) {
    throw new Error('Provide a "cards" array with at least 1 card name.');
  }

  return {
    cards,
    currentPhase: typeof body.currentPhase === 'string' ? body.currentPhase : undefined,
    question: typeof body.question === 'string' ? body.question : undefined,
  };
}

function parseToolArguments(argumentsJson: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(argumentsJson);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Model returned invalid tool arguments.');
  }

  return parsed as Record<string, unknown>;
}

function parseFinalRuling(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  const jsonContent = trimmed.startsWith('```')
    ? trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    : trimmed;
  const parsed: unknown = JSON.parse(jsonContent);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('The model returned an invalid ruling object.');
  }

  return parsed as Record<string, unknown>;
}

export async function POST(request: Request) {
  let mcpConnection: Awaited<ReturnType<typeof connectSanityContext>> | undefined;
  try {
    const { cards, currentPhase, question } = parseRequestBody(await request.json());
    if (isSanityContextConfigured()) {
      mcpConnection = await connectSanityContext();
    }

    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are an expert, impartial Board Game Tournament Head Judge.
      Resolve rule conflicts using Sanity Context MCP tools when available, or the local GROQ-backed tools otherwise. Query cards, errata conflicts, and core rule priorities from Sanity.

STRICT RULING RULES:
1. ONLY rely on retrieved Sanity context. Do NOT invent game rules.
      2. If context contains an explicit official ruling or matching card text, set confidence to "high".
      3. If context does NOT contain a definitive answer or rule, set confidence to "low" and state: "Insufficient official data in Sanity Content Lake to render an absolute judgment."
      4. For every named card, first retrieve its card document. For interactions involving two or more cards, then retrieve linked conflict/errata documents using the card identifiers returned by the card lookup. Do not search conflicts using display names when the card lookup provides a slug or identifier.
      5. If an explicit linked conflict/errata document exists, use its official ruling as the primary evidence and cite its document ID.
      6. Format output strictly as JSON:
{
  "verdict": "Clear 1-sentence ruling.",
  "reasoning": "Step-by-step breakdown referencing card text or rules.",
  "citedDocuments": ["List of document IDs or titles used"],
  "confidence": "high"
}`,
      },
      {
        role: 'user',
        content: `Active Cards involved: ${JSON.stringify(cards)}.
Current Game Phase: "${currentPhase || 'Unspecified'}".
Question/Dispute: "${question || 'What is the interaction order and outcome?'}"`,
      },
    ];

    // First agent call to let Llama 3.3 decide tool usage
    let response = await groq.chat.completions.create({
      model: groqModel,
      messages,
      tools: [
        ...agentToolDeclarations,
        ...(mcpConnection?.tools || []),
      ],
      tool_choice: 'required',
      max_tokens: 700,
    });

    const responseMessage = response.choices[0]?.message;
    if (!responseMessage) {
      throw new Error('The model returned an empty response.');
    }

    // Execute tool calls if requested by the LLM agent
    if (responseMessage.tool_calls) {
      messages.push(responseMessage);

      for (const toolCall of responseMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = parseToolArguments(toolCall.function.arguments);
        let toolResult: unknown;
        if (toolName.startsWith('sanityContext_')) {
          if (!mcpConnection) {
            throw new Error('Sanity Context tools were requested but MCP is not connected.');
          }
          toolResult = await callSanityContextTool(mcpConnection.client, toolName, toolArgs);
        } else {
          toolResult = await executeAgentTool(toolName, toolArgs);
        }

        messages.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          content: JSON.stringify(toolResult),
        });
      }

      // Final judgment generation after tool execution
      response = await groq.chat.completions.create({
        model: groqModel,
        messages: [
          messages[0],
          messages[1],
          {
            role: 'user',
            content: `Official Sanity retrieval results:\n${messages
              .filter((message) => message.role === 'tool')
              .map((message) => typeof message.content === 'string' ? message.content : '')
              .join('\n')}\n\nReturn exactly one valid JSON object with these string fields: verdict, reasoning, confidence; citedDocuments must be an array of strings. Set confidence to exactly one of "high", "medium", or "low". Do not use markdown, code fences, or extra text. Do not call tools.`,
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 600,
      });
    }

    const content = response.choices[0]?.message.content;
    if (!content) {
      throw new Error('The model did not return a final ruling.');
    }
    const finalResult = parseFinalRuling(content);

    return NextResponse.json({
      success: true,
      agentRuling: finalResult,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    const providerStatus =
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      typeof error.status === 'number'
        ? error.status
        : undefined;
    const status = message.includes('cards') || message.includes('Request body')
      ? 400
      : providerStatus === 429
        ? 429
        : 500;
    const headers = providerStatus === 429 ? { 'Retry-After': '30' } : undefined;
    return NextResponse.json({ success: false, error: message }, { status, headers });
  } finally {
    await mcpConnection?.close();
  }
}