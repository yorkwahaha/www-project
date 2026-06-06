import type { Pool, PoolClient } from 'pg';
import type {
  CreatePollInput,
  CreatorOwnedPollRow,
  PollOptionRow,
  PollOptionVoteAggregateRow,
  PollOptionVoteCounterRow,
  PollEligibilityRuleRow,
  PollReferenceAnswerTokenRow,
  PollRow,
  PublicLifecycleState,
  PollStatus,
  PollVoteTokenRow,
  UpdateUserProfileInput,
  ListPublicFeedPollsParams,
  PublicFeedPollRow,
  UserRow,
} from './types.js';
import {
  PollAlreadyCancelledError,
  PollAlreadyUnpublishedError,
  PollForbiddenError,
  PollLifecycleConflictError,
  PollLockedPeriodConflictError,
  PollNotFoundError,
  PollValidationError,
} from './errors.js';
import {
  isParticipationAllowed,
  isPublicHiddenPoll,
  participationRejectionMessage,
} from './public-visibility.js';
import {
  INVALID_OFFICIAL_VOTE_OPTION_MESSAGE,
  OFFICIAL_VOTE_ELIGIBILITY_MESSAGE,
} from './official-vote-messages.js';
import { isProfileEligibleForOfficialVote } from './profile-eligibility.js';
import { isOfficialVoteUser } from './trust.js';

export type PollRepository = {
  ensureUser(userId: string, displayName: string): Promise<UserRow>;
  createRegisteredUser(input: {
    userId: string;
    displayName: string;
    birthYearMonth: Date;
    residentialRegion: string;
  }): Promise<UserRow | null>;
  findUserById(userId: string): Promise<UserRow | null>;
  updateUserProfile(userId: string, input: UpdateUserProfileInput): Promise<UserRow | null>;
  createPollWithOptions(input: CreatePollInput): Promise<PollRow>;
  findPollById(pollId: string): Promise<PollRow | null>;
  listOptionsByPollId(pollId: string): Promise<PollOptionRow[]>;
  listVoteAggregatesByPollId(pollId: string): Promise<PollOptionVoteAggregateRow[]>;
  listPublicFeedPolls(params: ListPublicFeedPollsParams): Promise<PublicFeedPollRow[]>;
  listCreatorOwnedPolls(creatorId: string, limit: number): Promise<CreatorOwnedPollRow[]>;
  listPublicLifecycleSchedulerCandidateIds(limit: number): Promise<string[]>;
  optionBelongsToPoll(pollId: string, optionId: string): Promise<boolean>;
  softDeletePoll(pollId: string, creatorId: string): Promise<PollRow | null>;
  cancelPoll(pollId: string, creatorId: string): Promise<PollRow>;
  revealPoll(pollId: string, creatorId?: string): Promise<PollRow>;
  advancePublicLifecycle(pollId: string): Promise<PollRow>;
  unpublishPoll(pollId: string, creatorId: string): Promise<PollRow>;
  createReferenceAnswerToken(
    userId: string,
    pollId: string,
    answeredAt: Date,
    expiresAt: Date,
  ): Promise<PollReferenceAnswerTokenRow>;
  castOfficialVote(
    userId: string,
    pollId: string,
    optionId: string,
    votedAtMinute: Date,
    selectShardId: () => number,
  ): Promise<PollVoteTokenRow>;
  castOfficialVoteByIndex(
    userId: string,
    pollId: string,
    optionIndex: number,
    votedAtMinute: Date,
    selectShardId: () => number,
  ): Promise<PollVoteTokenRow>;
};

