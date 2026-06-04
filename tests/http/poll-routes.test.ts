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

  it('retires legacy POST /polls even when X-User-Id is supplied', async () => {
    const repository = createInMemoryPollRepository();
    const service = createPollService(repository);
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      const response = await request(baseUrl, 'POST', '/polls', {
        headers: { 'X-User-Id': creatorId, 'X-Display-Name': 'Legacy Creator' },
        body: {
          title: 'Legacy create',
          description: '',
          category: 'general',
          options: ['One', 'Two'],
          eligible_rule_id: null,
          closes_at: new Date(Date.now() + 86_400_000).toISOString(),
          publish: true,
        },
      });

      expect(response).toEqual({
        status: 410,
        body: {
          error: 'LEGACY_CREATOR_WRITE_RETIRED',
          message: 'Legacy creator-write routes are retired; use /creator/polls',
        },
      });
      expect(repository.polls.size).toBe(0);
    });
  });

  it('retires legacy DELETE /polls/:id even when X-User-Id is supplied', async () => {
    const repository = createInMemoryPollRepository();
    await repository.ensureUser(creatorId, 'Low trust creator');
    const service = createPollService(repository);
    const server = createHttpServer({ pollService: service });
    const created = await service.createPoll(
      {
        creatorId,
        title: 'Delete legacy route',
        description: '',
        category: 'general',
        options: ['One', 'Two'],
        eligibleRuleId: null,
        closesAt: new Date(Date.now() + 86_400_000),
        publish: true,
      },
      'Creator',
    );

    await withServer(server, async (baseUrl) => {
      const response = await request(baseUrl, 'DELETE', `/polls/${created.poll_id}`, {
        headers: { 'X-User-Id': creatorId },
      });

      expect(response).toEqual({
        status: 410,
        body: {
          error: 'LEGACY_CREATOR_WRITE_RETIRED',
          message: 'Legacy creator-write routes are retired; use /creator/polls',
        },
      });
      expect(repository.polls.get(created.poll_id)?.status).toBe('active');
    });
  });

  it('GET /polls/:id returns detail without vote signals', async () => {
    const repository = createInMemoryPollRepository();
    await repository.ensureUser(creatorId, 'Low trust creator');
    const ineligibleUserId = '33333333-3333-4333-8333-333333333333';
    await repository.ensureUser(ineligibleUserId, 'Ineligible low-trust user');
    const service = createPollService(repository);
    const server = createHttpServer({ pollService: service });
    const created = await service.createPoll(
      {
        creatorId,
        title: 'HTTP poll',
        description: 'via test',
        category: 'general',
        options: ['One', 'Two'],
        eligibleRuleId: null,
        closesAt: new Date(Date.now() + 86_400_000),
        publish: true,
      },
      'Creator',
    );

    await withServer(server, async (baseUrl) => {
      const pollId = created.poll_id;

      const detail = await request(baseUrl, 'GET', `/polls/${pollId}`, {});
      const ineligibleDetail = await request(baseUrl, 'GET', `/polls/${pollId}`, {
        headers: { 'X-User-Id': ineligibleUserId },
      });
      expect(detail.status).toBe(200);
      expect(ineligibleDetail.status).toBe(200);
      expect(ineligibleDetail.body).toEqual(detail.body);
      expect(detail.body.poll_id).toBe(pollId);
      expect(detail.body.public_lifecycle_state).toBe('collecting');
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

  it('GET /polls/:id returns 404 for draft polls without leaking state', async () => {
    const repository = createInMemoryPollRepository();
    await repository.ensureUser(creatorId, 'Low trust creator');
    const service = createPollService(repository);
    const server = createHttpServer({ pollService: service });
    const created = await service.createPoll(
      {
        creatorId,
        title: 'Draft poll',
        description: '',
        category: 'general',
        options: ['One', 'Two'],
        eligibleRuleId: null,
        closesAt: new Date(Date.now() + 86_400_000),
        publish: false,
      },
      'Creator',
    );

    await withServer(server, async (baseUrl) => {
      const pollId = created.poll_id;
      const response = await request(baseUrl, 'GET', `/polls/${pollId}`, {});

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'POLL_NOT_FOUND',
        message: 'Poll not found',
      });
      expect(JSON.stringify(response.body)).not.toMatch(/draft|suspended|moderation/i);
    });
  });
});
