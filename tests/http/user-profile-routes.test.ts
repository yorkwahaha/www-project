import type { Server } from 'node:http';
import { describe, expect, it } from 'vitest';
import { createUserAuthResolver } from '../../src/auth/user-auth-resolver.js';
import { createHttpServer } from '../../src/http/server.js';
import { createInMemoryPollRepository } from '../../src/polls/in-memory-repository.js';
import { createPollService } from '../../src/polls/service.js';
import type { PollEligibilityRuleRow } from '../../src/polls/types.js';

const userId = '11111111-1111-4111-8111-111111111111';
const otherUserId = '33333333-3333-4333-8333-333333333333';
const lowTrustUserId = '22222222-2222-4222-8222-222222222222';
const AUTH_REQUIRED = {
  error: 'AUTH_REQUIRED',
  message: 'User authentication is required',
} as const;

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
        body: AUTH_REQUIRED,
      });
      expect(putResponse).toEqual(getResponse);
    });
  });

  it('does not accept creator_session cookie as profile auth', async () => {
    const service = createPollService(createInMemoryPollRepository());
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      const getResponse = await request(baseUrl, 'GET', '/users/me/profile', {
        headers: { Cookie: 'creator_session=malformed-public-cookie' },
      });
      const putResponse = await request(baseUrl, 'PUT', '/users/me/profile', {
        headers: { Cookie: 'creator_session=malformed-public-cookie' },
        body: { birth_year_month: null, residential_region: null },
      });

      expect(getResponse).toEqual({
        status: 401,
        body: AUTH_REQUIRED,
      });
      expect(putResponse).toEqual(getResponse);
    });
  });

  it('rejects raw X-User-Id in production mode for GET and PUT', async () => {
    const service = createPollService(createInMemoryPollRepository());
    const productionResolver = createUserAuthResolver({ mode: 'production' });
    const server = createHttpServer({
      pollService: service,
      userAuthResolver: productionResolver,
    });

    await withServer(server, async (baseUrl) => {
      const getResponse = await request(baseUrl, 'GET', '/users/me/profile', {
        headers: { 'X-User-Id': userId },
      });
      const putResponse = await request(baseUrl, 'PUT', '/users/me/profile', {
        headers: { 'X-User-Id': userId },
        body: { birth_year_month: null, residential_region: null },
      });

      expect(getResponse).toEqual({ status: 401, body: AUTH_REQUIRED });
      expect(putResponse).toEqual(getResponse);
    });
  });

  it('accepts trusted verifier identity in production mode', async () => {
    const repository = createInMemoryPollRepository();
    await repository.ensureUser(userId, 'Profile User');
    const service = createPollService(repository);
    const productionResolver = createUserAuthResolver({
      mode: 'production',
      trustedCredentialVerifier: () => ({ user_id: userId }),
    });
    const server = createHttpServer({
      pollService: service,
      userAuthResolver: productionResolver,
    });

    await withServer(server, async (baseUrl) => {
      const updated = await request(baseUrl, 'PUT', '/users/me/profile', {
        body: { birth_year_month: '1998-07', residential_region: 'TW-TPE' },
      });
      const readBack = await request(baseUrl, 'GET', '/users/me/profile');

      expect(updated).toEqual({
        status: 200,
        body: { birth_year_month: '1998-07', residential_region: 'TW-TPE' },
      });
      expect(readBack).toEqual(updated);
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
      expect(Object.keys(readBack.body).sort()).toEqual([
        'birth_year_month',
        'residential_region',
      ]);
      expect(JSON.stringify(readBack.body)).not.toMatch(
        /gender|birthday|address|option_id|option_text|option_index|token|shard/i,
      );
    });
  });

  it('rejects malformed birth year-month, invalid region, extra fields, and missing fields', async () => {
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
        { birth_year_month: '', residential_region: 'TW-TPE' },
        { birth_year_month: '1998', residential_region: 'TW-TPE' },
        { birth_year_month: '1998-7', residential_region: 'TW-TPE' },
        { birth_year_month: '1998-00', residential_region: 'TW-TPE' },
        { birth_year_month: '1998-13', residential_region: 'TW-TPE' },
        { birth_year_month: '1998-07-02', residential_region: 'TW-TPE' },
        { birth_year_month: '1998-07-01', residential_region: 'TW-TPE' },
        { birth_year_month: 199807, residential_region: 'TW-TPE' },
        { birth_year_month: {}, residential_region: 'TW-TPE' },
        { birth_year_month: '1998-07', residential_region: 'Taipei Road 1' },
        { birth_year_month: '1998-07', residential_region: '12 Example Street' },
        { birth_year_month: '1998-07', residential_region: 'TW TPE' },
        { birth_year_month: '1998-07', residential_region: 'tw-tpe' },
        { birth_year_month: '1998-07', residential_region: ' '.repeat(2) },
        { birth_year_month: '1998-07', residential_region: `TW-${'A'.repeat(63)}` },
        { birth_year_month: '1998-07', residential_region: 123 },
        { birth_year_month: '1998-07', residential_region: {} },
        { birth_year_month: '1998-07', residential_region: 'TW-TPE', gender: 'x' },
        { birth_year_month: '1998-07', residential_region: 'TW-TPE', option_id: 'x' },
        { birth_year_month: '1998-07', residential_region: 'TW-TPE', address: 'x' },
        { birth_year_month: '1998-07' },
        { residential_region: 'TW-TPE' },
        {},
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

  it('keeps profile reads and writes scoped to the X-User-Id user only', async () => {
    const repository = createInMemoryPollRepository();
    await repository.ensureUser(userId, 'Profile User A');
    await repository.ensureUser(otherUserId, 'Profile User B');
    const service = createPollService(repository);
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      await request(baseUrl, 'PUT', '/users/me/profile', {
        headers: { 'X-User-Id': userId },
        body: { birth_year_month: '1998-07', residential_region: 'TW-TPE' },
      });
      await request(baseUrl, 'PUT', '/users/me/profile', {
        headers: { 'X-User-Id': otherUserId },
        body: { birth_year_month: '2001-02', residential_region: 'TW-KHH' },
      });

      const userARead = await request(baseUrl, 'GET', '/users/me/profile', {
        headers: { 'X-User-Id': userId },
      });
      const userBRead = await request(baseUrl, 'GET', '/users/me/profile', {
        headers: { 'X-User-Id': otherUserId },
      });
      await request(baseUrl, 'PUT', '/users/me/profile', {
        headers: { 'X-User-Id': userId },
        body: { birth_year_month: '1999-08', residential_region: 'TW-NWT' },
      });
      const userBAfterUserAWrite = await request(baseUrl, 'GET', '/users/me/profile', {
        headers: { 'X-User-Id': otherUserId },
      });

      expect(userARead).toEqual({
        status: 200,
        body: { birth_year_month: '1998-07', residential_region: 'TW-TPE' },
      });
      expect(userBRead).toEqual({
        status: 200,
        body: { birth_year_month: '2001-02', residential_region: 'TW-KHH' },
      });
      expect(userBAfterUserAWrite).toEqual(userBRead);
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