export function createPgPollRepository(pool: Pool): PollRepository {
  return {
    ensureUser: (userId, displayName) => ensureUser(pool, userId, displayName),
    createRegisteredUser: (input) => createRegisteredUser(pool, input),
    findUserById: (userId) => findUserById(pool, userId),
    updateUserProfile: (userId, input) => updateUserProfile(pool, userId, input),
    createPollWithOptions: (input) => createPollWithOptions(pool, input),
    findPollById: (pollId) => findPollById(pool, pollId),
    listOptionsByPollId: (pollId) => listOptionsByPollId(pool, pollId),
    listVoteAggregatesByPollId: (pollId) => listVoteAggregatesByPollId(pool, pollId),
    listPublicFeedPolls: (params) => listPublicFeedPolls(pool, params),
    listCreatorOwnedPolls: (creatorId, limit) => listCreatorOwnedPolls(pool, creatorId, limit),
    listPublicLifecycleSchedulerCandidateIds: (limit) =>
      listPublicLifecycleSchedulerCandidateIds(pool, limit),
    optionBelongsToPoll: (pollId, optionId) => optionBelongsToPoll(pool, pollId, optionId),
    softDeletePoll: (pollId, creatorId) => softDeletePoll(pool, pollId, creatorId),
    cancelPoll: (pollId, creatorId) => cancelPoll(pool, pollId, creatorId),
    revealPoll: (pollId, creatorId) => revealPoll(pool, pollId, creatorId),
    advancePublicLifecycle: (pollId) => advancePublicLifecycle(pool, pollId),
    unpublishPoll: (pollId, creatorId) => unpublishPoll(pool, pollId, creatorId),
    createReferenceAnswerToken: (userId, pollId, answeredAt, expiresAt) =>
      createReferenceAnswerToken(pool, userId, pollId, answeredAt, expiresAt),
    castOfficialVote: (userId, pollId, optionId, votedAtMinute, selectShardId) =>
      castOfficialVote(
        pool,
        userId,
        pollId,
        { optionId },
        votedAtMinute,
        selectShardId,
      ),
    castOfficialVoteByIndex: (userId, pollId, optionIndex, votedAtMinute, selectShardId) =>
      castOfficialVote(
        pool,
        userId,
        pollId,
        { optionIndex },
        votedAtMinute,
        selectShardId,
      ),
  };
}

type OfficialVoteOptionSelector =
  | { optionId: string }
  | { optionIndex: number };

async function castOfficialVote(
  pool: Pool,
  userId: string,
  pollId: string,
  optionSelector: OfficialVoteOptionSelector,
  votedAtMinute: Date,
  selectShardId: () => number,
): Promise<PollVoteTokenRow> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const user = await findUserByIdWithClient(client, userId);
    if (!user || user.status !== 'active' || !isOfficialVoteUser(user)) {
      throw new PollForbiddenError(OFFICIAL_VOTE_ELIGIBILITY_MESSAGE);
    }
    const poll = await findPollByIdWithClient(client, pollId, true);
    if (isPublicHiddenPoll(poll)) {
      throw new PollNotFoundError();
    }
    if (!poll || !isParticipationAllowed(poll)) {
      if (!poll) {
        throw new PollNotFoundError();
      }
      throw new PollValidationError(participationRejectionMessage(poll));
    }
    const eligibilityRule = await findPollEligibilityRuleWithClient(client, poll.id);
    if (!isProfileEligibleForOfficialVote(user, eligibilityRule)) {
      throw new PollForbiddenError(OFFICIAL_VOTE_ELIGIBILITY_MESSAGE);
    }
    const optionId = await resolveOfficialVoteOptionIdWithClient(
      client,
      pollId,
      optionSelector,
    );
    if (!optionId) {
      throw new PollValidationError(INVALID_OFFICIAL_VOTE_OPTION_MESSAGE);
    }
    const token = await insertVoteToken(
      client,
      userId,
      pollId,
      votedAtMinute,
      poll.closes_at,
    );
    const shardId = selectShardId();
    await incrementVoteCounter(client, pollId, optionId, shardId);
    await client.query('COMMIT');
    return token;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function resolveOfficialVoteOptionIdWithClient(
  client: PoolClient,
  pollId: string,
  selector: OfficialVoteOptionSelector,
): Promise<string | null> {
  if ('optionId' in selector) {
    return (await optionBelongsToPollWithClient(client, pollId, selector.optionId))
      ? selector.optionId
      : null;
  }
  if (!Number.isInteger(selector.optionIndex) || selector.optionIndex < 0) {
    return null;
  }
  const result = await client.query<{ id: string }>(
    `SELECT id
     FROM poll_options
     WHERE poll_id = $1 AND option_order = $2`,
    [pollId, selector.optionIndex],
  );
  return result.rows[0]?.id ?? null;
}

