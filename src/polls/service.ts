import { randomInt } from 'node:crypto';
import {
  OfficialVoteDuplicateError,
  PublishedPollImmutableError,
  PollForbiddenError,
  PollNotFoundError,
  PollValidationError,
  ReferenceAnswerDuplicateError,
} from './errors.js';
import type { PollRepository } from './repository.js';
import type {
  CreatePollInput,
  CreatePollResult,
  CreatorOwnedPollListResult,
  CancelPollResult,
  DeletePollResult,
  AdvancePublicLifecycleResult,
  PollDetail,
  PollOptionVoteAggregateRow,
  PollRow,
  PollResultDisplay,
  PublicFeedQuery,
  PublicFeedResult,
  RevealPollResult,
  OfficialVoteResult,
  ReferenceAnswerResult,
  UnpublishPollResult,
} from './types.js';
import { decodeFeedCursor, encodeFeedCursor, parseFeedLimit } from './feed-cursor.js';
import {
  INVALID_REFERENCE_ANSWER_OPTION_MESSAGE,
  REFERENCE_ANSWER_LOW_TRUST_ONLY_MESSAGE,
} from './reference-answer-messages.js';
import { SHARD_COUNT } from './vote-config.js';
import { isLowTrustUser } from './trust.js';
import {
  isParticipationAllowed,
  isPublicAggregateResultsReadable,
  isPublicDirectReadable,
  isPublicHiddenPoll,
  isPublicResultsReadable,
  participationRejectionMessage,
} from './public-visibility.js';
import { validateCreatePollInput } from './validation.js';

export type PollService = {
  createPoll(input: CreatePollInput, displayName: string): Promise<CreatePollResult>;
  createCreatorPoll(input: CreatePollInput): Promise<CreatePollResult>;
  getCreatorOwnedPolls(creatorId: string): Promise<CreatorOwnedPollListResult>;
  getPollById(pollId: string): Promise<PollDetail>;
  getPollResults(pollId: string): Promise<PollResultDisplay>;
  getPublicFeed(query?: PublicFeedQuery): Promise<PublicFeedResult>;
  deletePoll(pollId: string, creatorId: string): Promise<DeletePollResult>;
  cancelPoll(pollId: string, creatorId: string): Promise<CancelPollResult>;
  closePoll(pollId: string, creatorId: string): Promise<RevealPollResult>;
  revealPoll(pollId: string): Promise<RevealPollResult>;
  advancePublicLifecycle(pollId: string): Promise<AdvancePublicLifecycleResult>;
  unpublishPoll(pollId: string, creatorId: string): Promise<UnpublishPollResult>;
  submitReferenceAnswer(
    pollId: string,
    userId: string,
    optionId: string,
  ): Promise<ReferenceAnswerResult>;
  castOfficialVote(
    pollId: string,
    userId: string,
    optionId: string,
  ): Promise<OfficialVoteResult>;
  castOfficialVoteByIndex(
    pollId: string,
    userId: string,
    optionIndex: number,
  ): Promise<OfficialVoteResult>;
  assertCreatorCannotEditPublishedPoll(): never;
};

export const CREATOR_OWNED_POLL_LIST_LIMIT = 50;

