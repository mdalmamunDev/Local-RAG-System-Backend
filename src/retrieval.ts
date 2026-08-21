import { embed } from "./ollama";
import { pool, vectorToSql } from "./db";
import { config } from "./config";

export type RetrievedChunk = {
  id: string;
  document_id: string;
  filename: string;
  chunk_index: number;
  content: string;
  similarity: number;
};

export async function retrieve(
  question: string,
  topK = config.topK
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await embed(question);

  const result = await pool.query<RetrievedChunk>(
    `SELECT
       dc.id,
       dc.document_id,
       d.filename,
       dc.chunk_index,
       dc.content,
       1 - (dc.embedding <=> $1::vector) AS similarity
     FROM document_chunks dc
     JOIN documents d ON d.id = dc.document_id
     ORDER BY dc.embedding <=> $1::vector
     LIMIT $2`,
    [vectorToSql(queryEmbedding), topK]
  );

  return result.rows;
}