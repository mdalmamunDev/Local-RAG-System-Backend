import { pool } from "../../db";
import { ingestPdf } from "../../ingestion";
import { answerQuestion } from "../../rag";

class Controller {
  insertDocument = async (req: any, res: any) => {
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

  listDocuments = async (req: any, res: any) => {
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
  };

  deleteDocument = async (req: any, res: any) => {
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
  }

  chat = async (req: any, res: any) => {
    try {
      const question = String(req.body?.question ?? "").trim();

      if (!question) { return res.status(400).json({ message: "question is required" }); }

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
  }
}

export const RagController = new Controller();