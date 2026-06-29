"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOpportunities = getAllOpportunities;
exports.createOpportunity = createOpportunity;
const db_1 = __importDefault(require("../../config/db"));
async function getAllOpportunities() {
    const result = await db_1.default.query("SELECT * FROM opportunities ORDER BY created_at DESC");
    return result.rows;
}
async function createOpportunity(input) {
    const result = await db_1.default.query(`
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
    `, [
        input.title,
        input.source ?? null,
        input.type ?? null,
        input.description,
        input.link ?? null,
        input.score ?? null,
        input.reason ?? null,
        input.next_action ?? null,
        input.status ?? "new",
    ]);
    return result.rows[0];
}
//# sourceMappingURL=opportunity.service.js.map