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

describe('poll lifecycle HTTP routes', () => {
  it('requires creator auth and exposes only server-written lifecycle results', async () => {
    const repository = createInMemoryPollRepository();
    const service = createPollService(repository);
    const server = createHttpServer({ pollService: service });
    const cancelled = await service.createPoll(
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
      await expect(post(baseUrl, `/polls/${cancelled.poll_id}/cancel`)).resolves.toMatchObject({
        status: 401,
      });
      await expect(
        post(baseUrl, `/polls/${cancelled.poll_id}/cancel`, creatorId),
      ).resolves.toEqual({
        status: 200,
        body: {
          public_lifecycle_state: 'cancelled',
          message: '問卷已取消，不會產生公開結果。',
        },
      });
      const close = await post(baseUrl, `/polls/${revealed.poll_id}/close`, creatorId);
      expect(close).toMatchObject({
        status: 200,
        body: { public_lifecycle_state: 'revealed' },
      });
      await service.advancePublicLifecycle(revealed.poll_id);
      repository.polls.get(revealed.poll_id)!.public_lock_ends_at =
        new Date(Date.now() - 1_000);
      await service.advancePublicLifecycle(revealed.poll_id);
      await expect(
        post(baseUrl, `/polls/${revealed.poll_id}/unpublish`, creatorId),
      ).resolves.toEqual({
        status: 200,
        body: {
          public_lifecycle_state: 'unpublished',
          user_message: '此問卷已結束公開鎖定期，並由發起者下架。',
        },
      });
    });
  });
});
