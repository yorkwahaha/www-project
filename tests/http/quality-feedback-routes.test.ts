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
  pollId: string,
  body: unknown,
  headers: Record<string, string> = {},
): Promise<{ status: number; body: Record<string, unknown> }> {
  const response = await fetch(`${baseUrl}/polls/${pollId}/quality-feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
  };
}

async function seedQualityFeedbackRoute() {
  const repository = createInMemoryPollRepository();
  const service = createPollService(repository);
  const created = await service.createPoll(
    {
      creatorId,
      title: 'Quality feedback route',
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
  return { repository, service, pollId: created.poll_id, server };
}

function expectSuccessBodySafe(body: Record<string, unknown>): void {
  expect(body).toEqual({ ok: true });
  const serialized = JSON.stringify(body);
  expect(serialized).not.toMatch(
    /aggregate_count|threshold_state|bucket_state|ranking|creator_score|creator_punishment|result|option/i,
  );
}

describe('POST /polls/:pollId/quality-feedback', () => {
  it('writes valid tag aggregates and returns only ok', async () => {
    const { repository, pollId, server } = await seedQualityFeedbackRoute();

    await withServer(server, async (baseUrl) => {
      const first = await request(baseUrl, pollId, { feedback_tag: '表達清楚' });
      const second = await request(baseUrl, pollId, { feedback_tag: '表達清楚' });
      const third = await request(baseUrl, pollId, { feedback_tag: '選項公平' });

      expect(first.status).toBe(201);
      expect(second.status).toBe(201);
      expect(third.status).toBe(201);
      expectSuccessBodySafe(first.body);
      expectSuccessBodySafe(second.body);
      expectSuccessBodySafe(third.body);
    });

    expect(repository.qualityFeedbackAggregates.get(`${pollId}:表達清楚`)).toMatchObject({
      aggregate_count: 2,
    });
    expect(repository.qualityFeedbackAggregates.get(`${pollId}:選項公平`)).toMatchObject({
      aggregate_count: 1,
    });
  });

  it('rejects invalid tag bodies without writing aggregates', async () => {
    const { repository, pollId, server } = await seedQualityFeedbackRoute();

    await withServer(server, async (baseUrl) => {
      for (const body of [
        {},
        { feedback_tag: 1 },
        { feedback_tag: '' },
        { feedback_tag: '不太想答' },
        { feedback_tag: null },
      ]) {
        const response = await request(baseUrl, pollId, body);
        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({ error: 'POLL_VALIDATION' });
      }
    });

    expect(repository.qualityFeedbackAggregates.size).toBe(0);
  });

  it('rejects extra fields, including forbidden linkage fields', async () => {
    const { repository, pollId, server } = await seedQualityFeedbackRoute();

    await withServer(server, async (baseUrl) => {
      for (const field of [
        'option_id',
        'option_index',
        'user_id',
        'session_id',
        'creator_session',
        'vote_token',
        'request_id',
        'device_id',
        'ip_address',
        'user_agent',
        'trace_id',
        'metric_id',
        'error_id',
        'analytics_id',
        'selected_option',
        'threshold_state',
        'bucket_state',
      ]) {
        const response = await request(baseUrl, pollId, {
          feedback_tag: '表達清楚',
          [field]: 'forbidden',
        });
        expect(response.status, field).toBe(400);
        expect(response.body, field).toMatchObject({ error: 'POLL_VALIDATION' });
      }
    });

    expect(repository.qualityFeedbackAggregates.size).toBe(0);
  });

  it('does not require login or read user/session identity', async () => {
    const { repository, pollId, server } = await seedQualityFeedbackRoute();

    await withServer(server, async (baseUrl) => {
      const anonymous = await request(baseUrl, pollId, { feedback_tag: '期待結果' });
      const withIgnoredHeaders = await request(
        baseUrl,
        pollId,
        { feedback_tag: '期待結果' },
        {
          'X-User-Id': '44444444-4444-4444-8444-444444444444',
          Cookie: 'creator_session=malformed-public-cookie',
        },
      );

      expect(anonymous.status).toBe(201);
      expect(withIgnoredHeaders.status).toBe(201);
      expectSuccessBodySafe(anonymous.body);
      expectSuccessBodySafe(withIgnoredHeaders.body);
    });

    expect(repository.qualityFeedbackAggregates.get(`${pollId}:期待結果`)).toMatchObject({
      aggregate_count: 2,
    });
  });

  it('does not read option selection, vote token, or counter shard data', async () => {
    const { repository, pollId, server } = await seedQualityFeedbackRoute();

    await withServer(server, async (baseUrl) => {
      const response = await request(baseUrl, pollId, { feedback_tag: '題目不優' });

      expect(response.status).toBe(201);
      expectSuccessBodySafe(response.body);
    });

    expect(repository.referenceAnswerTokens.size).toBe(0);
    expect(repository.voteTokens.size).toBe(0);
    expect(repository.voteCounters.size).toBe(0);
  });

  it('returns existing not-found style for missing polls', async () => {
    const { repository, server } = await seedQualityFeedbackRoute();

    await withServer(server, async (baseUrl) => {
      const response = await request(
        baseUrl,
        '99999999-9999-4999-8999-999999999999',
        { feedback_tag: '表達清楚' },
      );

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'POLL_NOT_FOUND',
        message: 'Poll not found',
      });
    });

    expect(repository.qualityFeedbackAggregates.size).toBe(0);
  });
});
