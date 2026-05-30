import type { PollRepository } from './repository.js';
import type {
  CreatePollInput,
  PollOptionRow,
  PollReferenceAnswerTokenRow,
  PollRow,
  PollStatus,
  UserRow,
} from './types.js';
import type { TrustLevel } from './trust.js';

/** In-memory repository for unit tests (no PostgreSQL required). */
export function createInMemoryPollRepository(): PollRepository & {
  readonly polls: Map<string, PollRow>;
  readonly options: Map<string, PollOptionRow[]>;
  readonly referenceAnswerTokens: Map<string, PollReferenceAnswerTokenRow>;
  setUserTrustLevel(userId: string, trustLevel: TrustLevel): void;
} {
  const users = new Map<string, UserRow>();
  const polls = new Map<string, PollRow>();
  const options = new Map<string, PollOptionRow[]>();
  const referenceAnswerTokens = new Map<string, PollReferenceAnswerTokenRow>();

  return {
    polls,
    options,
    referenceAnswerTokens,

    setUserTrustLevel(userId, trustLevel) {
      const user = users.get(userId);
      if (user) {
        user.trust_level = trustLevel;
      }
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
  };
}
