import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { InvalidFeedCursorError, InvalidFeedLimitError } from '../../src/polls/errors.js';
import { createInMemoryPollRepository } from '../../src/polls/in-memory-repository.js';
import { createPollService } from '../../src/polls/service.js';

const creatorId = '11111111-1111-4111-8111-111111111111';
const officialUserId = '22222222-2222-4222-8222-222222222222';

async function createPoll(
  service: ReturnType<typeof createPollService>,
  title: string,
  publish = true,
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
      publish,
    },
    'Creator',
  );
}

async function seedPublishedPolls(
  service: ReturnType<typeof createPollService>,
  repository: ReturnType<typeof createInMemoryPollRepository>,
  count: number,
  publishedAtForIndex: (index: number) => Date,
) {
  const pollIds: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const created = await createPoll(service, `Feed ${index}`);
    repository.polls.get(created.poll_id)!.published_at = publishedAtForIndex(index);
    pollIds.push(created.poll_id);
  }
  return pollIds;
}

describe('public freshness feed', () => {
  it('returns active published polls only in deterministic freshness order', async () => {
    const repository = createInMemoryPollRepository();
    const service = createPollService(repository);
    const older = await createPoll(service, 'Older');
    const newer = await createPoll(service, 'Newer');
    const sameTimeLowerId = await createPoll(service, 'Same time lower id');
    const sameTimeHigherId = await createPoll(service, 'Same time higher id');
    const draft = await createPoll(service, 'Draft', false);
    const closed = await createPoll(service, 'Closed');
    const suspended = await createPoll(service, 'Suspended');
    const deleted = await createPoll(service, 'Deleted');
    const olderTime = new Date('2026-01-01T00:00:00.000Z');
    const newerTime = new Date('2026-02-01T00:00:00.000Z');
    const sameTime = new Date('2026-03-01T00:00:00.000Z');

    repository.polls.get(older.poll_id)!.published_at = olderTime;
    repository.polls.get(newer.poll_id)!.published_at = newerTime;
    repository.polls.get(sameTimeLowerId.poll_id)!.published_at = sameTime;
    repository.polls.get(sameTimeHigherId.poll_id)!.published_at = sameTime;
    repository.polls.get(closed.poll_id)!.status = 'closed';
    repository.polls.get(suspended.poll_id)!.status = 'suspended';
    repository.polls.get(deleted.poll_id)!.status = 'deleted';

    const feed = await service.getPublicFeed();
    const sameTimeIds = [sameTimeLowerId.poll_id, sameTimeHigherId.poll_id].sort();

    expect(feed.polls.map((poll) => poll.poll_id)).toEqual([
      ...sameTimeIds,
      newer.poll_id,
      older.poll_id,
    ]);
    expect(feed.next_cursor).toBeNull();
    expect(feed.polls).not.toContainEqual(expect.objectContaining({ poll_id: draft.poll_id }));
    expect(feed.polls).not.toContainEqual(expect.objectContaining({ poll_id: closed.poll_id }));
    expect(feed.polls).not.toContainEqual(
      expect.objectContaining({ poll_id: suspended.poll_id }),
    );
    expect(feed.polls).not.toContainEqual(
      expect.objectContaining({ poll_id: deleted.poll_id }),
    );
  });

  it('defaults to the first 50 rows when more polls exist', async () => {
    const repository = createInMemoryPollRepository();
    const service = createPollService(repository);
    const pollIds = await seedPublishedPolls(
      service,
      repository,
      55,
      (index) => new Date(Date.UTC(2026, 0, 1, 0, 0, index)),
    );

    const feed = await service.getPublicFeed();

    expect(feed.polls).toHaveLength(50);
    expect(feed.polls[0]!.poll_id).toBe(pollIds[54]);
    expect(feed.polls[49]!.poll_id).toBe(pollIds[5]);
    expect(feed.polls.map((poll) => poll.poll_id)).not.toContain(pollIds[0]);
    expect(feed.next_cursor).toBeTypeOf('string');
  });

  it('paginates with limit and cursor without duplicates', async () => {
    const repository = createInMemoryPollRepository();
    const service = createPollService(repository);
    await seedPublishedPolls(
      service,
      repository,
      55,
      (index) => new Date(Date.UTC(2026, 0, 1, 0, 0, index)),
    );

    const page1 = await service.getPublicFeed({ limit: 20 });
    const page2 = await service.getPublicFeed({
      limit: 20,
      cursor: page1.next_cursor!,
    });
    const page3 = await service.getPublicFeed({
      limit: 20,
      cursor: page2.next_cursor!,
    });

    expect(page1.polls).toHaveLength(20);
    expect(page2.polls).toHaveLength(20);
    expect(page3.polls).toHaveLength(15);
    expect(page3.next_cursor).toBeNull();

    const allIds = [...page1.polls, ...page2.polls, ...page3.polls].map(
      (poll) => poll.poll_id,
    );
    const expectedOrder = [...repository.polls.values()]
      .filter((poll) => poll.status === 'active' && poll.published_at !== null)
      .sort(
        (a, b) =>
          b.published_at!.getTime() - a.published_at!.getTime() ||
          a.id.localeCompare(b.id),
      )
      .map((poll) => poll.id);

    expect(new Set(allIds).size).toBe(55);
    expect(allIds).toEqual(expectedOrder);
  });

  it('rejects invalid feed limit and cursor values', async () => {
    const repository = createInMemoryPollRepository();
    const service = createPollService(repository);
    await createPoll(service, 'One');

    await expect(service.getPublicFeed({ limit: 0 })).rejects.toBeInstanceOf(
      InvalidFeedLimitError,
    );
    await expect(service.getPublicFeed({ limit: 51 })).rejects.toBeInstanceOf(
      InvalidFeedLimitError,
    );
    await expect(service.getPublicFeed({ limit: 'bad' })).rejects.toBeInstanceOf(
      InvalidFeedLimitError,
    );
    await expect(service.getPublicFeed({ cursor: 'not-a-cursor' })).rejects.toBeInstanceOf(
      InvalidFeedCursorError,
    );
  });

  it('returns only safe public metadata without exact publish timestamps', async () => {
    const repository = createInMemoryPollRepository();
    const service = createPollService(repository);
    const created = await createPoll(service, 'Safe metadata');

    await expect(service.getPublicFeed()).resolves.toEqual({
      polls: [
        {
          poll_id: created.poll_id,
          title: 'Safe metadata',
          category: 'general',
          status: 'active',
          published_display: '最近發布',
          result_page_url: `/results/${created.poll_id}`,
        },
      ],
      next_cursor: null,
    });

    expect(JSON.stringify(await service.getPublicFeed())).not.toMatch(
      /option_id|options|vote|result_bucket|shard|token|user_id|participation|reference_answer|official_vote|published_at|closes_at/i,
    );
  });

  it('is unaffected by Reference Answer, Official Vote, or selected-option distribution', async () => {
    const repository = createInMemoryPollRepository();
    const service = createPollService(repository, { selectShardId: () => 2 });
    const older = await createPoll(service, 'Older');
    const newer = await createPoll(service, 'Newer');
    repository.polls.get(older.poll_id)!.published_at =
      new Date('2026-01-01T00:00:00.000Z');
    repository.polls.get(newer.poll_id)!.published_at =
      new Date('2026-02-01T00:00:00.000Z');
    const baseline = await service.getPublicFeed();
    const [olderOption] = await repository.listOptionsByPollId(older.poll_id);
    const [newerOption] = await repository.listOptionsByPollId(newer.poll_id);

    await repository.ensureUser(creatorId, 'Low trust');
    await service.submitReferenceAnswer(newer.poll_id, creatorId, newerOption!.id);
    await repository.ensureUser(officialUserId, 'Official');
    repository.setUserTrustLevel(officialUserId, 'official');
    await service.castOfficialVote(older.poll_id, officialUserId, olderOption!.id);
    repository.voteCounters.set('distribution-only', {
      poll_id: older.poll_id,
      option_id: olderOption!.id,
      shard_id: 7,
      vote_count: 10_000,
    });

    await expect(service.getPublicFeed()).resolves.toEqual(baseline);
  });

  it('uses a polls-only PostgreSQL query with freshness ordering', async () => {
    const source = await readFile(
      join(process.cwd(), 'src/polls/repository.ts'),
      'utf8',
    );
    const feedFunction = source.match(
      /async function listPublicFeedPolls[\s\S]*?return result\.rows;\r?\n}/,
    )?.[0];
    const feedSql = source.match(
      /`SELECT id, title, category, status, published_at[\s\S]*?LIMIT \$\$\{values\.length\}`/,
    )?.[0];

    expect(feedFunction).toContain("status = 'active'");
    expect(feedFunction).toContain('published_at IS NOT NULL');
    expect(feedFunction).toContain('published_at <');
    expect(feedFunction).toContain('id >');
    expect(feedSql).toContain('FROM polls');
    expect(feedSql).toContain('ORDER BY published_at DESC, id ASC');
    const staticSql = feedSql!
      .split('\n')
      .filter((line) => !line.includes('${'))
      .join('\n');
    expect(staticSql).not.toMatch(/\bJOIN\b/i);
    for (const table of [
      'poll_options',
      'poll_option_vote_counters',
      'poll_vote_tokens',
      'poll_reference_answer_tokens',
      'users',
    ]) {
      expect(staticSql).not.toMatch(new RegExp(`\\bFROM\\s+${table}\\b`, 'i'));
      expect(staticSql).not.toMatch(new RegExp(`\\bJOIN\\s+${table}\\b`, 'i'));
    }
  });
});
