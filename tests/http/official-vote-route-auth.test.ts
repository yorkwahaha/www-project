import type { Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createUserAuthResolver } from '../../src/auth/user-auth-resolver.js';
import {
  clearDiagnosticRecordsForTests,
  getDiagnosticRecordsForTests,
} from '../../src/logging/safe-diagnostic.js';
import { createHttpServer } from '../../src/http/server.js';
import { createInMemoryPollRepository } from '../../src/polls/in-memory-repository.js';
import { createPollService } from '../../src/polls/service.js';

const officialUserId = '44444444-4444-4444-8444-444444444444';
const creatorId = '22222222-2222-4222-8222-222222222222';
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

async function seedVote() {
  const repository = createInMemoryPollRepository();
  await repository.ensureUser(officialUserId, 'Official');
  repository.setUserTrustLevel(officialUserId, 'official');
  const service = createPollService(repository, { selectShardId: () => 2 });
  const created = await service.createPoll(
    {
      creatorId,
      title: 'Vote auth HTTP',
      description: '',
      category: 'general',
      options: ['One', 'Two'],
      eligibleRuleId: null,
      closesAt: new Date(Date.now() + 86_400_000),
      publish: true,
    },
    'Creator',
  );
  const [option] = await repository.listOptionsByPollId(created.poll_id);
  return { repository, service, pollId: created.poll_id, optionId: option!.id };
}

async function postVote(
  baseUrl: string,
  pollId: string,
  path: 'vote' | 'vote-by-index',
  body: unknown,
  headers: Record<string, string> = {},
) {
  const response = await fetch(`${baseUrl}/polls/${pollId}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
  };
}

function expectSafe(body: unknown, optionId?: string) {
  const json = JSON.stringify(body);
  if (optionId) expect(json).not.toContain(optionId);
  expect(json).not.toMatch(/option_id|option_index|option_text|token|shard_id/i);
}

describe('Official Vote route UserAuthResolver cutover', () => {
  beforeEach(clearDiagnosticRecordsForTests);
  afterEach(clearDiagnosticRecordsForTests);

  it('rejects raw X-User-Id in production mode for vote and vote-by-index', async () => {
    const { service, pollId, optionId } = await seedVote();
    const productionResolver = createUserAuthResolver({ mode: 'production' });
    const server = createHttpServer({
      pollService: service,
      userAuthResolver: productionResolver,
    });

    await withServer(server, async (baseUrl) => {
      const vote = await postVote(
        baseUrl,
        pollId,
        'vote',
        { option_id: optionId },
        { 'X-User-Id': officialUserId },
      );
      const voteByIndex = await postVote(
        baseUrl,
        pollId,
        'vote-by-index',
        { option_index: 0 },
        { 'X-User-Id': officialUserId },
      );

      expect(vote).toEqual({ status: 401, body: AUTH_REQUIRED });
      expect(voteByIndex).toEqual(vote);
      expectSafe(vote.body);
      expectSafe(voteByIndex.body);
    });
  });

  it('accepts trusted verifier identity in production mode for vote', async () => {
    const { repository, service, pollId, optionId } = await seedVote();
    const productionResolver = createUserAuthResolver({
      mode: 'production',
      trustedCredentialVerifier: () => ({ user_id: officialUserId }),
    });
    const server = createHttpServer({
      pollService: service,
      userAuthResolver: productionResolver,
    });

    await withServer(server, async (baseUrl) => {
      const vote = await postVote(baseUrl, pollId, 'vote', { option_id: optionId });

      expect(vote.status).toBe(201);
      expect(vote.body).toEqual({ status: 'voted', voted: true });
      expect(repository.voteTokens.size).toBe(1);
      expect(repository.voteCounters.size).toBe(1);
      expectSafe(vote.body, optionId);
      expectSafe(getDiagnosticRecordsForTests(), optionId);
    });
  });

  it('accepts trusted verifier identity in production mode for vote-by-index', async () => {
    const { repository, service, pollId, optionId } = await seedVote();
    const productionResolver = createUserAuthResolver({
      mode: 'production',
      trustedCredentialVerifier: () => ({ user_id: officialUserId }),
    });
    const server = createHttpServer({
      pollService: service,
      userAuthResolver: productionResolver,
    });

    await withServer(server, async (baseUrl) => {
      const voteByIndex = await postVote(baseUrl, pollId, 'vote-by-index', {
        option_index: 0,
      });

      expect(voteByIndex.status).toBe(201);
      expect(voteByIndex.body).toEqual({ status: 'voted', voted: true });
      expect(repository.voteTokens.size).toBe(1);
      expect(repository.voteCounters.size).toBe(1);
      expectSafe(voteByIndex.body, optionId);
    });
  });

  it('does not authorize vote or vote-by-index with creator_session cookie only', async () => {
    const { repository, service, pollId, optionId } = await seedVote();
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      const vote = await postVote(
        baseUrl,
        pollId,
        'vote',
        { option_id: optionId },
        { Cookie: 'creator_session=malformed-public-cookie' },
      );
      const voteByIndex = await postVote(
        baseUrl,
        pollId,
        'vote-by-index',
        { option_index: 0 },
        { Cookie: 'creator_session=malformed-public-cookie' },
      );

      expect(vote).toEqual({ status: 401, body: AUTH_REQUIRED });
      expect(voteByIndex).toEqual(vote);
      expect(repository.voteTokens.size).toBe(0);
      expect(repository.voteCounters.size).toBe(0);
    });
  });

  it('keeps local test resolver MVP X-User-Id compatibility for vote and vote-by-index', async () => {
    const { repository, service, pollId, optionId } = await seedVote();
    const createdTwo = await service.createPoll(
      {
        creatorId,
        title: 'Vote auth HTTP 2',
        description: '',
        category: 'general',
        options: ['A', 'B'],
        eligibleRuleId: null,
        closesAt: new Date(Date.now() + 86_400_000),
        publish: true,
      },
      'Creator',
    );
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      const vote = await postVote(
        baseUrl,
        pollId,
        'vote',
        { option_id: optionId },
        { 'X-User-Id': officialUserId },
      );
      const voteByIndex = await postVote(
        baseUrl,
        createdTwo.poll_id,
        'vote-by-index',
        { option_index: 1 },
        { 'X-User-Id': officialUserId },
      );

      expect(vote.status).toBe(201);
      expect(voteByIndex.status).toBe(201);
      expect(repository.voteTokens.size).toBe(2);
      expect(repository.voteCounters.size).toBe(2);
    });
  });
});
