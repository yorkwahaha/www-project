import type { Server } from 'node:http';
import { describe, expect, it } from 'vitest';
import type { CreatorSessionConfig } from '../../src/creator-sessions/config.js';
import { createInMemoryCreatorSessionRepository } from '../../src/creator-sessions/in-memory-repository.js';
import { createCreatorSessionService } from '../../src/creator-sessions/service.js';
import { clearDiagnosticRecordsForTests, getDiagnosticRecordsForTests } from '../../src/logging/safe-diagnostic.js';
import { createHttpServer } from '../../src/http/server.js';
import { createInMemoryPollRepository } from '../../src/polls/in-memory-repository.js';
import { createPollService } from '../../src/polls/service.js';
import { createPublicLifecycleSchedulerService } from '../../src/polls/lifecycle-scheduler-service.js';
import { withServer } from './helpers/admin-http-fixture.js';

const creatorId = '11111111-1111-4111-8111-111111111111';
const token = 'a'.repeat(43);
const allowedOrigin = 'http://creator.test';

function config(overrides: Partial<CreatorSessionConfig> = {}): CreatorSessionConfig {
  return {
    environment: 'test',
    allowedOrigins: new Set([allowedOrigin]),
    allowInsecureCookie: true,
    localTestIssuerEnabled: true,
    secureCookie: false,
    ...overrides,
  };
}

