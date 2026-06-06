import type { Server } from 'node:http';
import { describe, expect, it } from 'vitest';
import type { TrustedCredentialVerifier } from '../../src/auth/user-auth-resolver.js';
import {
  LOGIN_SESSION_COOKIE_NAME,
  sha256SessionToken,
} from '../../src/http/login-session-routes.js';
import { createHttpServer } from '../../src/http/server.js';
import { createInMemoryPollRepository } from '../../src/polls/in-memory-repository.js';
import { createPollService } from '../../src/polls/service.js';
import { createInMemoryUserSessionRepository } from '../../src/user-sessions/in-memory-repository.js';
import type { InMemoryUserSessionRepository } from '../../src/user-sessions/in-memory-repository.js';
import { withServer } from './helpers/admin-http-fixture.js';

const userId = '11111111-1111-4111-8111-111111111111';
const otherUserId = '22222222-2222-4222-8222-222222222222';
const loginOrigin = 'https://www.test';
const bootstrapToken = 'trusted-bootstrap-token';
const rawSessionToken = 's'.repeat(43);

function createFixture(options: {
  verifier?: TrustedCredentialVerifier;
  repository?: InMemoryUserSessionRepository;
  now?: () => Date;
  generateToken?: () => string;
  allowedOrigins?: ReadonlySet<string>;
} = {}) {
  const repository = options.repository ?? createInMemoryUserSessionRepository();
  if (options.repository === undefined) {
    repository.seedUser(userId);
  }
  const verifier = options.verifier ?? ((req) => {
    return req.headers.authorization === `Bearer ${bootstrapToken}`
      ? { user_id: userId }
      : null;
  });
  const server = createHttpServer({
    pollService: createPollService(createInMemoryPollRepository()),
    loginSession: {
      repository,
      trustedCredentialVerifier: verifier,
      config: {
        allowedOrigins: options.allowedOrigins ?? new Set([loginOrigin]),
        sessionTtlSeconds: 3600,
      },
      now: options.now,
      generateToken: options.generateToken ?? (() => rawSessionToken),
    },
  });
  return { repository, server };
}

async function request(
  baseUrl: string,
  method: string,
  path: string,
  options: {
    cookie?: string;
    headers?: Record<string, string>;
  } = {},
): Promise<{
  status: number;
  body: Record<string, unknown> | null;
  setCookie: string | null;
}> {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(options.cookie === undefined ? {} : { Cookie: options.cookie }),
      ...options.headers,
    },
  });
  const text = await response.text();
  return {
    status: response.status,
    body: text === '' ? null : (JSON.parse(text) as Record<string, unknown>),
    setCookie: response.headers.get('set-cookie'),
  };
}

function cookieHeader(setCookie: string | null): string {
  if (!setCookie) {
    throw new Error('expected Set-Cookie');
  }
  return setCookie.split(';', 1)[0]!;
}

async function issueSession(server: Server): Promise<string> {
  return withServer(server, async (baseUrl) => {
    const response = await request(baseUrl, 'POST', '/login/session', {
      headers: {
        Origin: loginOrigin,
        Authorization: `Bearer ${bootstrapToken}`,
      },
    });
    expect(response.status).toBe(201);
    return cookieHeader(response.setCookie);
  });
}

