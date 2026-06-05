import type { Server } from 'node:http';
import { describe, expect, it } from 'vitest';
import { createHttpServer } from '../../src/http/server.js';
import { createInMemoryPollRepository } from '../../src/polls/in-memory-repository.js';
import { createPollService } from '../../src/polls/service.js';

const creatorId = '11111111-1111-4111-8111-111111111111';

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

async function getJson(baseUrl: string, path: string, cookie = false) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: cookie ? { Cookie: 'creator_session=malformed-public-cookie' } : {},
  });
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
  };
}

describe('creator_session public read boundary', () => {
  it('does not affect public read, result, feed, or notice routes', async () => {
    const repository = createInMemoryPollRepository();
    await repository.ensureUser(creatorId, 'Creator');
    const service = createPollService(repository);
    const created = await service.createPoll(
      {
        creatorId,
        title: 'Creator cookie public reads',
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
      for (const path of [
        `/polls/${created.poll_id}`,
        `/polls/${created.poll_id}/results`,
        '/polls/feed',
        `/polls/${created.poll_id}/public-notices`,
      ]) {
        const withoutCookie = await getJson(baseUrl, path);
        const withCookie = await getJson(baseUrl, path, true);

        expect(withCookie).toEqual(withoutCookie);
        expect(JSON.stringify(withCookie.body)).not.toMatch(/creator_session|token|shard_id/i);
      }
    });
  });
});
