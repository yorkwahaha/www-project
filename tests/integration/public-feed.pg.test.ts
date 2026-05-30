import type { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createPgPollRepository } from '../../src/polls/repository.js';
import { createPollService } from '../../src/polls/service.js';
import {
  applyMigrations,
  createIntegrationPool,
  setUserTrustLevel,
  truncateBusinessTables,
} from '../helpers/pg-integration.js';

const creatorId = '11111111-1111-4111-8111-111111111111';
const lowTrustUserId = '22222222-2222-4222-8222-222222222222';
const officialUserId = '33333333-3333-4333-8333-333333333333';

async function createPublishedPoll(
  service: ReturnType<typeof createPollService>,
  title: string,
) {
  return service.createPoll(
    {
      creatorId,
      title,
      description: '',
      category: 'general',
      options: ['Option A', 'Option B'],
      eligibleRuleId: null,
      closesAt: new Date(Date.now() + 86_400_000),
      publish: true,
    },
    'Creator',
  );
}

async function setPollPublishedAt(
  pool: Pool,
  pollId: string,
  publishedAt: Date,
): Promise<void> {
  await pool.query(
    `UPDATE polls SET published_at = $2, updated_at = NOW() WHERE id = $1`,
    [pollId, publishedAt],
  );
}

async function setPollStatus(
  pool: Pool,
  pollId: string,
  status: 'closed' | 'suspended' | 'deleted',
): Promise<void> {
  await pool.query(
    `UPDATE polls SET status = $2, updated_at = NOW() WHERE id = $1`,
    [pollId, status],
  );
}

async function setPollArchivedAt(pool: Pool, pollId: string, archivedAt: Date): Promise<void> {
  await pool.query(
    `UPDATE polls SET archived_at = $2, updated_at = NOW() WHERE id = $1`,
    [pollId, archivedAt],
  );
}

