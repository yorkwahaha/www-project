import type { IncomingMessage } from 'node:http';
import { describe, expect, it } from 'vitest';
import {
  sha256UserSessionToken,
  USER_SESSION_COOKIE_NAME,
} from '../../src/auth/session-cookie.js';
import { createUserAuthResolver, createUserAuthResolverFromEnv } from '../../src/auth/user-auth-resolver.js';
import { createInMemoryUserSessionRepository } from '../../src/user-sessions/in-memory-repository.js';
import type { UserSessionRow } from '../../src/user-sessions/repository.js';

const userId = '11111111-1111-4111-8111-111111111111';
const otherUserId = '22222222-2222-4222-8222-222222222222';
const sessionId = '33333333-3333-4333-8333-333333333333';
const rawSessionToken = 's'.repeat(43);
const createdAt = new Date('2026-06-06T00:00:00.000Z');
const expiresAt = new Date('2026-06-06T01:00:00.000Z');
const resolvedAt = new Date('2026-06-06T00:10:00.000Z');

function req(headers: IncomingMessage['headers'] = {}): IncomingMessage {
  return { headers } as IncomingMessage;
}

function sessionRow(overrides: Partial<UserSessionRow> = {}): UserSessionRow {
  return {
    session_id: sessionId,
    token_sha256: sha256UserSessionToken(rawSessionToken),
    user_id: userId,
    created_at: createdAt,
    expires_at: expiresAt,
    revoked_at: null,
    last_used_at: null,
    ...overrides,
  };
}

