import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PollNotFoundError } from '../../src/polls/errors.js';
import { createPgPollRepository } from '../../src/polls/repository.js';
import { createPollService } from '../../src/polls/service.js';
import {
  applyMigrations,
  createIntegrationPool,
  truncateBusinessTables,
} from '../helpers/pg-integration.js';

const creatorId = '11111111-1111-4111-8111-111111111111';

describe('Public result lifecycle PostgreSQL integration', () => {
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

  async function seedPollWithThresholdCount() {
    const repository = createPgPollRepository(pool);
    const service = createPollService(repository);
    await repository.ensureUser(creatorId, 'Creator');
    const created = await service.createPoll(
      {
        creatorId,
        title: 'Lifecycle result guard',
        description: '',
        category: 'general',
        options: ['A', 'B'],
        eligibleRuleId: null,
        closesAt: new Date(Date.now() + 86_400_000),
        publish: true,
      },
      'Creator',
    );
    const [option] = await repository.listOptionsByPollId(created.poll_id);
    await pool.query(
      `INSERT INTO poll_option_vote_counters (poll_id, option_id, shard_id, vote_count)
       VALUES ($1, $2, 0, 30)`,
      [created.poll_id, option!.id],
    );
    return { service, pollId: created.poll_id };
  }

  it('keeps collecting results counter-free even after the old total threshold is reached', async () => {
    const { service, pollId } = await seedPollWithThresholdCount();

    await expect(service.getPollResults(pollId)).resolves.toMatchObject({
      display_mode: 'collecting',
      total_votes_display: '收集中',
      collecting: true,
      options: [
        { display_percentage: null, display_count: null },
        { display_percentage: null, display_count: null },
      ],
    });
  });

  it.each(['revealed', 'locked', 'post_lock'] as const)(
    'reveals display-safe aggregates only for %s lifecycle state',
    async (publicLifecycleState) => {
      const { service, pollId } = await seedPollWithThresholdCount();
      await pool.query(
        `UPDATE polls
         SET public_lifecycle_state = $2
         WHERE id = $1`,
        [pollId, publicLifecycleState],
      );

      await expect(service.getPollResults(pollId)).resolves.toMatchObject({
        display_mode: 'bucketed_percentage',
        total_votes_display: '30–99',
        collecting: false,
      });
    },
  );

  it.each(['draft', 'cancelled', 'unpublished'] as const)(
    'does not expose aggregates for %s lifecycle state',
    async (publicLifecycleState) => {
      const { service, pollId } = await seedPollWithThresholdCount();
      await pool.query(
        `UPDATE polls
         SET public_lifecycle_state = $2
         WHERE id = $1`,
        [pollId, publicLifecycleState],
      );

      await expect(service.getPollResults(pollId)).resolves.toMatchObject({
        display_mode: 'unavailable',
        total_votes_display: '結果不可用',
        collecting: false,
      });
    },
  );

  it('does not reveal from legacy closed status alone', async () => {
    const { service, pollId } = await seedPollWithThresholdCount();
    await pool.query(
      `UPDATE polls
       SET status = 'closed', public_lifecycle_state = 'draft'
       WHERE id = $1`,
      [pollId],
    );

    await expect(service.getPollResults(pollId)).resolves.toMatchObject({
      display_mode: 'unavailable',
      total_votes_display: '結果不可用',
    });
  });

  it.each(['suspended', 'correction_pending'] as const)(
    'keeps legacy governance status %s fail-closed',
    async (status) => {
      const { service, pollId } = await seedPollWithThresholdCount();
      await pool.query(
        `UPDATE polls
         SET status = $2, public_lifecycle_state = 'collecting'
         WHERE id = $1`,
        [pollId, status],
      );

      await expect(service.getPollResults(pollId)).rejects.toBeInstanceOf(
        PollNotFoundError,
      );
    },
  );
});
