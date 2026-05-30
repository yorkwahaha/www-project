import type { Pool, PoolClient } from 'pg';
import type {
  CreatePollInput,
  PollOptionRow,
  PollOptionVoteAggregateRow,
  PollOptionVoteCounterRow,
  PollReferenceAnswerTokenRow,
  PollRow,
  PollStatus,
  PollVoteTokenRow,
  UserRow,
} from './types.js';
import { PollForbiddenError, PollNotFoundError, PollValidationError } from './errors.js';
import {
  INVALID_OFFICIAL_VOTE_OPTION_MESSAGE,
  OFFICIAL_VOTE_ELIGIBILITY_MESSAGE,
} from './official-vote-messages.js';
import { isOfficialVoteUser } from './trust.js';

export type PollRepository = {
  ensureUser(userId: string, displayName: string): Promise<UserRow>;
  findUserById(userId: string): Promise<UserRow | null>;
  createPollWithOptions(input: CreatePollInput): Promise<PollRow>;
  findPollById(pollId: string): Promise<PollRow | null>;
  listOptionsByPollId(pollId: string): Promise<PollOptionRow[]>;
  listVoteAggregatesByPollId(pollId: string): Promise<PollOptionVoteAggregateRow[]>;
  optionBelongsToPoll(pollId: string, optionId: string): Promise<boolean>;
  softDeletePoll(pollId: string, creatorId: string): Promise<PollRow | null>;
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
};

export function createPgPollRepository(pool: Pool): PollRepository {
  return {
    ensureUser: (userId, displayName) => ensureUser(pool, userId, displayName),
    findUserById: (userId) => findUserById(pool, userId),
    createPollWithOptions: (input) => createPollWithOptions(pool, input),
    findPollById: (pollId) => findPollById(pool, pollId),
    listOptionsByPollId: (pollId) => listOptionsByPollId(pool, pollId),
    listVoteAggregatesByPollId: (pollId) => listVoteAggregatesByPollId(pool, pollId),
    optionBelongsToPoll: (pollId, optionId) => optionBelongsToPoll(pool, pollId, optionId),
    softDeletePoll: (pollId, creatorId) => softDeletePoll(pool, pollId, creatorId),
    createReferenceAnswerToken: (userId, pollId, answeredAt, expiresAt) =>
      createReferenceAnswerToken(pool, userId, pollId, answeredAt, expiresAt),
    castOfficialVote: (userId, pollId, optionId, votedAtMinute, selectShardId) =>
      castOfficialVote(pool, userId, pollId, optionId, votedAtMinute, selectShardId),
  };
}

async function castOfficialVote(
  pool: Pool,
  userId: string,
  pollId: string,
  optionId: string,
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
    const poll = await findPollByIdWithClient(client, pollId);
    if (!poll || poll.status === 'deleted') {
      throw new PollNotFoundError();
    }
    if (poll.status !== 'active') {
      throw new PollValidationError('Official Vote requires an active poll');
    }
    if (!(await optionBelongsToPollWithClient(client, pollId, optionId))) {
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

async function findUserByIdWithClient(
  client: PoolClient,
  userId: string,
): Promise<UserRow | null> {
  const result = await client.query<UserRow>(
    `SELECT id, display_name, trust_level, status, created_at, updated_at
     FROM users WHERE id = $1`,
    [userId],
  );
  return result.rows[0] ?? null;
}

async function findPollByIdWithClient(
  client: PoolClient,
  pollId: string,
): Promise<PollRow | null> {
  const result = await client.query<PollRow>(
    `SELECT
       id, creator_id, title, description, category, status,
       eligible_rule_id, published_at, closes_at, deleted_at,
       created_at, updated_at
     FROM polls
     WHERE id = $1`,
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
  const result = await client.query<PollVoteTokenRow>(
    `INSERT INTO poll_vote_tokens (
       user_id, poll_id, voted_at_minute, expires_at
     )
     VALUES ($1, $2, $3, $4 + INTERVAL '180 days')
     RETURNING id, user_id, poll_id, voted_at_minute, expires_at, created_at`,
    [userId, pollId, votedAtMinute, closesAt],
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
    `SELECT id, display_name, trust_level, status, created_at, updated_at
     FROM users WHERE id = $1`,
    [userId],
  );
  return result.rows[0] ?? null;
}

async function ensureUser(
  pool: Pool,
  userId: string,
  displayName: string,
): Promise<UserRow> {
  const existing = await pool.query<UserRow>(
    `SELECT id, display_name, trust_level, status, created_at, updated_at
     FROM users WHERE id = $1`,
    [userId],
  );
  if (existing.rows[0]) {
    return existing.rows[0];
  }
  const inserted = await pool.query<UserRow>(
    `INSERT INTO users (id, display_name)
     VALUES ($1, $2)
     RETURNING id, display_name, trust_level, status, created_at, updated_at`,
    [userId, displayName],
  );
  return inserted.rows[0]!;
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
       eligible_rule_id, published_at, closes_at, deleted_at,
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
       eligible_rule_id, published_at, closes_at, deleted_at,
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

async function softDeletePoll(
  pool: Pool,
  pollId: string,
  creatorId: string,
): Promise<PollRow | null> {
  const result = await pool.query<PollRow>(
    `UPDATE polls
     SET status = 'deleted', deleted_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND creator_id = $2 AND status <> 'deleted'
     RETURNING
       id, creator_id, title, description, category, status,
       eligible_rule_id, published_at, closes_at, deleted_at,
       created_at, updated_at`,
    [pollId, creatorId],
  );
  return result.rows[0] ?? null;
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
  expiresAt: Date,
): Promise<PollReferenceAnswerTokenRow> {
  const result = await pool.query<PollReferenceAnswerTokenRow>(
    `INSERT INTO poll_reference_answer_tokens (
       user_id, poll_id, answered_at, expires_at
     )
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, poll_id, answered_at, expires_at, created_at`,
    [userId, pollId, answeredAt, expiresAt],
  );
  return result.rows[0]!;
}