describe('Public Feed PostgreSQL integration', () => {
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

  it('returns active published polls in freshness order; excludes non-feed states; ignores vote participation tables', async () => {
    const repository = createPgPollRepository(pool);
    const service = createPollService(repository, { selectShardId: () => 2 });

    await repository.ensureUser(creatorId, 'Creator');
    await repository.ensureUser(lowTrustUserId, 'Low trust');
    await repository.ensureUser(officialUserId, 'Official voter');
    await setUserTrustLevel(pool, officialUserId, 'official');

    const older = await createPublishedPoll(service, 'Older');
    const newer = await createPublishedPoll(service, 'Newer');
    const sameTimeLowerId = await createPublishedPoll(service, 'Same time lower id');
    const sameTimeHigherId = await createPublishedPoll(service, 'Same time higher id');
    const draft = await service.createPoll(
      {
        creatorId,
        title: 'Draft',
        description: '',
        category: 'general',
        options: ['Option A', 'Option B'],
        eligibleRuleId: null,
        closesAt: new Date(Date.now() + 86_400_000),
        publish: false,
      },
      'Creator',
    );
    const closed = await createPublishedPoll(service, 'Closed');
    const suspended = await createPublishedPoll(service, 'Suspended');
    const deleted = await createPublishedPoll(service, 'Deleted');
    const archived = await createPublishedPoll(service, 'Archived');

    const olderTime = new Date('2026-01-01T00:00:00.000Z');
    const newerTime = new Date('2026-02-01T00:00:00.000Z');
    const sameTime = new Date('2026-03-01T00:00:00.000Z');

    await setPollPublishedAt(pool, older.poll_id, olderTime);
    await setPollPublishedAt(pool, newer.poll_id, newerTime);
    await setPollPublishedAt(pool, sameTimeLowerId.poll_id, sameTime);
    await setPollPublishedAt(pool, sameTimeHigherId.poll_id, sameTime);
    await setPollStatus(pool, closed.poll_id, 'closed');
    await setPollStatus(pool, suspended.poll_id, 'suspended');
    await setPollStatus(pool, deleted.poll_id, 'deleted');
    await setPollArchivedAt(pool, archived.poll_id, new Date('2026-04-01T00:00:00.000Z'));

    const baseline = await service.getPublicFeed();
    const sameTimeIds = [sameTimeLowerId.poll_id, sameTimeHigherId.poll_id].sort();

    expect(baseline.polls.map((poll) => poll.poll_id)).toEqual([
      ...sameTimeIds,
      newer.poll_id,
      older.poll_id,
    ]);
    expect(baseline.next_cursor).toBeNull();
    expect(baseline.polls).not.toContainEqual(
      expect.objectContaining({ poll_id: draft.poll_id }),
    );
    expect(baseline.polls).not.toContainEqual(
      expect.objectContaining({ poll_id: closed.poll_id }),
    );
    expect(baseline.polls).not.toContainEqual(
      expect.objectContaining({ poll_id: suspended.poll_id }),
    );
    expect(baseline.polls).not.toContainEqual(
      expect.objectContaining({ poll_id: deleted.poll_id }),
    );
    expect(baseline.polls).not.toContainEqual(
      expect.objectContaining({ poll_id: archived.poll_id }),
    );
    expect(JSON.stringify(baseline)).not.toMatch(
      /option_id|options|vote|result_bucket|shard|token|user_id|participation|reference_answer|official_vote|published_at|closes_at/i,
    );

    const [olderOption] = await repository.listOptionsByPollId(older.poll_id);
    const [newerOption] = await repository.listOptionsByPollId(newer.poll_id);
    if (!olderOption || !newerOption) {
      throw new Error('expected poll options');
    }

    await service.submitReferenceAnswer(newer.poll_id, lowTrustUserId, newerOption.id);
    await service.castOfficialVote(older.poll_id, officialUserId, olderOption.id);
    await pool.query(
      `INSERT INTO poll_option_vote_counters (poll_id, option_id, shard_id, vote_count)
       VALUES ($1, $2, $3, $4)`,
      [older.poll_id, olderOption.id, 7, 10_000],
    );

    await expect(service.getPublicFeed()).resolves.toEqual(baseline);
  });

  it('returns at most 50 rows ordered by published_at DESC, id ASC', async () => {
    const repository = createPgPollRepository(pool);
    const service = createPollService(repository);

    await repository.ensureUser(creatorId, 'Creator');

    const createdPollIds: string[] = [];
    for (let index = 0; index < 51; index += 1) {
      const created = await createPublishedPoll(service, `Feed limit ${index}`);
      await setPollPublishedAt(
        pool,
        created.poll_id,
        new Date(Date.UTC(2026, 0, 1, 0, 0, index)),
      );
      createdPollIds.push(created.poll_id);
    }

    const feed = await service.getPublicFeed();

    expect(feed.polls).toHaveLength(50);
    expect(feed.polls.map((poll) => poll.poll_id)).not.toContain(createdPollIds[0]);
    expect(feed.polls[0]!.poll_id).toBe(createdPollIds[50]);
    expect(feed.polls[49]!.poll_id).toBe(createdPollIds[1]);
    expect(feed.next_cursor).toBeTypeOf('string');

    const page2 = await service.getPublicFeed({ cursor: feed.next_cursor! });
    expect(page2.polls).toHaveLength(1);
    expect(page2.polls[0]!.poll_id).toBe(createdPollIds[0]);
    expect(page2.next_cursor).toBeNull();
  });

  it('paginates with limit and same published_at tie-break by id ASC', async () => {
    const repository = createPgPollRepository(pool);
    const service = createPollService(repository);

    await repository.ensureUser(creatorId, 'Creator');

    const sameTime = new Date('2026-03-01T00:00:00.000Z');
    const pollIds: string[] = [];
    for (let index = 0; index < 5; index += 1) {
      const created = await createPublishedPoll(service, `Tie ${index}`);
      await setPollPublishedAt(pool, created.poll_id, sameTime);
      pollIds.push(created.poll_id);
    }

    const sortedIds = [...pollIds].sort();
    const page1 = await service.getPublicFeed({ limit: 2 });
    const page2 = await service.getPublicFeed({
      limit: 2,
      cursor: page1.next_cursor!,
    });
    const page3 = await service.getPublicFeed({
      limit: 2,
      cursor: page2.next_cursor!,
    });

    expect(page1.polls.map((poll) => poll.poll_id)).toEqual(sortedIds.slice(0, 2));
    expect(page2.polls.map((poll) => poll.poll_id)).toEqual(sortedIds.slice(2, 4));
    expect(page3.polls.map((poll) => poll.poll_id)).toEqual(sortedIds.slice(4, 5));
    expect(page3.next_cursor).toBeNull();
  });

  it('has public feed freshness partial index', async () => {
    const result = await pool.query<{ indexname: string; indexdef: string }>(
      `SELECT indexname, indexdef
       FROM pg_indexes
       WHERE schemaname = 'public'
         AND tablename = 'polls'
         AND indexname = 'idx_polls_public_feed_freshness'`,
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]!.indexdef.toLowerCase()).toContain('archived_at is null');
  });
});
