import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  applyMigrations,
  createIntegrationPool,
  listTableColumns,
  truncateBusinessTables,
} from '../helpers/pg-integration.js';

const userId = '11111111-1111-4111-8111-111111111111';

describe('Phase 65A creator session PostgreSQL schema', () => {
  const pool = createIntegrationPool();

  beforeAll(async () => {
    await applyMigrations();
  });

  beforeEach(async () => {
    await truncateBusinessTables(pool);
    await pool.query(
      `INSERT INTO users (id, display_name)
       VALUES ($1, 'Creator')`,
      [userId],
    );
  });

  afterAll(async () => {
    await pool.end();
  });

  it('adds only minimal creator session columns', async () => {
    expect(await listTableColumns(pool, 'creator_sessions')).toEqual([
      'token_sha256',
      'user_id',
      'created_at',
      'expires_at',
      'revoked_at',
    ]);
  });

  it('enforces digest length, positive TTL, and revocation time constraints', async () => {
    await expect(
      pool.query(
        `INSERT INTO creator_sessions (token_sha256, user_id, created_at, expires_at)
         VALUES ($1, $2, NOW(), NOW() + INTERVAL '12 hours')`,
        [Buffer.alloc(31), userId],
      ),
    ).rejects.toMatchObject({
      constraint: 'creator_sessions_token_sha256_length_check',
    });

    await expect(
      pool.query(
        `INSERT INTO creator_sessions (token_sha256, user_id, created_at, expires_at)
         VALUES ($1, $2, NOW(), NOW())`,
        [Buffer.alloc(32), userId],
      ),
    ).rejects.toMatchObject({ constraint: 'creator_sessions_expires_at_check' });

    await expect(
      pool.query(
        `INSERT INTO creator_sessions (
           token_sha256, user_id, created_at, expires_at, revoked_at
         )
         VALUES ($1, $2, NOW(), NOW() + INTERVAL '12 hours', NOW() - INTERVAL '1 second')`,
        [Buffer.alloc(32), userId],
      ),
    ).rejects.toMatchObject({ constraint: 'creator_sessions_revoked_at_check' });
  });
});
