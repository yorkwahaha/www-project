import type { Pool } from 'pg';

export type CreatorSessionUserRow = {
  id: string;
  status: string;
};

export type CreatorSessionRow = {
  token_sha256: Buffer;
  user_id: string;
  created_at: Date;
  expires_at: Date;
  revoked_at: Date | null;
};

export type CreatorSessionLookupRow = CreatorSessionRow & {
  user_status: string;
};

export type CreatorSessionRepository = {
  findUserById(userId: string): Promise<CreatorSessionUserRow | null>;
  insertSession(row: CreatorSessionRow): Promise<void>;
  findSessionByDigest(tokenSha256: Buffer): Promise<CreatorSessionLookupRow | null>;
  revokeSession(tokenSha256: Buffer, revokedAt: Date): Promise<boolean>;
};

export function createPgCreatorSessionRepository(
  pool: Pool,
): CreatorSessionRepository {
  return {
    async findUserById(userId) {
      const result = await pool.query<CreatorSessionUserRow>(
        `SELECT id, status
         FROM users
         WHERE id = $1`,
        [userId],
      );
      return result.rows[0] ?? null;
    },

    async insertSession(row) {
      await pool.query(
        `INSERT INTO creator_sessions (
           token_sha256, user_id, created_at, expires_at, revoked_at
         )
         VALUES ($1, $2, $3, $4, $5)`,
        [
          row.token_sha256,
          row.user_id,
          row.created_at,
          row.expires_at,
          row.revoked_at,
        ],
      );
    },

    async findSessionByDigest(tokenSha256) {
      const result = await pool.query<CreatorSessionLookupRow>(
        `SELECT
           session.token_sha256,
           session.user_id,
           session.created_at,
           session.expires_at,
           session.revoked_at,
           users.status AS user_status
         FROM creator_sessions AS session
         INNER JOIN users ON users.id = session.user_id
         WHERE session.token_sha256 = $1`,
        [tokenSha256],
      );
      return result.rows[0] ?? null;
    },

    async revokeSession(tokenSha256, revokedAt) {
      const result = await pool.query(
        `UPDATE creator_sessions
         SET revoked_at = $2
         WHERE token_sha256 = $1
           AND revoked_at IS NULL`,
        [tokenSha256, revokedAt],
      );
      return result.rowCount === 1;
    },
  };
}
