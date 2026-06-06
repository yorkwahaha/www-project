import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  USER_SESSION_COOKIE_NAME,
  sha256UserSessionToken,
} from '../../src/auth/session-cookie.js';
import {
  createUserAuthResolver,
  createUserAuthResolverFromEnv,
} from '../../src/auth/user-auth-resolver.js';
import { createHttpServer } from '../../src/http/server.js';
import { createInMemoryPollRepository } from '../../src/polls/in-memory-repository.js';
import { createPollService } from '../../src/polls/service.js';
import { createInMemoryUserSessionRepository } from '../../src/user-sessions/in-memory-repository.js';
import { withServer } from './helpers/admin-http-fixture.js';

const userId = '11111111-1111-4111-8111-111111111111';
const otherUserId = '22222222-2222-4222-8222-222222222222';
const rawSessionToken = 'm'.repeat(43);

const AUTH_REQUIRED = {
  error: 'AUTH_REQUIRED',
  message: 'User authentication is required',
} as const;

async function request(
  baseUrl: string,
  options: {
    headers?: Record<string, string>;
  } = {},
): Promise<{ status: number; body: Record<string, unknown> }> {
  const response = await fetch(`${baseUrl}/users/me`, {
    method: 'GET',
    headers: options.headers,
  });
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
  };
}

describe('authenticated me HTTP route', () => {
  it('returns only minimal identity for an authenticated user', async () => {
    const repository = createInMemoryPollRepository();
    await repository.ensureUser(userId, 'Profile User');
    const server = createHttpServer({
      pollService: createPollService(repository),
      userAuthResolver: createUserAuthResolver({
        mode: 'production',
        trustedCredentialVerifier: () => ({ user_id: userId }),
      }),
    });

    await withServer(server, async (baseUrl) => {
      const response = await request(baseUrl);

      expect(response).toEqual({
        status: 200,
        body: {
          user_id: userId,
          display_name: 'Profile User',
        },
      });
      expect(Object.keys(response.body).sort()).toEqual([
        'display_name',
        'user_id',
      ]);
    });
  });

  it('rejects unauthenticated requests', async () => {
    const server = createHttpServer({
      pollService: createPollService(createInMemoryPollRepository()),
      userAuthResolver: createUserAuthResolver({ mode: 'production' }),
    });

    await withServer(server, async (baseUrl) => {
      await expect(request(baseUrl)).resolves.toEqual({
        status: 401,
        body: AUTH_REQUIRED,
      });
    });
  });

  it('accepts a valid production www_session cookie through UserAuthResolver', async () => {
    const repository = createInMemoryPollRepository();
    await repository.ensureUser(userId, 'Cookie User');
    await repository.ensureUser(otherUserId, 'Spoofed User');
    const sessionRepository = createInMemoryUserSessionRepository();
    sessionRepository.seedUser(userId);
    await sessionRepository.insertSession({
      session_id: '44444444-4444-4444-8444-444444444444',
      token_sha256: sha256UserSessionToken(rawSessionToken),
      user_id: userId,
      created_at: new Date('2026-06-06T00:00:00.000Z'),
      expires_at: new Date('2026-06-06T01:00:00.000Z'),
      revoked_at: null,
      last_used_at: null,
    });
    const server = createHttpServer({
      pollService: createPollService(repository),
      userAuthResolver: createUserAuthResolver({
        mode: 'production',
        userSessionRepository: sessionRepository,
        now: () => new Date('2026-06-06T00:15:00.000Z'),
      }),
    });

    await withServer(server, async (baseUrl) => {
      const response = await request(baseUrl, {
        headers: {
          Cookie: `${USER_SESSION_COOKIE_NAME}=${rawSessionToken}`,
          'X-User-Id': otherUserId,
        },
      });

      expect(response).toEqual({
        status: 200,
        body: {
          user_id: userId,
          display_name: 'Cookie User',
        },
      });
      expect(
        (
          await sessionRepository.findSessionByDigest(
            sha256UserSessionToken(rawSessionToken),
          )
        )?.last_used_at,
      ).toEqual(new Date('2026-06-06T00:15:00.000Z'));
    });
  });

  it('preserves non-production X-User-Id compatibility', async () => {
    const repository = createInMemoryPollRepository();
    await repository.ensureUser(userId, 'Local User');
    const server = createHttpServer({
      pollService: createPollService(repository),
      userAuthResolver: createUserAuthResolverFromEnv({ APP_ENV: 'development' }),
    });

    await withServer(server, async (baseUrl) => {
      await expect(request(baseUrl, {
        headers: { 'X-User-Id': userId },
      })).resolves.toEqual({
        status: 200,
        body: {
          user_id: userId,
          display_name: 'Local User',
        },
      });
    });
  });

  it('does not expose session, token, profile, vote, option, or trust fields', async () => {
    const repository = createInMemoryPollRepository();
    await repository.ensureUser(userId, 'Safe User');
    repository.setUserProfile(userId, {
      birth_year_month: new Date('1998-07-01T00:00:00.000Z'),
      residential_region: 'TW-TPE',
    });
    const server = createHttpServer({
      pollService: createPollService(repository),
      userAuthResolver: createUserAuthResolver({
        mode: 'production',
        trustedCredentialVerifier: () => ({ user_id: userId }),
      }),
    });

    await withServer(server, async (baseUrl) => {
      const response = await request(baseUrl, {
        headers: {
          Cookie: [
            `${USER_SESSION_COOKIE_NAME}=${rawSessionToken}`,
            'creator_session=ignored-local-demo-cookie',
          ].join('; '),
        },
      });
      const serialized = JSON.stringify(response.body);

      expect(response.status).toBe(200);
      expect(Object.keys(response.body).sort()).toEqual([
        'display_name',
        'user_id',
      ]);
      expect(serialized).not.toMatch(
        /session_id|token_sha256|raw.*token|cookie|www_session|creator_session/i,
      );
      expect(serialized).not.toMatch(
        /birth_year_month|residential_region|eligibility|vote|option|poll_id|shard/i,
      );
      expect(serialized).not.toMatch(/trust|role/i);
    });
  });

  it('routes me auth through UserAuthResolver instead of direct X-User-Id reads', async () => {
    const routeSource = await readFile(
      join(process.cwd(), 'src/http/user-profile-routes.ts'),
      'utf8',
    );
    const serverSource = await readFile(
      join(process.cwd(), 'src/http/server.ts'),
      'utf8',
    );

    expect(serverSource).toContain("path === '/users/me'");
    expect(routeSource).toContain('handleGetMe');
    expect(routeSource).toContain('userAuthResolver.resolveUserAuth');
    expect(routeSource).not.toMatch(/req\.headers\['x-user-id'\]/i);
    expect(routeSource).not.toMatch(/headers\['x-user-id'\]/i);
  });
});
