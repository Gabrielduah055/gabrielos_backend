"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCandidatesForUser = listCandidatesForUser;
exports.findCandidateForUser = findCandidateForUser;
exports.createCandidateForUser = createCandidateForUser;
exports.updateCandidateForUser = updateCandidateForUser;
exports.deleteCandidateForUser = deleteCandidateForUser;
exports.approveCandidateForUser = approveCandidateForUser;
exports.ignoreCandidateForUser = ignoreCandidateForUser;
const db_1 = __importDefault(require("../../config/db"));
const candidateSelect = `
  SELECT
    id,
    user_id AS "userId",
    scout_goal_id AS "scoutGoalId",
    title,
    type,
    organization,
    source,
    link,
    score,
    why_it_matters AS "whyItMatters",
    suggested_next_action AS "suggestedNextAction",
    deadline,
    status,
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  FROM opportunity_candidates
`;
async function scoutGoalBelongsToUser(userId, scoutGoalId) {
    const result = await db_1.default.query("SELECT id FROM scout_goals WHERE id = $1 AND user_id = $2 LIMIT 1", [scoutGoalId, userId]);
    return (result.rowCount ?? 0) > 0;
}
async function listCandidatesForUser(userId) {
    const result = await db_1.default.query(`${candidateSelect} WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
    return result.rows;
}
async function findCandidateForUser(userId, id) {
    const result = await db_1.default.query(`${candidateSelect} WHERE user_id = $1 AND id = $2 LIMIT 1`, [userId, id]);
    return result.rows[0] ?? null;
}
async function createCandidateForUser(userId, input) {
    if (input.scoutGoalId !== undefined &&
        input.scoutGoalId !== null &&
        !(await scoutGoalBelongsToUser(userId, input.scoutGoalId))) {
        throw new Error("Scout goal was not found for this user.");
    }
    const result = await db_1.default.query(`
      INSERT INTO opportunity_candidates (
        user_id,
        scout_goal_id,
        title,
        type,
        organization,
        source,
        link,
        score,
        why_it_matters,
        suggested_next_action,
        deadline,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, 0), $9, $10, $11, COALESCE($12, 'pending'))
      RETURNING
        id,
        user_id AS "userId",
        scout_goal_id AS "scoutGoalId",
        title,
        type,
        organization,
        source,
        link,
        score,
        why_it_matters AS "whyItMatters",
        suggested_next_action AS "suggestedNextAction",
        deadline,
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `, [
        userId,
        input.scoutGoalId ?? null,
        input.title,
        input.type ?? null,
        input.organization ?? null,
        input.source ?? null,
        input.link ?? null,
        input.score ?? null,
        input.whyItMatters ?? null,
        input.suggestedNextAction ?? null,
        input.deadline ?? null,
        input.status ?? null,
    ]);
    return result.rows[0];
}
async function updateCandidateForUser(userId, id, input) {
    if (input.scoutGoalId !== undefined &&
        input.scoutGoalId !== null &&
        !(await scoutGoalBelongsToUser(userId, input.scoutGoalId))) {
        throw new Error("Scout goal was not found for this user.");
    }
    const updates = [];
    const values = [];
    const addUpdate = (column, value) => {
        values.push(value);
        updates.push(`${column} = $${values.length}`);
    };
    if (input.scoutGoalId !== undefined)
        addUpdate("scout_goal_id", input.scoutGoalId);
    if (input.title !== undefined)
        addUpdate("title", input.title);
    if (input.type !== undefined)
        addUpdate("type", input.type);
    if (input.organization !== undefined)
        addUpdate("organization", input.organization);
    if (input.source !== undefined)
        addUpdate("source", input.source);
    if (input.link !== undefined)
        addUpdate("link", input.link);
    if (input.score !== undefined)
        addUpdate("score", input.score);
    if (input.whyItMatters !== undefined)
        addUpdate("why_it_matters", input.whyItMatters);
    if (input.suggestedNextAction !== undefined) {
        addUpdate("suggested_next_action", input.suggestedNextAction);
    }
    if (input.deadline !== undefined)
        addUpdate("deadline", input.deadline);
    if (input.status !== undefined)
        addUpdate("status", input.status);
    if (updates.length === 0) {
        return findCandidateForUser(userId, id);
    }
    values.push(userId, id);
    const result = await db_1.default.query(`
      UPDATE opportunity_candidates
      SET
        ${updates.join(", ")},
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $${values.length - 1} AND id = $${values.length}
      RETURNING
        id,
        user_id AS "userId",
        scout_goal_id AS "scoutGoalId",
        title,
        type,
        organization,
        source,
        link,
        score,
        why_it_matters AS "whyItMatters",
        suggested_next_action AS "suggestedNextAction",
        deadline,
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `, values);
    return result.rows[0] ?? null;
}
async function deleteCandidateForUser(userId, id) {
    const result = await db_1.default.query(`
      DELETE FROM opportunity_candidates
      WHERE user_id = $1 AND id = $2
      RETURNING
        id,
        user_id AS "userId",
        scout_goal_id AS "scoutGoalId",
        title,
        type,
        organization,
        source,
        link,
        score,
        why_it_matters AS "whyItMatters",
        suggested_next_action AS "suggestedNextAction",
        deadline,
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `, [userId, id]);
    return result.rows[0] ?? null;
}
async function approveCandidateForUser(userId, id) {
    const client = await db_1.default.connect();
    try {
        await client.query("BEGIN");
        const candidateResult = await client.query(`${candidateSelect} WHERE user_id = $1 AND id = $2 LIMIT 1 FOR UPDATE`, [userId, id]);
        const candidate = candidateResult.rows[0];
        if (!candidate) {
            await client.query("ROLLBACK");
            return null;
        }
        const existingOpportunity = await client.query(`
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
        WHERE user_id = $1 AND candidate_id = $2
        LIMIT 1
      `, [userId, id]);
        let opportunity = existingOpportunity.rows[0];
        if (!opportunity) {
            const opportunityResult = await client.query(`
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
          VALUES ($1, $2, $3, $4, $5, $6, 'saved', $7, 'medium', $8, $9, $10)
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
                id,
                candidate.title,
                candidate.type,
                candidate.organization,
                candidate.source,
                candidate.deadline,
                candidate.suggestedNextAction,
                candidate.link,
                candidate.whyItMatters,
            ]);
            opportunity = opportunityResult.rows[0];
        }
        const updatedCandidate = await client.query(`
        UPDATE opportunity_candidates
        SET status = 'approved', updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND id = $2
        RETURNING
          id,
          user_id AS "userId",
          scout_goal_id AS "scoutGoalId",
          title,
          type,
          organization,
          source,
          link,
          score,
          why_it_matters AS "whyItMatters",
          suggested_next_action AS "suggestedNextAction",
          deadline,
          status,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `, [userId, id]);
        await client.query("COMMIT");
        return {
            candidate: updatedCandidate.rows[0],
            opportunity,
        };
    }
    catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
    finally {
        client.release();
    }
}
async function ignoreCandidateForUser(userId, id) {
    const result = await db_1.default.query(`
      UPDATE opportunity_candidates
      SET status = 'ignored', updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND id = $2
      RETURNING
        id,
        user_id AS "userId",
        scout_goal_id AS "scoutGoalId",
        title,
        type,
        organization,
        source,
        link,
        score,
        why_it_matters AS "whyItMatters",
        suggested_next_action AS "suggestedNextAction",
        deadline,
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `, [userId, id]);
    return result.rows[0] ?? null;
}
//# sourceMappingURL=opportunityCandidate.service.js.map