import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createPgPollRepository } from '../../src/polls/repository.js';
import { createPollService } from '../../src/polls/service.js';
import {
  applyMigrations,
  createIntegrationPool,
  listTableColumns,
  truncateBusinessTables,
  waitForBlockedPollLocks,
} from '../helpers/pg-integration.js';

const creatorId = '11111111-1111-4111-8111-111111111111';
const lowTrustUserId = '22222222-2222-4222-8222-222222222222';

const FORBIDDEN_REFERENCE_TOKEN_COLUMNS = [
  'option_id',
  'encrypted_option_id',
  'option_text',
  'selected_option_index',
  'answer_payload',
  'answer_snapshot',
] as const;

describe('Reference Answer PostgreSQL integration', () => {
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

  it('writes option-free reference token only; rejects duplicate; does not increment vote counters', async () => {
    const repository = createPgPollRepository(pool);
    const service = createPollService(repository);

    await repository.ensureUser(creatorId, 'Creator');
    await repository.ensureUser(lowTrustUserId, 'Low trust voter');

    const created = await service.createPoll(
      {
        creatorId,
        title: 'PG Reference Answer',
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
    if (!option) {
      throw new Error('expected poll option');
    }

    await expect(
      service.submitReferenceAnswer(created.poll_id, lowTrustUserId, option.id),
    ).resolves.toEqual({ status: 'recorded', reference_answered: true });

    const tokenColumns = await listTableColumns(pool, 'poll_reference_answer_tokens');
    for (const forbidden of FORBIDDEN_REFERENCE_TOKEN_COLUMNS) {
      expect(tokenColumns).not.toContain(forbidden);
    }

    const tokens = await pool.query<{ user_id: string; poll_id: string }>(
      `SELECT user_id, poll_id
       FROM poll_reference_answer_tokens
       WHERE poll_id = $1`,
      [created.poll_id],
    );
    expect(tokens.rows).toHaveLength(1);
    expect(tokens.rows[0]).toEqual({
      user_id: lowTrustUserId,
      poll_id: created.poll_id,
    });

    const voteTokens = await pool.query(
      `SELECT 1 FROM poll_vote_tokens WHERE poll_id = $1`,
      [created.poll_id],
    );
    expect(voteTokens.rows).toHaveLength(0);

    const counters = await pool.query(
      `SELECT 1 FROM poll_option_vote_counters WHERE poll_id = $1`,
      [created.poll_id],
    );
    expect(counters.rows).toHaveLength(0);

    await expect(
      service.submitReferenceAnswer(created.poll_id, lowTrustUserId, option.id),
    ).rejects.toMatchObject({ code: 'REFERENCE_ANSWER_DUPLICATE' });

    const tokensAfterDuplicate = await pool.query(
      `SELECT user_id, poll_id
       FROM poll_reference_answer_tokens
       WHERE poll_id = $1`,
      [created.poll_id],
    );
    expect(tokensAfterDuplicate.rows).toHaveLength(1);

    const countersAfterDuplicate = await pool.query(
      `SELECT 1 FROM poll_option_vote_counters WHERE poll_id = $1`,
      [created.poll_id],
    );
    expect(countersAfterDuplicate.rows).toHaveLength(0);
  });

  it.each(['cancelled', 'revealed', 'locked', 'post_lock', 'unpublished'] as const)(
    'rejects Reference Answer for %s lifecycle without token or counter writes',
    async (publicLifecycleState) => {
      const repository = createPgPollRepository(pool);
      const service = createPollService(repository);
      await repository.ensureUser(creatorId, 'Creator');
      await repository.ensureUser(lowTrustUserId, 'Low trust voter');
      const created = await service.createPoll(
        {
          creatorId,
          title: 'PG lifecycle-blocked Reference Answer',
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
        `UPDATE polls SET public_lifecycle_state = $2 WHERE id = $1`,
        [created.poll_id, publicLifecycleState],
      );

      await expect(
        service.submitReferenceAnswer(created.poll_id, lowTrustUserId, option!.id),
      ).rejects.toMatchObject({
        code: 'POLL_VALIDATION',
        message: 'Poll is not collecting responses',
      });
      const tokens = await pool.query(
        `SELECT 1 FROM poll_reference_answer_tokens WHERE poll_id = $1`,
        [created.poll_id],
      );
      const counters = await pool.query(
        `SELECT 1 FROM poll_option_vote_counters WHERE poll_id = $1`,
        [created.poll_id],
      );
      expect(tokens.rows).toHaveLength(0);
      expect(counters.rows).toHaveLength(0);
    },
  );

  it.each(['cancel', 'reveal'] as const)(
    'serializes Reference Answer with queued %s lifecycle transition',
    async (transition) => {
      const repository = createPgPollRepository(pool);
      const service = createPollService(repository);
      await repository.ensureUser(creatorId, 'Creator');
      await repository.ensureUser(lowTrustUserId, 'Low trust voter');
      const created = await service.createPoll(
        {
          creatorId,
          title: 'PG Reference Answer lifecycle race',
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
      const blocker = await pool.connect();
      let released = false;
      try {
        await blocker.query('BEGIN');
        const pidResult = await blocker.query<{ pid: number }>(
          `SELECT pg_backend_pid() AS pid`,
        );
        const blockerPid = pidResult.rows[0]!.pid;
        await blocker.query(`SELECT 1 FROM polls WHERE id = $1 FOR UPDATE`, [
          created.poll_id,
        ]);
        if (transition === 'reveal') {
          await blocker.query(
            `UPDATE polls
             SET closes_at = NOW() - INTERVAL '1 second'
             WHERE id = $1`,
            [created.poll_id],
          );
        }

        const transitionAssertion = transition === 'cancel'
          ? expect(service.cancelPoll(created.poll_id, creatorId)).resolves.toMatchObject({
              public_lifecycle_state: 'cancelled',
            })
          : expect(service.revealPoll(created.poll_id)).resolves.toMatchObject({
              public_lifecycle_state: 'revealed',
            });
        await waitForBlockedPollLocks(pool, blockerPid, 1);
        const referenceAnswerAssertion = expect(
          service.submitReferenceAnswer(created.poll_id, lowTrustUserId, option!.id),
        ).rejects.toMatchObject({
          code: 'POLL_VALIDATION',
          message: 'Poll is not collecting responses',
        });
        await waitForBlockedPollLocks(pool, blockerPid, 2);
        await blocker.query('COMMIT');
        released = true;
        await Promise.all([transitionAssertion, referenceAnswerAssertion]);
      } finally {
        if (!released) {
          await blocker.query('ROLLBACK');
        }
        blocker.release();
      }

      const tokens = await pool.query(
        `SELECT 1 FROM poll_reference_answer_tokens WHERE poll_id = $1`,
        [created.poll_id],
      );
      const counters = await pool.query(
        `SELECT 1 FROM poll_option_vote_counters WHERE poll_id = $1`,
        [created.poll_id],
      );
      expect(tokens.rows).toHaveLength(0);
      expect(counters.rows).toHaveLength(0);
    },
  );
});
