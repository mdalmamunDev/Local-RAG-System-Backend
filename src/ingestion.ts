import { randomUUID } from "crypto";
import pdf from "pdf-parse";
import { pool, vectorToSql } from "./db";
import { embed } from "./ollama";
import { chunkText } from "./chunking";
import { config } from "./config";

export async function ingestPdf(
  buffer: Buffer,
  filename: string
) {
  const parsed = await pdf(buffer);

  if (!parsed.text?.trim()) {
    throw new Error("No readable text found in the PDF");
  }

  const chunks = chunkText(
    parsed.text,
    config.chunkSize,
    config.chunkOverlap
  );

  if (chunks.length === 0) {
    throw new Error("PDF produced no chunks");
  }

  const client = await pool.connect();
  const documentId = randomUUID();

  try {
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO documents (id, filename)
       VALUES ($1, $2)`,
      [documentId, filename]
    );

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await embed(chunks[i]);

      await client.query(
        `INSERT INTO document_chunks
          (id, document_id, chunk_index, content, embedding, metadata)
         VALUES ($1, $2, $3, $4, $5::vector, $6::jsonb)`,
        [
          randomUUID(),
          documentId,
          i,
          chunks[i],
          vectorToSql(embedding),
          JSON.stringify({
            filename,
            chunkIndex: i
          })
        ]
      );
    }

    await client.query("COMMIT");

    return {
      documentId,
      filename,
      chunks: chunks.length
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}