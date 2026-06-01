import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  applyMigrations,
  createIntegrationPool,
  listTableColumns,
  truncateBusinessTables,
} from '../helpers/pg-integration.js';

const creatorId = '11111111-1111-4111-8111-111111111111';

async function insertUser(pool: ReturnType<typeof createIntegrationPool>): Promise<void> {
  await pool.query(
    `INSERT INTO users (id, display_name)
     VALUES ($1, 'Creator')`,
    [creatorId],
  );
}

async function insertPoll(
  pool: ReturnType<typeof createIntegrationPool>,
  status: string,
): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `INSERT INTO polls (
       creator_id, title, category, status, closes_at
     )
     VALUES ($1, 'Lifecycle foundation', 'general', $2, NOW() + INTERVAL '1 day')
     RETURNING id`,
    [creatorId, status],
  );
  return result.rows[0]!.id;
}

describe('Phase 54 public lifecycle PostgreSQL schema', () => {
  const pool = createIntegrationPool();

  beforeAll(async () => {
    await applyMigrations();
  });

  beforeEach(async () => {
    await truncateBusinessTables(pool);
    await insertUser(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('adds the public lifecycle columns to polls', async () => {
    const columns = await listTableColumns(pool, 'polls');

    for (const column of [
      'public_lifecycle_state',
      'revealed_at',
      'public_lock_ends_at',
      'cancelled_at',
      'unpublished_at',
    ]) {
      expect(columns).toContain(column);
    }
  });

  it('initializes omitted lifecycle state conservatively for legacy inserts', async () => {
    const draftPollId = await insertPoll(pool, 'draft');
    const activePollId = await insertPoll(pool, 'active');

    const result = await pool.query<{ id: string; public_lifecycle_state: string }>(
      `SELECT id, public_lifecycle_state
       FROM polls
       WHERE id IN ($1, $2)
       ORDER BY id`,
      [draftPollId, activePollId],
    );
    const states = new Map(
      result.rows.map((row) => [row.id, row.public_lifecycle_state]),
    );

    expect(states.get(draftPollId)).toBe('draft');
    expect(states.get(activePollId)).toBe('collecting');
  });

  it('rejects invalid lifecycle states', async () => {
    await expect(
      pool.query(
        `INSERT INTO polls (
           creator_id, title, category, status, closes_at, public_lifecycle_state
         )
         VALUES ($1, 'Invalid state', 'general', 'draft', NOW() + INTERVAL '1 day', 'open')`,
        [creatorId],
      ),
    ).rejects.toMatchObject({ constraint: 'polls_public_lifecycle_state_check' });
  });

  it('enforces cancellation and post-lock unpublish timestamp meaning', async () => {
    const pollId = await insertPoll(pool, 'active');

    await expect(
      pool.query(
        `UPDATE polls
         SET cancelled_at = NOW()
         WHERE id = $1`,
        [pollId],
      ),
    ).rejects.toMatchObject({ constraint: 'polls_cancelled_at_state_check' });

    await expect(
      pool.query(
        `UPDATE polls
         SET public_lifecycle_state = 'locked',
             revealed_at = NOW(),
             public_lock_ends_at = NOW() + INTERVAL '4 days'
         WHERE id = $1`,
        [pollId],
      ),
    ).rejects.toMatchObject({ constraint: 'polls_public_lock_ends_at_check' });

    await expect(
      pool.query(
        `UPDATE polls
         SET public_lifecycle_state = 'unpublished',
             revealed_at = NOW(),
             public_lock_ends_at = NOW() + INTERVAL '5 days',
             unpublished_at = NOW()
         WHERE id = $1`,
        [pollId],
      ),
    ).rejects.toMatchObject({ constraint: 'polls_unpublished_at_state_check' });

    await expect(
      pool.query(
        `UPDATE polls
         SET public_lifecycle_state = 'unpublished',
             revealed_at = NOW() - INTERVAL '6 days',
             public_lock_ends_at = NOW() - INTERVAL '1 day',
             unpublished_at = NOW()
         WHERE id = $1`,
        [pollId],
      ),
    ).resolves.toMatchObject({ rowCount: 1 });
  });

  it('adds minimal poll eligibility rule storage without evaluation data', async () => {
    const pollId = await insertPoll(pool, 'active');
    await pool.query(
      `INSERT INTO poll_eligibility_rules (
         poll_id, rule_type, min_birth_year_month, allowed_regions
       )
       VALUES ($1, 'age_region', DATE '1990-01-01', ARRAY['TW-KHH'])`,
      [pollId],
    );

    expect(await listTableColumns(pool, 'poll_eligibility_rules')).toEqual([
      'poll_id',
      'rule_type',
      'min_birth_year_month',
      'max_birth_year_month',
      'allowed_regions',
      'created_at',
      'updated_at',
    ]);
  });
});
