import { describe, expect, it } from 'vitest';
import { PollNotFoundError, PollValidationError } from '../../src/polls/errors.js';
import { createInMemoryPollRepository } from '../../src/polls/in-memory-repository.js';
import { createPollService } from '../../src/polls/service.js';

const creatorId = '11111111-1111-4111-8111-111111111111';
const lowTrustUserId = '22222222-2222-4222-8222-222222222222';
const officialUserId = '33333333-3333-4333-8333-333333333333';

async function createPublishedPoll(
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

describe('Poll public visibility boundaries', () => {
  it('returns 404 for hidden states on public read routes', async () => {
    const repository = createInMemoryPollRepository();
    const service = createPollService(repository);
    const draft = await createPublishedPoll(service, 'Draft', false);
    const hidden = await createPublishedPoll(service, 'Hidden');
    repository.polls.get(hidden.poll_id)!.status = 'suspended';

    for (const pollId of [draft.poll_id, hidden.poll_id, crypto.randomUUID()]) {
      await expect(service.getPollById(pollId)).rejects.toBeInstanceOf(PollNotFoundError);
      await expect(service.getPollResults(pollId)).rejects.toBeInstanceOf(PollNotFoundError);
    }

    repository.polls.get(hidden.poll_id)!.status = 'correction_pending';
    await expect(service.getPollById(hidden.poll_id)).rejects.toBeInstanceOf(PollNotFoundError);

    const deleted = await createPublishedPoll(service, 'Deleted');
    await service.deletePoll(deleted.poll_id, creatorId);
    await expect(service.getPollById(deleted.poll_id)).rejects.toBeInstanceOf(PollNotFoundError);
  });

  it('allows direct read and results for active, closed, and archived polls', async () => {
    const repository = createInMemoryPollRepository();
    const service = createPollService(repository);
    const active = await createPublishedPoll(service, 'Active');
    const closed = await createPublishedPoll(service, 'Closed');
    const archived = await createPublishedPoll(service, 'Archived');
    repository.polls.get(closed.poll_id)!.status = 'closed';
    repository.polls.get(archived.poll_id)!.archived_at = new Date();

    await expect(service.getPollById(active.poll_id)).resolves.toMatchObject({
      poll_id: active.poll_id,
    });
    await expect(service.getPollById(closed.poll_id)).resolves.toMatchObject({
      status: 'closed',
    });
    await expect(service.getPollById(archived.poll_id)).resolves.toMatchObject({
      status: 'active',
    });
    await expect(service.getPollResults(active.poll_id)).resolves.toMatchObject({
      poll_id: active.poll_id,
    });
    await expect(service.getPollResults(archived.poll_id)).resolves.toMatchObject({
      poll_id: archived.poll_id,
    });
  });

  it('rejects participation for closed, archived, hidden, and expired active polls', async () => {
    const repository = createInMemoryPollRepository();
    await repository.ensureUser(lowTrustUserId, 'Low trust');
    await repository.ensureUser(officialUserId, 'Official');
    repository.setUserTrustLevel(officialUserId, 'official');
    const service = createPollService(repository, { selectShardId: () => 1 });

    const active = await createPublishedPoll(service, 'Active');
    const closed = await createPublishedPoll(service, 'Closed');
    const archived = await createPublishedPoll(service, 'Archived');
    const draft = await createPublishedPoll(service, 'Draft', false);
    const expired = await createPublishedPoll(service, 'Expired');
    repository.polls.get(closed.poll_id)!.status = 'closed';
    repository.polls.get(archived.poll_id)!.archived_at = new Date();
    repository.polls.get(expired.poll_id)!.closes_at = new Date(Date.now() - 60_000);

    const [activeOption] = await repository.listOptionsByPollId(active.poll_id);

    await expect(
      service.submitReferenceAnswer(active.poll_id, lowTrustUserId, activeOption!.id),
    ).resolves.toEqual({ status: 'recorded', reference_answered: true });

    for (const pollId of [closed.poll_id, archived.poll_id, expired.poll_id]) {
      const [option] = await repository.listOptionsByPollId(pollId);
      await expect(
        service.submitReferenceAnswer(pollId, lowTrustUserId, option!.id),
      ).rejects.toBeInstanceOf(PollValidationError);
      await expect(
        service.castOfficialVote(pollId, officialUserId, option!.id),
      ).rejects.toBeInstanceOf(PollValidationError);
    }

    const [draftOption] = await repository.listOptionsByPollId(draft.poll_id);
    await expect(
      service.submitReferenceAnswer(draft.poll_id, lowTrustUserId, draftOption!.id),
    ).rejects.toBeInstanceOf(PollNotFoundError);
    await expect(
      service.castOfficialVote(draft.poll_id, officialUserId, draftOption!.id),
    ).rejects.toBeInstanceOf(PollNotFoundError);
  });

  it.each(['cancelled', 'revealed', 'locked', 'post_lock', 'unpublished'] as const)(
    'rejects Reference Answer and Official Vote when lifecycle is %s',
    async (publicLifecycleState) => {
      const repository = createInMemoryPollRepository();
      await repository.ensureUser(lowTrustUserId, 'Low trust');
      await repository.ensureUser(officialUserId, 'Official');
      repository.setUserTrustLevel(officialUserId, 'official');
      const service = createPollService(repository, { selectShardId: () => 1 });
      const created = await createPublishedPoll(service, 'Lifecycle blocked');
      repository.polls.get(created.poll_id)!.public_lifecycle_state =
        publicLifecycleState;
      const [option] = await repository.listOptionsByPollId(created.poll_id);

      await expect(
        service.submitReferenceAnswer(created.poll_id, lowTrustUserId, option!.id),
      ).rejects.toMatchObject({
        code: 'POLL_VALIDATION',
        message: 'Poll is not collecting responses',
      });
      await expect(
        service.castOfficialVote(created.poll_id, officialUserId, option!.id),
      ).rejects.toMatchObject({
        code: 'POLL_VALIDATION',
        message: 'Poll is not collecting responses',
      });
      expect(repository.referenceAnswerTokens.size).toBe(0);
      expect(repository.voteTokens.size).toBe(0);
      expect(repository.voteCounters.size).toBe(0);
    },
  );
});
