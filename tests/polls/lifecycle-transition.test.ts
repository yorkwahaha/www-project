import { describe, expect, it } from 'vitest';
import { createInMemoryPollRepository } from '../../src/polls/in-memory-repository.js';
import { createPollService } from '../../src/polls/service.js';

const creatorId = '11111111-1111-4111-8111-111111111111';
const otherUserId = '22222222-2222-4222-8222-222222222222';

async function setup() {
  const repository = createInMemoryPollRepository();
  const service = createPollService(repository);
  const created = await service.createPoll(
    {
      creatorId,
      title: 'Lifecycle transitions',
      description: '',
      category: 'general',
      options: ['A', 'B'],
      eligibleRuleId: null,
      closesAt: new Date(Date.now() + 86_400_000),
      publish: true,
    },
    'Creator',
  );
  return { repository, service, pollId: created.poll_id };
}

describe('poll lifecycle transitions', () => {
  it('cancels collecting polls without aggregate access and blocks repeat cancel', async () => {
    const { repository, service, pollId } = await setup();
    repository.listVoteAggregatesByPollId = async () => {
      throw new Error('cancelled result shell must not query aggregates');
    };

    await expect(service.cancelPoll(pollId, otherUserId)).rejects.toMatchObject({
      code: 'POLL_FORBIDDEN',
    });
    await expect(service.cancelPoll(pollId, creatorId)).resolves.toEqual({
      public_lifecycle_state: 'cancelled',
      message: '問卷已取消，不會產生公開結果。',
    });
    expect(repository.polls.get(pollId)).toMatchObject({
      public_lifecycle_state: 'cancelled',
      cancelled_at: expect.any(Date),
    });
    await expect(service.getPollResults(pollId)).resolves.toMatchObject({
      public_lifecycle_state: 'cancelled',
      display_mode: 'unavailable',
    });
    await expect(service.cancelPoll(pollId, creatorId)).rejects.toMatchObject({
      code: 'ALREADY_CANCELLED',
    });
  });

  it('reveals only through explicit close at or after closes_at', async () => {
    const { repository, service, pollId } = await setup();
    const poll = repository.polls.get(pollId)!;
    poll.status = 'closed';
    repository.voteCounters.set(`${pollId}:threshold:0`, {
      poll_id: pollId,
      option_id: repository.options.get(pollId)![0]!.id,
      shard_id: 0,
      vote_count: 30,
    });

    await expect(service.getPollResults(pollId)).resolves.toMatchObject({
      public_lifecycle_state: 'collecting',
      display_mode: 'collecting',
    });
    await expect(service.closePoll(pollId, creatorId)).rejects.toMatchObject({
      code: 'POLL_VALIDATION',
    });

    poll.closes_at = new Date(Date.now() - 1_000);
    const revealed = await service.closePoll(pollId, creatorId);
    expect(revealed.public_lifecycle_state).toBe('revealed');
    expect(
      new Date(revealed.public_lock_ends_at).getTime() -
        new Date(revealed.revealed_at).getTime(),
    ).toBe(5 * 24 * 60 * 60 * 1000);
    await expect(service.getPollResults(pollId)).resolves.toMatchObject({
      public_lifecycle_state: 'revealed',
      display_mode: 'bucketed_percentage',
    });
  });

  it('advances revealed to locked to post_lock before creator unpublish', async () => {
    const { repository, service, pollId } = await setup();
    repository.polls.get(pollId)!.closes_at = new Date(Date.now() - 1_000);
    await service.revealPoll(pollId);
    const revealed = repository.polls.get(pollId)!;
    const revealedAt = revealed.revealed_at;
    const publicLockEndsAt = revealed.public_lock_ends_at;

    await expect(service.advancePublicLifecycle(pollId)).resolves.toMatchObject({
      public_lifecycle_state: 'locked',
    });
    expect(repository.polls.get(pollId)).toMatchObject({
      revealed_at: revealedAt,
      public_lock_ends_at: publicLockEndsAt,
    });
    await expect(service.advancePublicLifecycle(pollId)).rejects.toMatchObject({
      code: 'LOCKED_PERIOD_CONFLICT',
    });

    repository.polls.get(pollId)!.public_lock_ends_at = new Date(Date.now() - 1_000);
    await expect(service.advancePublicLifecycle(pollId)).resolves.toMatchObject({
      public_lifecycle_state: 'post_lock',
    });
    await expect(service.unpublishPoll(pollId, otherUserId)).rejects.toMatchObject({
      code: 'POLL_FORBIDDEN',
    });
    await expect(service.unpublishPoll(pollId, creatorId)).resolves.toEqual({
      public_lifecycle_state: 'unpublished',
      user_message: '此問卷已結束公開鎖定期，並由發起者下架。',
    });
    repository.listVoteAggregatesByPollId = async () => {
      throw new Error('unpublished result shell must not query aggregates');
    };
    await expect(service.getPollResults(pollId)).resolves.toMatchObject({
      public_lifecycle_state: 'unpublished',
      display_mode: 'unavailable',
    });
    await expect(service.unpublishPoll(pollId, creatorId)).rejects.toMatchObject({
      code: 'ALREADY_UNPUBLISHED',
    });
  });
});
