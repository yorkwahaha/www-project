import type { PollRepository } from './repository.js';
import type {
  CreatePollInput,
  PollOptionRow,
  PollOptionVoteCounterRow,
  PollReferenceAnswerTokenRow,
  PollRow,
  PollStatus,
  ListPublicFeedPollsParams,
  PollVoteTokenRow,
  UserRow,
} from './types.js';
import type { TrustLevel } from './trust.js';
import { PollForbiddenError, PollNotFoundError, PollValidationError } from './errors.js';
import {
  INVALID_OFFICIAL_VOTE_OPTION_MESSAGE,
  OFFICIAL_VOTE_ELIGIBILITY_MESSAGE,
} from './official-vote-messages.js';
import {
  isParticipationAllowed,
  isPublicFeedEligible,
  isPublicHiddenPoll,
  participationRejectionMessage,
} from './public-visibility.js';
import { isOfficialVoteUser } from './trust.js';

/** In-memory repository for unit tests (no PostgreSQL required). */
export function createInMemoryPollRepository(): PollRepository & {
  readonly polls: Map<string, PollRow>;
  readonly options: Map<string, PollOptionRow[]>;
  readonly referenceAnswerTokens: Map<string, PollReferenceAnswerTokenRow>;
  readonly voteTokens: Map<string, PollVoteTokenRow>;
  readonly voteCounters: Map<string, PollOptionVoteCounterRow>;
  setUserTrustLevel(userId: string, trustLevel: TrustLevel): void;
  failNextVoteTokenInsert(): void;
  failNextVoteCounterIncrement(): void;
} {
  const users = new Map<string, UserRow>();
  const polls = new Map<string, PollRow>();
  const options = new Map<string, PollOptionRow[]>();
  const referenceAnswerTokens = new Map<string, PollReferenceAnswerTokenRow>();
  const voteTokens = new Map<string, PollVoteTokenRow>();
  const voteCounters = new Map<string, PollOptionVoteCounterRow>();
  let failVoteTokenInsert = false;
  let failVoteCounterIncrement = false;

  return {
    polls,
    options,
    referenceAnswerTokens,
    voteTokens,
    voteCounters,

    setUserTrustLevel(userId, trustLevel) {
      const user = users.get(userId);
      if (user) {
        user.trust_level = trustLevel;
      }
    },

    failNextVoteTokenInsert() {
      failVoteTokenInsert = true;
    },

    failNextVoteCounterIncrement() {
      failVoteCounterIncrement = true;
    },

    async ensureUser(userId, displayName) {
      const existing = users.get(userId);
      if (existing) {
        return existing;
      }
      const now = new Date();
      const user: UserRow = {
        id: userId,
        display_name: displayName,
        trust_level: 'low',
        status: 'active',
        created_at: now,
        updated_at: now,
      };
      users.set(userId, user);
      return user;
    },

    async createPollWithOptions(input) {
      const now = new Date();
      const status: PollStatus = input.publish ? 'active' : 'draft';
      const poll: PollRow = {
        id: crypto.randomUUID(),
        creator_id: input.creatorId,
        title: input.title.trim(),
        description: input.description.trim(),
        category: input.category.trim(),
        status,
        eligible_rule_id: input.eligibleRuleId,
        published_at: input.publish ? now : null,
        archived_at: null,
        closes_at: input.closesAt,
        deleted_at: null,
        created_at: now,
        updated_at: now,
      };
      polls.set(poll.id, poll);
      const pollOptions: PollOptionRow[] = input.options.map((text, order) => ({
        id: crypto.randomUUID(),
        poll_id: poll.id,
        option_order: order,
        option_text: text.trim(),
        created_at: now,
        updated_at: now,
      }));
      options.set(poll.id, pollOptions);
      return poll;
    },

    async findUserById(userId) {
      return users.get(userId) ?? null;
    },

    async findPollById(pollId) {
      return polls.get(pollId) ?? null;
    },

    async listOptionsByPollId(pollId) {
      return [...(options.get(pollId) ?? [])].sort(
        (a, b) => a.option_order - b.option_order,
      );
    },

    async listVoteAggregatesByPollId(pollId) {
      return (options.get(pollId) ?? [])
        .map((option) => ({
          option_id: option.id,
          option_order: option.option_order,
          option_text: option.option_text,
          vote_count: [...voteCounters.values()]
            .filter((counter) => (
              counter.poll_id === pollId && counter.option_id === option.id
            ))
            .reduce((total, counter) => total + counter.vote_count, 0)
            .toString(),
        }))
        .sort((a, b) => a.option_order - b.option_order);
    },

    async listPublicFeedPolls(params: ListPublicFeedPollsParams) {
      return [...polls.values()]
        .filter((poll) => isPublicFeedEligible(poll))
        .filter((poll) => (
          !params.cursor || isPublicFeedRowAfterCursor(poll, params.cursor)
        ))
        .sort((a, b) => (
          b.published_at!.getTime() - a.published_at!.getTime() ||
          a.id.localeCompare(b.id)
        ))
        .slice(0, params.limit + 1)
        .map((poll) => ({
          id: poll.id,
          title: poll.title,
          category: poll.category,
          status: 'active' as const,
          published_at: poll.published_at!,
        }));
    },

    async softDeletePoll(pollId, creatorId) {
      const poll = polls.get(pollId);
      if (!poll || poll.creator_id !== creatorId || poll.status === 'deleted') {
        return null;
      }
      const deleted: PollRow = {
        ...poll,
        status: 'deleted',
        deleted_at: new Date(),
        updated_at: new Date(),
      };
      polls.set(pollId, deleted);
      return deleted;
    },

    async optionBelongsToPoll(pollId, optionId) {
      return (options.get(pollId) ?? []).some((option) => option.id === optionId);
    },

    async createReferenceAnswerToken(userId, pollId, answeredAt, expiresAt) {
      const key = `${userId}:${pollId}`;
      if (referenceAnswerTokens.has(key)) {
        const error = new Error('duplicate reference answer token') as Error & {
          code: string;
        };
        error.code = '23505';
        throw error;
      }
      const token: PollReferenceAnswerTokenRow = {
        id: crypto.randomUUID(),
        user_id: userId,
        poll_id: pollId,
        answered_at: answeredAt,
        expires_at: expiresAt,
        created_at: new Date(),
      };
      referenceAnswerTokens.set(key, token);
      return token;
    },

    async castOfficialVote(userId, pollId, optionId, votedAtMinute, selectShardId) {
      const user = users.get(userId);
      if (!user || user.status !== 'active' || !isOfficialVoteUser(user)) {
        throw new PollForbiddenError(OFFICIAL_VOTE_ELIGIBILITY_MESSAGE);
      }
      const poll = polls.get(pollId);
      if (isPublicHiddenPoll(poll)) {
        throw new PollNotFoundError();
      }
      if (!poll || !isParticipationAllowed(poll)) {
        if (!poll) {
          throw new PollNotFoundError();
        }
        throw new PollValidationError(participationRejectionMessage(poll));
      }
      if (!(options.get(pollId) ?? []).some((option) => option.id === optionId)) {
        throw new PollValidationError(INVALID_OFFICIAL_VOTE_OPTION_MESSAGE);
      }

      const tokenKey = `${userId}:${pollId}`;
      if (failVoteTokenInsert) {
        failVoteTokenInsert = false;
        throw new Error('simulated vote token insert failure');
      }
      if (voteTokens.has(tokenKey)) {
        const error = new Error('duplicate vote token') as Error & { code: string };
        error.code = '23505';
        throw error;
      }

      const token: PollVoteTokenRow = {
        id: crypto.randomUUID(),
        user_id: userId,
        poll_id: pollId,
        voted_at_minute: votedAtMinute,
        expires_at: new Date(poll.closes_at.getTime() + 180 * 24 * 60 * 60 * 1000),
        created_at: new Date(),
      };
      const shardId = selectShardId();
      const counterKey = `${pollId}:${optionId}:${shardId}`;
      const existingCounter = voteCounters.get(counterKey);
      const counter: PollOptionVoteCounterRow = {
        poll_id: pollId,
        option_id: optionId,
        shard_id: shardId,
        vote_count: (existingCounter?.vote_count ?? 0) + 1,
      };

      if (failVoteCounterIncrement) {
        failVoteCounterIncrement = false;
        throw new Error('simulated vote counter increment failure');
      }

      voteTokens.set(tokenKey, token);
      voteCounters.set(counterKey, counter);
      return token;
    },

    async castOfficialVoteByIndex(
      userId,
      pollId,
      optionIndex,
      votedAtMinute,
      selectShardId,
    ) {
      const user = users.get(userId);
      if (!user || user.status !== 'active' || !isOfficialVoteUser(user)) {
        throw new PollForbiddenError(OFFICIAL_VOTE_ELIGIBILITY_MESSAGE);
      }
      const poll = polls.get(pollId);
      if (isPublicHiddenPoll(poll)) {
        throw new PollNotFoundError();
      }
      if (!poll || !isParticipationAllowed(poll)) {
        if (!poll) {
          throw new PollNotFoundError();
        }
        throw new PollValidationError(participationRejectionMessage(poll));
      }
      const optionId = Number.isInteger(optionIndex) && optionIndex >= 0
        ? (options.get(pollId) ?? [])
          .find((option) => option.option_order === optionIndex)?.id
        : undefined;
      if (!optionId) {
        throw new PollValidationError(INVALID_OFFICIAL_VOTE_OPTION_MESSAGE);
      }
      return this.castOfficialVote(
        userId,
        pollId,
        optionId,
        votedAtMinute,
        selectShardId,
      );
    },
  };
}

function isPublicFeedRowAfterCursor(
  poll: PollRow,
  cursor: NonNullable<ListPublicFeedPollsParams['cursor']>,
): boolean {
  const publishedAt = poll.published_at!.getTime();
  const cursorPublishedAt = cursor.publishedAt.getTime();
  if (publishedAt < cursorPublishedAt) {
    return true;
  }
  if (publishedAt > cursorPublishedAt) {
    return false;
  }
  return poll.id > cursor.pollId;
}