function createFixture(options: {
  config?: CreatorSessionConfig;
  now?: () => Date;
} = {}) {
  const pollRepository = createInMemoryPollRepository();
  const sessionRepository = createInMemoryCreatorSessionRepository();
  sessionRepository.seedUser(creatorId);
  const sessionConfig = options.config ?? config();
  const sessionService = createCreatorSessionService(sessionRepository, sessionConfig, {
    now: options.now,
    generateToken: () => token,
  });
  const server = createHttpServer({
    pollService: createPollService(pollRepository),
    creatorSession: { config: sessionConfig, service: sessionService },
  });
  return { pollRepository, sessionRepository, server };
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

function cookieHeader(setCookie: string | null): string {
  if (!setCookie) {
    throw new Error('expected Set-Cookie');
  }
  return setCookie.split(';', 1)[0]!;
}

describe('creator session routes', () => {
  it('issues a host-only strict HttpOnly cookie without returning or diagnosing raw token', async () => {
    clearDiagnosticRecordsForTests();
    const fixture = createFixture();
    await withServer(fixture.server, async (baseUrl) => {
      const response = await request(baseUrl, 'POST', '/creator/session', {
        headers: { Origin: allowedOrigin },
        body: { user_id: creatorId },
      });

      expect(response.status).toBe(201);
      expect(response.setCookie).toContain(`creator_session=${token}`);
      expect(response.setCookie).toContain('HttpOnly');
      expect(response.setCookie).toContain('SameSite=Strict');
      expect(response.setCookie).toContain('Path=/creator');
      expect(response.setCookie).not.toContain('Domain=');
      expect(response.setCookie).not.toContain('__Host-');
      expect(JSON.stringify(response.body)).not.toContain(token);
      expect(JSON.stringify(getDiagnosticRecordsForTests())).not.toContain(token);
    });
  });

  it('fails closed when issuance is unavailable and ignores spoofed X-User-Id', async () => {
    const fixture = createFixture({ config: config({ localTestIssuerEnabled: false }) });
    await withServer(fixture.server, async (baseUrl) => {
      const response = await request(baseUrl, 'POST', '/creator/session', {
        headers: { Origin: allowedOrigin, 'X-User-Id': creatorId },
        body: { user_id: creatorId },
      });
      expect(response.status).toBe(503);
      expect(response.body).toEqual({
        error: 'CREATOR_SESSION_ISSUER_UNAVAILABLE',
        message: 'Creator session issuer is unavailable',
      });
      expect(fixture.sessionRepository.sessions.size).toBe(0);
    });
  });

  it('fails closed in production and serializes Secure when secure cookies are configured', async () => {
    const productionFixture = createFixture({
      config: config({
        environment: 'production',
        allowedOrigins: new Set(['https://creator.test']),
        allowInsecureCookie: false,
        localTestIssuerEnabled: true,
        secureCookie: true,
      }),
    });
    await withServer(productionFixture.server, async (baseUrl) => {
      const response = await request(baseUrl, 'POST', '/creator/session', {
        headers: { Origin: 'https://creator.test' },
        body: { user_id: creatorId },
      });
      expect(response.status).toBe(503);
      expect(response.body).toEqual({
        error: 'CREATOR_SESSION_ISSUER_UNAVAILABLE',
        message: 'Creator session issuer is unavailable',
      });
      expect(response.setCookie).toBeNull();
      expect(JSON.stringify(response.body)).not.toContain(token);
      expect(productionFixture.sessionRepository.sessions.size).toBe(0);
    });

    const secureFixture = createFixture({ config: config({ secureCookie: true }) });
    await withServer(secureFixture.server, async (baseUrl) => {
      const response = await request(baseUrl, 'POST', '/creator/session', {
        headers: { Origin: allowedOrigin },
        body: { user_id: creatorId },
      });
      expect(response.setCookie).toContain('Secure');
    });
  });

  it('rejects missing, malformed, duplicate, unknown, expired, revoked, and inactive sessions', async () => {
    let now = new Date('2026-06-03T00:00:00.000Z');
    const fixture = createFixture({ now: () => now });
    await withServer(fixture.server, async (baseUrl) => {
      for (const cookie of [
        undefined,
        'creator_session=malformed',
        `creator_session=${token}; creator_session=${token}`,
        `creator_session=${'b'.repeat(43)}`,
      ]) {
        const response = await request(baseUrl, 'GET', '/creator/session', { cookie });
        expect(response.status).toBe(401);
        expect(JSON.stringify(response.body)).not.toContain(token);
      }

      const issued = await request(baseUrl, 'POST', '/creator/session', {
        headers: { Origin: allowedOrigin },
        body: { user_id: creatorId },
      });
      const cookie = cookieHeader(issued.setCookie);

      now = new Date('2026-06-03T12:00:00.000Z');
      expect((await request(baseUrl, 'GET', '/creator/session', { cookie })).status).toBe(
        401,
      );

      now = new Date('2026-06-03T00:00:00.000Z');
      const renewed = await request(baseUrl, 'POST', '/creator/session', {
        headers: { Origin: allowedOrigin },
        body: { user_id: creatorId },
      });
      const renewedCookie = cookieHeader(renewed.setCookie);
      fixture.sessionRepository.setUserStatus(creatorId, 'suspended');
      expect(
        (await request(baseUrl, 'GET', '/creator/session', { cookie: renewedCookie }))
          .status,
      ).toBe(401);
      fixture.sessionRepository.setUserStatus(creatorId, 'active');

      expect(
        (
          await request(baseUrl, 'DELETE', '/creator/session', {
            cookie: renewedCookie,
            headers: { Origin: allowedOrigin },
          })
        ).status,
      ).toBe(200);
      expect(
        (await request(baseUrl, 'GET', '/creator/session', { cookie: renewedCookie }))
          .status,
      ).toBe(401);
    });
  });

  it('rejects unsafe mutation origins and clears logout cookie with the matching path', async () => {
    const fixture = createFixture();
    await withServer(fixture.server, async (baseUrl) => {
      for (const origin of [undefined, 'not-an-origin', 'http://other.test']) {
        const response = await request(baseUrl, 'POST', '/creator/session', {
          headers: origin === undefined ? {} : { Origin: origin },
          body: { user_id: creatorId },
        });
        expect(response.status).toBe(403);
      }

      const issued = await request(baseUrl, 'POST', '/creator/session', {
        headers: { Origin: allowedOrigin },
        body: { user_id: creatorId },
      });
      const loggedOut = await request(baseUrl, 'DELETE', '/creator/session', {
        cookie: cookieHeader(issued.setCookie),
        headers: { Origin: allowedOrigin },
      });
      expect(loggedOut.setCookie).toContain('creator_session=');
      expect(loggedOut.setCookie).toContain('Path=/creator');
      expect(loggedOut.setCookie).toContain('Max-Age=0');
      expect(loggedOut.setCookie).not.toContain('Domain=');
      expect([...fixture.sessionRepository.sessions.values()][0]!.revoked_at).not.toBeNull();
    });
  });

  it('does not use creator cookies as authority for public participation or alter scheduler wiring', async () => {
    const fixture = createFixture();
    await fixture.pollRepository.ensureUser(creatorId, 'Creator');
    const poll = await createPollService(fixture.pollRepository).createPoll(
      {
        creatorId,
        title: 'Session isolation',
        description: '',
        category: 'general',
        options: ['A', 'B'],
        eligibleRuleId: null,
        closesAt: new Date(Date.now() + 60_000),
        publish: true,
      },
      'Creator',
    );
    await withServer(fixture.server, async (baseUrl) => {
      const cookie = `creator_session=${token}`;
      expect(
        (
          await request(baseUrl, 'POST', `/polls/${poll.poll_id}/reference-answer`, {
            cookie,
            body: { option_id: 'private-option' },
          })
        ).status,
      ).toBe(401);
      expect(
        (
          await request(baseUrl, 'POST', `/polls/${poll.poll_id}/vote`, {
            cookie,
            body: { option_id: 'private-option' },
          })
        ).status,
      ).toBe(401);
      expect(
        (await request(baseUrl, 'GET', `/polls/${poll.poll_id}/results`, { cookie }))
          .body,
      ).toMatchObject({ collecting: true, total_votes_display: '收集中' });
    });

    expect(
      await createPublicLifecycleSchedulerService(fixture.pollRepository)
        .runDuePublicLifecycleAdvancementBatch(),
    ).toEqual({ candidate_count: 0, advanced: [], failed: [] });

  });
});
