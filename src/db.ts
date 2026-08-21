import { Pool } from "pg";
import { config } from "./config";

export const pool = new Pool({
  connectionString: config.databaseUrl
});

export async function checkDatabase() {
  await pool.query("SELECT 1");
}

export function vectorToSql(vector: number[]): string {
  return `[${vector.join(",")}]`;
}