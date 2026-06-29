"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserByFirebaseUid = findUserByFirebaseUid;
exports.createUser = createUser;
exports.updateUserProfile = updateUserProfile;
const db_1 = __importDefault(require("../config/db"));
const userSelect = `
  SELECT
    id,
    firebase_uid AS "firebaseUid",
    email,
    first_name AS "firstName",
    last_name AS "lastName",
    role,
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  FROM users
`;
async function findUserByFirebaseUid(firebaseUid) {
    const result = await db_1.default.query(`${userSelect} WHERE firebase_uid = $1 LIMIT 1`, [firebaseUid]);
    return result.rows[0] ?? null;
}
async function createUser(input) {
    const result = await db_1.default.query(`
      INSERT INTO users (
        firebase_uid,
        email,
        first_name,
        last_name,
        role
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        firebase_uid AS "firebaseUid",
        email,
        first_name AS "firstName",
        last_name AS "lastName",
        role,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `, [
        input.firebaseUid,
        input.email,
        input.firstName ?? null,
        input.lastName ?? null,
        input.role ?? "user",
    ]);
    return result.rows[0];
}
async function updateUserProfile(firebaseUid, input) {
    const result = await db_1.default.query(`
      UPDATE users
      SET
        first_name = COALESCE($2, first_name),
        last_name = COALESCE($3, last_name),
        updated_at = CURRENT_TIMESTAMP
      WHERE firebase_uid = $1
      RETURNING
        id,
        firebase_uid AS "firebaseUid",
        email,
        first_name AS "firstName",
        last_name AS "lastName",
        role,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `, [firebaseUid, input.firstName ?? null, input.lastName ?? null]);
    return result.rows[0] ?? null;
}
//# sourceMappingURL=user.model.js.map