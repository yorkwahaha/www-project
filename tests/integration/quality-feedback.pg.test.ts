import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createPgPollRepository } from '../../src/polls/repository.js';
import { createPollService } from '../../src/polls/service.js';
import {
  applyMigrations,
  createIntegrationPool,
  truncateBusinessTables,
} from '../helpers/pg-integration.js';

const creatorId = '11111111-1111-4111-8111-111111111111';

describe('Quality feedback PostgreSQL aggregate write', () => {
  const pool = createIntegrationPool();

  beforeAll(async () => {
    await applyMigrations();
  });

  beforeEach(async () => {
    await truncateBusinessTables(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('upserts poll-level feedback aggregates without vote or identity linkage', async () => {
    const repository = createPgPollRepository(pool);
    const service = createPollService(repository);
    await repository.ensureUser(creatorId, 'Creator');
    const created = await service.createPoll(
      {
        creatorId,
        title: 'PG quality feedback',
        description: '',
        category: 'general',
        options: ['A', 'B'],
        eligibleRuleId: null,
        closesAt: new Date(Date.now() + 86_400_000),
        publish: true,
      },
      'Creator',
    );

    await expect(
      service.submitQualityFeedback(created.poll_id, '表達清楚'),
    ).resolves.toEqual({ ok: true });
    await service.submitQualityFeedback(created.poll_id, '表達清楚');
    await service.submitQualityFeedback(created.poll_id, '選項公平');

    const aggregates = await pool.query<{
      poll_id: string;
      feedback_tag: string;
      aggregate_count: string;
    }>(
      `SELECT poll_id, feedback_tag, aggregate_count::text AS aggregate_count
       FROM poll_quality_feedback_aggregate
       WHERE poll_id = $1
       ORDER BY feedback_tag ASC`,
      [created.poll_id],
    );

    expect(aggregates.rows).toEqual([
      {
        poll_id: created.poll_id,
        feedback_tag: '表達清楚',
        aggregate_count: '2',
      },
      {
        poll_id: created.poll_id,
        feedback_tag: '選項公平',
        aggregate_count: '1',
      },
    ]);

    const voteTokens = await pool.query(`SELECT 1 FROM poll_vote_tokens`);
    const voteCounters = await pool.query(`SELECT 1 FROM poll_option_vote_counters`);
    expect(voteTokens.rows).toHaveLength(0);
    expect(voteCounters.rows).toHaveLength(0);
  });
});
