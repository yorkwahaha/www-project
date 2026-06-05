import type { Server } from 'node:http';
import { describe, expect, it } from 'vitest';
import { createHttpServer } from '../../src/http/server.js';
import { createInMemoryPollRepository } from '../../src/polls/in-memory-repository.js';
import { createPollService } from '../../src/polls/service.js';
import type { PollEligibilityRuleRow } from '../../src/polls/types.js';

const userId = '11111111-1111-4111-8111-111111111111';
const lowTrustUserId = '22222222-2222-4222-8222-222222222222';

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

async function request(
  baseUrl: string,
  method: 'GET' | 'PUT' | 'POST',
  path: string,
  options: {
    headers?: Record<string, string>;
    body?: unknown;
  } = {},
) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
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

describe('User profile HTTP routes', () => {
  it('requires user auth for GET and PUT', async () => {
    const service = createPollService(createInMemoryPollRepository());
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      const getResponse = await request(baseUrl, 'GET', '/users/me/profile');
      const putResponse = await request(baseUrl, 'PUT', '/users/me/profile', {
        body: { birth_year_month: null, residential_region: null },
      });

      expect(getResponse).toEqual({
        status: 401,
        body: { error: 'AUTH_REQUIRED', message: 'X-User-Id header is required' },
      });
      expect(putResponse).toEqual(getResponse);
    });
  });

  it('does not accept creator_session cookie as profile auth', async () => {
    const service = createPollService(createInMemoryPollRepository());
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      const response = await request(baseUrl, 'GET', '/users/me/profile', {
        headers: { Cookie: 'creator_session=malformed-public-cookie' },
      });

      expect(response).toEqual({
        status: 401,
        body: { error: 'AUTH_REQUIRED', message: 'X-User-Id header is required' },
      });
    });
  });

  it('updates and reads back only birth_year_month and coarse residential_region', async () => {
    const repository = createInMemoryPollRepository();
    await repository.ensureUser(userId, 'Profile User');
    const service = createPollService(repository);
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      const updated = await request(baseUrl, 'PUT', '/users/me/profile', {
        headers: {
          'X-User-Id': userId,
          Cookie: 'creator_session=ignored-public-cookie',
        },
        body: { birth_year_month: '1998-07', residential_region: ' TW-TPE ' },
      });
      const readBack = await request(baseUrl, 'GET', '/users/me/profile', {
        headers: {
          'X-User-Id': userId,
          Cookie: 'creator_session=ignored-public-cookie',
        },
      });

      expect(updated).toEqual({
        status: 200,
        body: { birth_year_month: '1998-07', residential_region: 'TW-TPE' },
      });
      expect(readBack).toEqual(updated);
      expect(JSON.stringify(readBack.body)).not.toMatch(
        /gender|birthday|address|option_id|option_text|option_index|token|shard/i,
      );
    });
  });

  it('rejects exact birthday, invalid region, unknown fields, and missing fields', async () => {
    const repository = createInMemoryPollRepository();
    await repository.ensureUser(userId, 'Profile User');
    const service = createPollService(repository);
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      await request(baseUrl, 'PUT', '/users/me/profile', {
        headers: { 'X-User-Id': userId },
        body: { birth_year_month: '1998-07', residential_region: 'TW-TPE' },
      });

      for (const body of [
        { birth_year_month: '1998-07-02', residential_region: 'TW-TPE' },
        { birth_year_month: '1998-07-01', residential_region: 'TW-TPE' },
        { birth_year_month: '1998-07', residential_region: 'Taipei Road 1' },
        { birth_year_month: '1998-07', residential_region: ' '.repeat(2) },
        { birth_year_month: '1998-07', residential_region: `TW-${'A'.repeat(63)}` },
        { birth_year_month: '1998-07', residential_region: 'TW-TPE', gender: 'x' },
        { birth_year_month: '1998-07' },
      ]) {
        const response = await request(baseUrl, 'PUT', '/users/me/profile', {
          headers: { 'X-User-Id': userId },
          body,
        });

        expect(response).toEqual({
          status: 400,
          body: { error: 'POLL_VALIDATION', message: 'Invalid profile payload' },
        });
      }

      const readBack = await request(baseUrl, 'GET', '/users/me/profile', {
        headers: { 'X-User-Id': userId },
      });
      expect(readBack.body).toEqual({
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      });
    });
  });

  it('allows null to clear both profile fields', async () => {
    const repository = createInMemoryPollRepository();
    await repository.ensureUser(userId, 'Profile User');
    const service = createPollService(repository);
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      await request(baseUrl, 'PUT', '/users/me/profile', {
        headers: { 'X-User-Id': userId },
        body: { birth_year_month: '1998-07', residential_region: 'TW-TPE' },
      });
      const cleared = await request(baseUrl, 'PUT', '/users/me/profile', {
        headers: { 'X-User-Id': userId },
        body: { birth_year_month: null, residential_region: null },
      });

      expect(cleared).toEqual({
        status: 200,
        body: { birth_year_month: null, residential_region: null },
      });
    });
  });

  it('does not apply profile eligibility to Reference Answer after profile update', async () => {
    const repository = createInMemoryPollRepository();
    await repository.ensureUser(lowTrustUserId, 'Low trust');
    const service = createPollService(repository);
    const created = await service.createPoll(
      {
        creatorId: lowTrustUserId,
        title: 'Reference Answer profile boundary',
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
    repository.setPollEligibilityRule(profileRule(created.poll_id, {
      rule_type: 'region',
      allowed_regions: ['TW-KHH'],
    }));
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      await request(baseUrl, 'PUT', '/users/me/profile', {
        headers: { 'X-User-Id': lowTrustUserId },
        body: { birth_year_month: '1998-07', residential_region: 'TW-TPE' },
      });
      const response = await request(
        baseUrl,
        'POST',
        `/polls/${created.poll_id}/reference-answer`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': lowTrustUserId,
            Cookie: 'creator_session=ignored-public-cookie',
          },
          body: { option_id: option!.id },
        },
      );

      expect(response).toEqual({
        status: 201,
        body: { status: 'recorded', reference_answered: true },
      });
      expect(repository.voteTokens.size).toBe(0);
      expect(repository.voteCounters.size).toBe(0);
    });
  });
});
