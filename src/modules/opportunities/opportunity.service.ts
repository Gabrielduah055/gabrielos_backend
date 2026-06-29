import pool from "../../config/db";

export interface CreateOpportunityInput {
  title: string;
  source?: string | null;
  type?: string | null;
  description: string;
  link?: string | null;
  score?: number | null;
  reason?: string | null;
  next_action?: string | null;
  status?: string | null;
}

export async function getAllOpportunities() {
  const result = await pool.query(
    "SELECT * FROM opportunities ORDER BY created_at DESC"
  );

  return result.rows;
}

export async function createOpportunity(input: CreateOpportunityInput) {
  const result = await pool.query(
    `
      INSERT INTO opportunities (
        title,
        source,
        type,
        description,
        link,
        score,
        reason,
        next_action,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
    [
      input.title,
      input.source ?? null,
      input.type ?? null,
      input.description,
      input.link ?? null,
      input.score ?? null,
      input.reason ?? null,
      input.next_action ?? null,
      input.status ?? "new",
    ]
  );

  return result.rows[0];
}
