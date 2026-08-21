import { Ollama } from "ollama";
import { config } from "./config";

export const ollama = new Ollama({
  host: config.ollamaHost
});

export async function embed(text: string): Promise<number[]> {
  const response = await ollama.embed({
    model: config.embedModel,
    input: text
  });

  const vector = response.embeddings?.[0];

  if (!vector) {
    throw new Error("Ollama returned no embedding");
  }

  return vector;
}

export async function chat(prompt: string): Promise<string> {
  const response = await ollama.chat({
    model: config.chatModel,
    messages: [
      {
        role: "system",
        content:
          "You are a document question-answering assistant. Use only the supplied context. If the context does not contain the answer, say you do not know. Do not invent facts."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    options: {
      temperature: 0
    }
  });

  return response.message.content;
}