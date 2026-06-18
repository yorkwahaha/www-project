import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createInMemoryPollRepository } from '../../src/polls/in-memory-repository.js';
import { createPollService } from '../../src/polls/service.js';

const creatorId = '11111111-1111-4111-8111-111111111111';

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

async function setVoteCounts(
  repository: ReturnType<typeof createInMemoryPollRepository>,
  pollId: string,
  distribution: number[],
) {
  const options = await repository.listOptionsByPollId(pollId);
  options.forEach((option, index) => {
    repository.voteCounters.set(`${pollId}:${option.id}`, {
      poll_id: pollId,
      option_id: option.id,
      shard_id: 1,
      vote_count: distribution[index] ?? 0,
    });
  });
}

function setPublishedAt(
  repository: ReturnType<typeof createInMemoryPollRepository>,
  pollId: string,
  when: Date,
) {
  repository.polls.get(pollId)!.published_at = when;
}

function reveal(
  repository: ReturnType<typeof createInMemoryPollRepository>,
  pollId: string,
  state: 'revealed' | 'locked' | 'post_lock' = 'revealed',
) {
  repository.polls.get(pollId)!.public_lifecycle_state = state;
}

describe('Phase 303 public home mixed feed (service)', () => {
  it('keeps /polls/feed collecting-only and unchanged even when revealed polls exist', async () => {
    const repository = createInMemoryPollRepository();
    const service = createPollService(repository);
    const collecting = await createPoll(service, 'Collecting');
    const revealed = await createPoll(service, 'Revealed');
    await setVoteCounts(repository, revealed.poll_id, [40, 20]);
    reveal(repository, revealed.poll_id);

    const feed = await service.getPublicFeed();
    const ids = feed.polls.map((poll) => poll.poll_id);
    expect(ids).toContain(collecting.poll_id);
    expect(ids).not.toContain(revealed.poll_id);
    // Explore feed item shape is unchanged (collecting-only contract).
    expect(feed.polls[0]).toMatchObject({ status: 'active', published_display: '最近發布' });
    expect(feed.polls[0]).not.toHaveProperty('result_summary');
    expect(feed.polls[0]).not.toHaveProperty('state');
  });

  it('returns a discriminated union of collecting and revealed items', async () => {
    const repository = createInMemoryPollRepository();
    const service = createPollService(repository);
    const collecting = await createPoll(service, 'Collecting');
    const revealed = await createPoll(service, 'Revealed');
    setPublishedAt(repository, collecting.poll_id, new Date('2026-02-01T00:00:00.000Z'));
    setPublishedAt(repository, revealed.poll_id, new Date('2026-01-01T00:00:00.000Z'));
    await setVoteCounts(repository, revealed.poll_id, [40, 20]);
    reveal(repository, revealed.poll_id);

    const feed = await service.getHomeFeed();
    const byId = new Map(feed.items.map((item) => [item.poll_id, item]));

    expect(byId.get(collecting.poll_id)).toMatchObject({
      state: 'collecting',
      lifecycle_label: '收集中',
      vote_page_url: `/vote/${collecting.poll_id}`,
    });
    expect(byId.get(revealed.poll_id)).toMatchObject({
      state: 'revealed',
      lifecycle_label: '已公開',
      result_page_url: `/results/${revealed.poll_id}`,
    });
  });

  it('emits collecting items with no result_summary or aggregate even when votes exist', async () => {
    const repository = createInMemoryPollRepository();
    const service = createPollService(repository);
    const collecting = await createPoll(service, 'Collecting with votes');
    // Votes exist but the poll is still collecting → never expose any aggregate.
    await setVoteCounts(repository, collecting.poll_id, [120, 80]);

    const feed = await service.getHomeFeed();
    const item = feed.items.find((entry) => entry.poll_id === collecting.poll_id);

    expect(item?.state).toBe('collecting');
    expect(item).not.toHaveProperty('result_summary');
    expect(JSON.stringify(item)).not.toMatch(
      /result_summary|vote_count|percentage|rank|progress|total_votes|leading|winner|百分比|票數/i,
    );
  });

  it('emits revealed items only when public aggregate visibility allows it', async () => {
    const repository = createInMemoryPollRepository();
    const service = createPollService(repository);
    // Collecting poll with many votes → must NOT become a revealed item.
    const stillCollecting = await createPoll(service, 'Collecting many votes');
    await setVoteCounts(repository, stillCollecting.poll_id, [200, 100]);
    // Revealed poll with enough votes → revealed item.
    const revealed = await createPoll(service, 'Revealed enough');
    await setVoteCounts(repository, revealed.poll_id, [300, 200]);
    reveal(repository, revealed.poll_id);
    // Revealed poll with too few votes → omitted (no presentable bucket).
    const revealedLowVotes = await createPoll(service, 'Revealed low votes');
    await setVoteCounts(repository, revealedLowVotes.poll_id, [3, 2]);
    reveal(repository, revealedLowVotes.poll_id);

    const feed = await service.getHomeFeed();
    const byId = new Map(feed.items.map((item) => [item.poll_id, item]));

    expect(byId.get(stillCollecting.poll_id)?.state).toBe('collecting');
    expect(byId.get(revealed.poll_id)?.state).toBe('revealed');
    expect(byId.has(revealedLowVotes.poll_id)).toBe(false);
  });

  it('uses display-safe bucketed result output, never raw counts', async () => {
    const repository = createInMemoryPollRepository();
    const service = createPollService(repository);
    const revealed = await createPoll(service, 'Revealed bucketed');
    await setVoteCounts(repository, revealed.poll_id, [40, 20]); // total 60 → '30–99'
    reveal(repository, revealed.poll_id);

    const feed = await service.getHomeFeed();
    const item = feed.items.find((entry) => entry.poll_id === revealed.poll_id);

    expect(item?.state).toBe('revealed');
    if (item?.state === 'revealed') {
      expect(item.result_summary.total_votes_display).toBe('30–99');
      expect(item.result_summary.display_mode).toBe('bucketed_percentage');
      // Leading option label is public (also on results page); percentage is a
      // bucketed display string, never a raw ratio or raw count.
      expect(item.result_summary.leading_option?.display_label).toBe('Option A');
      expect(item.result_summary.leading_option?.display_percentage).toMatch(/^約 /);
    }
    // Raw counts (40 / 20) must never leak; only bucketed display strings appear
    // (e.g. '30–99', '約 60–70%'), which never contain the raw per-option counts.
    const serialized = JSON.stringify(item);
    expect(serialized).not.toContain('40');
    expect(serialized).not.toContain('20');
    expect(serialized).not.toMatch(/option_id|option_index|vote_count/);
  });

  it('never exposes option linkage or identity fields in either state', async () => {
    const repository = createInMemoryPollRepository();
    const service = createPollService(repository);
    const collecting = await createPoll(service, 'Collecting');
    const revealed = await createPoll(service, 'Revealed');
    await setVoteCounts(repository, revealed.poll_id, [80, 40]);
    reveal(repository, revealed.poll_id, 'locked');

    const serialized = JSON.stringify(await service.getHomeFeed());
    expect(serialized).not.toMatch(
      /option_id|option_index|shard|vote_token|user_id|session|request_id|device|trace|published_at|closes_at/i,
    );
    expect(collecting.poll_id).toBeTruthy();
  });

  it('adds GET /home/feed without modifying the /polls/feed query', async () => {
    const repositorySource = await readFile(
      join(process.cwd(), 'src/polls/repository.ts'),
      'utf8',
    );
    const serverSource = await readFile(
      join(process.cwd(), 'src/http/server.ts'),
      'utf8',
    );

    // /polls/feed query is still the collecting-only freshness query.
    const feedFunction = repositorySource.match(
      /async function listPublicFeedPolls[\s\S]*?return result\.rows;\r?\n}/,
    )?.[0];
    expect(feedFunction).toContain("status = 'active'");
    expect(feedFunction).toContain("public_lifecycle_state = 'collecting'");

    // Home feed is a separate route + query.
    expect(serverSource).toContain("path === '/home/feed'");
    expect(serverSource).toContain('handleGetHomeFeed');
    expect(repositorySource).toContain('listPublicHomeFeedPolls');
  });

  it('documents Phase 303 in README and the implementation doc', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    const doc = await readFile(
      join(
        process.cwd(),
        'docs/www-project-phase-303-public-home-mixed-feed-contract-implementation-v1.md',
      ),
      'utf8',
    );
    expect(readme).toContain('Phase 303');
    expect(readme).toContain(
      'docs/www-project-phase-303-public-home-mixed-feed-contract-implementation-v1.md',
    );
    expect(doc).toContain('GET /home/feed');
    expect(doc).toContain('isPublicAggregateResultsReadable');
  });
});
