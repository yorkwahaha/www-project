import type { Server } from 'node:http';
import { describe, expect, it } from 'vitest';
import type { TrustedCredentialVerifier } from '../../src/auth/user-auth-resolver.js';
import {
  LOGIN_SESSION_COOKIE_NAME,
  sha256SessionToken,
} from '../../src/http/login-session-routes.js';
import {
  createUserAuthResolver,
} from '../../src/auth/user-auth-resolver.js';
import { createHttpServer } from '../../src/http/server.js';
import { createInMemoryPollRepository } from '../../src/polls/in-memory-repository.js';
import { createPollService } from '../../src/polls/service.js';
import { createInMemoryUserSessionRepository } from '../../src/user-sessions/in-memory-repository.js';
import { withServer } from './helpers/admin-http-fixture.js';

const userId = '99999999-9999-4999-8999-999999999999';
const flowOrigin = 'https://www.test';
const flowToken = 'phase-95-registration-login-flow-token';
const rawSessionToken = 'p'.repeat(43);

function createFixture() {
  const pollRepository = createInMemoryPollRepository();
  const sessionRepository = createInMemoryUserSessionRepository();
  const originalFindUserById = sessionRepository.findUserById.bind(sessionRepository);
  const originalCreateRegisteredUser =
    pollRepository.createRegisteredUser.bind(pollRepository);
  sessionRepository.findUserById = async (lookupUserId) => {
    const fromSessionStore = await originalFindUserById(lookupUserId);
    if (fromSessionStore) {
      return fromSessionStore;
    }
    const fromPoll = await pollRepository.findUserById(lookupUserId);
    if (!fromPoll) {
      return null;
    }
    return { id: fromPoll.id, status: fromPoll.status };
  };
  pollRepository.createRegisteredUser = async (input) => {
    const created = await originalCreateRegisteredUser(input);
    if (created) {
      sessionRepository.seedUser(input.userId);
    }
    return created;
  };
  const verifier: TrustedCredentialVerifier = (req) =>
    req.headers.authorization === `Bearer ${flowToken}` ? { user_id: userId } : null;

  const server = createHttpServer({
    pollService: createPollService(pollRepository),
    userAuthResolver: createUserAuthResolver({
      mode: 'production',
      trustedCredentialVerifier: verifier,
      userSessionRepository: sessionRepository,
    }),
    loginSession: {
      repository: sessionRepository,
      trustedCredentialVerifier: verifier,
      config: {
        allowedOrigins: new Set([flowOrigin]),
        sessionTtlSeconds: 3600,
      },
      generateToken: () => rawSessionToken,
    },
    registration: {
      repository: pollRepository,
      trustedCredentialVerifier: verifier,
      config: {
        allowedOrigins: new Set([flowOrigin]),
      },
    },
  });

  return { pollRepository, sessionRepository, server };
}

async function request(
  baseUrl: string,
  method: string,
  path: string,
  options: {
    headers?: Record<string, string>;
    body?: unknown;
    cookie?: string;
  } = {},
): Promise<{
  status: number;
  body: Record<string, unknown> | null;
  setCookie: string | null;
}> {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(options.cookie === undefined ? {} : { Cookie: options.cookie }),
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
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

async function runFullFlow(server: Server) {
  return withServer(server, async (baseUrl) => {
    const registration = await request(baseUrl, 'POST', '/registration', {
      headers: {
        Origin: flowOrigin,
        Authorization: `Bearer ${flowToken}`,
      },
      body: {
        display_name: 'Phase 95 Flow User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
    });
    expect(registration).toEqual({
      status: 201,
      body: {
        registered: true,
        login_required: true,
      },
      setCookie: null,
    });

    const anonymousMe = await request(baseUrl, 'GET', '/users/me');
    expect(anonymousMe.status).toBe(401);
    expect(anonymousMe.body).toEqual({
      error: 'AUTH_REQUIRED',
      message: 'User authentication is required',
    });

    const login = await request(baseUrl, 'POST', '/login/session', {
      headers: {
        Origin: flowOrigin,
        Authorization: `Bearer ${flowToken}`,
      },
    });
    expect(login.status).toBe(201);
    expect(login.body).toMatchObject({ authenticated: true });
    expect(login.body).toHaveProperty('expires_at');
    expect(Object.keys(login.body!).sort()).toEqual(['authenticated', 'expires_at']);
    const sessionCookie = cookieHeader(login.setCookie);
    expect(sessionCookie.startsWith(`${LOGIN_SESSION_COOKIE_NAME}=`)).toBe(true);

    const authenticatedMe = await request(baseUrl, 'GET', '/users/me', {
      cookie: sessionCookie,
    });
    expect(authenticatedMe.status).toBe(200);
    expect(authenticatedMe.body).toEqual({
      user_id: userId,
      display_name: 'Phase 95 Flow User',
    });
    expect(Object.keys(authenticatedMe.body!).sort()).toEqual([
      'display_name',
      'user_id',
    ]);
    expect(JSON.stringify(authenticatedMe.body)).not.toMatch(
      /birth_year_month|residential_region|token_sha256|session_id|www_session|cookie|option_id|option_text|option_index/i,
    );

    const logout = await request(baseUrl, 'DELETE', '/login/session', {
      headers: { Origin: flowOrigin },
      cookie: sessionCookie,
    });
    expect(logout.status).toBe(204);
    expect(logout.body).toBeNull();

    const meAfterLogout = await request(baseUrl, 'GET', '/users/me');
    expect(meAfterLogout.status).toBe(401);
    expect(meAfterLogout.body).toEqual({
      error: 'AUTH_REQUIRED',
      message: 'User authentication is required',
    });

    return { baseUrl, sessionCookie };
  });
}

describe('Phase 95 registration/login full flow HTTP coverage', () => {
  it('registers without session, logs in to read display_name, then logs out anonymously', async () => {
    const fixture = createFixture();
    await runFullFlow(fixture.server);

    const user = await fixture.pollRepository.findUserById(userId);
    expect(user).toMatchObject({
      id: userId,
      display_name: 'Phase 95 Flow User',
      status: 'active',
      residential_region: 'TW-TPE',
    });
  });

  it('revokes the issued session after logout', async () => {
    const fixture = createFixture();
    const { sessionCookie } = await runFullFlow(fixture.server);

    await withServer(fixture.server, async (baseUrl) => {
      const rejected = await request(baseUrl, 'GET', '/users/me', {
        cookie: sessionCookie,
      });
      expect(rejected.status).toBe(401);
    });

    const stored = [...fixture.sessionRepository.sessions.values()][0]!;
    expect(stored.revoked_at).not.toBeNull();
    expect(stored.token_sha256.equals(sha256SessionToken(rawSessionToken))).toBe(true);
  });
});
