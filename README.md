# Node.js + Ollama + PostgreSQL/pgvector RAG

A minimal RAG system built from the fundamentals:

- Node.js + TypeScript
- Express
- Ollama
- `nomic-embed-text` embeddings
- `llama3.1:8b` generation
- PostgreSQL + pgvector
- PDF ingestion
- Cosine similarity retrieval

## Architecture

```text
PDF
 ↓
pdf-parse
 ↓
text chunks
 ↓
Ollama embedding
 ↓
PostgreSQL + pgvector
 ↓
question embedding
 ↓
top-K cosine similarity
 ↓
context
 ↓
Ollama LLM
 ↓
answer + sources
```

## Requirements

- Node.js 20+
- Docker
- Docker Compose
- At least enough RAM for the selected Ollama model

## 1. Configure

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

## 2. Start PostgreSQL and Ollama

```bash
docker compose up -d
```

Check:

```bash
docker compose ps
```

## 3. Download models

```bash
docker exec -it rag-ollama ollama pull nomic-embed-text
docker exec -it rag-ollama ollama pull llama3.1:8b
```

Check:

```bash
docker exec -it rag-ollama ollama list
```

## 4. Install Node dependencies

```bash
npm install
```

## 5. Run

```bash
npm run dev
```

API:

```text
http://localhost:8080
```

## 6. Health check

```bash
curl http://localhost:8080/health
```

## 7. Upload a PDF

Linux/macOS:

```bash
curl -X POST \
  -F "file=@./documents/company-policy.pdf" \
  http://localhost:8080/documents
```

PowerShell:

```powershell
curl.exe -X POST `
  -F "file=@.\documents\company-policy.pdf" `
  http://localhost:8080/documents
```

Example response:

```json
{
  "documentId": "uuid",
  "filename": "company-policy.pdf",
  "chunks": 12
}
```

## 8. Ask a question

```bash
curl -X POST http://localhost:8080/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"How many annual leave days are available?"}'
```

Example response:

```json
{
  "answer": "Employees are entitled to 20 days of annual leave.",
  "sources": [
    {
      "documentId": "uuid",
      "filename": "company-policy.pdf",
      "chunkIndex": 3,
      "similarity": 0.82
    }
  ]
}
```

## API

### GET /health

Checks the database.

### POST /documents

Multipart upload:

```text
file=<PDF>
```

### GET /documents

Lists indexed documents.

### DELETE /documents/:id

Deletes a document and all of its chunks.

### POST /chat

```json
{
  "question": "Your question"
}
```

## Important RAG concepts in this codebase

### Embedding

`src/ollama.ts`

```ts
embed(text)
```

Converts text into a vector.

### Chunking

`src/chunking.ts`

Breaks a document into overlapping pieces.

### Ingestion

`src/ingestion.ts`

```text
PDF → text → chunks → embeddings → PostgreSQL
```

### Retrieval

`src/retrieval.ts`

Uses pgvector cosine distance:

```sql
dc.embedding <=> $1::vector
```

Lower distance means more similar vectors.

### Generation

`src/rag.ts`

```text
question
+
retrieved chunks
↓
prompt
↓
Ollama
↓
answer
```

## Important limitation

This is intentionally a learning-oriented implementation.

It does not yet include:

- authentication
- authorization
- background ingestion jobs
- OCR for scanned PDFs
- document-level access control
- hybrid BM25/vector search
- reranking
- streaming
- conversation memory
- prompt-injection defenses beyond a basic system instruction
- RAG evaluation
- production observability

Those should be added after understanding the core pipeline.
