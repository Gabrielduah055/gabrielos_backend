import pool from "../../config/db";
import { OpportunityPriority, OpportunityStatus, OpportunityType } from "./opportunity.constants";

export interface Opportunity {
  id: number;
  userId: number;
  candidateId: number | null;
  title: string;
  type: OpportunityType | null;
  organization: string | null;
  source: string | null;
  status: OpportunityStatus;
  deadline: Date | null;
  priority: OpportunityPriority;
  nextAction: string | null;
  link: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOpportunityInput {
  candidateId?: number | null;
  title: string;
  type?: OpportunityType | null;
  organization?: string | null;
  source?: string | null;
  status?: OpportunityStatus | null;
  deadline?: string | null;
  priority?: OpportunityPriority | null;
  nextAction?: string | null;
  link?: string | null;
  notes?: string | null;
}

export type UpdateOpportunityInput = Partial<CreateOpportunityInput>;

const opportunitySelect = `
  SELECT
    id,
    user_id AS "userId",
    candidate_id AS "candidateId",
    title,
    type,
    organization,
    source,
    status,
    deadline,
    priority,
    next_action AS "nextAction",
    link,
    notes,
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  FROM opportunities
`;

async function candidateBelongsToUser(
  userId: number,
  candidateId: number
): Promise<boolean> {
  const result = await pool.query(
    "SELECT id FROM opportunity_candidates WHERE id = $1 AND user_id = $2 LIMIT 1",
    [candidateId, userId]
  );

  return (result.rowCount ?? 0) > 0;
}

export async function listOpportunitiesForUser(
  userId: number
): Promise<Opportunity[]> {
  const result = await pool.query<Opportunity>(
    `${opportunitySelect} WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
}

export async function findOpportunityForUser(
  userId: number,
  id: number
): Promise<Opportunity | null> {
  const result = await pool.query<Opportunity>(
    `${opportunitySelect} WHERE user_id = $1 AND id = $2 LIMIT 1`,
    [userId, id]
  );

  return result.rows[0] ?? null;
}

export async function createOpportunityForUser(
  userId: number,
  input: CreateOpportunityInput
): Promise<Opportunity> {
  if (
    input.candidateId !== undefined &&
    input.candidateId !== null &&
    !(await candidateBelongsToUser(userId, input.candidateId))
  ) {
    throw new Error("Candidate was not found for this user.");
  }

  const result = await pool.query<Opportunity>(
    `
      INSERT INTO opportunities (
        user_id,
        candidate_id,
        title,
        type,
        organization,
        source,
        status,
        deadline,
        priority,
        next_action,
        link,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'saved'), $8, COALESCE($9, 'medium'), $10, $11, $12)
      RETURNING
        id,
        user_id AS "userId",
        candidate_id AS "candidateId",
        title,
        type,
        organization,
        source,
        status,
        deadline,
        priority,
        next_action AS "nextAction",
        link,
        notes,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [
      userId,
      input.candidateId ?? null,
      input.title,
      input.type ?? null,
      input.organization ?? null,
      input.source ?? null,
      input.status ?? null,
      input.deadline ?? null,
      input.priority ?? null,
      input.nextAction ?? null,
      input.link ?? null,
      input.notes ?? null,
    ]
  );

  return result.rows[0];
}

export async function updateOpportunityForUser(
  userId: number,
  id: number,
  input: UpdateOpportunityInput
): Promise<Opportunity | null> {
  if (
    input.candidateId !== undefined &&
    input.candidateId !== null &&
    !(await candidateBelongsToUser(userId, input.candidateId))
  ) {
    throw new Error("Candidate was not found for this user.");
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  const addUpdate = (column: string, value: unknown) => {
    values.push(value);
    updates.push(`${column} = $${values.length}`);
  };

  if (input.candidateId !== undefined) addUpdate("candidate_id", input.candidateId);
  if (input.title !== undefined) addUpdate("title", input.title);
  if (input.type !== undefined) addUpdate("type", input.type);
  if (input.organization !== undefined) addUpdate("organization", input.organization);
  if (input.source !== undefined) addUpdate("source", input.source);
  if (input.status !== undefined) addUpdate("status", input.status);
  if (input.deadline !== undefined) addUpdate("deadline", input.deadline);
  if (input.priority !== undefined) addUpdate("priority", input.priority);
  if (input.nextAction !== undefined) addUpdate("next_action", input.nextAction);
  if (input.link !== undefined) addUpdate("link", input.link);
  if (input.notes !== undefined) addUpdate("notes", input.notes);

  if (updates.length === 0) {
    return findOpportunityForUser(userId, id);
  }

  values.push(userId, id);

  const result = await pool.query<Opportunity>(
    `
      UPDATE opportunities
      SET
        ${updates.join(", ")},
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $${values.length - 1} AND id = $${values.length}
      RETURNING
        id,
        user_id AS "userId",
        candidate_id AS "candidateId",
        title,
        type,
        organization,
        source,
        status,
        deadline,
        priority,
        next_action AS "nextAction",
        link,
        notes,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    values
  );

  return result.rows[0] ?? null;
}

export async function deleteOpportunityForUser(
  userId: number,
  id: number
): Promise<Opportunity | null> {
  const result = await pool.query<Opportunity>(
    `
      DELETE FROM opportunities
      WHERE user_id = $1 AND id = $2
      RETURNING
        id,
        user_id AS "userId",
        candidate_id AS "candidateId",
        title,
        type,
        organization,
        source,
        status,
        deadline,
        priority,
        next_action AS "nextAction",
        link,
        notes,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [userId, id]
  );

  return result.rows[0] ?? null;
}
