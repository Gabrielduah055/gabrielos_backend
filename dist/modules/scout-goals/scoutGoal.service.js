"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listScoutGoalsForUser = listScoutGoalsForUser;
exports.findScoutGoalForUser = findScoutGoalForUser;
exports.createScoutGoalForUser = createScoutGoalForUser;
exports.updateScoutGoalForUser = updateScoutGoalForUser;
exports.deleteScoutGoalForUser = deleteScoutGoalForUser;
const db_1 = __importDefault(require("../../config/db"));
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
async function listScoutGoalsForUser(userId) {
    const result = await db_1.default.query(`${scoutGoalSelect} WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
    return result.rows;
}
async function findScoutGoalForUser(userId, id) {
    const result = await db_1.default.query(`${scoutGoalSelect} WHERE user_id = $1 AND id = $2 LIMIT 1`, [userId, id]);
    return result.rows[0] ?? null;
}
async function createScoutGoalForUser(userId, input) {
    const result = await db_1.default.query(`
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
    `, [
        userId,
        input.title,
        input.type ?? null,
        input.keywords ?? null,
        input.location ?? null,
        input.sources ?? null,
        input.frequency ?? null,
        input.minimumScore ?? null,
        input.isActive ?? null,
    ]);
    return result.rows[0];
}
async function updateScoutGoalForUser(userId, id, input) {
    const updates = [];
    const values = [];
    const addUpdate = (column, value) => {
        values.push(value);
        updates.push(`${column} = $${values.length}`);
    };
    if (input.title !== undefined)
        addUpdate("title", input.title);
    if (input.type !== undefined)
        addUpdate("type", input.type);
    if (input.keywords !== undefined)
        addUpdate("keywords", input.keywords);
    if (input.location !== undefined)
        addUpdate("location", input.location);
    if (input.sources !== undefined)
        addUpdate("sources", input.sources);
    if (input.frequency !== undefined)
        addUpdate("frequency", input.frequency);
    if (input.minimumScore !== undefined)
        addUpdate("minimum_score", input.minimumScore);
    if (input.isActive !== undefined)
        addUpdate("is_active", input.isActive);
    if (updates.length === 0) {
        return findScoutGoalForUser(userId, id);
    }
    values.push(userId, id);
    const result = await db_1.default.query(`
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
    `, values);
    return result.rows[0] ?? null;
}
async function deleteScoutGoalForUser(userId, id) {
    const result = await db_1.default.query(`
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
    `, [userId, id]);
    return result.rows[0] ?? null;
}
//# sourceMappingURL=scoutGoal.service.js.map