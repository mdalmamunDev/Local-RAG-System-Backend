import express from "express";
import cors from "cors";
import multer from "multer";
import { config } from "./config";
import { checkDatabase, pool } from "./db";
import { ingestPdf } from "./ingestion";
import { answerQuestion } from "./rag";

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024
  }
});

app.use(cors());
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await checkDatabase();
    res.json({
      status: "ok",
      database: "ok"
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      message: error instanceof Error ? error.message : "Database unavailable"
    });
  }
});

app.post(
  "/documents",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "Upload a PDF using the 'file' field"
        });
      }

      if (req.file.mimetype !== "application/pdf") {
        return res.status(400).json({
          message: "Only PDF files are supported"
        });
      }

      const result = await ingestPdf(
        req.file.buffer,
        req.file.originalname
      );

      return res.status(201).json(result);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Document ingestion failed"
      });
    }
  }
);

app.post("/chat", async (req, res) => {
  try {
    const question = String(req.body?.question ?? "").trim();

    if (!question) {
      return res.status(400).json({
        message: "question is required"
      });
    }

    const result = await answerQuestion(question);

    return res.json(result);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "RAG request failed"
    });
  }
});

app.get("/documents", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         d.id,
         d.filename,
         d.created_at,
         COUNT(dc.id)::int AS chunks
       FROM documents d
       LEFT JOIN document_chunks dc
         ON dc.document_id = d.id
       GROUP BY d.id
       ORDER BY d.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to list documents"
    });
  }
});

app.delete("/documents/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM documents WHERE id = $1 RETURNING id, filename",
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Document not found"
      });
    }

    return res.json({
      message: "Document deleted",
      document: result.rows[0]
    });
  } catch (error) {
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to delete document"
    });
  }
});

app.use(
  (
    error: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(error);
    res.status(500).json({
      message: error.message || "Internal server error"
    });
  }
);

app.listen(config.port, () => {
  console.log(`RAG API running on http://localhost:${config.port}`);
});