import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createPgPollRepository } from '../../src/polls/repository.js';
import { createPollService } from '../../src/polls/service.js';
import {
  applyMigrations,
  createIntegrationPool,
  truncateBusinessTables,
} from '../helpers/pg-integration.js';

const creatorId = '11111111-1111-4111-8111-111111111111';

describe('Public lifecycle transition PostgreSQL integration', () => {
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

  it('writes reveal, lock, post-lock, and unpublish atomically from explicit lifecycle calls', async () => {
    const repository = createPgPollRepository(pool);
    const service = createPollService(repository);
    await repository.ensureUser(creatorId, 'Creator');
    const created = await service.createPoll(
      {
        creatorId,
        title: 'PG lifecycle transitions',
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
    await pool.query(
      `UPDATE polls
       SET status = 'closed', closes_at = NOW() - INTERVAL '1 second'
       WHERE id = $1`,
      [created.poll_id],
    );

    await expect(service.getPollResults(created.poll_id)).resolves.toMatchObject({
      public_lifecycle_state: 'collecting',
      display_mode: 'collecting',
    });
    const reveal = await service.revealPoll(created.poll_id);
    expect(
      new Date(reveal.public_lock_ends_at).getTime() -
        new Date(reveal.revealed_at).getTime(),
    ).toBe(5 * 24 * 60 * 60 * 1000);
    await expect(service.getPollResults(created.poll_id)).resolves.toMatchObject({
      public_lifecycle_state: 'revealed',
      display_mode: 'bucketed_percentage',
    });

    await expect(service.advancePublicLifecycle(created.poll_id)).resolves.toMatchObject({
      public_lifecycle_state: 'locked',
    });
    await expect(service.advancePublicLifecycle(created.poll_id)).rejects.toMatchObject({
      code: 'LOCKED_PERIOD_CONFLICT',
    });
    await pool.query(
      `UPDATE polls
       SET revealed_at = NOW() - INTERVAL '6 days',
           public_lock_ends_at = NOW() - INTERVAL '1 day'
       WHERE id = $1`,
      [created.poll_id],
    );
    await expect(service.advancePublicLifecycle(created.poll_id)).resolves.toMatchObject({
      public_lifecycle_state: 'post_lock',
    });
    await expect(service.unpublishPoll(created.poll_id, creatorId)).resolves.toMatchObject({
      public_lifecycle_state: 'unpublished',
    });

    const stored = await pool.query<{
      public_lifecycle_state: string;
      revealed_at: Date;
      public_lock_ends_at: Date;
      unpublished_at: Date;
    }>(
      `SELECT public_lifecycle_state, revealed_at, public_lock_ends_at, unpublished_at
       FROM polls
       WHERE id = $1`,
      [created.poll_id],
    );
    expect(stored.rows[0]).toMatchObject({
      public_lifecycle_state: 'unpublished',
      revealed_at: expect.any(Date),
      public_lock_ends_at: expect.any(Date),
      unpublished_at: expect.any(Date),
    });
  });
});
