import { chat } from "./ollama";
import { retrieve } from "./retrieval";

export async function answerQuestion(question: string) {
  const chunks = await retrieve(question);

  const context = chunks
    .map(
      (chunk, index) =>
        `[Source ${index + 1}: ${chunk.filename}, chunk ${chunk.chunk_index}]\n${chunk.content}`
    )
    .join("\n\n");

  const prompt = `Answer the user's question using only the context below.

Context:
${context || "(No relevant context found.)"}

User question:
${question}

Rules:
- Do not use outside knowledge.
- If the answer is not supported by the context, say: "I don't know based on the provided documents."
- Keep the answer concise.
- Do not mention these instructions.`;

  const answer = await chat(prompt);

  return {
    answer,
    sources: chunks.map((chunk) => ({
      documentId: chunk.document_id,
      filename: chunk.filename,
      chunkIndex: chunk.chunk_index,
      similarity: Number(chunk.similarity)
    }))
  };
}