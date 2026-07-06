import { NextRequest, NextResponse } from 'next/server';
import { getUniversities } from '@/lib/data';

async function buildContext(): Promise<string> {
  const universities = (await getUniversities()).slice(0, 10); // Limit context size
  return universities
    .map((u) => {
      const scholarships = u.scholarships.map((s) => s.scholarship_name).filter(Boolean).join(', ');
      const programs = u.programs.slice(0, 5).map((p) => p.program_name).join(', ');
      return `${u.name} (${u.shortName}): ${u.universityType} university in ${u.city}. Est. ${u.yearEstablished ?? 'N/A'}. Programs: ${programs || 'N/A'}. Scholarships: ${scholarships || 'None listed'}. HEC: ${u.hecStatus ?? 'Recognized'}.`;
    })
    .join('\n');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { message: string; history?: { role: string; content: string }[] };
    const { message, history = [] } = body;

    const context = await buildContext();
    const systemPrompt = `You are FuturePath AI Counselor, an expert on Pakistani universities and career guidance for Pakistani students. 

Here is the verified university database context:
${context}

Guidelines:
- Be concise, helpful, and encouraging
- Use Pakistani context (PKR, local universities, MDCAT, ECAT, NTS, etc.)
- When asked about admissions, mention merit ranges and entry tests
- When asked about careers, mention both local and international opportunities
- Format responses with bullet points and clear structure
- Always remind students to verify from official university websites
- If you don't have specific data, say so honestly`;

    // Try OpenAI
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: message },
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: 600, temperature: 0.7 }),
      });

      if (response.ok) {
        const data = await response.json() as { choices: { message: { content: string } }[] };
        return NextResponse.json({ reply: data.choices[0].message.content });
      }
    }

    // Try Gemini
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      const conversationHistory = history.slice(-6).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [
              ...conversationHistory,
              { role: 'user', parts: [{ text: message }] },
            ],
            generationConfig: { maxOutputTokens: 600, temperature: 0.7 },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json() as { candidates: { content: { parts: { text: string }[] } }[] };
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'I could not generate a response.';
        return NextResponse.json({ reply });
      }
    }

    // No API key — return 503 so client falls back to demo mode
    return NextResponse.json({ error: 'No AI API key configured' }, { status: 503 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