async function findUserByIdWithClient(
  client: PoolClient,
  userId: string,
): Promise<UserRow | null> {
  const result = await client.query<UserRow>(
    `SELECT
       id, display_name, trust_level, status,
       birth_year_month, residential_region,
       created_at, updated_at
     FROM users WHERE id = $1`,
    [userId],
  );
  return result.rows[0] ?? null;
}

async function findPollEligibilityRuleWithClient(
  client: PoolClient,
  pollId: string,
): Promise<PollEligibilityRuleRow | null> {
  const result = await client.query<PollEligibilityRuleRow>(
    `SELECT
       poll_id, rule_type, min_birth_year_month, max_birth_year_month,
       allowed_regions, created_at, updated_at
     FROM poll_eligibility_rules
     WHERE poll_id = $1`,
    [pollId],
  );
  return result.rows[0] ?? null;
}

async function findPollByIdWithClient(
  client: PoolClient,
  pollId: string,
  forUpdate = false,
): Promise<PollRow | null> {
  const result = await client.query<PollRow>(
    `SELECT
       id, creator_id, title, description, category, status,
       public_lifecycle_state, eligible_rule_id, published_at, archived_at, closes_at,
       revealed_at, public_lock_ends_at, cancelled_at, unpublished_at, deleted_at,
       created_at, updated_at
     FROM polls
     WHERE id = $1
     ${forUpdate ? 'FOR UPDATE' : ''}`,
    [pollId],
  );
  return result.rows[0] ?? null;
}

async function optionBelongsToPollWithClient(
  client: PoolClient,
  pollId: string,
  optionId: string,
): Promise<boolean> {
  const result = await client.query(
    `SELECT 1
     FROM poll_options
     WHERE poll_id = $1 AND id = $2`,
    [pollId, optionId],
  );
  return result.rows.length > 0;
}

async function insertVoteToken(
  client: PoolClient,
  userId: string,
  pollId: string,
  votedAtMinute: Date,
  closesAt: Date,
): Promise<PollVoteTokenRow> {
  const expiresAt = new Date(closesAt.getTime() + 180 * 24 * 60 * 60 * 1000);
  const result = await client.query<PollVoteTokenRow>(
    `INSERT INTO poll_vote_tokens (
       user_id, poll_id, voted_at_minute, expires_at
     )
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, poll_id, voted_at_minute, expires_at, created_at`,
    [userId, pollId, votedAtMinute, expiresAt],
  );
  return result.rows[0]!;
}

async function incrementVoteCounter(
  client: PoolClient,
  pollId: string,
  optionId: string,
  shardId: number,
): Promise<PollOptionVoteCounterRow> {
  const result = await client.query<PollOptionVoteCounterRow>(
    `INSERT INTO poll_option_vote_counters (
       poll_id, option_id, shard_id, vote_count
     )
     VALUES ($1, $2, $3, 1)
     ON CONFLICT (poll_id, option_id, shard_id)
     DO UPDATE SET vote_count = poll_option_vote_counters.vote_count + 1
     RETURNING poll_id, option_id, shard_id, vote_count`,
    [pollId, optionId, shardId],
  );
  return result.rows[0]!;
}

