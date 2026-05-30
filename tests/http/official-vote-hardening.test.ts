import type { Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearDiagnosticRecordsForTests,
  getDiagnosticRecordsForTests,
} from '../../src/logging/safe-diagnostic.js';
import { createHttpServer } from '../../src/http/server.js';
import { createInMemoryPollRepository } from '../../src/polls/in-memory-repository.js';
import { INVALID_OFFICIAL_VOTE_OPTION_MESSAGE } from '../../src/polls/official-vote-messages.js';
import { createPollService } from '../../src/polls/service.js';

const officialUserId = '44444444-4444-4444-8444-444444444444';
const creatorId = '22222222-2222-4222-8222-222222222222';

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

async function request(baseUrl: string, path: string, body: unknown) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': officialUserId },
    body: JSON.stringify(body),
  });
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
  };
}

async function seedVote() {
  const repository = createInMemoryPollRepository();
  await repository.ensureUser(officialUserId, 'Official');
  repository.setUserTrustLevel(officialUserId, 'official');
  const service = createPollService(repository, { selectShardId: () => 2 });
  const created = await service.createPoll(
    {
      creatorId,
      title: 'Vote HTTP',
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

function expectSafe(body: unknown, optionId: string) {
  const json = JSON.stringify(body);
  expect(json).not.toContain(optionId);
  expect(json).not.toContain('option_id');
}

describe('Official Vote HTTP hardening', () => {
  beforeEach(clearDiagnosticRecordsForTests);
  afterEach(clearDiagnosticRecordsForTests);

  it('returns safe success and ignores client-provided shard_id', async () => {
    const { repository, service, pollId, optionId } = await seedVote();
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      const response = await request(baseUrl, `/polls/${pollId}/vote`, {
        option_id: optionId,
        shard_id: 7,
      });
      expect(response.status).toBe(201);
      expect(response.body).toEqual({ status: 'voted', voted: true });
      expectSafe(response.body, optionId);
      expect([...repository.voteCounters.values()][0]!.shard_id).toBe(2);
      expectSafe(getDiagnosticRecordsForTests(), optionId);
    });
  });

  it('returns safe errors without submitted option UUID or field name', async () => {
    const { service, pollId } = await seedVote();
    const invalidOptionId = '99999999-9999-4999-8999-999999999999';
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      const response = await request(baseUrl, `/polls/${pollId}/vote`, {
        option_id: invalidOptionId,
      });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(INVALID_OFFICIAL_VOTE_OPTION_MESSAGE);
      expectSafe(response.body, invalidOptionId);
      expectSafe(getDiagnosticRecordsForTests(), invalidOptionId);
    });
  });

  it('returns safe conflict for duplicate vote without incrementing again', async () => {
    const { repository, service, pollId, optionId } = await seedVote();
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      await request(baseUrl, `/polls/${pollId}/vote`, { option_id: optionId });
      const duplicate = await request(baseUrl, `/polls/${pollId}/vote`, {
        option_id: optionId,
      });

      expect(duplicate.status).toBe(409);
      expectSafe(duplicate.body, optionId);
      expect([...repository.voteCounters.values()][0]!.vote_count).toBe(1);
    });
  });

  it('returns safe 500 and rolls back token when counter increment fails', async () => {
    const { repository, service, pollId, optionId } = await seedVote();
    repository.failNextVoteCounterIncrement();
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      const response = await request(baseUrl, `/polls/${pollId}/vote`, {
        option_id: optionId,
      });

      expect(response.status).toBe(500);
      expectSafe(response.body, optionId);
      expectSafe(getDiagnosticRecordsForTests(), optionId);
      expect(repository.voteTokens.size).toBe(0);
      expect(repository.voteCounters.size).toBe(0);
    });
  });
});
