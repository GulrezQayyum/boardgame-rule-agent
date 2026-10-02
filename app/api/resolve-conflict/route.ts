import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { agentToolDeclarations, executeAgentTool } from '@/sanity/lib/agentTools';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
const groqModel = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

export async function POST(request: Request) {
  try {
    const { cards, currentPhase, question } = await request.json();

    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Provide a "cards" array with at least 1 card name.' },
        { status: 400 }
      );
    }

    const messages: any[] = [
      {
        role: 'system',
        content: `You are an expert, impartial Board Game Tournament Head Judge.
      Resolve rule conflicts using tools to query official cards, errata conflicts, and core rule priorities from Sanity.

STRICT RULING RULES:
1. ONLY rely on retrieved Sanity context. Do NOT invent game rules.
      2. If context contains an explicit official ruling or matching card text, set confidence to "high".
      3. If context does NOT contain a definitive answer or rule, set confidence to "low" and state: "Insufficient official data in Sanity Content Lake to render an absolute judgment."
      4. Format output strictly as JSON:
{
  "verdict": "Clear 1-sentence ruling.",
  "reasoning": "Step-by-step breakdown referencing card text or rules.",
  "citedDocuments": ["List of document IDs or titles used"],
  "confidence": "high" | "medium" | "low"
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
      tools: agentToolDeclarations as any,
      tool_choice: 'required',
    });

    let responseMessage = response.choices[0].message;

    // Execute tool calls if requested by the LLM agent
    if (responseMessage.tool_calls) {
      messages.push(responseMessage);

      for (const toolCall of responseMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        const toolResult = await executeAgentTool(toolName, toolArgs);

        messages.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolName,
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
              .map((message) => message.content)
              .join('\n')}\n\nReturn the final ruling as JSON. Do not call tools.`,
          },
        ],
        response_format: { type: 'json_object' },
      });
    }

    const finalResult = JSON.parse(response.choices[0].message.content || '{}');

    return NextResponse.json({
      success: true,
      agentRuling: finalResult,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}