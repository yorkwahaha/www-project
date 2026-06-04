import type { Server } from 'node:http';
import { describe, expect, it } from 'vitest';
import { createHttpServer } from '../../src/http/server.js';
import { createInMemoryPollRepository } from '../../src/polls/in-memory-repository.js';
import {
  INVALID_OFFICIAL_VOTE_OPTION_MESSAGE,
  OFFICIAL_VOTE_ELIGIBILITY_MESSAGE,
} from '../../src/polls/official-vote-messages.js';
import { createPollService } from '../../src/polls/service.js';
import type { PollEligibilityRuleRow } from '../../src/polls/types.js';

const creatorId = '22222222-2222-4222-8222-222222222222';
const officialUserId = '44444444-4444-4444-8444-444444444444';

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

async function seedVoteByIndex() {
  const repository = createInMemoryPollRepository();
  await repository.ensureUser(officialUserId, 'Official');
  repository.setUserTrustLevel(officialUserId, 'official');
  const service = createPollService(repository, { selectShardId: () => 2 });
  const created = await service.createPoll(
    {
      creatorId,
      title: 'Vote by index HTTP',
      description: '',
      category: 'general',
      options: ['One', 'Two'],
      eligibleRuleId: null,
      closesAt: new Date(Date.now() + 86_400_000),
      publish: true,
    },
    'Creator',
  );
  const options = await repository.listOptionsByPollId(created.poll_id);
  return { repository, service, pollId: created.poll_id, options };
}

async function request(baseUrl: string, pollId: string, body: unknown) {
  const response = await fetch(`${baseUrl}/polls/${pollId}/vote-by-index`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': officialUserId,
    },
    body: JSON.stringify(body),
  });
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
  };
}

function profileRule(
  pollId: string,
  input: Partial<PollEligibilityRuleRow>,
): PollEligibilityRuleRow {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    poll_id: pollId,
    rule_type: 'unrestricted',
    min_birth_year_month: null,
    max_birth_year_month: null,
    allowed_regions: [],
    created_at: now,
    updated_at: now,
    ...input,
  };
}

function expectSafe(body: unknown, optionId?: string) {
  const serialized = JSON.stringify(body);
  if (optionId) expect(serialized).not.toContain(optionId);
  expect(serialized).not.toMatch(/option_id|token|shard_id|user_id|selected_option_index/i);
}

describe('POST /polls/:pollId/vote-by-index', () => {
  it('maps a valid public option index server-side and returns the existing safe vote response', async () => {
    const { repository, service, pollId, options } = await seedVoteByIndex();
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      const response = await request(baseUrl, pollId, { option_index: 1 });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ status: 'voted', voted: true });
      expectSafe(response.body, options[1]!.id);
      expect([...repository.voteCounters.values()]).toEqual([
        { poll_id: pollId, option_id: options[1]!.id, shard_id: 2, vote_count: 1 },
      ]);
      const [token] = [...repository.voteTokens.values()];
      expect(token).not.toHaveProperty('option_id');
    });
  });

  it('returns a safe validation error for invalid public option indexes', async () => {
    const { service, pollId } = await seedVoteByIndex();
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      for (const option_index of [-1, 1.5, 99, '1', null]) {
        const response = await request(baseUrl, pollId, { option_index });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(INVALID_OFFICIAL_VOTE_OPTION_MESSAGE);
        expectSafe(response.body);
      }
    });
  });

  it('returns indistinguishable profile-ineligible responses for valid and nonexistent indexes', async () => {
    const { repository, service, pollId } = await seedVoteByIndex();
    repository.setPollEligibilityRule(profileRule(pollId, {
      rule_type: 'region',
      allowed_regions: ['TW-KHH'],
    }));
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      const valid = await request(baseUrl, pollId, { option_index: 0 });
      const nonexistent = await request(baseUrl, pollId, { option_index: 99 });

      expect(valid).toEqual(nonexistent);
      expect(valid).toEqual({
        status: 403,
        body: {
          error: 'POLL_FORBIDDEN',
          message: OFFICIAL_VOTE_ELIGIBILITY_MESSAGE,
        },
      });
      expectSafe(valid.body);
      expect(repository.voteTokens.size).toBe(0);
      expect(repository.voteCounters.size).toBe(0);
    });
  });

  it('returns the existing safe not-found behavior for unknown and hidden polls', async () => {
    const { repository, service, pollId } = await seedVoteByIndex();
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      const unknown = await request(
        baseUrl,
        '99999999-9999-4999-8999-999999999999',
        { option_index: 0 },
      );
      expect(unknown.status).toBe(404);
      expect(unknown.body).toEqual({ error: 'POLL_NOT_FOUND', message: 'Poll not found' });

      for (const status of ['suspended', 'correction_pending'] as const) {
        repository.polls.get(pollId)!.status = status;
        const hidden = await request(baseUrl, pollId, { option_index: 0 });
        expect(hidden.status).toBe(404);
        expect(hidden.body).toEqual({ error: 'POLL_NOT_FOUND', message: 'Poll not found' });
        expect(JSON.stringify(hidden.body)).not.toMatch(/suspended|correction_pending/i);
      }
    });
  });

  it('returns the existing safe rejection for a visible poll that is not votable', async () => {
    const { repository, service, pollId } = await seedVoteByIndex();
    repository.polls.get(pollId)!.status = 'closed';
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      const response = await request(baseUrl, pollId, { option_index: 0 });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'POLL_VALIDATION', message: 'Poll is closed' });
      expectSafe(response.body);
    });
  });

  it('keeps public poll detail free of internal option ids', async () => {
    const { service, pollId, options } = await seedVoteByIndex();
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/polls/${pollId}`);
      const body = await response.json();
      const serialized = JSON.stringify(body);

      expect(response.status).toBe(200);
      expect(serialized).not.toContain(options[0]!.id);
      expect(serialized).not.toContain(options[1]!.id);
      expect(serialized).not.toContain('option_id');
    });
  });
});