describe('production login session routes', () => {
  it('issues a secure HttpOnly session cookie and stores only token_sha256', async () => {
    const now = new Date('2026-06-06T00:00:00.000Z');
    const fixture = createFixture({ now: () => now });

    await withServer(fixture.server, async (baseUrl) => {
      const response = await request(baseUrl, 'POST', '/login/session', {
        headers: {
          Origin: loginOrigin,
          Authorization: `Bearer ${bootstrapToken}`,
        },
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        authenticated: true,
        expires_at: '2026-06-06T01:00:00.000Z',
      });
      expect(response.setCookie).toContain(
        `${LOGIN_SESSION_COOKIE_NAME}=${rawSessionToken}`,
      );
      expect(response.setCookie).toContain('HttpOnly');
      expect(response.setCookie).toContain('Secure');
      expect(response.setCookie).toContain('SameSite=Lax');
      expect(response.setCookie).toContain('Path=/');
      expect(response.setCookie).toContain('Max-Age=3600');
      expect(response.setCookie).not.toContain('Domain=');
      expect(JSON.stringify(response.body)).not.toContain(rawSessionToken);

      expect(fixture.repository.sessions.size).toBe(1);
      const stored = [...fixture.repository.sessions.values()][0]!;
      expect(stored.token_sha256).toEqual(sha256SessionToken(rawSessionToken));
      expect(stored.token_sha256.toString('utf8')).not.toContain(rawSessionToken);
      expect(stored.user_id).toBe(userId);
      expect(stored).not.toHaveProperty('poll_id');
      expect(stored).not.toHaveProperty('option_id');
      expect(stored).not.toHaveProperty('request_id');
    });
  });

  it('keeps the route unavailable unless explicitly backed by a trusted verifier', async () => {
    const server = createHttpServer({
      pollService: createPollService(createInMemoryPollRepository()),
    });

    await withServer(server, async (baseUrl) => {
      const response = await request(baseUrl, 'POST', '/login/session', {
        headers: {
          Origin: loginOrigin,
          Authorization: `Bearer ${bootstrapToken}`,
        },
      });
      expect(response.status).toBe(404);
      expect(response.setCookie).toBeNull();
    });
  });

  it('fails closed for missing, rejected, throwing, inactive, or spoofed credentials', async () => {
    for (const verifier of [
      () => null,
      () => {
        throw new Error('verifier failed');
      },
    ] satisfies TrustedCredentialVerifier[]) {
      const fixture = createFixture({ verifier });
      await withServer(fixture.server, async (baseUrl) => {
        const response = await request(baseUrl, 'POST', '/login/session', {
          headers: {
            Origin: loginOrigin,
            'X-User-Id': userId,
            Cookie: 'creator_session=local-demo-token',
          },
        });
        expect(response.status).toBe(401);
        expect(response.setCookie).toBeNull();
        expect(fixture.repository.sessions.size).toBe(0);
      });
    }

    const inactiveRepository = createInMemoryUserSessionRepository();
    inactiveRepository.seedUser(userId, 'suspended');
    const inactiveFixture = createFixture({ repository: inactiveRepository });
    await withServer(inactiveFixture.server, async (baseUrl) => {
      const response = await request(baseUrl, 'POST', '/login/session', {
        headers: {
          Origin: loginOrigin,
          Authorization: `Bearer ${bootstrapToken}`,
        },
      });
      expect(response.status).toBe(401);
      expect(inactiveFixture.repository.sessions.size).toBe(0);
    });

    const unknownUserFixture = createFixture({
      verifier: () => ({ user_id: otherUserId }),
    });
    await withServer(unknownUserFixture.server, async (baseUrl) => {
      const response = await request(baseUrl, 'POST', '/login/session', {
        headers: {
          Origin: loginOrigin,
          Authorization: `Bearer ${bootstrapToken}`,
        },
      });
      expect(response.status).toBe(401);
      expect(unknownUserFixture.repository.sessions.size).toBe(0);
    });
  });

  it('rejects unsafe mutation origins before issuing or revoking sessions', async () => {
    const fixture = createFixture();

    await withServer(fixture.server, async (baseUrl) => {
      for (const origin of [undefined, 'not-an-origin', 'https://other.test']) {
        const response = await request(baseUrl, 'POST', '/login/session', {
          headers: {
            ...(origin === undefined ? {} : { Origin: origin }),
            Authorization: `Bearer ${bootstrapToken}`,
          },
        });
        expect(response.status).toBe(403);
      }
      expect(fixture.repository.sessions.size).toBe(0);

      const revoked = await request(baseUrl, 'DELETE', '/login/session', {
        cookie: `${LOGIN_SESSION_COOKIE_NAME}=${rawSessionToken}`,
        headers: { Origin: 'https://other.test' },
      });
      expect(revoked.status).toBe(403);
      expect(revoked.setCookie).toBeNull();
    });
  });

  it('revokes the current session by digest and clears the cookie', async () => {
    let now = new Date('2026-06-06T00:00:00.000Z');
    const fixture = createFixture({ now: () => now });
    const cookie = await issueSession(fixture.server);

    now = new Date('2026-06-06T00:10:00.000Z');
    await withServer(fixture.server, async (baseUrl) => {
      const response = await request(baseUrl, 'DELETE', '/login/session', {
        cookie,
        headers: { Origin: loginOrigin },
      });

      expect(response.status).toBe(204);
      expect(response.body).toBeNull();
      expect(response.setCookie).toContain(`${LOGIN_SESSION_COOKIE_NAME}=`);
      expect(response.setCookie).toContain('HttpOnly');
      expect(response.setCookie).toContain('Secure');
      expect(response.setCookie).toContain('SameSite=Lax');
      expect(response.setCookie).toContain('Path=/');
      expect(response.setCookie).toContain('Max-Age=0');
      expect(response.setCookie).not.toContain('Domain=');

      const stored = [...fixture.repository.sessions.values()][0]!;
      expect(stored.revoked_at).toEqual(now);
    });
  });

  it('does not revoke for malformed, duplicate, unknown, expired, or already revoked cookies', async () => {
    let now = new Date('2026-06-06T00:00:00.000Z');
    const fixture = createFixture({ now: () => now });
    const cookie = await issueSession(fixture.server);
    const stored = [...fixture.repository.sessions.values()][0]!;

    await withServer(fixture.server, async (baseUrl) => {
      for (const invalidCookie of [
        undefined,
        `${LOGIN_SESSION_COOKIE_NAME}=malformed`,
        `${cookie}; ${cookie}`,
        `${LOGIN_SESSION_COOKIE_NAME}=${'u'.repeat(43)}`,
      ]) {
        const response = await request(baseUrl, 'DELETE', '/login/session', {
          cookie: invalidCookie,
          headers: { Origin: loginOrigin },
        });
        expect(response.status).toBe(204);
        expect(response.setCookie).toContain('Max-Age=0');
        expect(stored.revoked_at).toBeNull();
      }

      now = new Date('2026-06-06T01:00:00.000Z');
      const expired = await request(baseUrl, 'DELETE', '/login/session', {
        cookie,
        headers: { Origin: loginOrigin },
      });
      expect(expired.status).toBe(204);
      expect(stored.revoked_at).toBeNull();
    });
  });
});
