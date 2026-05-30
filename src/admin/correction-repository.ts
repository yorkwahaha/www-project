import type { Pool } from 'pg';
import type {
  AdminUserRow,
  CorrectionRequestRow,
  CorrectionTargetField,
  InsertCorrectionRequestRow,
  PollRowForCorrection,
} from './types.js';

export type CorrectionRepository = {
  findActiveAdminByUserId(userId: string): Promise<AdminUserRow | null>;
  findPollByIdForCorrection(pollId: string): Promise<PollRowForCorrection | null>;
  findOptionTextForPoll(pollId: string, optionId: string): Promise<string | null>;
  findPendingCorrectionRequest(params: {
    pollId: string;
    correctionTargetField: CorrectionTargetField;
    correctionTargetId: string | null;
  }): Promise<CorrectionRequestRow | null>;
  insertCorrectionRequest(row: InsertCorrectionRequestRow): Promise<CorrectionRequestRow>;
};

export function createPgCorrectionRepository(pool: Pool): CorrectionRepository {
  return {
    findActiveAdminByUserId: (userId) => findActiveAdminByUserId(pool, userId),
    findPollByIdForCorrection: (pollId) => findPollByIdForCorrection(pool, pollId),
    findOptionTextForPoll: (pollId, optionId) => findOptionTextForPoll(pool, pollId, optionId),
    findPendingCorrectionRequest: (params) => findPendingCorrectionRequest(pool, params),
    insertCorrectionRequest: (row) => insertCorrectionRequest(pool, row),
  };
}

async function findActiveAdminByUserId(
  pool: Pool,
  userId: string,
): Promise<AdminUserRow | null> {
  const result = await pool.query<AdminUserRow>(
    `SELECT user_id, role, status, created_at, revoked_at
     FROM admin_users
     WHERE user_id = $1 AND status = 'active'`,
    [userId],
  );
  return result.rows[0] ?? null;
}

async function findPollByIdForCorrection(
  pool: Pool,
  pollId: string,
): Promise<PollRowForCorrection | null> {
  const result = await pool.query<PollRowForCorrection>(
    `SELECT id, title, description, status
     FROM polls
     WHERE id = $1`,
    [pollId],
  );
  return result.rows[0] ?? null;
}

async function findOptionTextForPoll(
  pool: Pool,
  pollId: string,
  optionId: string,
): Promise<string | null> {
  const result = await pool.query<{ option_text: string }>(
    `SELECT option_text
     FROM poll_options
     WHERE poll_id = $1 AND id = $2`,
    [pollId, optionId],
  );
  return result.rows[0]?.option_text ?? null;
}

async function findPendingCorrectionRequest(
  pool: Pool,
  params: {
    pollId: string;
    correctionTargetField: CorrectionTargetField;
    correctionTargetId: string | null;
  },
): Promise<CorrectionRequestRow | null> {
  const result = await pool.query<CorrectionRequestRow>(
    `SELECT
       id, poll_id, requester_admin_id, correction_target_field, correction_target_id,
       original_text, proposed_text, reason, status, requires_dual_admin,
       spread_score_at_submit, spread_score_locked_until, valid_until,
       submitted_at, created_at, updated_at
     FROM poll_correction_requests
     WHERE poll_id = $1
       AND correction_target_field = $2
       AND status = 'pending'
       AND correction_target_id IS NOT DISTINCT FROM $3
     LIMIT 1`,
    [params.pollId, params.correctionTargetField, params.correctionTargetId],
  );
  return result.rows[0] ?? null;
}

async function insertCorrectionRequest(
  pool: Pool,
  row: InsertCorrectionRequestRow,
): Promise<CorrectionRequestRow> {
  const result = await pool.query<CorrectionRequestRow>(
    `INSERT INTO poll_correction_requests (
       poll_id,
       requester_admin_id,
       correction_target_field,
       correction_target_id,
       original_text,
       proposed_text,
       reason,
       status,
       requires_dual_admin,
       spread_score_at_submit,
       spread_score_locked_until,
       valid_until,
       submitted_at,
       created_at,
       updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13, $13)
     RETURNING
       id, poll_id, requester_admin_id, correction_target_field, correction_target_id,
       original_text, proposed_text, reason, status, requires_dual_admin,
       spread_score_at_submit, spread_score_locked_until, valid_until,
       submitted_at, created_at, updated_at`,
    [
      row.poll_id,
      row.requester_admin_id,
      row.correction_target_field,
      row.correction_target_id,
      row.original_text,
      row.proposed_text,
      row.reason,
      row.status,
      row.requires_dual_admin,
      row.spread_score_at_submit,
      row.spread_score_locked_until,
      row.valid_until,
      row.submitted_at,
    ],
  );
  return result.rows[0]!;
}
