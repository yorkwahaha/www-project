import type { Pool, PoolClient } from 'pg';
import type {
  CreatePollInput,
  PollOptionRow,
  PollRow,
  PollStatus,
  UserRow,
} from './types.js';

export type PollRepository = {
  ensureUser(userId: string, displayName: string): Promise<UserRow>;
  createPollWithOptions(input: CreatePollInput): Promise<PollRow>;
  findPollById(pollId: string): Promise<PollRow | null>;
  listOptionsByPollId(pollId: string): Promise<PollOptionRow[]>;
  softDeletePoll(pollId: string, creatorId: string): Promise<PollRow | null>;
};

export function createPgPollRepository(pool: Pool): PollRepository {
  return {
    ensureUser: (userId, displayName) => ensureUser(pool, userId, displayName),
    createPollWithOptions: (input) => createPollWithOptions(pool, input),
    findPollById: (pollId) => findPollById(pool, pollId),
    listOptionsByPollId: (pollId) => listOptionsByPollId(pool, pollId),
    softDeletePoll: (pollId, creatorId) => softDeletePoll(pool, pollId, creatorId),
  };
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
