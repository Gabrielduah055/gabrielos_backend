"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listOpportunitiesForUser = listOpportunitiesForUser;
exports.findOpportunityForUser = findOpportunityForUser;
exports.createOpportunityForUser = createOpportunityForUser;
exports.updateOpportunityForUser = updateOpportunityForUser;
exports.deleteOpportunityForUser = deleteOpportunityForUser;
const db_1 = __importDefault(require("../../config/db"));
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
async function candidateBelongsToUser(userId, candidateId) {
    const result = await db_1.default.query("SELECT id FROM opportunity_candidates WHERE id = $1 AND user_id = $2 LIMIT 1", [candidateId, userId]);
    return (result.rowCount ?? 0) > 0;
}
async function listOpportunitiesForUser(userId) {
    const result = await db_1.default.query(`${opportunitySelect} WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
    return result.rows;
}
async function findOpportunityForUser(userId, id) {
    const result = await db_1.default.query(`${opportunitySelect} WHERE user_id = $1 AND id = $2 LIMIT 1`, [userId, id]);
    return result.rows[0] ?? null;
}
async function createOpportunityForUser(userId, input) {
    if (input.candidateId !== undefined &&
        input.candidateId !== null &&
        !(await candidateBelongsToUser(userId, input.candidateId))) {
        throw new Error("Candidate was not found for this user.");
    }
    const result = await db_1.default.query(`
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
    `, [
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
    ]);
    return result.rows[0];
}
async function updateOpportunityForUser(userId, id, input) {
    if (input.candidateId !== undefined &&
        input.candidateId !== null &&
        !(await candidateBelongsToUser(userId, input.candidateId))) {
        throw new Error("Candidate was not found for this user.");
    }
    const updates = [];
    const values = [];
    const addUpdate = (column, value) => {
        values.push(value);
        updates.push(`${column} = $${values.length}`);
    };
    if (input.candidateId !== undefined)
        addUpdate("candidate_id", input.candidateId);
    if (input.title !== undefined)
        addUpdate("title", input.title);
    if (input.type !== undefined)
        addUpdate("type", input.type);
    if (input.organization !== undefined)
        addUpdate("organization", input.organization);
    if (input.source !== undefined)
        addUpdate("source", input.source);
    if (input.status !== undefined)
        addUpdate("status", input.status);
    if (input.deadline !== undefined)
        addUpdate("deadline", input.deadline);
    if (input.priority !== undefined)
        addUpdate("priority", input.priority);
    if (input.nextAction !== undefined)
        addUpdate("next_action", input.nextAction);
    if (input.link !== undefined)
        addUpdate("link", input.link);
    if (input.notes !== undefined)
        addUpdate("notes", input.notes);
    if (updates.length === 0) {
        return findOpportunityForUser(userId, id);
    }
    values.push(userId, id);
    const result = await db_1.default.query(`
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
    `, values);
    return result.rows[0] ?? null;
}
async function deleteOpportunityForUser(userId, id) {
    const result = await db_1.default.query(`
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
    `, [userId, id]);
    return result.rows[0] ?? null;
}
//# sourceMappingURL=opportunity.service.js.map