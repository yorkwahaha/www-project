import type { Server } from 'node:http';
import { describe, expect, it } from 'vitest';
import { createUserAuthResolver } from '../../src/auth/user-auth-resolver.js';
import type { CreatorSessionConfig } from '../../src/creator-sessions/config.js';
import { createInMemoryCreatorSessionRepository } from '../../src/creator-sessions/in-memory-repository.js';
import { createCreatorSessionService } from '../../src/creator-sessions/service.js';
import { createHttpServer } from '../../src/http/server.js';
import { createInMemoryPollRepository } from '../../src/polls/in-memory-repository.js';
import { createPollService } from '../../src/polls/service.js';

const creatorA = '11111111-1111-4111-8111-111111111111';
const creatorB = '22222222-2222-4222-8222-222222222222';
const tokenA = 'a'.repeat(43);
const allowedOrigin = 'http://creator.test';
const AUTH_REQUIRED = {
  error: 'AUTH_REQUIRED',
  message: 'User authentication is required',
} as const;

async function withServer<T>(server: Server, run: (baseUrl: string) => Promise<T>) {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('failed to bind test server');
  try {
    return await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    );
  }
}

function sessionConfig(environment: CreatorSessionConfig['environment']): CreatorSessionConfig {
  const productionOrigin = 'https://creator.test';
  return {
    environment,
    allowedOrigins: new Set([environment === 'production' ? productionOrigin : allowedOrigin]),
    allowInsecureCookie: environment !== 'production',
    localTestIssuerEnabled: environment !== 'production',
    secureCookie: environment === 'production',
  };
}

function productionOriginHeader(): Record<string, string> {
  return { Origin: 'https://creator.test' };
}

async function createFixture(options: {
  environment: CreatorSessionConfig['environment'];
  userAuthResolver?: ReturnType<typeof createUserAuthResolver>;
}) {
  const pollRepository = createInMemoryPollRepository();
  await pollRepository.ensureUser(creatorA, 'Creator A');
  await pollRepository.ensureUser(creatorB, 'Creator B');
  const pollService = createPollService(pollRepository);
  const sessionRepository = createInMemoryCreatorSessionRepository();
  sessionRepository.seedUser(creatorA);
  sessionRepository.seedUser(creatorB);
  const config = sessionConfig(options.environment);
  const sessionService = createCreatorSessionService(sessionRepository, config, {
    generateToken: () => tokenA,
  });
  const userAuthResolver =
    options.userAuthResolver ??
  createUserAuthResolver({
    mode: options.environment === 'production' ? 'production' : 'test',
    allowMvpUserIdHeader: options.environment !== 'production',
  });
  const server = createHttpServer({
    pollService,
    userAuthResolver,
    creatorSession: { config, service: sessionService },
  });
  return { pollRepository, pollService, server, sessionService, config };
}

async function request(
  baseUrl: string,
  method: string,
  path: string,
  options: {
    cookie?: string;
    headers?: Record<string, string>;
    body?: unknown;
  } = {},
) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(options.cookie === undefined ? {} : { Cookie: options.cookie }),
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
    setCookie: response.headers.get('set-cookie'),
  };
}

async function issueCookie(baseUrl: string): Promise<string> {
  const response = await request(baseUrl, 'POST', '/creator/session', {
    headers: { Origin: allowedOrigin },
    body: { user_id: creatorA },
  });
  expect(response.status).toBe(201);
  return response.setCookie!.split(';', 1)[0]!;
}

function createBody(title = 'Cutover poll') {
  return {
    title,
    description: '',
    category: 'general',
    options: ['A', 'B'],
    eligible_rule_id: null,
    closes_at: new Date(Date.now() + 86_400_000).toISOString(),
    publish: true,
  };
}

