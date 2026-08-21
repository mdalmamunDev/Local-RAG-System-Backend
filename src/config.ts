import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 8080),
  databaseUrl: process.env.DATABASE_URL ?? "postgresql://rag:ragpassword@localhost:5433/ragdb",
  ollamaHost: process.env.OLLAMA_HOST ?? "http://localhost:11434",
  chatModel: process.env.OLLAMA_CHAT_MODEL ?? "llama3.1:8b",
  embedModel: process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text",
  topK: Number(process.env.TOP_K ?? 5),
  chunkSize: Number(process.env.CHUNK_SIZE ?? 1000),
  chunkOverlap: Number(process.env.CHUNK_OVERLAP ?? 200)
};