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

async function seedFeed() {
  const repository = createInMemoryPollRepository();
  const service = createPollService(repository);
  await service.createPoll(
    {
      creatorId,
      title: 'Public feed poll',
      description: '',
      category: 'general',
      options: ['One', 'Two'],
      eligibleRuleId: null,
      closesAt: new Date(Date.now() + 86_400_000),
      publish: true,
    },
    'Creator',
  );
  return createHttpServer({ pollService: service });
}

describe('public feed HTTP route', () => {
  it('returns identical safe payloads for different user identities', async () => {
    const server = await seedFeed();

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
      expect(serialized).not.toMatch(
        /option_id|options|vote|result_bucket|shard|token|user_id|trust|participation|reference_answer|official_vote|published_at|closes_at/i,
      );
    });
  });

  it('rejects unsupported query params with a safe scrubbed error', async () => {
    const server = await seedFeed();

    await withServer(server, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/polls/feed?user_id=sensitive`);

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: 'UNSUPPORTED_QUERY_PARAMS',
        message: 'Feed query parameters are not supported',
      });
    });
  });
});
