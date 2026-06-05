import type { Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearDiagnosticRecordsForTests,
  getDiagnosticRecordsForTests,
} from '../../src/logging/safe-diagnostic.js';
import { createHttpServer } from '../../src/http/server.js';
import {
  INVALID_REFERENCE_ANSWER_OPTION_MESSAGE,
  REFERENCE_ANSWER_LOW_TRUST_ONLY_MESSAGE,
} from '../../src/polls/reference-answer-messages.js';
import { createInMemoryPollRepository } from '../../src/polls/in-memory-repository.js';
import { createPollService } from '../../src/polls/service.js';
import type { PollEligibilityRuleRow } from '../../src/polls/types.js';

const lowTrustUserId = '22222222-2222-4222-8222-222222222222';
const officialTrustUserId = '44444444-4444-4444-8444-444444444444';

function assertReferenceAnswerResponseSafe(
  body: Record<string, unknown>,
  submittedOptionId: string,
): void {
  const json = JSON.stringify(body);
  expect(json).not.toContain(submittedOptionId);
  expect(json).not.toContain('option_id');
}

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
  path: string,
  options: {
    headers?: Record<string, string>;
    body?: unknown;
  } = {},
): Promise<{ status: number; body: Record<string, unknown> }> {
  const payload = options.body === undefined ? undefined : JSON.stringify(options.body);
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: payload,
  });
  const body = (await response.json()) as Record<string, unknown>;
  return { status: response.status, body };
}

async function seedActivePoll(
  repository: ReturnType<typeof createInMemoryPollRepository>,
  service: ReturnType<typeof createPollService>,
) {
  const created = await service.createPoll(
    {
      creatorId: lowTrustUserId,
      title: 'Reference Answer hardening',
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
  return { pollId: created.poll_id, optionId: option!.id };
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

describe('Reference Answer HTTP hardening', () => {
  beforeEach(() => {
    clearDiagnosticRecordsForTests();
  });

  afterEach(() => {
    clearDiagnosticRecordsForTests();
  });

  it('allows low-trust active users and scrubs diagnostics', async () => {
    const repository = createInMemoryPollRepository();
    await repository.ensureUser(lowTrustUserId, 'Low trust');
    const service = createPollService(repository);
    const { pollId, optionId } = await seedActivePoll(repository, service);
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      const response = await request(baseUrl, `/polls/${pollId}/reference-answer`, {
        headers: { 'X-User-Id': lowTrustUserId },
        body: { option_id: optionId },
      });

      expect(response.status).toBe(201);
      assertReferenceAnswerResponseSafe(response.body, optionId);

      const diagnostics = getDiagnosticRecordsForTests();
      expect(diagnostics.length).toBeGreaterThanOrEqual(2);
      const diagnosticJson = JSON.stringify(diagnostics);
      expect(diagnosticJson).not.toContain(optionId);
      expect(diagnosticJson).not.toContain('option_id');
    });
  });

  it('does not apply profile eligibility rules or creator_session cookie to Reference Answer', async () => {
    const repository = createInMemoryPollRepository();
    await repository.ensureUser(lowTrustUserId, 'Low trust');
    const service = createPollService(repository);
    const { pollId, optionId } = await seedActivePoll(repository, service);
    repository.setPollEligibilityRule(profileRule(pollId, {
      rule_type: 'region',
      allowed_regions: ['TW-KHH'],
    }));
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      const response = await request(baseUrl, `/polls/${pollId}/reference-answer`, {
        headers: {
          'X-User-Id': lowTrustUserId,
          Cookie: 'creator_session=malformed-public-cookie',
        },
        body: { option_id: optionId },
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ status: 'recorded', reference_answered: true });
      expect(repository.referenceAnswerTokens.size).toBe(1);
      expect(repository.voteTokens.size).toBe(0);
      expect(repository.voteCounters.size).toBe(0);
    });
  });

  it('rejects official-trust users with safe 403 response', async () => {
    const repository = createInMemoryPollRepository();
    await repository.ensureUser(officialTrustUserId, 'Official trust');
    repository.setUserTrustLevel(officialTrustUserId, 'official');
    const service = createPollService(repository);
    const { pollId, optionId } = await seedActivePoll(repository, service);
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      const response = await request(baseUrl, `/polls/${pollId}/reference-answer`, {
        headers: { 'X-User-Id': officialTrustUserId },
        body: { option_id: optionId },
      });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(REFERENCE_ANSWER_LOW_TRUST_ONLY_MESSAGE);
      assertReferenceAnswerResponseSafe(response.body, optionId);
      expect(repository.referenceAnswerTokens.size).toBe(0);
    });
  });

  it('returns safe 400 for invalid option without leaking option UUID or field name', async () => {
    const repository = createInMemoryPollRepository();
    await repository.ensureUser(lowTrustUserId, 'Low trust');
    const service = createPollService(repository);
    const { pollId } = await seedActivePoll(repository, service);
    const invalidOptionId = '99999999-9999-4999-8999-999999999999';
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      const response = await request(baseUrl, `/polls/${pollId}/reference-answer`, {
        headers: { 'X-User-Id': lowTrustUserId },
        body: { option_id: invalidOptionId },
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(INVALID_REFERENCE_ANSWER_OPTION_MESSAGE);
      assertReferenceAnswerResponseSafe(response.body, invalidOptionId);

      const diagnostics = getDiagnosticRecordsForTests();
      expect(diagnostics.length).toBeGreaterThanOrEqual(1);
      const diagnosticJson = JSON.stringify(diagnostics);
      expect(diagnosticJson).not.toContain(invalidOptionId);
      expect(diagnosticJson).not.toContain('option_id');
    });
  });
});
