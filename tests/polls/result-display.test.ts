import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createInMemoryPollRepository } from '../../src/polls/in-memory-repository.js';
import { createPollService } from '../../src/polls/service.js';

const creatorId = '11111111-1111-4111-8111-111111111111';

async function seedPoll(
  publicLifecycleState: 'draft' | 'collecting' | 'cancelled' | 'revealed' | 'locked' | 'post_lock' | 'unpublished' = 'revealed',
) {
  const repository = createInMemoryPollRepository();
  const service = createPollService(repository);
  const created = await service.createPoll(
    {
      creatorId,
      title: 'Result Display',
      description: '',
      category: 'general',
      options: ['Option A', 'Option B'],
      eligibleRuleId: null,
      closesAt: new Date(Date.now() + 86_400_000),
      publish: true,
    },
    'Creator',
  );
  repository.polls.get(created.poll_id)!.public_lifecycle_state = publicLifecycleState;
  const options = await repository.listOptionsByPollId(created.poll_id);
  return { repository, service, pollId: created.poll_id, options };
}

function seedCounter(
  repository: ReturnType<typeof createInMemoryPollRepository>,
  pollId: string,
  optionId: string,
  shardId: number,
  voteCount: number,
) {
  repository.voteCounters.set(`${pollId}:${optionId}:${shardId}`, {
    poll_id: pollId,
    option_id: optionId,
    shard_id: shardId,
    vote_count: voteCount,
  });
}