async function findUserById(pool: Pool, userId: string): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(
    `SELECT
       id, display_name, trust_level, status,
       birth_year_month, residential_region,
       created_at, updated_at
     FROM users WHERE id = $1`,
    [userId],
  );
  return result.rows[0] ?? null;
}

async function updateUserProfile(
  pool: Pool,
  userId: string,
  input: UpdateUserProfileInput,
): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(
    `UPDATE users
     SET birth_year_month = $2,
         residential_region = $3,
         updated_at = now()
     WHERE id = $1
     RETURNING
       id, display_name, trust_level, status,
       birth_year_month, residential_region,
       created_at, updated_at`,
    [userId, input.birth_year_month, input.residential_region],
  );
  return result.rows[0] ?? null;
}

async function ensureUser(
  pool: Pool,
  userId: string,
  displayName: string,
): Promise<UserRow> {
  const existing = await pool.query<UserRow>(
    `SELECT
       id, display_name, trust_level, status,
       birth_year_month, residential_region,
       created_at, updated_at
     FROM users WHERE id = $1`,
    [userId],
  );
  if (existing.rows[0]) {
    return existing.rows[0];
  }
  const inserted = await pool.query<UserRow>(
    `INSERT INTO users (id, display_name)
     VALUES ($1, $2)
      RETURNING
        id, display_name, trust_level, status,
        birth_year_month, residential_region,
        created_at, updated_at`,
    [userId, displayName],
  );
  return inserted.rows[0]!;
}

async function createRegisteredUser(
  pool: Pool,
  input: {
    userId: string;
    displayName: string;
    birthYearMonth: Date;
    residentialRegion: string;
  },
): Promise<UserRow | null> {
  const inserted = await pool.query<UserRow>(
    `INSERT INTO users (
       id,
       display_name,
       birth_year_month,
       residential_region
     )
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO NOTHING
     RETURNING
       id, display_name, trust_level, status,
       birth_year_month, residential_region,
       created_at, updated_at`,
    [
      input.userId,
      input.displayName,
      input.birthYearMonth,
      input.residentialRegion,
    ],
  );
  return inserted.rows[0] ?? null;
}

async function createPollWithOptions(
  pool: Pool,
  input: CreatePollInput,
): Promise<PollRow> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const poll = await insertPoll(client, input);
    await insertOptions(client, poll.id, input.options);
    await client.query('COMMIT');
    return poll;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function insertPoll(
  client: PoolClient,
  input: CreatePollInput,
): Promise<PollRow> {
  const status: PollStatus = input.publish ? 'active' : 'draft';
  const publishedAt = input.publish ? new Date() : null;
  const result = await client.query<PollRow>(
    `INSERT INTO polls (
       creator_id, title, description, category, status,
       eligible_rule_id, published_at, closes_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING
       id, creator_id, title, description, category, status,
       public_lifecycle_state, eligible_rule_id, published_at, archived_at, closes_at,
       revealed_at, public_lock_ends_at, cancelled_at, unpublished_at, deleted_at,
       created_at, updated_at`,
    [
      input.creatorId,
      input.title.trim(),
      input.description.trim(),
      input.category.trim(),
      status,
      input.eligibleRuleId,
      publishedAt,
      input.closesAt,
    ],
  );
  return result.rows[0]!;
}

async function insertOptions(
  client: PoolClient,
  pollId: string,
  options: string[],
): Promise<void> {
  for (let index = 0; index < options.length; index += 1) {
    await client.query(
      `INSERT INTO poll_options (poll_id, option_order, option_text)
       VALUES ($1, $2, $3)`,
      [pollId, index, options[index]!.trim()],
    );
  }
}

async function findPollById(pool: Pool, pollId: string): Promise<PollRow | null> {
  const result = await pool.query<PollRow>(
    `SELECT
       id, creator_id, title, description, category, status,
       public_lifecycle_state, eligible_rule_id, published_at, archived_at, closes_at,
       revealed_at, public_lock_ends_at, cancelled_at, unpublished_at, deleted_at,
       created_at, updated_at
     FROM polls
     WHERE id = $1`,
    [pollId],
  );
  return result.rows[0] ?? null;
}