export function createPollService(
  repository: PollRepository,
  options: { selectShardId?: () => number } = {},
): PollService {
  const selectShardId = options.selectShardId ?? (() => randomInt(0, SHARD_COUNT));
  return {
    async createPoll(input, displayName) {
      validatePollCreation(input);
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
      if (!poll || !isPublicDirectReadable(poll)) {
        throw new PollNotFoundError();
      }
      const options = await repository.listOptionsByPollId(pollId);
      return toPollDetail(poll, options);
    },

    async getPollResults(pollId) {
      const poll = await repository.findPollById(pollId);
      if (!poll || !isPublicResultsReadable(poll)) {
        throw new PollNotFoundError();
      }
      if (!isPublicAggregateResultsReadable(poll)) {
        const options = await repository.listOptionsByPollId(pollId);
        return toPollResultShell(poll.id, poll.public_lifecycle_state, options);
      }
      const options = await repository.listVoteAggregatesByPollId(pollId);
      return toPollResultDisplay(pollId, poll.public_lifecycle_state, options);
    },

    async getPublicFeed(query = {}) {
      const limit = parseFeedLimit(query.limit);
      const cursor = query.cursor === undefined ? undefined : decodeFeedCursor(query.cursor);
      const rows = await repository.listPublicFeedPolls({ limit, cursor });
      const hasMore = rows.length > limit;
      const pageRows = hasMore ? rows.slice(0, limit) : rows;
      const lastRow = pageRows.at(-1);
      return {
        polls: pageRows.map((poll) => ({
          poll_id: poll.id,
          title: poll.title,
          category: poll.category,
          status: poll.status,
          published_display: '最近發布',
          result_page_url: `/results/${poll.id}`,
        })),
        next_cursor:
          hasMore && lastRow
            ? encodeFeedCursor(lastRow.published_at, lastRow.id)
            : null,
      };
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

    async createCreatorPoll(input) {
      validatePollCreation(input);
      const creator = await repository.findUserById(input.creatorId);
      if (!creator || creator.status !== 'active') {
        throw new PollForbiddenError('Active creator is required');
      }
      const poll = await repository.createPollWithOptions(input);
      return {
        poll_id: poll.id,
        status: poll.status,
        created_at: poll.created_at.toISOString(),
      };
    },

    async getCreatorOwnedPolls(creatorId) {
      const rows = await repository.listCreatorOwnedPolls(
        creatorId,
        CREATOR_OWNED_POLL_LIST_LIMIT,
      );
      return {
        polls: rows.map((poll) => ({
          poll_id: poll.id,
          title: poll.title,
          category: poll.category,
          public_lifecycle_state: poll.public_lifecycle_state,
          closes_at: poll.closes_at.toISOString(),
          revealed_at: poll.revealed_at?.toISOString() ?? null,
          public_lock_ends_at: poll.public_lock_ends_at?.toISOString() ?? null,
          cancelled_at: poll.cancelled_at?.toISOString() ?? null,
          unpublished_at: poll.unpublished_at?.toISOString() ?? null,
        })),
      };
    },

    async cancelPoll(pollId, creatorId) {
      await repository.cancelPoll(pollId, creatorId);
      return {
        public_lifecycle_state: 'cancelled',
        message: '問卷已取消，不會產生公開結果。',
      };
    },

    async closePoll(pollId, creatorId) {
      return toRevealPollResult(await repository.revealPoll(pollId, creatorId));
    },

    async revealPoll(pollId) {
      return toRevealPollResult(await repository.revealPoll(pollId));
    },

    async advancePublicLifecycle(pollId) {
      const poll = await repository.advancePublicLifecycle(pollId);
      return {
        public_lifecycle_state: poll.public_lifecycle_state as 'locked' | 'post_lock',
        revealed_at: poll.revealed_at!.toISOString(),
        public_lock_ends_at: poll.public_lock_ends_at!.toISOString(),
      };
    },

    async unpublishPoll(pollId, creatorId) {
      await repository.unpublishPoll(pollId, creatorId);
      return {
        public_lifecycle_state: 'unpublished',
        user_message: '此問卷已結束公開鎖定期，並由發起者下架。',
      };
    },

    async submitReferenceAnswer(pollId, userId, optionId) {
      const user = await repository.findUserById(userId);
      if (!user || user.status !== 'active') {
        throw new PollForbiddenError('Active user is required');
      }
      if (!isLowTrustUser(user)) {
        throw new PollForbiddenError(REFERENCE_ANSWER_LOW_TRUST_ONLY_MESSAGE);
      }
      const poll = await repository.findPollById(pollId);
      if (!poll || isPublicHiddenPoll(poll)) {
        throw new PollNotFoundError();
      }
      if (!isParticipationAllowed(poll)) {
        throw new PollValidationError(participationRejectionMessage(poll));
      }
      if (!optionId || !(await repository.optionBelongsToPoll(pollId, optionId))) {
        throw new PollValidationError(INVALID_REFERENCE_ANSWER_OPTION_MESSAGE);
      }
      const answeredAt = truncateToMinute(new Date());
      try {
        await repository.createReferenceAnswerToken(
          userId,
          pollId,
          answeredAt,
          poll.closes_at,
        );
      } catch (err) {
        if (isUniqueViolation(err)) {
          throw new ReferenceAnswerDuplicateError();
        }
        throw err;
      }
      return { status: 'recorded', reference_answered: true };
    },

    async castOfficialVote(pollId, userId, optionId) {
      const votedAtMinute = truncateToMinute(new Date());
      try {
        await repository.castOfficialVote(
          userId,
          pollId,
          optionId,
          votedAtMinute,
          selectShardId,
        );
      } catch (err) {
        if (isUniqueViolation(err)) {
          throw new OfficialVoteDuplicateError();
        }
        throw err;
      }
      return { status: 'voted', voted: true };
    },

    async castOfficialVoteByIndex(pollId, userId, optionIndex) {
      const votedAtMinute = truncateToMinute(new Date());
      try {
        await repository.castOfficialVoteByIndex(
          userId,
          pollId,
          optionIndex,
          votedAtMinute,
          selectShardId,
        );
      } catch (err) {
        if (isUniqueViolation(err)) {
          throw new OfficialVoteDuplicateError();
        }
        throw err;
      }
      return { status: 'voted', voted: true };
    },

    assertCreatorCannotEditPublishedPoll(): never {
      throw new PublishedPollImmutableError();
    },
  };
}

function validatePollCreation(input: CreatePollInput): void {
  validateCreatePollInput({
    title: input.title,
    description: input.description,
    category: input.category,
    options: input.options,
    closesAt: input.closesAt,
    publish: input.publish,
  });
}

function toRevealPollResult(poll: PollRow): RevealPollResult {
  return {
    public_lifecycle_state: 'revealed',
    revealed_at: poll.revealed_at!.toISOString(),
    public_lock_ends_at: poll.public_lock_ends_at!.toISOString(),
  };
}

function truncateToMinute(value: Date): Date {
  value.setSeconds(0, 0);
  return value;
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    err.code === '23505'
  );
}

