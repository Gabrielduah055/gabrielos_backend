import pool from "../../config/db";
import { ScoutGoalFrequency, ScoutGoalType } from "../opportunities/opportunity.constants";

export interface ScoutGoal {
  id: number;
  userId: number;
  title: string;
  type: ScoutGoalType;
  keywords: string | null;
  location: string | null;
  sources: string | null;
  frequency: ScoutGoalFrequency;
  minimumScore: number;
  isActive: boolean;
  lastRunAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateScoutGoalInput {
  title: string;
  type?: ScoutGoalType | null;
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
    last_run_at AS "lastRunAt",
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
        last_run_at AS "lastRunAt",
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
        last_run_at AS "lastRunAt",
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
        last_run_at AS "lastRunAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [userId, id]
  );

  return result.rows[0] ?? null;
}

export async function markScoutGoalRun(id: number): Promise<void> {
  await pool.query(
    `UPDATE scout_goals SET last_run_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [id]
  );
}

const FREQUENCY_INTERVALS_MS: Record<ScoutGoalFrequency, number> = {
  daily: 20 * 60 * 60 * 1000, // ~20h, so a job scheduled once/day always catches it
  weekly: 6.5 * 24 * 60 * 60 * 1000,
  monthly: 27 * 24 * 60 * 60 * 1000,
};

export function isScoutGoalDue(goal: ScoutGoal, now: Date = new Date()): boolean {
  if (!goal.isActive) {
    return false;
  }

  if (!goal.lastRunAt) {
    return true;
  }

  const interval = FREQUENCY_INTERVALS_MS[goal.frequency] ?? FREQUENCY_INTERVALS_MS.weekly;
  const lastRunTime = new Date(goal.lastRunAt).getTime();

  return now.getTime() - lastRunTime >= interval;
}