async function listOptionsByPollId(
  pool: Pool,
  pollId: string,
): Promise<PollOptionRow[]> {
  const result = await pool.query<PollOptionRow>(
    `SELECT id, poll_id, option_order, option_text, created_at, updated_at
     FROM poll_options
     WHERE poll_id = $1
     ORDER BY option_order ASC`,
    [pollId],
  );
  return result.rows;
}

async function listVoteAggregatesByPollId(
  pool: Pool,
  pollId: string,
): Promise<PollOptionVoteAggregateRow[]> {
  const result = await pool.query<PollOptionVoteAggregateRow>(
    `SELECT
       options.id AS option_id,
       options.option_order,
       options.option_text,
       COALESCE(SUM(counters.vote_count), 0)::text AS vote_count
     FROM poll_options AS options
     LEFT JOIN poll_option_vote_counters AS counters
       ON counters.poll_id = options.poll_id
      AND counters.option_id = options.id
     WHERE options.poll_id = $1
     GROUP BY options.id, options.option_order, options.option_text
     ORDER BY options.option_order ASC`,
    [pollId],
  );
  return result.rows;
}

async function listPublicFeedPolls(
  pool: Pool,
  params: ListPublicFeedPollsParams,
): Promise<PublicFeedPollRow[]> {
  const feedOpenAt = new Date();
  const conditions = [
    "status = 'active'",
    "public_lifecycle_state = 'collecting'",
    'published_at IS NOT NULL',
    'archived_at IS NULL',
    'closes_at > $1',
  ];
  const values: unknown[] = [feedOpenAt];

  if (params.cursor) {
    values.push(params.cursor.publishedAt, params.cursor.pollId);
    conditions.push(
      `(published_at < $${values.length - 1} OR (published_at = $${values.length - 1} AND id > $${values.length}))`,
    );
  }

  values.push(params.limit + 1);
  const result = await pool.query<PublicFeedPollRow>(
    `SELECT id, title, category, status, published_at
     FROM polls
     WHERE ${conditions.join(' AND ')}
     ORDER BY published_at DESC, id ASC
     LIMIT $${values.length}`,
    values,
  );
  return result.rows;
}

async function listCreatorOwnedPolls(
  pool: Pool,
  creatorId: string,
  limit: number,
): Promise<CreatorOwnedPollRow[]> {
  const result = await pool.query<CreatorOwnedPollRow>(
    `SELECT
       id, title, category, public_lifecycle_state, closes_at,
       revealed_at, public_lock_ends_at, cancelled_at, unpublished_at, created_at
     FROM polls
     WHERE creator_id = $1
       AND status NOT IN ('deleted', 'suspended', 'correction_pending')
       AND archived_at IS NULL
     ORDER BY created_at DESC, id ASC
     LIMIT $2`,
    [creatorId, limit],
  );
  return result.rows;
}

async function listPublicLifecycleSchedulerCandidateIds(
  pool: Pool,
  limit: number,
): Promise<string[]> {
  const result = await pool.query<{ id: string }>(
    `SELECT id
     FROM polls
     WHERE status IN ('active', 'closed')
       AND (
         (
           public_lifecycle_state = 'revealed'
           AND (
             revealed_at IS NULL
             OR public_lock_ends_at IS NULL
             OR revealed_at <= NOW()
           )
         )
         OR (
           public_lifecycle_state = 'locked'
           AND (
             revealed_at IS NULL
             OR public_lock_ends_at IS NULL
             OR public_lock_ends_at <= NOW()
           )
         )
       )
     ORDER BY id ASC
     LIMIT $1`,
    [limit],
  );
  return result.rows.map((row) => row.id);
}

