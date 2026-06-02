import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createPublicLifecycleSchedulerService } from '../../src/polls/lifecycle-scheduler-service.js';
import { runLifecycleSchedulerCommand } from '../../src/polls/lifecycle-scheduler-runner.js';
import { createPgPollRepository } from '../../src/polls/repository.js';
import { createPollService } from '../../src/polls/service.js';
import {
  applyMigrations,
  createIntegrationPool,
  truncateBusinessTables,
} from '../helpers/pg-integration.js';

const creatorId = '11111111-1111-4111-8111-111111111111';

describe('Public lifecycle scheduler PostgreSQL integration', () => {
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

  it('advances only due revealed and locked rows using server time', async () => {
    const repository = createPgPollRepository(pool);
    const pollService = createPollService(repository);
    const scheduler = createPublicLifecycleSchedulerService(repository);
    await repository.ensureUser(creatorId, 'Creator');
    const dueRevealed = await createPoll(pollService, 'Due revealed');
    const futureRevealed = await createPoll(pollService, 'Future revealed');
    const dueLocked = await createPoll(pollService, 'Due locked');
    const futureLocked = await createPoll(pollService, 'Future locked');
    await pool.query(
      `UPDATE polls
       SET public_lifecycle_state = 'revealed',
           revealed_at = NOW() - INTERVAL '1 second',
           public_lock_ends_at = NOW() + INTERVAL '5 days' - INTERVAL '1 second'
       WHERE id = $1`,
      [dueRevealed.poll_id],
    );
    await pool.query(
      `UPDATE polls
       SET public_lifecycle_state = 'revealed',
           revealed_at = NOW() + INTERVAL '1 day',
           public_lock_ends_at = NOW() + INTERVAL '6 days'
       WHERE id = $1`,
      [futureRevealed.poll_id],
    );
    await pool.query(
      `UPDATE polls
       SET public_lifecycle_state = 'locked',
           revealed_at = NOW() - INTERVAL '6 days',
           public_lock_ends_at = NOW() - INTERVAL '1 day'
       WHERE id = $1`,
      [dueLocked.poll_id],
    );
    await pool.query(
      `UPDATE polls
       SET public_lifecycle_state = 'locked',
           revealed_at = NOW() - INTERVAL '1 day',
           public_lock_ends_at = NOW() + INTERVAL '4 days'
       WHERE id = $1`,
      [futureLocked.poll_id],
    );

    const summaries: string[] = [];
    const errors: string[] = [];
    const exitCode = await runLifecycleSchedulerCommand([], {
      scheduler,
      writeSummary: (message) => summaries.push(message),
      writeError: (message) => errors.push(message),
    });

    expect(exitCode).toBe(0);
    expect(summaries).toEqual([
      'lifecycle-scheduler: {"candidate_count":2,"advanced_count":2,"locked_count":1,"post_lock_count":1,"failed_count":0,"failed_by_code":{}}',
    ]);
    expect(errors).toEqual([]);
    expect(summaries[0]).not.toContain(dueRevealed.poll_id);
    expect(summaries[0]).not.toContain(dueLocked.poll_id);
    expect(await lifecycleStatesById([
      dueRevealed.poll_id,
      futureRevealed.poll_id,
      dueLocked.poll_id,
      futureLocked.poll_id,
    ])).toEqual(new Map([
      [dueRevealed.poll_id, 'locked'],
      [futureRevealed.poll_id, 'revealed'],
      [dueLocked.poll_id, 'post_lock'],
      [futureLocked.poll_id, 'locked'],
    ]));
  });

  it.each(['revealed', 'locked'] as const)(
    'fails closed for malformed %s rows without mutation',
    async (publicLifecycleState) => {
      const repository = createPgPollRepository(pool);
      const pollService = createPollService(repository);
      const scheduler = createPublicLifecycleSchedulerService(repository);
      await repository.ensureUser(creatorId, 'Creator');
      const created = await createPoll(pollService, `Malformed ${publicLifecycleState}`);
      await pool.query(
        `UPDATE polls
         SET public_lifecycle_state = $2,
             revealed_at = NULL,
             public_lock_ends_at = NULL
         WHERE id = $1`,
        [created.poll_id, publicLifecycleState],
      );

      await expect(
        scheduler.runDuePublicLifecycleAdvancementBatch(),
      ).resolves.toEqual({
        candidate_count: 1,
        advanced: [],
        failed: [{
          poll_id: created.poll_id,
          error_code: 'LIFECYCLE_CONFLICT',
        }],
      });
      expect(await lifecycleStatesById([created.poll_id])).toEqual(
        new Map([[created.poll_id, publicLifecycleState]]),
      );
    },
  );

  async function lifecycleStatesById(pollIds: string[]): Promise<Map<string, string>> {
    const stored = await pool.query<{ id: string; public_lifecycle_state: string }>(
      `SELECT id, public_lifecycle_state
       FROM polls
       WHERE id = ANY($1::uuid[])`,
      [pollIds],
    );
    return new Map(stored.rows.map((row) => [row.id, row.public_lifecycle_state]));
  }
});

async function createPoll(
  service: ReturnType<typeof createPollService>,
  title: string,
) {
  return service.createPoll(
    {
      creatorId,
      title,
      description: '',
      category: 'general',
      options: ['A', 'B'],
      eligibleRuleId: null,
      closesAt: new Date(Date.now() + 86_400_000),
      publish: true,
    },
    'Creator',
  );
}
