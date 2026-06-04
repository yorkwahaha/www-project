import { describe, expect, it } from 'vitest';
import { createInMemoryPollRepository } from '../../src/polls/in-memory-repository.js';
import { OFFICIAL_VOTE_ELIGIBILITY_MESSAGE } from '../../src/polls/official-vote-messages.js';
import { createPollService } from '../../src/polls/service.js';
import type { PollEligibilityRuleRow } from '../../src/polls/types.js';

const creatorId = '11111111-1111-4111-8111-111111111111';

async function seedOfficialVote() {
  const repository = createInMemoryPollRepository();
  const service = createPollService(repository, { selectShardId: () => 3 });
  const created = await service.createPoll(
    {
      creatorId,
      title: 'Official Vote',
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
  return { repository, service, pollId: created.poll_id, optionId: option!.id };
}

async function addOfficialUser(
  repository: ReturnType<typeof createInMemoryPollRepository>,
  userId: string,
) {
  await repository.ensureUser(userId, 'Official');
  repository.setUserTrustLevel(userId, 'official');
}

function profileRule(
  pollId: string,
  input: Partial<PollEligibilityRuleRow>,
): PollEligibilityRuleRow {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    poll_id: pollId,
    rule_type: 'unrestricted',
    min_birth_year_month: null,
    max_birth_year_month: null,
    allowed_regions: [],
    created_at: now,
    updated_at: now,
    ...input,
  };
}

describe('Official Vote service', () => {
  it('increments aggregate counter and stores option-free token', async () => {
    const { repository, service, pollId, optionId } = await seedOfficialVote();
    await addOfficialUser(repository, creatorId);

    await expect(service.castOfficialVote(pollId, creatorId, optionId)).resolves.toEqual({
      status: 'voted',
      voted: true,
    });

    const [token] = [...repository.voteTokens.values()];
    expect(token).toMatchObject({ user_id: creatorId, poll_id: pollId });
    expect(token!.voted_at_minute.getSeconds()).toBe(0);
    expect(token).not.toHaveProperty('option_id');
    expect(token!.expires_at.getTime()).toBe(
      repository.polls.get(pollId)!.closes_at.getTime() + 180 * 24 * 60 * 60 * 1000,
    );
    expect([...repository.voteCounters.values()]).toEqual([
      { poll_id: pollId, option_id: optionId, shard_id: 3, vote_count: 1 },
    ]);
  });

  it('blocks duplicate token without incrementing aggregate counter', async () => {
    const { repository, service, pollId, optionId } = await seedOfficialVote();
    await addOfficialUser(repository, creatorId);

    await service.castOfficialVote(pollId, creatorId, optionId);
    await expect(service.castOfficialVote(pollId, creatorId, optionId)).rejects.toMatchObject({
      code: 'OFFICIAL_VOTE_DUPLICATE',
    });
    expect([...repository.voteCounters.values()][0]!.vote_count).toBe(1);
  });

  it('rejects low-trust users from Official Vote', async () => {
    const { repository, service, pollId, optionId } = await seedOfficialVote();
    await repository.ensureUser(creatorId, 'Low trust');

    await expect(service.castOfficialVote(pollId, creatorId, optionId)).rejects.toMatchObject({
      code: 'POLL_FORBIDDEN',
    });
    expect(repository.voteTokens.size).toBe(0);
    expect(repository.voteCounters.size).toBe(0);
  });

  it('rejects profile-ineligible Official Vote before token or counter writes', async () => {
    const { repository, service, pollId, optionId } = await seedOfficialVote();
    await addOfficialUser(repository, creatorId);
    repository.setPollEligibilityRule(profileRule(pollId, {
      rule_type: 'age_region',
      min_birth_year_month: new Date('1990-01-01T00:00:00.000Z'),
      max_birth_year_month: new Date('2000-12-01T00:00:00.000Z'),
      allowed_regions: ['TW-KHH'],
    }));

    await expect(service.castOfficialVote(pollId, creatorId, optionId)).rejects.toMatchObject({
      code: 'POLL_FORBIDDEN',
      message: OFFICIAL_VOTE_ELIGIBILITY_MESSAGE,
    });
    expect(repository.voteTokens.size).toBe(0);
    expect(repository.voteCounters.size).toBe(0);
  });

  it('allows profile-eligible Official Vote under age and region rules', async () => {
    const { repository, service, pollId, optionId } = await seedOfficialVote();
    await addOfficialUser(repository, creatorId);
    repository.setUserProfile(creatorId, {
      birth_year_month: new Date('1999-05-01T00:00:00.000Z'),
      residential_region: 'TW-KHH',
    });
    repository.setPollEligibilityRule(profileRule(pollId, {
      rule_type: 'age_region',
      min_birth_year_month: new Date('1990-01-01T00:00:00.000Z'),
      max_birth_year_month: new Date('2000-12-01T00:00:00.000Z'),
      allowed_regions: ['TW-KHH'],
    }));

    await expect(service.castOfficialVote(pollId, creatorId, optionId)).resolves.toEqual({
      status: 'voted',
      voted: true,
    });
    expect(repository.voteTokens.size).toBe(1);
    expect(repository.voteCounters.size).toBe(1);
  });

  it('rejects profile-ineligible vote-by-index before distinguishing valid and nonexistent indexes', async () => {
    const { repository, service, pollId } = await seedOfficialVote();
    await addOfficialUser(repository, creatorId);
    repository.setPollEligibilityRule(profileRule(pollId, {
      rule_type: 'region',
      allowed_regions: ['TW-KHH'],
    }));

    const validIndex = await service.castOfficialVoteByIndex(pollId, creatorId, 0)
      .then(() => null)
      .catch((err: unknown) => err);
    const nonexistentIndex = await service.castOfficialVoteByIndex(pollId, creatorId, 99)
      .then(() => null)
      .catch((err: unknown) => err);

    expect(validIndex).toMatchObject({
      code: 'POLL_FORBIDDEN',
      message: OFFICIAL_VOTE_ELIGIBILITY_MESSAGE,
    });
    expect(nonexistentIndex).toMatchObject({
      code: 'POLL_FORBIDDEN',
      message: OFFICIAL_VOTE_ELIGIBILITY_MESSAGE,
    });
    expect(repository.voteTokens.size).toBe(0);
    expect(repository.voteCounters.size).toBe(0);
  });

  it.each(['cancelled', 'revealed', 'locked', 'post_lock', 'unpublished'] as const)(
    'rejects Official Vote when lifecycle is %s',
    async (publicLifecycleState) => {
      const { repository, service, pollId, optionId } = await seedOfficialVote();
      await addOfficialUser(repository, creatorId);
      repository.polls.get(pollId)!.public_lifecycle_state = publicLifecycleState;

      await expect(
        service.castOfficialVote(pollId, creatorId, optionId),
      ).rejects.toMatchObject({
        code: 'POLL_VALIDATION',
        message: 'Poll is not collecting responses',
      });
      expect(repository.voteTokens.size).toBe(0);
      expect(repository.voteCounters.size).toBe(0);
    },
  );

  it('rolls back when token insert or counter increment fails', async () => {
    const first = await seedOfficialVote();
    await addOfficialUser(first.repository, creatorId);
    first.repository.failNextVoteTokenInsert();
    await expect(
      first.service.castOfficialVote(first.pollId, creatorId, first.optionId),
    ).rejects.toThrow(/token insert/);
    expect(first.repository.voteTokens.size).toBe(0);
    expect(first.repository.voteCounters.size).toBe(0);

    const second = await seedOfficialVote();
    await addOfficialUser(second.repository, creatorId);
    second.repository.failNextVoteCounterIncrement();
    await expect(
      second.service.castOfficialVote(second.pollId, creatorId, second.optionId),
    ).rejects.toThrow(/counter increment/);
    expect(second.repository.voteTokens.size).toBe(0);
    expect(second.repository.voteCounters.size).toBe(0);
  });

  it('does not lose concurrent aggregate increments', async () => {
    const { repository, service, pollId, optionId } = await seedOfficialVote();
    const userIds = Array.from(
      { length: 20 },
      (_, index) => `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    );
    await Promise.all(userIds.map((userId) => addOfficialUser(repository, userId)));

    await Promise.all(
      userIds.map((userId) => service.castOfficialVote(pollId, userId, optionId)),
    );
    expect([...repository.voteCounters.values()][0]!.vote_count).toBe(20);
    expect(repository.voteTokens.size).toBe(20);
  });
});
