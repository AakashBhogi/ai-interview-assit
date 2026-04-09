import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const config = { runtime: 'nodejs' };

export default async function handler(req) {
  const { question, history = [] } = await req.json();

  const messages = [
    { role: 'system', content: 'You are an expert interview coach. Give concise, confident answers. Format: 1 direct answer sentence, then 2-3 bullet points. Max 100 words. No filler phrases.' },
    ...history,
    { role: 'user', content: question }
  ];

  const stream = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    stream: true,
    max_tokens: 180,
    temperature: 0.3
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    }
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}