describe('Result Display service', () => {
  it('keeps PostgreSQL aggregate counts as text instead of narrowing to integer', async () => {
    const repositorySource = await readFile(
      join(process.cwd(), 'src/polls/repository.ts'),
      'utf8',
    );

    expect(repositorySource).toContain(
      'COALESCE(SUM(counters.vote_count), 0)::text AS vote_count',
    );
    expect(repositorySource).not.toContain(
      'COALESCE(SUM(counters.vote_count), 0)::integer AS vote_count',
    );
  });

  it('sums shards internally and exposes only display-safe option data', async () => {
    const { repository, service, pollId, options } = await seedPoll();
    seedCounter(repository, pollId, options[0]!.id, 1, 12);
    seedCounter(repository, pollId, options[0]!.id, 7, 8);
    seedCounter(repository, pollId, options[1]!.id, 3, 10);

    const result = await service.getPollResults(pollId);

    expect(result).toEqual({
      poll_id: pollId,
      public_lifecycle_state: 'revealed',
      display_mode: 'bucketed_percentage',
      total_votes_display: '30–99',
      collecting: false,
      options: [
        {
          option_index: 0,
          display_label: 'Option A',
          display_percentage: '約 60–70%',
          display_count: null,
        },
        {
          option_index: 1,
          display_label: 'Option B',
          display_percentage: '約 30–40%',
          display_count: null,
        },
      ],
      updated_display: '最近更新',
      quality_badge: null,
    });
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(options[0]!.id);
    expect(serialized).not.toContain(options[1]!.id);
    expect(serialized).not.toMatch(
      /user_id|token|shard_id|voted_at_minute|answered_at|eligibility_snapshot|result_snapshot|vote_event/i,
    );
  });

  it('returns a collecting shell without reading counters even when total votes would exceed the old threshold', async () => {
    const { repository, service, pollId, options } = await seedPoll('collecting');
    seedCounter(repository, pollId, options[0]!.id, 1, 30);
    repository.listVoteAggregatesByPollId = async () => {
      throw new Error('collecting result path must not query aggregates');
    };

    await expect(service.getPollResults(pollId)).resolves.toEqual({
      poll_id: pollId,
      public_lifecycle_state: 'collecting',
      display_mode: 'collecting',
      total_votes_display: '收集中',
      collecting: true,
      options: [
        {
          option_index: 0,
          display_label: 'Option A',
          display_percentage: null,
          display_count: null,
        },
        {
          option_index: 1,
          display_label: 'Option B',
          display_percentage: null,
          display_count: null,
        },
      ],
      updated_display: '最近更新',
      quality_badge: null,
    });
  });

  it.each(['revealed', 'locked', 'post_lock'] as const)(
    'returns display-safe aggregates only when lifecycle is %s',
    async (publicLifecycleState) => {
      const { repository, service, pollId, options } = await seedPoll(
        publicLifecycleState,
      );
      seedCounter(repository, pollId, options[0]!.id, 1, 30);

      await expect(service.getPollResults(pollId)).resolves.toMatchObject({
        public_lifecycle_state: publicLifecycleState,
        display_mode: 'bucketed_percentage',
        total_votes_display: '30–99',
        collecting: false,
      });
    },
  );

  it.each(['draft', 'cancelled', 'unpublished'] as const)(
    'returns an unavailable shell without reading counters when lifecycle is %s',
    async (publicLifecycleState) => {
      const { repository, service, pollId } = await seedPoll(publicLifecycleState);
      repository.listVoteAggregatesByPollId = async () => {
        throw new Error('unavailable result path must not query aggregates');
      };

      await expect(service.getPollResults(pollId)).resolves.toMatchObject({
        public_lifecycle_state: publicLifecycleState,
        display_mode: 'unavailable',
        total_votes_display: '結果不可用',
        collecting: false,
        user_message:
          publicLifecycleState === 'cancelled'
            ? '問卷已取消，不會產生公開結果。'
            : publicLifecycleState === 'unpublished'
              ? '此問卷已結束公開鎖定期，並由發起者下架。'
              : '此問卷目前沒有可公開顯示的結果。',
      });
    },
  );

  it('does not reveal aggregates from legacy closed status alone', async () => {
    const { repository, service, pollId, options } = await seedPoll('draft');
    repository.polls.get(pollId)!.status = 'closed';
    seedCounter(repository, pollId, options[0]!.id, 1, 30);
    repository.listVoteAggregatesByPollId = async () => {
      throw new Error('legacy closed result path must not query aggregates');
    };

    await expect(service.getPollResults(pollId)).resolves.toMatchObject({
      public_lifecycle_state: 'draft',
      display_mode: 'unavailable',
      total_votes_display: '結果不可用',
    });
  });

  it.each([
    {
      total: 0,
      counts: [0, 0],
      displayMode: 'collecting',
      totalDisplay: '收集中',
      percentage: null,
      count: null,
    },
    {
      total: 1,
      counts: [1, 0],
      displayMode: 'collecting',
      totalDisplay: '收集中',
      percentage: null,
      count: null,
    },
    {
      total: 29,
      counts: [9, 20],
      displayMode: 'collecting',
      totalDisplay: '收集中',
      percentage: null,
      count: null,
    },
    {
      total: 30,
      counts: [12, 18],
      displayMode: 'bucketed_percentage',
      totalDisplay: '30–99',
      percentage: '約 40–50%',
      count: null,
    },
    {
      total: 99,
      counts: [49, 50],
      displayMode: 'bucketed_percentage',
      totalDisplay: '30–99',
      percentage: '約 40–50%',
      count: null,
    },
    {
      total: 100,
      counts: [43, 57],
      displayMode: 'rounded_with_bucketed_votes',
      totalDisplay: '100–499',
      percentage: '約 43%',
      count: '約 0–50 票',
    },
    {
      total: 499,
      counts: [216, 283],
      displayMode: 'rounded_with_bucketed_votes',
      totalDisplay: '100–499',
      percentage: '約 43%',
      count: '約 200–250 票',
    },
    {
      total: 500,
      counts: [216, 284],
      displayMode: 'precise',
      totalDisplay: '500+',
      percentage: '43.2%',
      count: '約 220 票',
    },
  ])('uses the display-safe tier for $total official votes', async ({
    counts,
    displayMode,
    totalDisplay,
    percentage,
    count,
  }) => {
    const { repository, service, pollId, options } = await seedPoll();
    seedCounter(repository, pollId, options[0]!.id, 0, counts[0]!);
    seedCounter(repository, pollId, options[1]!.id, 1, counts[1]!);

    const result = await service.getPollResults(pollId);

    expect(result.display_mode).toBe(displayMode);
    expect(result.total_votes_display).toBe(totalDisplay);
    expect(result.options[0]).toMatchObject({
      display_percentage: percentage,
      display_count: count,
    });
  });

  it('does not count Reference Answer participation or reveal a user selection', async () => {
    const { repository, service, pollId, options } = await seedPoll('collecting');
    await repository.createReferenceAnswerToken(
      creatorId,
      pollId,
      new Date(),
      repository.polls.get(pollId)!.closes_at,
    );

    const result = await service.getPollResults(pollId);
    const serialized = JSON.stringify(result);

    expect(result.collecting).toBe(true);
    expect(result.options.every((option) => option.display_percentage === null)).toBe(true);
    expect(serialized).not.toContain(creatorId);
    expect(serialized).not.toContain(options[0]!.id);
  });

  it('cannot reveal which option a specific official user selected', async () => {
    const { repository, service, pollId, options } = await seedPoll('collecting');
    const firstUserId = '33333333-3333-4333-8333-333333333333';
    const secondUserId = '44444444-4444-4444-8444-444444444444';
    await repository.ensureUser(firstUserId, 'First official user');
    await repository.ensureUser(secondUserId, 'Second official user');
    repository.setUserTrustLevel(firstUserId, 'official');
    repository.setUserTrustLevel(secondUserId, 'official');
    await service.castOfficialVote(pollId, firstUserId, options[0]!.id);
    await service.castOfficialVote(pollId, secondUserId, options[1]!.id);
    repository.polls.get(pollId)!.public_lifecycle_state = 'revealed';

    const serialized = JSON.stringify(await service.getPollResults(pollId));

    expect(serialized).not.toContain(firstUserId);
    expect(serialized).not.toContain(secondUserId);
    expect(serialized).not.toContain(options[0]!.id);
    expect(serialized).not.toContain(options[1]!.id);
  });

  it('formats aggregate counts above the JavaScript safe integer limit', async () => {
    const { repository, service, pollId, options } = await seedPoll();
    repository.listVoteAggregatesByPollId = async () => [
      {
        option_id: options[0]!.id,
        option_order: 0,
        option_text: 'Option A',
        vote_count: '9007199254740993',
      },
      {
        option_id: options[1]!.id,
        option_order: 1,
        option_text: 'Option B',
        vote_count: '9007199254740993',
      },
    ];

    const result = await service.getPollResults(pollId);

    expect(result.options[0]).toMatchObject({
      display_percentage: '50.0%',
      display_count: '約 9007199254740990 票',
    });
    expect(JSON.stringify(result)).not.toContain(options[0]!.id);
  });

  it('returns a safe not-found error for a missing poll', async () => {
    const service = createPollService(createInMemoryPollRepository());

    await expect(
      service.getPollResults('99999999-9999-4999-8999-999999999999'),
    ).rejects.toMatchObject({
      code: 'POLL_NOT_FOUND',
      message: 'Poll not found',
      statusCode: 404,
    });
  });
});
