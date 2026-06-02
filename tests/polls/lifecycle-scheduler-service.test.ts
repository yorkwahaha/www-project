import { describe, expect, it } from 'vitest';
import { createPublicLifecycleSchedulerService } from '../../src/polls/lifecycle-scheduler-service.js';
import { createInMemoryPollRepository } from '../../src/polls/in-memory-repository.js';
import { createPollService } from '../../src/polls/service.js';

const creatorId = '11111111-1111-4111-8111-111111111111';
const FIVE_DAYS = 5 * 24 * 60 * 60 * 1000;

async function setup() {
  const repository = createInMemoryPollRepository();
  const pollService = createPollService(repository);
  const scheduler = createPublicLifecycleSchedulerService(repository);
  const created = await pollService.createPoll(
    {
      creatorId,
      title: 'Lifecycle scheduler',
      description: '',
      category: 'general',
      options: ['A', 'B'],
      eligibleRuleId: null,
      closesAt: new Date(Date.now() + 86_400_000),
      publish: true,
    },
    'Creator',
  );
  return { repository, scheduler, pollId: created.poll_id };
}

describe('public lifecycle scheduler service', () => {
  it('advances a due revealed poll to locked without reading counters', async () => {
    const { repository, scheduler, pollId } = await setup();
    const poll = repository.polls.get(pollId)!;
    poll.public_lifecycle_state = 'revealed';
    poll.revealed_at = new Date(Date.now() - 1_000);
    poll.public_lock_ends_at = new Date(poll.revealed_at.getTime() + FIVE_DAYS);
    repository.listVoteAggregatesByPollId = async () => {
      throw new Error('scheduler must not query aggregates');
    };

    await expect(
      scheduler.runDuePublicLifecycleAdvancementBatch(),
    ).resolves.toEqual({
      candidate_count: 1,
      advanced: [{ poll_id: pollId, public_lifecycle_state: 'locked' }],
      failed: [],
    });
  });

  it('does not advance a revealed poll before revealed_at', async () => {
    const { repository, scheduler, pollId } = await setup();
    const poll = repository.polls.get(pollId)!;
    poll.public_lifecycle_state = 'revealed';
    poll.revealed_at = new Date(Date.now() + 60_000);
    poll.public_lock_ends_at = new Date(poll.revealed_at.getTime() + FIVE_DAYS);

    await expect(
      scheduler.runDuePublicLifecycleAdvancementBatch(),
    ).resolves.toEqual({
      candidate_count: 0,
      advanced: [],
      failed: [],
    });
    expect(repository.polls.get(pollId)!.public_lifecycle_state).toBe('revealed');
  });

  it('advances a due locked poll to post_lock', async () => {
    const { repository, scheduler, pollId } = await setup();
    const poll = repository.polls.get(pollId)!;
    poll.public_lifecycle_state = 'locked';
    poll.revealed_at = new Date(Date.now() - FIVE_DAYS - 1_000);
    poll.public_lock_ends_at = new Date(poll.revealed_at.getTime() + FIVE_DAYS);

    await expect(
      scheduler.runDuePublicLifecycleAdvancementBatch(),
    ).resolves.toEqual({
      candidate_count: 1,
      advanced: [{ poll_id: pollId, public_lifecycle_state: 'post_lock' }],
      failed: [],
    });
  });

  it('does not advance a locked poll before public_lock_ends_at', async () => {
    const { repository, scheduler, pollId } = await setup();
    const poll = repository.polls.get(pollId)!;
    poll.public_lifecycle_state = 'locked';
    poll.revealed_at = new Date(Date.now() - 1_000);
    poll.public_lock_ends_at = new Date(poll.revealed_at.getTime() + FIVE_DAYS);

    await expect(
      scheduler.runDuePublicLifecycleAdvancementBatch(),
    ).resolves.toEqual({
      candidate_count: 0,
      advanced: [],
      failed: [],
    });
    expect(repository.polls.get(pollId)!.public_lifecycle_state).toBe('locked');
  });

  it.each(['revealed', 'locked'] as const)(
    'fails closed for malformed %s rows without mutation',
    async (publicLifecycleState) => {
      const { repository, scheduler, pollId } = await setup();
      const poll = repository.polls.get(pollId)!;
      poll.public_lifecycle_state = publicLifecycleState;
      poll.revealed_at = null;
      poll.public_lock_ends_at = null;

      await expect(
        scheduler.runDuePublicLifecycleAdvancementBatch(),
      ).resolves.toEqual({
        candidate_count: 1,
        advanced: [],
        failed: [{ poll_id: pollId, error_code: 'LIFECYCLE_CONFLICT' }],
      });
      expect(repository.polls.get(pollId)!.public_lifecycle_state).toBe(
        publicLifecycleState,
      );
    },
  );

  it('rejects an unbounded batch request', async () => {
    const { scheduler } = await setup();

    await expect(
      scheduler.runDuePublicLifecycleAdvancementBatch(101),
    ).rejects.toThrow(RangeError);
  });
});
