import type { Server } from 'node:http';
import { describe, expect, it } from 'vitest';
import { createHttpServer } from '../../src/http/server.js';
import { createInMemoryPollRepository } from '../../src/polls/in-memory-repository.js';
import { createPollService } from '../../src/polls/service.js';

const creatorId = '22222222-2222-4222-8222-222222222222';

async function withServer<T>(
  server: Server,
  run: (baseUrl: string) => Promise<T>,
): Promise<T> {
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('failed to bind test server');
  }
  try {
    return await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

async function request(
  baseUrl: string,
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  } = {},
) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method,
    headers: options.headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
  };
}

describe('Result Display HTTP route', () => {
  it('returns public aggregate display data without sensitive fields', async () => {
    const repository = createInMemoryPollRepository();
    const service = createPollService(repository);
    const created = await service.createPoll(
      {
        creatorId,
        title: 'HTTP Result Display',
        description: '',
        category: 'general',
        options: ['One', 'Two'],
        eligibleRuleId: null,
        closesAt: new Date(Date.now() + 86_400_000),
        publish: true,
      },
      'Creator',
    );
    repository.polls.get(created.poll_id)!.public_lifecycle_state = 'revealed';
    const options = await repository.listOptionsByPollId(created.poll_id);
    repository.voteCounters.set('first-shard', {
      poll_id: created.poll_id,
      option_id: options[0]!.id,
      shard_id: 1,
      vote_count: 18,
    });
    repository.voteCounters.set('second-shard', {
      poll_id: created.poll_id,
      option_id: options[0]!.id,
      shard_id: 6,
      vote_count: 12,
    });
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      const response = await request(baseUrl, `/polls/${created.poll_id}/results`);
      const serialized = JSON.stringify(response.body);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        poll_id: created.poll_id,
        public_lifecycle_state: 'revealed',
        display_mode: 'bucketed_percentage',
        total_votes_display: '30–99',
      });
      expect(serialized).not.toContain(options[0]!.id);
      expect(serialized).not.toContain(options[1]!.id);
      expect(serialized).not.toContain(creatorId);
      expect(serialized).not.toMatch(
        /user_id|token|shard_id|voted_at_minute|answered_at|eligibility_snapshot|result_snapshot|vote_event/i,
      );
    });
  });

  it('returns the same counter-free collecting shell for creator and public reads', async () => {
    const repository = createInMemoryPollRepository();
    const service = createPollService(repository);
    const created = await service.createPoll(
      {
        creatorId,
        title: 'Collecting shell',
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
    repository.voteCounters.set('threshold-crossing-shard', {
      poll_id: created.poll_id,
      option_id: options[0]!.id,
      shard_id: 1,
      vote_count: 30,
    });
    repository.listVoteAggregatesByPollId = async () => {
      throw new Error('collecting HTTP path must not query aggregates');
    };
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      const path = `/polls/${created.poll_id}/results`;
      const creator = await request(baseUrl, path, {
        headers: { 'X-User-Id': creatorId },
      });
      const publicRead = await request(baseUrl, path);

      expect(creator.status).toBe(200);
      expect(creator.body).toEqual(publicRead.body);
      expect(creator.body).toMatchObject({
        public_lifecycle_state: 'collecting',
        display_mode: 'collecting',
        total_votes_display: '收集中',
        collecting: true,
        options: [
          { display_percentage: null, display_count: null },
          { display_percentage: null, display_count: null },
        ],
      });
      expect(JSON.stringify(creator.body)).not.toContain('30–99');
    });
  });

  it.each([
    ['draft', '此問卷目前沒有可公開顯示的結果。'],
    ['cancelled', '問卷已取消，不會產生公開結果。'],
    ['unpublished', '此問卷已結束公開鎖定期，並由發起者下架。'],
  ] as const)(
    'returns a counter-free unavailable shell for %s lifecycle state',
    async (publicLifecycleState, userMessage) => {
      const repository = createInMemoryPollRepository();
      const service = createPollService(repository);
      const created = await service.createPoll(
        {
          creatorId,
          title: 'Unavailable lifecycle shell',
          description: '',
          category: 'general',
          options: ['One', 'Two'],
          eligibleRuleId: null,
          closesAt: new Date(Date.now() + 86_400_000),
          publish: true,
        },
        'Creator',
      );
      repository.polls.get(created.poll_id)!.public_lifecycle_state =
        publicLifecycleState;
      repository.listVoteAggregatesByPollId = async () => {
        throw new Error('unavailable HTTP path must not query aggregates');
      };
      const server = createHttpServer({ pollService: service });

      await withServer(server, async (baseUrl) => {
        const response = await request(baseUrl, `/polls/${created.poll_id}/results`);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          public_lifecycle_state: publicLifecycleState,
          display_mode: 'unavailable',
          total_votes_display: '結果不可用',
          collecting: false,
          user_message: userMessage,
          options: [
            { display_percentage: null, display_count: null },
            { display_percentage: null, display_count: null },
          ],
        });
      });
    },
  );

  it('returns 404 for hidden poll states without leaking moderation labels', async () => {
    const repository = createInMemoryPollRepository();
    const service = createPollService(repository);
    const created = await service.createPoll(
      {
        creatorId,
        title: 'Hidden results poll',
        description: '',
        category: 'general',
        options: ['One', 'Two'],
        eligibleRuleId: null,
        closesAt: new Date(Date.now() + 86_400_000),
        publish: true,
      },
      'Creator',
    );
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      for (const status of ['suspended', 'correction_pending'] as const) {
        repository.polls.get(created.poll_id)!.status = status;
        const response = await request(baseUrl, `/polls/${created.poll_id}/results`);
        const serialized = JSON.stringify(response.body);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
          error: 'POLL_NOT_FOUND',
          message: 'Poll not found',
        });
        expect(serialized).not.toMatch(/suspended|correction_pending|moderation/i);
      }
    });
  });

  it('returns a scrubbed safe 404 for a missing poll', async () => {
    const server = createHttpServer({
      pollService: createPollService(createInMemoryPollRepository()),
    });

    await withServer(server, async (baseUrl) => {
      const response = await request(
        baseUrl,
        '/polls/99999999-9999-4999-8999-999999999999/results',
      );

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'POLL_NOT_FOUND',
        message: 'Poll not found',
      });
    });
  });

  it('returns a scrubbed safe 400 for an invalid poll id', async () => {
    const server = createHttpServer({
      pollService: createPollService(createInMemoryPollRepository()),
    });

    await withServer(server, async (baseUrl) => {
      const response = await request(baseUrl, '/polls/not-a-uuid/results');
      const serialized = JSON.stringify(response.body);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'INVALID_POLL_ID',
        message: 'Invalid poll id',
      });
      expect(serialized).not.toMatch(
        /option_id|token|sql|stack|request|diagnostic|voted_at_minute/i,
      );
    });
  });

  it('returns identical result payloads for different user identities', async () => {
    const repository = createInMemoryPollRepository();
    const service = createPollService(repository);
    const created = await service.createPoll(
      {
        creatorId,
        title: 'Identity-neutral result',
        description: '',
        category: 'general',
        options: ['One', 'Two'],
        eligibleRuleId: null,
        closesAt: new Date(Date.now() + 86_400_000),
        publish: true,
      },
      'Creator',
    );
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      const path = `/polls/${created.poll_id}/results`;
      const first = await request(baseUrl, path, {
        headers: { 'X-User-Id': '33333333-3333-4333-8333-333333333333' },
      });
      const second = await request(baseUrl, path, {
        headers: { 'X-User-Id': '44444444-4444-4444-8444-444444444444' },
      });

      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
      expect(first.body).toEqual(second.body);
    });
  });

  it('keeps result payload stable after a duplicate vote attempt', async () => {
    const officialUserId = '44444444-4444-4444-8444-444444444444';
    const repository = createInMemoryPollRepository();
    await repository.ensureUser(officialUserId, 'Official');
    repository.setUserTrustLevel(officialUserId, 'official');
    const service = createPollService(repository, { selectShardId: () => 2 });
    const created = await service.createPoll(
      {
        creatorId,
        title: 'Duplicate-stable result',
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
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      const votePath = `/polls/${created.poll_id}/vote`;
      const voteHeaders = {
        'Content-Type': 'application/json',
        'X-User-Id': officialUserId,
      };
      const firstVote = await request(baseUrl, votePath, {
        method: 'POST',
        headers: voteHeaders,
        body: { option_id: option!.id },
      });
      const beforeDuplicate = await request(baseUrl, `/polls/${created.poll_id}/results`);
      const duplicateVote = await request(baseUrl, votePath, {
        method: 'POST',
        headers: voteHeaders,
        body: { option_id: option!.id },
      });
      const afterDuplicate = await request(baseUrl, `/polls/${created.poll_id}/results`);

      expect(firstVote.status).toBe(201);
      expect(duplicateVote.status).toBe(409);
      expect(afterDuplicate.body).toEqual(beforeDuplicate.body);
      expect([...repository.voteCounters.values()][0]!.vote_count).toBe(1);
    });
  });
});
