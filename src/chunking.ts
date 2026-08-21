export function chunkText(
  text: string,
  chunkSize: number,
  overlap: number
): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (!normalized) return [];
  if (overlap >= chunkSize) {
    throw new Error("CHUNK_OVERLAP must be smaller than CHUNK_SIZE");
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    const end = Math.min(start + chunkSize, normalized.length);
    const chunk = normalized.slice(start, end).trim();

    if (chunk) chunks.push(chunk);
    if (end >= normalized.length) break;

    start = end - overlap;
  }

  return chunks;
}