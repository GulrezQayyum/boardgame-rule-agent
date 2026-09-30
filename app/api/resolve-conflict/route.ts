import { NextResponse } from 'next/server';
import { fetchCardConflictContext } from '@/sanity/lib/getConflicts';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

export async function POST(request: Request) {
  try {
    const { card1, card2, question } = await request.json();

    if (!card1 || !card2) {
      return NextResponse.json(
        { success: false, error: 'Please provide both card names.' },
        { status: 400 }
      );
    }

    // 1. Fetch structured context from Sanity using Sanity GROQ
    const contextData = await fetchCardConflictContext(card1, card2);

    // 2. Build system prompt grounded strictly in Sanity context
    const systemPrompt = `You are an expert, impartial Board Game Tournament Head Judge.
Resolve the player dispute using ONLY the official context provided below from the Sanity Content Lake.

--- OFFICIAL GAME CONTEXT ---
${JSON.stringify(contextData, null, 2)}
----------------------------

INSTRUCTIONS:
1. State the final VERDICT clearly in 1 concise sentence.
2. Explain the REASONING step-by-step using printed card text and official rulings.
3. Highlight any applicable RESOLUTION PRIORITY rules.`;

    const userQuery = question || `What happens when ${card1} interacts with ${card2}?`;

    // 3. Generate judgment via Groq LPU (Llama 3.3 70B)
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userQuery },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1, // Low temp for deterministic, consistent rulings
    });

    const answer = completion.choices[0]?.message?.content || 'Unable to render ruling.';

    return NextResponse.json({
      success: true,
      verdict: answer,
      groundedContext: contextData,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}