function toPollDetail(
  poll: {
    id: string;
    title: string;
    description: string;
    category: string;
    status: PollDetail['status'];
    public_lifecycle_state: PollDetail['public_lifecycle_state'];
    closes_at: Date;
    created_at: Date;
    published_at: Date | null;
  },
  options: Array<{ option_order: number; option_text: string }>,
): PollDetail {
  return {
    poll_id: poll.id,
    public_lifecycle_state: poll.public_lifecycle_state,
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

function toPollResultDisplay(
  pollId: string,
  lifecycleState: PollRow['public_lifecycle_state'],
  options: PollOptionVoteAggregateRow[],
): PollResultDisplay {
  const counts = options.map((option) => BigInt(option.vote_count));
  const total = counts.reduce((sum, count) => sum + count, 0n);
  const tier = getResultTier(total);
  return {
    poll_id: pollId,
    public_lifecycle_state: lifecycleState,
    display_mode: tier.displayMode,
    total_votes_display: tier.totalVotesDisplay,
    collecting: total < 30n,
    options: options.map((option, index) => ({
      option_index: option.option_order,
      display_label: option.option_text,
      display_percentage: formatPercentage(counts[index]!, total),
      display_count: formatCount(counts[index]!, total),
    })),
    updated_display: '最近更新',
  };
}

function toPollResultShell(
  pollId: string,
  lifecycleState: PollRow['public_lifecycle_state'],
  options: Array<{ option_order: number; option_text: string }>,
): PollResultDisplay {
  const collecting = lifecycleState === 'collecting';
  return {
    poll_id: pollId,
    public_lifecycle_state: lifecycleState,
    display_mode: collecting ? 'collecting' : 'unavailable',
    total_votes_display: collecting ? '收集中' : '結果不可用',
    collecting,
    options: options.map((option) => ({
      option_index: option.option_order,
      display_label: option.option_text,
      display_percentage: null,
      display_count: null,
    })),
    updated_display: '最近更新',
    ...(collecting ? {} : { user_message: unavailableResultMessage(lifecycleState) }),
  };
}

function unavailableResultMessage(
  lifecycleState: PollRow['public_lifecycle_state'],
): string {
  if (lifecycleState === 'cancelled') {
    return '問卷已取消，不會產生公開結果。';
  }
  if (lifecycleState === 'unpublished') {
    return '此問卷已結束公開鎖定期，並由發起者下架。';
  }
  return '此問卷目前沒有可公開顯示的結果。';
}

function getResultTier(total: bigint): {
  displayMode: PollResultDisplay['display_mode'];
  totalVotesDisplay: PollResultDisplay['total_votes_display'];
} {
  if (total < 30n) {
    return { displayMode: 'collecting', totalVotesDisplay: '收集中' };
  }
  if (total < 100n) {
    return { displayMode: 'bucketed_percentage', totalVotesDisplay: '30–99' };
  }
  if (total < 500n) {
    return {
      displayMode: 'rounded_with_bucketed_votes',
      totalVotesDisplay: '100–499',
    };
  }
  return { displayMode: 'precise', totalVotesDisplay: '500+' };
}

function formatPercentage(count: bigint, total: bigint): string | null {
  if (total < 30n) {
    return null;
  }
  if (total < 100n) {
    const lower = (count * 100n / total / 10n) * 10n;
    const upper = lower + 10n > 100n ? 100n : lower + 10n;
    return lower === upper ? '約 100%' : `約 ${lower}–${upper}%`;
  }
  if (total < 500n) {
    return `約 ${(count * 100n + total / 2n) / total}%`;
  }
  const tenths = (count * 1_000n + total / 2n) / total;
  return `${tenths / 10n}.${tenths % 10n}%`;
}

function formatCount(count: bigint, total: bigint): string | null {
  if (total < 100n) {
    return null;
  }
  if (total < 500n) {
    const lower = (count / 50n) * 50n;
    const upper = lower + 50n;
    return `約 ${lower}–${upper} 票`;
  }
  return `約 ${((count + 5n) / 10n) * 10n} 票`;
}