describe('UserAuthResolver foundation', () => {
  it('fails closed in production when no trusted verifier is configured', async () => {
    const resolver = createUserAuthResolver({ mode: 'production' });

    await expect(
      resolver.resolveUserAuth(req({ 'x-user-id': userId })),
    ).resolves.toBeNull();
  });

  it('does not treat creator_session as production user auth', async () => {
    const resolver = createUserAuthResolver({ mode: 'production' });

    await expect(
      resolver.resolveUserAuth(req({ cookie: 'creator_session=local-demo-token' })),
    ).resolves.toBeNull();
  });

  it('resolves production identity only from an explicit trusted verifier', async () => {
    const resolver = createUserAuthResolver({
      mode: 'production',
      trustedCredentialVerifier: () => ({ user_id: userId }),
    });

    await expect(resolver.resolveUserAuth(req())).resolves.toEqual({
      user_id: userId,
      source: 'production',
    });
  });

  it('fails closed when a trusted verifier throws', async () => {
    const resolver = createUserAuthResolver({
      mode: 'production',
      trustedCredentialVerifier: () => {
        throw new Error('verifier unavailable');
      },
    });

    await expect(resolver.resolveUserAuth(req())).resolves.toBeNull();
  });

  it('allows MVP X-User-Id in local demo only when explicitly configured', async () => {
    const disabled = createUserAuthResolver({ mode: 'local_demo' });
    const enabled = createUserAuthResolver({
      mode: 'local_demo',
      allowMvpUserIdHeader: true,
    });

    await expect(disabled.resolveUserAuth(req({ 'x-user-id': userId }))).resolves.toBeNull();
    await expect(enabled.resolveUserAuth(req({ 'x-user-id': ` ${userId} ` }))).resolves.toEqual({
      user_id: userId,
      source: 'local_demo',
    });
  });

  it('allows MVP X-User-Id in tests only when explicitly configured', async () => {
    const disabled = createUserAuthResolver({ mode: 'test' });
    const enabled = createUserAuthResolver({
      mode: 'test',
      allowMvpUserIdHeader: true,
    });

    await expect(disabled.resolveUserAuth(req({ 'x-user-id': userId }))).resolves.toBeNull();
    await expect(enabled.resolveUserAuth(req({ 'x-user-id': userId }))).resolves.toEqual({
      user_id: userId,
      source: 'test',
    });
  });

  it('creates production resolver that rejects raw X-User-Id', async () => {
    const resolver = createUserAuthResolverFromEnv({ APP_ENV: 'production' });

    await expect(resolver.resolveUserAuth(req({ 'x-user-id': userId }))).resolves.toBeNull();
  });

  it('creates local demo resolver that allows MVP X-User-Id when APP_ENV is development', async () => {
    const resolver = createUserAuthResolverFromEnv({ APP_ENV: 'development' });

    await expect(resolver.resolveUserAuth(req({ 'x-user-id': userId }))).resolves.toEqual({
      user_id: userId,
      source: 'local_demo',
    });
  });

  it('creates test resolver that allows MVP X-User-Id when APP_ENV is test', async () => {
    const resolver = createUserAuthResolverFromEnv({ APP_ENV: 'test' });

    await expect(resolver.resolveUserAuth(req({ 'x-user-id': userId }))).resolves.toEqual({
      user_id: userId,
      source: 'test',
    });
  });

  it('ignores forwarded, query, and body-selected identity surfaces', async () => {
    const resolver = createUserAuthResolver({
      mode: 'local_demo',
      allowMvpUserIdHeader: true,
    });

    await expect(
      resolver.resolveUserAuth(
        req({
          'x-forwarded-user': userId,
          'x-authenticated-user-id': userId,
        }),
      ),
    ).resolves.toBeNull();
  });

  it('resolves a valid production www_session cookie and updates last_used_at', async () => {
    const repository = createInMemoryUserSessionRepository();
    repository.seedUser(userId);
    await repository.insertSession(sessionRow());
    const resolver = createUserAuthResolver({
      mode: 'production',
      userSessionRepository: repository,
      now: () => resolvedAt,
    });

    await expect(
      resolver.resolveUserAuth(
        req({ cookie: `${USER_SESSION_COOKIE_NAME}=${rawSessionToken}` }),
      ),
    ).resolves.toEqual({ user_id: userId, source: 'production' });

    const stored = await repository.findSessionByDigest(
      sha256UserSessionToken(rawSessionToken),
    );
    expect(stored?.last_used_at).toEqual(resolvedAt);
  });

  it('rejects missing, malformed, duplicate, unknown, expired, revoked, and inactive sessions without updating last_used_at', async () => {
    const cases: Array<{
      cookie?: string;
      row?: UserSessionRow;
      userStatus?: string;
    }> = [
      { cookie: undefined },
      { cookie: `${USER_SESSION_COOKIE_NAME}=malformed` },
      {
        cookie: `${USER_SESSION_COOKIE_NAME}=${rawSessionToken}; ${USER_SESSION_COOKIE_NAME}=${rawSessionToken}`,
      },
      { cookie: `${USER_SESSION_COOKIE_NAME}=${'u'.repeat(43)}` },
      {
        cookie: `${USER_SESSION_COOKIE_NAME}=${rawSessionToken}`,
        row: sessionRow({ expires_at: resolvedAt }),
      },
      {
        cookie: `${USER_SESSION_COOKIE_NAME}=${rawSessionToken}`,
        row: sessionRow({ revoked_at: new Date('2026-06-06T00:05:00.000Z') }),
      },
      {
        cookie: `${USER_SESSION_COOKIE_NAME}=${rawSessionToken}`,
        row: sessionRow(),
        userStatus: 'suspended',
      },
    ];

    for (const testCase of cases) {
      const repository = createInMemoryUserSessionRepository();
      repository.seedUser(userId, testCase.userStatus ?? 'active');
      if (testCase.row) {
        await repository.insertSession(testCase.row);
      }
      const resolver = createUserAuthResolver({
        mode: 'production',
        userSessionRepository: repository,
        now: () => resolvedAt,
      });

      await expect(
        resolver.resolveUserAuth(
          req(testCase.cookie === undefined ? {} : { cookie: testCase.cookie }),
        ),
      ).resolves.toBeNull();

      const stored = await repository.findSessionByDigest(
        sha256UserSessionToken(rawSessionToken),
      );
      expect(stored?.last_used_at ?? null).toBeNull();
    }
  });

  it('preserves non-production X-User-Id compatibility and does not read www_session cookies outside production mode', async () => {
    const repository = createInMemoryUserSessionRepository();
    repository.seedUser(otherUserId);
    await repository.insertSession(sessionRow({ user_id: otherUserId }));
    const resolver = createUserAuthResolver({
      mode: 'local_demo',
      allowMvpUserIdHeader: true,
      userSessionRepository: repository,
      now: () => resolvedAt,
    });

    await expect(
      resolver.resolveUserAuth(
        req({
          cookie: `${USER_SESSION_COOKIE_NAME}=${rawSessionToken}`,
          'x-user-id': userId,
        }),
      ),
    ).resolves.toEqual({ user_id: userId, source: 'local_demo' });
    await expect(
      resolver.resolveUserAuth(
        req({ cookie: `${USER_SESSION_COOKIE_NAME}=${rawSessionToken}` }),
      ),
    ).resolves.toBeNull();

    const stored = await repository.findSessionByDigest(
      sha256UserSessionToken(rawSessionToken),
    );
    expect(stored?.last_used_at).toBeNull();
  });
});
