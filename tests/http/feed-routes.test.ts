import type { Server } from 'node:http';
import { describe, expect, it } from 'vitest';
import { createHttpServer } from '../../src/http/server.js';
import { createInMemoryPollRepository } from '../../src/polls/in-memory-repository.js';
import { createPollService } from '../../src/polls/service.js';

const creatorId = '11111111-1111-4111-8111-111111111111';

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

async function seedFeedPolls(count: number) {
  const repository = createInMemoryPollRepository();
  const service = createPollService(repository);
  const pollIds: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const created = await service.createPoll(
      {
        creatorId,
        title: `Public feed poll ${index}`,
        description: '',
        category: 'general',
        options: ['One', 'Two'],
        eligibleRuleId: null,
        closesAt: new Date(Date.now() + 86_400_000),
        publish: true,
      },
      'Creator',
    );
    repository.polls.get(created.poll_id)!.published_at = new Date(
      Date.UTC(2026, 0, 1, 0, 0, index),
    );
    pollIds.push(created.poll_id);
  }
  return { repository, service, pollIds };
}

describe('public feed HTTP route', () => {
  it('returns identical safe payloads for different user identities', async () => {
    const { service } = await seedFeedPolls(1);
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      const first = await fetch(`${baseUrl}/polls/feed`, {
        headers: { 'X-User-Id': '22222222-2222-4222-8222-222222222222' },
      });
      const second = await fetch(`${baseUrl}/polls/feed`, {
        headers: { 'X-User-Id': '33333333-3333-4333-8333-333333333333' },
      });
      const firstBody = await first.json();
      const secondBody = await second.json();
      const serialized = JSON.stringify(firstBody);

      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
      expect(firstBody).toEqual(secondBody);
      expect(firstBody.next_cursor).toBeNull();
      expect(serialized).not.toMatch(
        /option_id|options|vote|result_bucket|shard|token|user_id|trust|participation|reference_answer|official_vote|published_at|closes_at/i,
      );
    });
  });

  it('supports limit and cursor query parameters', async () => {
    const { service } = await seedFeedPolls(25);
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      const page1Response = await fetch(`${baseUrl}/polls/feed?limit=10`);
      const page1Body = (await page1Response.json()) as {
        polls: Array<{ poll_id: string }>;
        next_cursor: string | null;
      };

      expect(page1Response.status).toBe(200);
      expect(page1Body.polls).toHaveLength(10);
      expect(page1Body.next_cursor).toBeTypeOf('string');

      const page2Response = await fetch(
        `${baseUrl}/polls/feed?limit=10&cursor=${encodeURIComponent(page1Body.next_cursor!)}`,
      );
      const page2Body = (await page2Response.json()) as {
        polls: Array<{ poll_id: string }>;
        next_cursor: string | null;
      };

      expect(page2Response.status).toBe(200);
      expect(page2Body.polls).toHaveLength(10);
      expect(
        page2Body.polls.every(
          (poll) => !page1Body.polls.some((first) => first.poll_id === poll.poll_id),
        ),
      ).toBe(true);
      expect(JSON.stringify(page2Body)).not.toMatch(
        /option_id|vote|reference_answer|user_id|published_at|engagement|ranking/i,
      );
    });
  });

  it('rejects unsupported query params with a safe scrubbed error', async () => {
    const { service } = await seedFeedPolls(1);
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/polls/feed?user_id=sensitive`);

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: 'UNSUPPORTED_QUERY_PARAMS',
        message: 'Feed query parameters are not supported',
      });
    });
  });

  it('rejects invalid limit and cursor values', async () => {
    const { service } = await seedFeedPolls(1);
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      const invalidLimit = await fetch(`${baseUrl}/polls/feed?limit=0`);
      const invalidCursor = await fetch(`${baseUrl}/polls/feed?cursor=bad`);

      expect(invalidLimit.status).toBe(400);
      await expect(invalidLimit.json()).resolves.toEqual({
        error: 'INVALID_FEED_LIMIT',
        message: 'Feed limit must be an integer from 1 to 50',
      });

      expect(invalidCursor.status).toBe(400);
      await expect(invalidCursor.json()).resolves.toEqual({
        error: 'INVALID_FEED_CURSOR',
        message: 'Invalid feed cursor',
      });
    });
  });
});
