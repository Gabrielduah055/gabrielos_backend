import fs from "fs/promises";
import path from "path";
import pool from "./db";

async function readSchemaFile() {
  const schemaPaths = [
    path.join(process.cwd(), "src", "database", "schema.sql"),
    path.join(process.cwd(), "dist", "database", "schema.sql"),
    path.join(__dirname, "..", "database", "schema.sql"),
  ];

  for (const schemaPath of schemaPaths) {
    try {
      return await fs.readFile(schemaPath, "utf8");
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;

      if (code !== "ENOENT") {
        throw error;
      }
    }
  }

  throw new Error("Database schema file was not found.");
}

export async function initDatabase() {
  const schema = await readSchemaFile();
  await pool.query(schema);
}
