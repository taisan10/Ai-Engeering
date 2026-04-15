import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY!,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const stream = await openai.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages,
    stream: true, // 🔥 IMPORTANT
  });

  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new Response(readableStream);
}