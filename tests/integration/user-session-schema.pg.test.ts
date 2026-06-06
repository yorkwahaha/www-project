import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import {
  applyMigrations,
  createIntegrationPool,
  listTableColumns,
  truncateBusinessTables,
} from '../helpers/pg-integration.js';
import { createPgUserSessionRepository } from '../../src/user-sessions/repository.js';

const userId = '11111111-1111-4111-8111-111111111111';
const sessionId = '22222222-2222-4222-8222-222222222222';
const tokenSha256 = createHash('sha256').update('pg-session-token').digest();

describe('Phase 78 production user session PostgreSQL schema', () => {
  const pool = createIntegrationPool();

  beforeAll(async () => {
    await applyMigrations();
  });

  beforeEach(async () => {
    await truncateBusinessTables(pool);
    await pool.query(
      `INSERT INTO users (id, display_name)
       VALUES ($1, 'Session User')`,
      [userId],
    );
  });

  afterAll(async () => {
    await pool.end();
  });

  it('adds only minimal production user session columns', async () => {
    expect(await listTableColumns(pool, 'user_sessions')).toEqual([
      'session_id',
      'token_sha256',
      'user_id',
      'created_at',
      'expires_at',
      'revoked_at',
      'last_used_at',
    ]);
  });

  it('enforces digest length, positive TTL, revocation, and last-used constraints', async () => {
    await expect(
      pool.query(
        `INSERT INTO user_sessions (
           session_id, token_sha256, user_id, created_at, expires_at
         )
         VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '12 hours')`,
        [sessionId, Buffer.alloc(31), userId],
      ),
    ).rejects.toMatchObject({
      constraint: 'user_sessions_token_sha256_length_check',
    });

    await expect(
      pool.query(
        `INSERT INTO user_sessions (
           session_id, token_sha256, user_id, created_at, expires_at
         )
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [sessionId, Buffer.alloc(32), userId],
      ),
    ).rejects.toMatchObject({ constraint: 'user_sessions_expires_at_check' });

    await expect(
      pool.query(
        `INSERT INTO user_sessions (
           session_id, token_sha256, user_id, created_at, expires_at, revoked_at
         )
         VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '12 hours', NOW() - INTERVAL '1 second')`,
        [sessionId, Buffer.alloc(32), userId],
      ),
    ).rejects.toMatchObject({ constraint: 'user_sessions_revoked_at_check' });

    await expect(
      pool.query(
        `INSERT INTO user_sessions (
           session_id,
           token_sha256,
           user_id,
           created_at,
           expires_at,
           last_used_at
         )
         VALUES (
           $1,
           $2,
           $3,
           TIMESTAMPTZ '2026-06-06T00:00:00.000Z',
           TIMESTAMPTZ '2026-06-07T00:00:00.000Z',
           TIMESTAMPTZ '2026-06-07T00:00:01.000Z'
         )`,
        [sessionId, Buffer.alloc(32), userId],
      ),
    ).rejects.toMatchObject({ constraint: 'user_sessions_last_used_at_check' });
  });

  it('supports repository insert, digest lookup, last-used update, and revocation', async () => {
    const repository = createPgUserSessionRepository(pool);
    const createdAt = new Date('2026-06-06T00:00:00.000Z');
    const expiresAt = new Date('2026-06-07T00:00:00.000Z');

    await repository.insertSession({
      session_id: sessionId,
      token_sha256: tokenSha256,
      user_id: userId,
      created_at: createdAt,
      expires_at: expiresAt,
      revoked_at: null,
      last_used_at: null,
    });

    const found = await repository.findSessionByDigest(tokenSha256);
    expect(found).toMatchObject({
      session_id: sessionId,
      user_id: userId,
      user_status: 'active',
      revoked_at: null,
      last_used_at: null,
    });

    const lastUsedAt = new Date('2026-06-06T12:00:00.000Z');
    await expect(repository.markSessionUsed(sessionId, lastUsedAt)).resolves.toBe(
      true,
    );
    expect((await repository.findSessionByDigest(tokenSha256))?.last_used_at).toEqual(
      lastUsedAt,
    );

    const revokedAt = new Date('2026-06-06T13:00:00.000Z');
    await expect(repository.revokeSession(sessionId, revokedAt)).resolves.toBe(
      true,
    );
    await expect(repository.revokeSession(sessionId, revokedAt)).resolves.toBe(
      false,
    );
    expect((await repository.findSessionByDigest(tokenSha256))?.revoked_at).toEqual(
      revokedAt,
    );
  });
});
