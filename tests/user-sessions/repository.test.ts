import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createInMemoryUserSessionRepository } from '../../src/user-sessions/in-memory-repository.js';
import type { UserSessionRow } from '../../src/user-sessions/repository.js';

const userId = '11111111-1111-4111-8111-111111111111';
const sessionId = '22222222-2222-4222-8222-222222222222';
const rawToken = 'production-session-token';
const tokenSha256 = createHash('sha256').update(rawToken).digest();
const createdAt = new Date('2026-06-06T00:00:00.000Z');
const expiresAt = new Date('2026-06-07T00:00:00.000Z');

function sessionRow(overrides: Partial<UserSessionRow> = {}): UserSessionRow {
  return {
    session_id: sessionId,
    token_sha256: tokenSha256,
    user_id: userId,
    created_at: createdAt,
    expires_at: expiresAt,
    revoked_at: null,
    last_used_at: null,
    ...overrides,
  };
}

describe('production user session repository foundation', () => {
  it('stores and looks up only hashed token session lifecycle data', async () => {
    const repository = createInMemoryUserSessionRepository();
    repository.seedUser(userId);

    await repository.insertSession(sessionRow());

    const stored = [...repository.sessions.values()][0]!;
    expect(stored.token_sha256.toString('utf8')).not.toContain(rawToken);
    expect(stored).not.toHaveProperty('poll_id');
    expect(stored).not.toHaveProperty('option_id');
    expect(stored).not.toHaveProperty('request_id');

    const found = await repository.findSessionByDigest(tokenSha256);
    expect(found).toMatchObject({
      session_id: sessionId,
      user_id: userId,
      user_status: 'active',
      revoked_at: null,
      last_used_at: null,
    });
  });

  it('marks active sessions as used without refreshing expiry', async () => {
    const repository = createInMemoryUserSessionRepository();
    repository.seedUser(userId);
    await repository.insertSession(sessionRow());

    const lastUsedAt = new Date('2026-06-06T12:00:00.000Z');
    await expect(repository.markSessionUsed(sessionId, lastUsedAt)).resolves.toBe(
      true,
    );

    const found = await repository.findSessionByDigest(tokenSha256);
    expect(found?.last_used_at).toEqual(lastUsedAt);
    expect(found?.expires_at).toEqual(expiresAt);
  });

  it('does not mark revoked or expired sessions as used', async () => {
    const repository = createInMemoryUserSessionRepository();
    repository.seedUser(userId);
    await repository.insertSession(
      sessionRow({ revoked_at: new Date('2026-06-06T01:00:00.000Z') }),
    );

    await expect(
      repository.markSessionUsed(sessionId, new Date('2026-06-06T12:00:00.000Z')),
    ).resolves.toBe(false);

    const otherSessionId = '33333333-3333-4333-8333-333333333333';
    const otherDigest = Buffer.alloc(32, 3);
    await repository.insertSession(
      sessionRow({
        session_id: otherSessionId,
        token_sha256: otherDigest,
        revoked_at: null,
      }),
    );

    await expect(repository.markSessionUsed(otherSessionId, expiresAt)).resolves.toBe(
      false,
    );
  });

  it('revokes a session once by session id', async () => {
    const repository = createInMemoryUserSessionRepository();
    repository.seedUser(userId);
    await repository.insertSession(sessionRow());

    const revokedAt = new Date('2026-06-06T13:00:00.000Z');
    await expect(repository.revokeSession(sessionId, revokedAt)).resolves.toBe(
      true,
    );
    await expect(repository.revokeSession(sessionId, revokedAt)).resolves.toBe(
      false,
    );

    const found = await repository.findSessionByDigest(tokenSha256);
    expect(found?.revoked_at).toEqual(revokedAt);
  });
});
