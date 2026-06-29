import pool from "../config/db";

export interface User {
  id: number;
  firebaseUid: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  firebaseUid: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: string;
}

export interface UpdateUserProfileInput {
  firstName?: string | null;
  lastName?: string | null;
}

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

export async function findUserByFirebaseUid(
  firebaseUid: string
): Promise<User | null> {
  const result = await pool.query<User>(
    `${userSelect} WHERE firebase_uid = $1 LIMIT 1`,
    [firebaseUid]
  );

  return result.rows[0] ?? null;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const result = await pool.query<User>(
    `
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
    `,
    [
      input.firebaseUid,
      input.email,
      input.firstName ?? null,
      input.lastName ?? null,
      input.role ?? "user",
    ]
  );

  return result.rows[0];
}

export async function updateUserProfile(
  firebaseUid: string,
  input: UpdateUserProfileInput
): Promise<User | null> {
  const result = await pool.query<User>(
    `
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
    `,
    [firebaseUid, input.firstName ?? null, input.lastName ?? null]
  );

  return result.rows[0] ?? null;
}
