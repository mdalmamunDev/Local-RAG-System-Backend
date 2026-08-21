import express from "express";
import cors from "cors";
import { config } from "./config";
import { checkDatabase, pool } from "./db";
import ragRouter from "./module/rag/rag.router";

const app = express();

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

app.use("/rag", ragRouter);

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