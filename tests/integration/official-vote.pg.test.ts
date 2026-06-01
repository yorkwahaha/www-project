import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createPgPollRepository } from '../../src/polls/repository.js';
import { createPollService } from '../../src/polls/service.js';
import {
  applyMigrations,
  createIntegrationPool,
  listTableColumns,
  setUserTrustLevel,
  truncateBusinessTables,
} from '../helpers/pg-integration.js';

const FIXED_SHARD_ID = 3;
const creatorId = '11111111-1111-4111-8111-111111111111';
const officialUserId = '22222222-2222-4222-8222-222222222222';

describe('Official Vote PostgreSQL integration', () => {
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

  it('writes option-free vote token and aggregate counter; blocks duplicate vote', async () => {
    const repository = createPgPollRepository(pool);
    const service = createPollService(repository, {
      selectShardId: () => FIXED_SHARD_ID,
    });

    await repository.ensureUser(creatorId, 'Creator');
    await repository.ensureUser(officialUserId, 'Official voter');
    await setUserTrustLevel(pool, officialUserId, 'official');

    const created = await service.createPoll(
      {
        creatorId,
        title: 'PG Official Vote',
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
      service.castOfficialVote(created.poll_id, officialUserId, option.id),
    ).resolves.toEqual({ status: 'voted', voted: true });

    const tokenColumns = await listTableColumns(pool, 'poll_vote_tokens');
    expect(tokenColumns).not.toContain('option_id');

    const tokens = await pool.query<{ user_id: string; poll_id: string }>(
      `SELECT user_id, poll_id
       FROM poll_vote_tokens
       WHERE poll_id = $1`,
      [created.poll_id],
    );
    expect(tokens.rows).toHaveLength(1);
    expect(tokens.rows[0]).toEqual({
      user_id: officialUserId,
      poll_id: created.poll_id,
    });

    const counters = await pool.query<{
      poll_id: string;
      option_id: string;
      shard_id: number;
      vote_count: string;
    }>(
      `SELECT poll_id, option_id, shard_id, vote_count::text AS vote_count
       FROM poll_option_vote_counters
       WHERE poll_id = $1`,
      [created.poll_id],
    );
    expect(counters.rows).toEqual([
      {
        poll_id: created.poll_id,
        option_id: option.id,
        shard_id: FIXED_SHARD_ID,
        vote_count: '1',
      },
    ]);

    await expect(
      service.castOfficialVote(created.poll_id, officialUserId, option.id),
    ).rejects.toMatchObject({ code: 'OFFICIAL_VOTE_DUPLICATE' });

    const countersAfterDuplicate = await pool.query<{ vote_count: string }>(
      `SELECT vote_count::text AS vote_count
       FROM poll_option_vote_counters
       WHERE poll_id = $1`,
      [created.poll_id],
    );
    expect(countersAfterDuplicate.rows).toEqual([{ vote_count: '1' }]);
  });

  it('maps a public option index inside the official vote transaction', async () => {
    const repository = createPgPollRepository(pool);
    const service = createPollService(repository, {
      selectShardId: () => FIXED_SHARD_ID,
    });

    await repository.ensureUser(creatorId, 'Creator');
    await repository.ensureUser(officialUserId, 'Official voter');
    await setUserTrustLevel(pool, officialUserId, 'official');

    const created = await service.createPoll(
      {
        creatorId,
        title: 'PG Official Vote By Index',
        description: '',
        category: 'general',
        options: ['A', 'B'],
        eligibleRuleId: null,
        closesAt: new Date(Date.now() + 86_400_000),
        publish: true,
      },
      'Creator',
    );
    const options = await repository.listOptionsByPollId(created.poll_id);

    await expect(
      service.castOfficialVoteByIndex(created.poll_id, officialUserId, 1),
    ).resolves.toEqual({ status: 'voted', voted: true });

    const tokens = await pool.query<{ user_id: string; poll_id: string }>(
      `SELECT user_id, poll_id
       FROM poll_vote_tokens
       WHERE poll_id = $1`,
      [created.poll_id],
    );
    expect(tokens.rows).toEqual([{ user_id: officialUserId, poll_id: created.poll_id }]);

    const counters = await pool.query<{
      poll_id: string;
      option_id: string;
      shard_id: number;
      vote_count: string;
    }>(
      `SELECT poll_id, option_id, shard_id, vote_count::text AS vote_count
       FROM poll_option_vote_counters
       WHERE poll_id = $1`,
      [created.poll_id],
    );
    expect(counters.rows).toEqual([
      {
        poll_id: created.poll_id,
        option_id: options[1]!.id,
        shard_id: FIXED_SHARD_ID,
        vote_count: '1',
      },
    ]);
  });

  it('rejects Official Vote outside collecting lifecycle without writing token or counter', async () => {
    const repository = createPgPollRepository(pool);
    const service = createPollService(repository, {
      selectShardId: () => FIXED_SHARD_ID,
    });

    await repository.ensureUser(creatorId, 'Creator');
    await repository.ensureUser(officialUserId, 'Official voter');
    await setUserTrustLevel(pool, officialUserId, 'official');

    const created = await service.createPoll(
      {
        creatorId,
        title: 'PG Official Vote Lifecycle Guard',
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
      `UPDATE polls
       SET public_lifecycle_state = 'revealed'
       WHERE id = $1`,
      [created.poll_id],
    );

    await expect(
      service.castOfficialVote(created.poll_id, officialUserId, option!.id),
    ).rejects.toMatchObject({
      code: 'POLL_VALIDATION',
      message: 'Poll is not collecting responses',
    });

    const tokens = await pool.query(
      `SELECT 1 FROM poll_vote_tokens WHERE poll_id = $1`,
      [created.poll_id],
    );
    const counters = await pool.query(
      `SELECT 1 FROM poll_option_vote_counters WHERE poll_id = $1`,
      [created.poll_id],
    );
    expect(tokens.rows).toHaveLength(0);
    expect(counters.rows).toHaveLength(0);
  });
});