async function softDeletePoll(
  pool: Pool,
  pollId: string,
  creatorId: string,
): Promise<PollRow | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const poll = await findPollByIdWithClient(client, pollId, true);
    if (!poll || poll.creator_id !== creatorId || poll.status === 'deleted') {
      await client.query('COMMIT');
      return null;
    }
    assertCreatorDeleteAllowed(poll);
    const result = await client.query<PollRow>(
      `UPDATE polls
       SET status = 'deleted', deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING
         id, creator_id, title, description, category, status,
         public_lifecycle_state, eligible_rule_id, published_at, archived_at, closes_at,
         revealed_at, public_lock_ends_at, cancelled_at, unpublished_at, deleted_at,
         created_at, updated_at`,
      [pollId],
    );
    await client.query('COMMIT');
    return result.rows[0] ?? null;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function cancelPoll(
  pool: Pool,
  pollId: string,
  creatorId: string,
): Promise<PollRow> {
  return withLockedPoll(pool, pollId, async (client, poll) => {
    assertCreatorTransitionPoll(poll, creatorId);
    if (poll.public_lifecycle_state === 'cancelled') {
      throw new PollAlreadyCancelledError();
    }
    assertLifecycleState(poll, 'collecting');
    await client.query(
      `UPDATE polls
       SET public_lifecycle_state = 'cancelled',
           cancelled_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [pollId],
    );
    return requirePollByIdWithClient(client, pollId);
  });
}

async function revealPoll(
  pool: Pool,
  pollId: string,
  creatorId?: string,
): Promise<PollRow> {
  return withLockedPoll(pool, pollId, async (client, poll) => {
    assertTransitionPoll(poll);
    if (creatorId !== undefined) {
      assertCreator(poll, creatorId);
    }
    assertLifecycleState(poll, 'collecting');
    const now = await getTransactionNow(client);
    if (poll.closes_at.getTime() > now.getTime()) {
      throw new PollValidationError('Poll cannot be revealed before closes_at');
    }
    await client.query(
      `UPDATE polls
       SET public_lifecycle_state = 'revealed',
           revealed_at = NOW(),
           public_lock_ends_at = NOW() + INTERVAL '5 days',
           updated_at = NOW()
       WHERE id = $1`,
      [pollId],
    );
    return requirePollByIdWithClient(client, pollId);
  });
}

async function advancePublicLifecycle(
  pool: Pool,
  pollId: string,
): Promise<PollRow> {
  return withLockedPoll(pool, pollId, async (client, poll) => {
    assertTransitionPoll(poll);
    let publicLifecycleState: PublicLifecycleState;
    if (poll.public_lifecycle_state === 'revealed') {
      assertLifecycleTimestampsPresent(poll);
      const now = await getTransactionNow(client);
      if (poll.revealed_at.getTime() > now.getTime()) {
        throw new PollLifecycleConflictError('Poll revealed_at has not been reached');
      }
      publicLifecycleState = 'locked';
    } else if (poll.public_lifecycle_state === 'locked') {
      assertLifecycleTimestampsPresent(poll);
      const now = await getTransactionNow(client);
      if (poll.public_lock_ends_at.getTime() > now.getTime()) {
        throw new PollLockedPeriodConflictError();
      }
      publicLifecycleState = 'post_lock';
    } else {
      throw new PollLifecycleConflictError();
    }
    await client.query(
      `UPDATE polls
       SET public_lifecycle_state = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [pollId, publicLifecycleState],
    );
    return requirePollByIdWithClient(client, pollId);
  });
}

