import pool from "../../config/db";
import { OpportunityType, ScoutGoalFrequency } from "../opportunities/opportunity.constants";

export interface ScoutGoal {
  id: number;
  userId: number;
  title: string;
  type: OpportunityType;
  keywords: string | null;
  location: string | null;
  sources: string | null;
  frequency: ScoutGoalFrequency;
  minimumScore: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateScoutGoalInput {
  title: string;
  type?: OpportunityType | null;
  keywords?: string | null;
  location?: string | null;
  sources?: string | null;
  frequency?: ScoutGoalFrequency | null;
  minimumScore?: number | null;
  isActive?: boolean;
}

export type UpdateScoutGoalInput = Partial<CreateScoutGoalInput>;

const scoutGoalSelect = `
  SELECT
    id,
    user_id AS "userId",
    title,
    type,
    keywords,
    location,
    sources,
    frequency,
    minimum_score AS "minimumScore",
    is_active AS "isActive",
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  FROM scout_goals
`;

export async function listScoutGoalsForUser(userId: number): Promise<ScoutGoal[]> {
  const result = await pool.query<ScoutGoal>(
    `${scoutGoalSelect} WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
}

export async function findScoutGoalForUser(
  userId: number,
  id: number
): Promise<ScoutGoal | null> {
  const result = await pool.query<ScoutGoal>(
    `${scoutGoalSelect} WHERE user_id = $1 AND id = $2 LIMIT 1`,
    [userId, id]
  );

  return result.rows[0] ?? null;
}

export async function createScoutGoalForUser(
  userId: number,
  input: CreateScoutGoalInput
): Promise<ScoutGoal> {
  const result = await pool.query<ScoutGoal>(
    `
      INSERT INTO scout_goals (
        user_id,
        title,
        type,
        keywords,
        location,
        sources,
        frequency,
        minimum_score,
        is_active
      )
      VALUES ($1, $2, COALESCE($3, 'other'), $4, $5, $6, COALESCE($7, 'weekly'), COALESCE($8, 70), COALESCE($9, true))
      RETURNING
        id,
        user_id AS "userId",
        title,
        type,
        keywords,
        location,
        sources,
        frequency,
        minimum_score AS "minimumScore",
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [
      userId,
      input.title,
      input.type ?? null,
      input.keywords ?? null,
      input.location ?? null,
      input.sources ?? null,
      input.frequency ?? null,
      input.minimumScore ?? null,
      input.isActive ?? null,
    ]
  );

  return result.rows[0];
}

export async function updateScoutGoalForUser(
  userId: number,
  id: number,
  input: UpdateScoutGoalInput
): Promise<ScoutGoal | null> {
  const updates: string[] = [];
  const values: unknown[] = [];

  const addUpdate = (column: string, value: unknown) => {
    values.push(value);
    updates.push(`${column} = $${values.length}`);
  };

  if (input.title !== undefined) addUpdate("title", input.title);
  if (input.type !== undefined) addUpdate("type", input.type);
  if (input.keywords !== undefined) addUpdate("keywords", input.keywords);
  if (input.location !== undefined) addUpdate("location", input.location);
  if (input.sources !== undefined) addUpdate("sources", input.sources);
  if (input.frequency !== undefined) addUpdate("frequency", input.frequency);
  if (input.minimumScore !== undefined) addUpdate("minimum_score", input.minimumScore);
  if (input.isActive !== undefined) addUpdate("is_active", input.isActive);

  if (updates.length === 0) {
    return findScoutGoalForUser(userId, id);
  }

  values.push(userId, id);

  const result = await pool.query<ScoutGoal>(
    `
      UPDATE scout_goals
      SET
        ${updates.join(", ")},
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $${values.length - 1} AND id = $${values.length}
      RETURNING
        id,
        user_id AS "userId",
        title,
        type,
        keywords,
        location,
        sources,
        frequency,
        minimum_score AS "minimumScore",
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    values
  );

  return result.rows[0] ?? null;
}

export async function deleteScoutGoalForUser(
  userId: number,
  id: number
): Promise<ScoutGoal | null> {
  const result = await pool.query<ScoutGoal>(
    `
      DELETE FROM scout_goals
      WHERE user_id = $1 AND id = $2
      RETURNING
        id,
        user_id AS "userId",
        title,
        type,
        keywords,
        location,
        sources,
        frequency,
        minimum_score AS "minimumScore",
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [userId, id]
  );

  return result.rows[0] ?? null;
}
