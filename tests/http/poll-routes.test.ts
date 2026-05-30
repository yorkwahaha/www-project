import type { Server } from 'node:http';
import { describe, expect, it } from 'vitest';
import { createHttpServer } from '../../src/http/server.js';
import { getHealthStatus } from '../../src/milestone.js';
import { createInMemoryPollRepository } from '../../src/polls/in-memory-repository.js';
import { createPollService } from '../../src/polls/service.js';

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
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    return await run(baseUrl);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

async function request(
  baseUrl: string,
  method: string,
  path: string,
  options: {
    headers?: Record<string, string>;
    body?: unknown;
  } = {},
): Promise<{ status: number; body: Record<string, unknown> }> {
  const payload = options.body === undefined ? undefined : JSON.stringify(options.body);
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: payload,
  });
  const body = (await response.json()) as Record<string, unknown>;
  return { status: response.status, body };
}

describe('poll HTTP routes', () => {
  it('GET /health returns delivery milestone status', async () => {
    const repository = createInMemoryPollRepository();
    const server = createHttpServer({ pollService: createPollService(repository) });

    await withServer(server, async (baseUrl) => {
      const response = await request(baseUrl, 'GET', '/health');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(getHealthStatus());
    });
  });

  const creatorId = '22222222-2222-4222-8222-222222222222';

  it('POST /polls creates poll; GET returns detail without vote signals', async () => {
    const service = createPollService(createInMemoryPollRepository());
    const server = createHttpServer({ pollService: service });
    const closesAt = new Date(Date.now() + 86_400_000).toISOString();

    await withServer(server, async (baseUrl) => {
      const created = await request(baseUrl, 'POST', '/polls', {
        headers: { 'X-User-Id': creatorId },
        body: {
          title: 'HTTP poll',
          description: 'via test',
          category: 'general',
          options: ['One', 'Two'],
          closes_at: closesAt,
          publish: true,
        },
      });

      expect(created.status).toBe(201);
      const pollId = created.body.poll_id as string;

      const detail = await request(baseUrl, 'GET', `/polls/${pollId}`, {});
      expect(detail.status).toBe(200);
      expect(detail.body.poll_id).toBe(pollId);
      expect(detail.body).not.toHaveProperty('option_vote_count');
      expect(detail.body).not.toHaveProperty('manipulation_direction_signal');
    });
  });

  it('PUT /polls/:id is not allowed (creator zero-edit)', async () => {
    const service = createPollService(createInMemoryPollRepository());
    const pollId = '33333333-3333-4333-8333-333333333333';
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      const response = await request(baseUrl, 'PUT', `/polls/${pollId}`, {
        headers: { 'X-User-Id': creatorId },
        body: { title: 'changed' },
      });
      expect(response.status).toBe(405);
    });
  });

  it('POST /polls/:id/reference-answer records participation only', async () => {
    const repository = createInMemoryPollRepository();
    await repository.ensureUser(creatorId, 'Low trust creator');
    const service = createPollService(repository);
    const server = createHttpServer({ pollService: service });
    const created = await service.createPoll(
      {
        creatorId,
        title: 'HTTP Reference Answer',
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

    await withServer(server, async (baseUrl) => {
      const response = await request(
        baseUrl,
        'POST',
        `/polls/${created.poll_id}/reference-answer`,
        {
          headers: { 'X-User-Id': creatorId },
          body: { option_id: option!.id },
        },
      );

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ status: 'recorded', reference_answered: true });
      const [token] = [...repository.referenceAnswerTokens.values()];
      expect(token).not.toHaveProperty('option_id');
    });
  });
});