async function unpublishPoll(
  pool: Pool,
  pollId: string,
  creatorId: string,
): Promise<PollRow> {
  return withLockedPoll(pool, pollId, async (client, poll) => {
    assertCreatorTransitionPoll(poll, creatorId);
    if (poll.public_lifecycle_state === 'unpublished') {
      throw new PollAlreadyUnpublishedError();
    }
    assertLifecycleState(poll, 'post_lock');
    const now = await getTransactionNow(client);
    if (
      poll.public_lock_ends_at === null ||
      poll.public_lock_ends_at.getTime() > now.getTime()
    ) {
      throw new PollLockedPeriodConflictError();
    }
    await client.query(
      `UPDATE polls
       SET public_lifecycle_state = 'unpublished',
           unpublished_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [pollId],
    );
    return requirePollByIdWithClient(client, pollId);
  });
}

async function withLockedPoll(
  pool: Pool,
  pollId: string,
  transition: (client: PoolClient, poll: PollRow) => Promise<PollRow>,
): Promise<PollRow> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const poll = await findPollByIdWithClient(client, pollId, true);
    const transitioned = await transition(client, poll ?? missingPoll());
    await client.query('COMMIT');
    return transitioned;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

function missingPoll(): never {
  throw new PollNotFoundError();
}

function assertTransitionPoll(poll: PollRow): void {
  if (isPublicHiddenPoll(poll)) {
    throw new PollNotFoundError();
  }
}

function assertCreatorTransitionPoll(poll: PollRow, creatorId: string): void {
  assertTransitionPoll(poll);
  assertCreator(poll, creatorId);
}

function assertCreator(poll: PollRow, creatorId: string): void {
  if (poll.creator_id !== creatorId) {
    throw new PollForbiddenError('Only the creator may change poll lifecycle');
  }
}

function assertLifecycleState(
  poll: PollRow,
  expected: PublicLifecycleState,
): void {
  if (poll.public_lifecycle_state !== expected) {
    throw new PollLifecycleConflictError();
  }
}

function assertCreatorDeleteAllowed(poll: PollRow): void {
  if (
    poll.public_lifecycle_state === 'revealed' ||
    poll.public_lifecycle_state === 'locked' ||
    poll.public_lifecycle_state === 'post_lock'
  ) {
    throw new PollLifecycleConflictError(
      'Creator delete is not allowed after aggregate results are public',
    );
  }
}

function assertLifecycleTimestampsPresent(
  poll: PollRow,
): asserts poll is PollRow & {
  revealed_at: Date;
  public_lock_ends_at: Date;
} {
  if (poll.revealed_at === null || poll.public_lock_ends_at === null) {
    throw new PollLifecycleConflictError('Poll lifecycle timestamps are incomplete');
  }
}

async function getTransactionNow(client: PoolClient): Promise<Date> {
  const result = await client.query<{ now: Date }>(`SELECT NOW() AS now`);
  return result.rows[0]!.now;
}

async function requirePollByIdWithClient(
  client: PoolClient,
  pollId: string,
): Promise<PollRow> {
  return (await findPollByIdWithClient(client, pollId)) ?? missingPoll();
}

async function optionBelongsToPoll(
  pool: Pool,
  pollId: string,
  optionId: string,
): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1
     FROM poll_options
     WHERE poll_id = $1 AND id = $2`,
    [pollId, optionId],
  );
  return result.rows.length > 0;
}

async function createReferenceAnswerToken(
  pool: Pool,
  userId: string,
  pollId: string,
  answeredAt: Date,
  _expiresAt: Date,
): Promise<PollReferenceAnswerTokenRow> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const poll = await findPollByIdWithClient(client, pollId, true);
    if (isPublicHiddenPoll(poll)) {
      throw new PollNotFoundError();
    }
    if (!poll || !isParticipationAllowed(poll)) {
      if (!poll) {
        throw new PollNotFoundError();
      }
      throw new PollValidationError(participationRejectionMessage(poll));
    }
    const result = await client.query<PollReferenceAnswerTokenRow>(
      `INSERT INTO poll_reference_answer_tokens (
         user_id, poll_id, answered_at, expires_at
       )
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, poll_id, answered_at, expires_at, created_at`,
      [userId, pollId, answeredAt, poll.closes_at],
    );
    await client.query('COMMIT');
    return result.rows[0]!;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