describe('Creator route UserAuthResolver cutover', () => {
  it('rejects raw X-User-Id and creator_session in production mode for creator polls', async () => {
    const fixture = await createFixture({ environment: 'production' });
    const cookie = `creator_session=${tokenA}`;

    await withServer(fixture.server, async (baseUrl) => {
      const create = await request(baseUrl, 'POST', '/creator/polls', {
        cookie,
        headers: { ...productionOriginHeader(), 'X-User-Id': creatorA },
        body: createBody(),
      });
      const list = await request(baseUrl, 'GET', '/creator/polls', {
        cookie,
        headers: { 'X-User-Id': creatorA },
      });

      expect(create).toEqual({ status: 401, body: AUTH_REQUIRED, setCookie: null });
      expect(list).toEqual({ status: 401, body: AUTH_REQUIRED, setCookie: null });
      expect(fixture.pollRepository.polls.size).toBe(0);
    });
  });

  it('accepts trusted verifier identity in production mode for creator poll create and list', async () => {
    const fixture = await createFixture({
      environment: 'production',
      userAuthResolver: createUserAuthResolver({
        mode: 'production',
        trustedCredentialVerifier: () => ({ user_id: creatorA }),
      }),
    });

    await withServer(fixture.server, async (baseUrl) => {
      const created = await request(baseUrl, 'POST', '/creator/polls', {
        headers: {
          ...productionOriginHeader(),
          'X-User-Id': creatorB,
        },
        body: { ...createBody(), creator_id: creatorB, user_id: creatorB },
      });
      expect(created.status).toBe(201);
      expect(fixture.pollRepository.polls.get(created.body.poll_id as string)?.creator_id).toBe(
        creatorA,
      );

      const listed = await request(baseUrl, 'GET', '/creator/polls', {
        cookie: `creator_session=${tokenA}`,
        headers: { 'X-User-Id': creatorB },
      });
      expect(listed.status).toBe(200);
      const polls = listed.body.polls as Array<Record<string, unknown>>;
      expect(polls).toHaveLength(1);
      expect(polls[0]!.poll_id).toBe(created.body.poll_id);
    });
  });

  it('denies cross-owner delete in production even when spoofed identity headers are present', async () => {
    const fixture = await createFixture({
      environment: 'production',
      userAuthResolver: createUserAuthResolver({
        mode: 'production',
        trustedCredentialVerifier: (req) => {
          const spoofed = req.headers['x-spoofed-creator']?.toString();
          return spoofed ? { user_id: spoofed } : { user_id: creatorA };
        },
      }),
    });
    const created = await fixture.pollService.createCreatorPoll({
      creatorId: creatorA,
      title: 'Owned',
      description: '',
      category: 'general',
      options: ['A', 'B'],
      eligibleRuleId: null,
      closesAt: new Date(Date.now() + 86_400_000),
      publish: true,
    });

    await withServer(fixture.server, async (baseUrl) => {
      const denied = await request(baseUrl, 'DELETE', `/creator/polls/${created.poll_id}`, {
        headers: {
          ...productionOriginHeader(),
          'X-User-Id': creatorA,
          'X-Spoofed-Creator': creatorB,
        },
      });
      expect(denied.status).toBe(403);
    });
  });

  it('keeps local demo creator_session compatibility for creator polls', async () => {
    const fixture = await createFixture({ environment: 'test' });

    await withServer(fixture.server, async (baseUrl) => {
      const cookie = await issueCookie(baseUrl);
      const created = await request(baseUrl, 'POST', '/creator/polls', {
        cookie,
        headers: { Origin: allowedOrigin, 'X-User-Id': creatorB },
        body: createBody('Local demo'),
      });
      expect(created.status).toBe(201);
      expect(fixture.pollRepository.polls.get(created.body.poll_id as string)?.creator_id).toBe(
        creatorA,
      );
    });
  });

  it('ignores creator_session for production GET /creator/session and uses trusted verifier only', async () => {
    const fixture = await createFixture({
      environment: 'production',
      userAuthResolver: createUserAuthResolver({
        mode: 'production',
        trustedCredentialVerifier: () => ({ user_id: creatorA }),
      }),
    });

    await withServer(fixture.server, async (baseUrl) => {
      const withCookie = await request(baseUrl, 'GET', '/creator/session', {
        cookie: `creator_session=${tokenA}`,
      });
      expect(withCookie).toEqual({
        status: 200,
        body: { authenticated: true },
        setCookie: null,
      });
    });
  });

  it('rejects production GET /creator/session when only creator_session or raw X-User-Id is present', async () => {
    const fixture = await createFixture({ environment: 'production' });

    await withServer(fixture.server, async (baseUrl) => {
      const withCookie = await request(baseUrl, 'GET', '/creator/session', {
        cookie: `creator_session=${tokenA}`,
      });
      const withHeader = await request(baseUrl, 'GET', '/creator/session', {
        headers: { 'X-User-Id': creatorA },
      });

      expect(withCookie).toEqual({ status: 401, body: AUTH_REQUIRED, setCookie: null });
      expect(withHeader).toEqual({ status: 401, body: AUTH_REQUIRED, setCookie: null });
    });
  });

  it('keeps production POST /creator/session issuance fail-closed', async () => {
    const fixture = await createFixture({ environment: 'production' });

    await withServer(fixture.server, async (baseUrl) => {
      const response = await request(baseUrl, 'POST', '/creator/session', {
        headers: { ...productionOriginHeader(), 'X-User-Id': creatorA },
        body: { user_id: creatorA },
      });
      expect(response.status).toBe(503);
      expect(response.body.error).toBe('CREATOR_SESSION_ISSUER_UNAVAILABLE');
      expect(response.setCookie).toBeNull();
    });
  });
});
