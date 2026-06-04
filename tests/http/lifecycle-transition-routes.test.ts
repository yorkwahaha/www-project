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
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
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

async function post(baseUrl: string, path: string, userId?: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: userId ? { 'X-User-Id': userId } : {},
  });
  return { status: response.status, body: await response.json() };
}

describe('legacy poll lifecycle HTTP routes', () => {
  it('retires legacy X-User-Id lifecycle writes without mutating poll state', async () => {
    const repository = createInMemoryPollRepository();
    const service = createPollService(repository);
    const server = createHttpServer({ pollService: service });
    const collecting = await service.createPoll(
      {
        creatorId,
        title: 'Cancel route',
        description: '',
        category: 'general',
        options: ['A', 'B'],
        eligibleRuleId: null,
        closesAt: new Date(Date.now() + 86_400_000),
        publish: true,
      },
      'Creator',
    );
    const revealed = await service.createPoll(
      {
        creatorId,
        title: 'Reveal route',
        description: '',
        category: 'general',
        options: ['A', 'B'],
        eligibleRuleId: null,
        closesAt: new Date(Date.now() + 86_400_000),
        publish: true,
      },
      'Creator',
    );
    repository.polls.get(revealed.poll_id)!.closes_at = new Date(Date.now() - 1_000);

    await withServer(server, async (baseUrl) => {
      for (const [pollId, transition] of [
        [collecting.poll_id, 'cancel'],
        [revealed.poll_id, 'close'],
        [revealed.poll_id, 'unpublish'],
      ] as const) {
        await expect(
          post(baseUrl, `/polls/${pollId}/${transition}`, creatorId),
        ).resolves.toEqual({
          status: 410,
          body: {
            error: 'LEGACY_CREATOR_WRITE_RETIRED',
            message: 'Legacy creator-write routes are retired; use /creator/polls',
          },
        });
      }

      expect(repository.polls.get(collecting.poll_id)).toMatchObject({
        public_lifecycle_state: 'collecting',
        cancelled_at: null,
      });
      expect(repository.polls.get(revealed.poll_id)).toMatchObject({
        public_lifecycle_state: 'collecting',
        revealed_at: null,
        unpublished_at: null,
      });
    });
  });
});
