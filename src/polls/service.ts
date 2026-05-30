import { PublishedPollImmutableError, PollForbiddenError, PollNotFoundError } from './errors.js';
import type { PollRepository } from './repository.js';
import type {
  CreatePollInput,
  CreatePollResult,
  DeletePollResult,
  PollDetail,
} from './types.js';
import { validateCreatePollInput } from './validation.js';

export type PollService = {
  createPoll(input: CreatePollInput, displayName: string): Promise<CreatePollResult>;
  getPollById(pollId: string): Promise<PollDetail>;
  deletePoll(pollId: string, creatorId: string): Promise<DeletePollResult>;
  assertCreatorCannotEditPublishedPoll(): never;
};

export function createPollService(repository: PollRepository): PollService {
  return {
    async createPoll(input, displayName) {
      validateCreatePollInput({
        title: input.title,
        description: input.description,
        category: input.category,
        options: input.options,
        closesAt: input.closesAt,
        publish: input.publish,
      });
      await repository.ensureUser(input.creatorId, displayName);
      const poll = await repository.createPollWithOptions(input);
      return {
        poll_id: poll.id,
        status: poll.status,
        created_at: poll.created_at.toISOString(),
      };
    },

    async getPollById(pollId) {
      const poll = await repository.findPollById(pollId);
      if (!poll || poll.status === 'deleted') {
        throw new PollNotFoundError();
      }
      const options = await repository.listOptionsByPollId(pollId);
      return toPollDetail(poll, options);
    },

    async deletePoll(pollId, creatorId) {
      const existing = await repository.findPollById(pollId);
      if (!existing || existing.status === 'deleted') {
        throw new PollNotFoundError();
      }
      if (existing.creator_id !== creatorId) {
        throw new PollForbiddenError('Only the creator may delete this poll');
      }
      const deleted = await repository.softDeletePoll(pollId, creatorId);
      if (!deleted) {
        throw new PollNotFoundError();
      }
      return {
        poll_id: deleted.id,
        status: 'deleted',
        deleted_at: deleted.deleted_at!.toISOString(),
      };
    },

    assertCreatorCannotEditPublishedPoll(): never {
      throw new PublishedPollImmutableError();
    },
  };
}

function toPollDetail(
  poll: {
    id: string;
    title: string;
    description: string;
    category: string;
    status: PollDetail['status'];
    closes_at: Date;
    created_at: Date;
    published_at: Date | null;
  },
  options: Array<{ option_order: number; option_text: string }>,
): PollDetail {
  return {
    poll_id: poll.id,
    title: poll.title,
    description: poll.description,
    category: poll.category,
    status: poll.status,
    closes_at: poll.closes_at.toISOString(),
    created_at: poll.created_at.toISOString(),
    published_at: poll.published_at?.toISOString() ?? null,
    options: options.map((option) => ({
      option_index: option.option_order,
      label: option.option_text,
    })),
    user_participation_state: null,
  };
}
