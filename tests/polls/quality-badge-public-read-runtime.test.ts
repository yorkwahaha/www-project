import type { Server } from 'node:http';
import { describe, expect, it } from 'vitest';
import { createHttpServer } from '../../src/http/server.js';
import { createInMemoryPollRepository } from '../../src/polls/in-memory-repository.js';
import { createPollService } from '../../src/polls/service.js';
import type { QualityFeedbackAggregateRow } from '../../src/polls/types.js';

const creatorId = '11111111-1111-4111-8111-111111111111';

function futureDate(): Date {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
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
  try {
    return await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

async function request(baseUrl: string, path: string) {
  const response = await fetch(`${baseUrl}${path}`);
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
  };
}

async function seedPoll() {
  const repository = createInMemoryPollRepository();
  const service = createPollService(repository);
  const created = await service.createPoll(
    {
      creatorId,
      title: 'Quality badge poll',
      description: '',
      category: 'general',
      options: ['A', 'B'],
      eligibleRuleId: null,
      closesAt: futureDate(),
      publish: true,
    },
    'Creator',
  );
  return { repository, service, pollId: created.poll_id };
}

function setAggregate(
  repository: ReturnType<typeof createInMemoryPollRepository>,
  pollId: string,
  feedbackTag: QualityFeedbackAggregateRow['feedback_tag'],
  aggregateCount: number,
) {
  repository.qualityFeedbackAggregates.set(`${pollId}:${feedbackTag}`, {
    poll_id: pollId,
    feedback_tag: feedbackTag,
    aggregate_count: aggregateCount,
    updated_at: new Date(),
  });
}

const FORBIDDEN_PUBLIC_BADGE_FIELDS = [
  'aggregate_count',
  'tag_counts',
  'tag_breakdown',
  'raw_feedback_total',
  'score',
  'rank',
  'percentile',
  'threshold_state',
  'bucket_state',
  'creator_score',
  'reason_code',
  'eligibility_status',
] as const;

describe('quality badge minimal public read runtime', () => {
  it('returns quality_badge null on poll detail when no aggregate exists', async () => {
    const { service, pollId } = await seedPoll();
    const detail = await service.getPollById(pollId);
    expect(detail.quality_badge).toBeNull();
  });

  it('returns quality_badge null when positive conditions are not met', async () => {
    const { repository, service, pollId } = await seedPoll();
    setAggregate(repository, pollId, '表達清楚', 2);
    const detail = await service.getPollById(pollId);
    expect(detail.quality_badge).toBeNull();
  });

  it('returns quality_badge positive_feedback when positive conditions are met', async () => {
    const { repository, service, pollId } = await seedPoll();
    setAggregate(repository, pollId, '表達清楚', 2);
    setAggregate(repository, pollId, '值得思考', 1);
    const detail = await service.getPollById(pollId);
    expect(detail.quality_badge).toBe('positive_feedback');
  });

  it('includes quality_badge on results without exposing forbidden fields', async () => {
    const { repository, service, pollId } = await seedPoll();
    setAggregate(repository, pollId, '表達清楚', 3);
    repository.polls.get(pollId)!.public_lifecycle_state = 'revealed';

    const results = await service.getPollResults(pollId);
    const serialized = JSON.stringify(results);

    expect(results.quality_badge).toBe('positive_feedback');
    for (const forbidden of FORBIDDEN_PUBLIC_BADGE_FIELDS) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it('exposes quality_badge on HTTP poll detail and results without forbidden fields', async () => {
    const { repository, service, pollId } = await seedPoll();
    setAggregate(repository, pollId, '選項公平', 3);
    const server = createHttpServer({ pollService: service });

    await withServer(server, async (baseUrl) => {
      const detail = await request(baseUrl, `/polls/${pollId}`);
      const results = await request(baseUrl, `/polls/${pollId}/results`);
      const detailSerialized = JSON.stringify(detail.body);
      const resultsSerialized = JSON.stringify(results.body);

      expect(detail.status).toBe(200);
      expect(detail.body.quality_badge).toBe('positive_feedback');
      expect(results.status).toBe(200);
      expect(results.body.quality_badge).toBe('positive_feedback');

      for (const forbidden of FORBIDDEN_PUBLIC_BADGE_FIELDS) {
        expect(detailSerialized).not.toContain(forbidden);
        expect(resultsSerialized).not.toContain(forbidden);
      }
    });
  });

  it('keeps public feed ordering unchanged while adding quality_badge', async () => {
    const repository = createInMemoryPollRepository();
    const service = createPollService(repository);
    const older = await service.createPoll(
      {
        creatorId,
        title: 'Older',
        description: '',
        category: 'general',
        options: ['A', 'B'],
        eligibleRuleId: null,
        closesAt: futureDate(),
        publish: true,
      },
      'Creator',
    );
    const newer = await service.createPoll(
      {
        creatorId,
        title: 'Newer',
        description: '',
        category: 'general',
        options: ['A', 'B'],
        eligibleRuleId: null,
        closesAt: futureDate(),
        publish: true,
      },
      'Creator',
    );
    repository.polls.get(older.poll_id)!.published_at = new Date('2026-01-01T00:00:00.000Z');
    repository.polls.get(newer.poll_id)!.published_at = new Date('2026-02-01T00:00:00.000Z');
    setAggregate(repository, older.poll_id, '表達清楚', 3);
    setAggregate(repository, newer.poll_id, '表達清楚', 1);

    const feed = await service.getPublicFeed();
    expect(feed.polls.map((poll) => poll.poll_id)).toEqual([newer.poll_id, older.poll_id]);
    expect(feed.polls[0]!.quality_badge).toBeNull();
    expect(feed.polls[1]!.quality_badge).toBe('positive_feedback');
  });

  it('does not change result visibility rules for collecting polls', async () => {
    const { repository, service, pollId } = await seedPoll();
    setAggregate(repository, pollId, '表達清楚', 3);

    const results = await service.getPollResults(pollId);
    expect(results.display_mode).toBe('collecting');
    expect(results.collecting).toBe(true);
    expect(results.quality_badge).toBe('positive_feedback');
  });
});
