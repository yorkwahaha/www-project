import type { Pool } from 'pg';

export type UserSessionUserRow = {
  id: string;
  status: string;
};

export type UserSessionRow = {
  session_id: string;
  token_sha256: Buffer;
  user_id: string;
  created_at: Date;
  expires_at: Date;
  revoked_at: Date | null;
  last_used_at: Date | null;
};

export type UserSessionLookupRow = UserSessionRow & {
  user_status: string;
};

export type UserSessionRepository = {
  findUserById(userId: string): Promise<UserSessionUserRow | null>;
  insertSession(row: UserSessionRow): Promise<void>;
  findSessionByDigest(tokenSha256: Buffer): Promise<UserSessionLookupRow | null>;
  markSessionUsed(sessionId: string, lastUsedAt: Date): Promise<boolean>;
  revokeSession(sessionId: string, revokedAt: Date): Promise<boolean>;
};

export function createPgUserSessionRepository(pool: Pool): UserSessionRepository {
  return {
    async findUserById(userId) {
      const result = await pool.query<UserSessionUserRow>(
        `SELECT id, status
         FROM users
         WHERE id = $1`,
        [userId],
      );
      return result.rows[0] ?? null;
    },

    async insertSession(row) {
      await pool.query(
        `INSERT INTO user_sessions (
           session_id,
           token_sha256,
           user_id,
           created_at,
           expires_at,
           revoked_at,
           last_used_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          row.session_id,
          row.token_sha256,
          row.user_id,
          row.created_at,
          row.expires_at,
          row.revoked_at,
          row.last_used_at,
        ],
      );
    },

    async findSessionByDigest(tokenSha256) {
      const result = await pool.query<UserSessionLookupRow>(
        `SELECT
           session.session_id,
           session.token_sha256,
           session.user_id,
           session.created_at,
           session.expires_at,
           session.revoked_at,
           session.last_used_at,
           users.status AS user_status
         FROM user_sessions AS session
         INNER JOIN users ON users.id = session.user_id
         WHERE session.token_sha256 = $1`,
        [tokenSha256],
      );
      return result.rows[0] ?? null;
    },

    async markSessionUsed(sessionId, lastUsedAt) {
      const result = await pool.query(
        `UPDATE user_sessions
         SET last_used_at = $2
         WHERE session_id = $1
           AND revoked_at IS NULL
           AND expires_at > $2`,
        [sessionId, lastUsedAt],
      );
      return result.rowCount === 1;
    },

    async revokeSession(sessionId, revokedAt) {
      const result = await pool.query(
        `UPDATE user_sessions
         SET revoked_at = $2
         WHERE session_id = $1
           AND revoked_at IS NULL`,
        [sessionId, revokedAt],
      );
      return result.rowCount === 1;
    },
  };
}
