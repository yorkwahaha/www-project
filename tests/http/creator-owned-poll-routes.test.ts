import { describe, expect, it } from 'vitest';
import type { CreatorSessionConfig } from '../../src/creator-sessions/config.js';
import { createInMemoryCreatorSessionRepository } from '../../src/creator-sessions/in-memory-repository.js';
import { createCreatorSessionService } from '../../src/creator-sessions/service.js';
import { createHttpServer } from '../../src/http/server.js';
import { createInMemoryPollRepository } from '../../src/polls/in-memory-repository.js';
import { createPollService } from '../../src/polls/service.js';
import { withServer } from './helpers/admin-http-fixture.js';

const creatorA = '11111111-1111-4111-8111-111111111111';
const creatorB = '22222222-2222-4222-8222-222222222222';
const tokenA = 'a'.repeat(43);
const tokenB = 'b'.repeat(43);
const allowedOrigin = 'http://creator.test';

function config(): CreatorSessionConfig {
  return {
    environment: 'test',
    allowedOrigins: new Set([allowedOrigin]),
    allowInsecureCookie: true,
    localTestIssuerEnabled: true,
    secureCookie: false,
  };
}

async function createFixture() {
  const pollRepository = createInMemoryPollRepository();
  await pollRepository.ensureUser(creatorA, 'Creator A');
  await pollRepository.ensureUser(creatorB, 'Creator B');
  const pollService = createPollService(pollRepository);
  const sessionRepository = createInMemoryCreatorSessionRepository();
  sessionRepository.seedUser(creatorA);
  sessionRepository.seedUser(creatorB);
  const tokens = [tokenA, tokenB];
  const sessionConfig = config();
  const sessionService = createCreatorSessionService(sessionRepository, sessionConfig, {
    generateToken: () => tokens.shift() ?? tokenB,
  });
  return {
    pollRepository,
    pollService,
    server: createHttpServer({
      pollService,
      creatorSession: { config: sessionConfig, service: sessionService },
    }),
  };
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

async function issueCookie(baseUrl: string, userId: string): Promise<string> {
  const response = await request(baseUrl, 'POST', '/creator/session', {
    headers: { Origin: allowedOrigin },
    body: { user_id: userId },
  });
  expect(response.status).toBe(201);
  return response.setCookie!.split(';', 1)[0]!;
}

function createBody(title = 'Owned poll') {
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

async function createOwnedPoll(
  baseUrl: string,
  cookie: string,
  title = 'Owned poll',
): Promise<string> {
  const response = await request(baseUrl, 'POST', '/creator/polls', {
    cookie,
    headers: { Origin: allowedOrigin },
    body: createBody(title),
  });
  expect(response.status).toBe(201);
  return response.body.poll_id as string;
}

describe('creator-owned poll routes', () => {
  it('prefers creator cookie over spoofed identity inputs and rejects missing auth', async () => {
    const fixture = await createFixture();
    await withServer(fixture.server, async (baseUrl) => {
      const withoutAuth = await request(baseUrl, 'POST', '/creator/polls', {
        headers: { Origin: allowedOrigin },
        body: createBody('No auth'),
      });
      expect(withoutAuth).toMatchObject({
        status: 401,
        body: {
          error: 'CREATOR_SESSION_INVALID',
          message: 'Valid creator session is required',
        },
      });

      const cookie = await issueCookie(baseUrl, creatorA);
      const created = await request(baseUrl, 'POST', '/creator/polls', {
        cookie,
        headers: {
          Origin: allowedOrigin,
          'X-User-Id': creatorB,
          'X-Display-Name': 'Spoofed creator',
        },
        body: { ...createBody(), creator_id: creatorB, user_id: creatorB },
      });
      expect(created.status).toBe(201);
      expect(fixture.pollRepository.polls.get(created.body.poll_id as string)?.creator_id)
        .toBe(creatorA);
    });
  });

  it('applies the exact-match Origin gate to every creator mutation', async () => {
    const fixture = await createFixture();
    const existing = await fixture.pollService.createCreatorPoll({
      creatorId: creatorA,
      title: 'Origin gate',
      description: '',
      category: 'general',
      options: ['A', 'B'],
      eligibleRuleId: null,
      closesAt: new Date(Date.now() + 86_400_000),
      publish: true,
    });
    await withServer(fixture.server, async (baseUrl) => {
      const cookie = await issueCookie(baseUrl, creatorA);
      for (const [method, path, body] of [
        ['POST', '/creator/polls', createBody()],
        ['DELETE', `/creator/polls/${existing.poll_id}`, undefined],
        ['POST', `/creator/polls/${existing.poll_id}/cancel`, undefined],
        ['POST', `/creator/polls/${existing.poll_id}/close`, undefined],
        ['POST', `/creator/polls/${existing.poll_id}/unpublish`, undefined],
      ] as const) {
        const response = await request(baseUrl, method, path, { cookie, body });
        expect(response.status).toBe(403);
        expect(response.body.error).toBe('CREATOR_SESSION_ORIGIN_REJECTED');
      }
      expect((await request(baseUrl, 'GET', '/creator/polls', { cookie })).status).toBe(200);
    });
  });

  it('denies cross-owner actions and reuses lifecycle transactions for the owner', async () => {
    const fixture = await createFixture();
    await withServer(fixture.server, async (baseUrl) => {
      const cookieA = await issueCookie(baseUrl, creatorA);
      const cookieB = await issueCookie(baseUrl, creatorB);
      const cancelPollId = await createOwnedPoll(baseUrl, cookieA, 'Cancel owned');

      expect(
        (await request(baseUrl, 'POST', `/creator/polls/${cancelPollId}/cancel`, {
          cookie: cookieB,
          headers: { Origin: allowedOrigin, 'X-User-Id': creatorA },
        })).status,
      ).toBe(403);
      expect(
        (await request(baseUrl, 'DELETE', `/creator/polls/${cancelPollId}`, {
          cookie: cookieB,
          headers: { Origin: allowedOrigin, 'X-User-Id': creatorA },
        })).status,
      ).toBe(403);
      expect(
        await request(baseUrl, 'POST', `/creator/polls/${cancelPollId}/cancel`, {
          cookie: cookieA,
          headers: { Origin: allowedOrigin },
        }),
      ).toMatchObject({
        status: 200,
        body: { public_lifecycle_state: 'cancelled' },
      });

      const deletePollId = await createOwnedPoll(baseUrl, cookieA, 'Delete owned');
      expect(
        await request(baseUrl, 'DELETE', `/creator/polls/${deletePollId}`, {
          cookie: cookieA,
          headers: { Origin: allowedOrigin },
        }),
      ).toMatchObject({
        status: 200,
        body: { poll_id: deletePollId, status: 'deleted' },
      });

      const closePollId = await createOwnedPoll(baseUrl, cookieA, 'Close owned');
      fixture.pollRepository.polls.get(closePollId)!.closes_at =
        new Date(Date.now() - 1_000);
      expect(
        await request(baseUrl, 'POST', `/creator/polls/${closePollId}/close`, {
          cookie: cookieA,
          headers: { Origin: allowedOrigin },
        }),
      ).toMatchObject({
        status: 200,
        body: { public_lifecycle_state: 'revealed' },
      });
      await fixture.pollService.advancePublicLifecycle(closePollId);
      fixture.pollRepository.polls.get(closePollId)!.public_lock_ends_at =
        new Date(Date.now() - 1_000);
      await fixture.pollService.advancePublicLifecycle(closePollId);
      expect(
        await request(baseUrl, 'POST', `/creator/polls/${closePollId}/unpublish`, {
          cookie: cookieA,
          headers: { Origin: allowedOrigin },
        }),
      ).toMatchObject({
        status: 200,
        body: { public_lifecycle_state: 'unpublished' },
      });
    });
  });

  it('returns a bounded deterministic counter-free owned list and filters hidden rows', async () => {
    const fixture = await createFixture();
    for (let index = 0; index < 55; index += 1) {
      await fixture.pollService.createCreatorPoll({
        creatorId: creatorA,
        title: `Visible ${index}`,
        description: '',
        category: 'general',
        options: ['A', 'B'],
        eligibleRuleId: null,
        closesAt: new Date(Date.now() + 86_400_000),
        publish: index !== 0,
      });
    }
    const hiddenIds: string[] = [];
    for (const status of ['deleted', 'suspended', 'correction_pending'] as const) {
      const created = await fixture.pollService.createCreatorPoll({
        creatorId: creatorA,
        title: `Hidden ${status}`,
        description: '',
        category: 'general',
        options: ['A', 'B'],
        eligibleRuleId: null,
        closesAt: new Date(Date.now() + 86_400_000),
        publish: true,
      });
      fixture.pollRepository.polls.get(created.poll_id)!.status = status;
      hiddenIds.push(created.poll_id);
    }
    const archived = await fixture.pollService.createCreatorPoll({
      creatorId: creatorA,
      title: 'Hidden archived',
      description: '',
      category: 'general',
      options: ['A', 'B'],
      eligibleRuleId: null,
      closesAt: new Date(Date.now() + 86_400_000),
      publish: true,
    });
    fixture.pollRepository.polls.get(archived.poll_id)!.archived_at = new Date();
    hiddenIds.push(archived.poll_id);

    await withServer(fixture.server, async (baseUrl) => {
      const cookie = await issueCookie(baseUrl, creatorA);
      const response = await request(baseUrl, 'GET', '/creator/polls', { cookie });
      expect(response.status).toBe(200);
      const polls = response.body.polls as Array<Record<string, unknown>>;
      expect(polls).toHaveLength(50);
      expect(polls.map((poll) => poll.poll_id)).toEqual(
        (await fixture.pollRepository.listCreatorOwnedPolls(creatorA, 50))
          .map((poll) => poll.id),
      );
      expect(polls.map((poll) => poll.poll_id)).not.toEqual(
        expect.arrayContaining(hiddenIds),
      );
      expect(Object.keys(polls[0]!).sort()).toEqual([
        'cancelled_at',
        'category',
        'closes_at',
        'poll_id',
        'public_lifecycle_state',
        'public_lock_ends_at',
        'revealed_at',
        'title',
        'unpublished_at',
      ]);
      expect(JSON.stringify(response.body)).not.toMatch(
        /creator_id|option|count|percent|token|ranking|reference.answer/i,
      );
    });
  });
});
