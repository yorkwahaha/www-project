import type { Pool, PoolClient } from 'pg';
import {
  CorrectionDecisionAlreadySubmittedError,
  CorrectionExpiredError,
  CorrectionRequestNotFoundError,
  CorrectionRequestNotPendingError,
  ProposerCannotApproveError,
} from './errors.js';
import type {
  AdminDecisionRow,
  AdminDecisionValue,
  AdminUserRow,
  CorrectionRequestRow,
  PollRowForCorrection,
} from './types.js';
import { POLL_CORRECTION_REQUEST_TARGET_TYPE } from './types.js';

export type SubmitCorrectionDecisionParams = {
  requestId: string;
  adminId: string;
  decision: AdminDecisionValue;
  reason_code: string;
  reason_text: string;
  submittedAt: Date;
};

export type SubmitCorrectionDecisionOutcome = {
  decision: AdminDecisionRow;
  request: CorrectionRequestRow;
};

export type CorrectionDecisionRepository = {
  findActiveAdminByUserId(userId: string): Promise<AdminUserRow | null>;
  findCorrectionRequestById(requestId: string): Promise<CorrectionRequestRow | null>;
  findPollByIdForCorrection(pollId: string): Promise<PollRowForCorrection | null>;
  findAdminDecisionForRequest(
    requestId: string,
    adminId: string,
  ): Promise<AdminDecisionRow | null>;
  listAdminDecisionsForRequest(requestId: string): Promise<AdminDecisionRow[]>;
  submitCorrectionDecisionAtomic(
    params: SubmitCorrectionDecisionParams,
  ): Promise<SubmitCorrectionDecisionOutcome>;
};

export function createPgCorrectionDecisionRepository(pool: Pool): CorrectionDecisionRepository {
  return {
    findActiveAdminByUserId: (userId) => findActiveAdminByUserId(pool, userId),
    findCorrectionRequestById: (requestId) => findCorrectionRequestById(pool, requestId),
    findPollByIdForCorrection: (pollId) => findPollByIdForCorrection(pool, pollId),
    findAdminDecisionForRequest: (requestId, adminId) =>
      findAdminDecisionForRequest(pool, requestId, adminId),
    listAdminDecisionsForRequest: (requestId) =>
      listAdminDecisionsForRequest(pool, requestId),
    submitCorrectionDecisionAtomic: (params) =>
      submitCorrectionDecisionAtomic(pool, params),
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

const CORRECTION_REQUEST_SELECT = `SELECT
  id, poll_id, requester_admin_id, correction_target_field, correction_target_id,
  original_text, proposed_text, reason, status, requires_dual_admin,
  spread_score_at_submit, spread_score_locked_until, valid_until,
  submitted_at, created_at, updated_at
FROM poll_correction_requests`;

async function findCorrectionRequestById(
  pool: Pool,
  requestId: string,
): Promise<CorrectionRequestRow | null> {
  const result = await pool.query<CorrectionRequestRow>(
    `${CORRECTION_REQUEST_SELECT} WHERE id = $1`,
    [requestId],
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

async function findAdminDecisionForRequest(
  pool: Pool,
  requestId: string,
  adminId: string,
): Promise<AdminDecisionRow | null> {
  const result = await pool.query<AdminDecisionRow>(
    `SELECT
       id, admin_id, target_type, target_id, decision, reason_code, reason_text,
       submitted_at, metadata_json, created_at
     FROM admin_decision_logs
     WHERE target_type = $1 AND target_id = $2 AND admin_id = $3`,
    [POLL_CORRECTION_REQUEST_TARGET_TYPE, requestId, adminId],
  );
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  return { ...row, metadata_json: {} };
}

async function listAdminDecisionsForRequest(
  pool: Pool,
  requestId: string,
): Promise<AdminDecisionRow[]> {
  const result = await pool.query<AdminDecisionRow>(
    `SELECT
       id, admin_id, target_type, target_id, decision, reason_code, reason_text,
       submitted_at, metadata_json, created_at
     FROM admin_decision_logs
     WHERE target_type = $1 AND target_id = $2
     ORDER BY submitted_at ASC`,
    [POLL_CORRECTION_REQUEST_TARGET_TYPE, requestId],
  );
  return result.rows.map((row) => ({ ...row, metadata_json: {} }));
}

async function submitCorrectionDecisionAtomic(
  pool: Pool,
  params: SubmitCorrectionDecisionParams,
): Promise<SubmitCorrectionDecisionOutcome> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const outcome = await submitCorrectionDecisionOnClient(client, params);
    await client.query('COMMIT');
    return outcome;
  } catch (error) {
    if (
      !(error instanceof CorrectionExpiredError && error.statusUpdateCommitted)
    ) {
      await client.query('ROLLBACK');
    }
    throw error;
  } finally {
    client.release();
  }
}

async function submitCorrectionDecisionOnClient(
  client: PoolClient,
  params: SubmitCorrectionDecisionParams,
): Promise<SubmitCorrectionDecisionOutcome> {
  const locked = await client.query<CorrectionRequestRow>(
    `${CORRECTION_REQUEST_SELECT} WHERE id = $1 FOR UPDATE`,
    [params.requestId],
  );
  const request = locked.rows[0];
  if (!request) {
    throw new CorrectionRequestNotFoundError();
  }
  if (request.status !== 'pending') {
    throw new CorrectionRequestNotPendingError();
  }
  if (params.submittedAt.getTime() > request.valid_until.getTime()) {
    await client.query(
      `UPDATE poll_correction_requests
       SET status = 'expired', updated_at = $2
       WHERE id = $1 AND status = 'pending'`,
      [params.requestId, params.submittedAt],
    );
    await client.query('COMMIT');
    throw new CorrectionExpiredError('Correction request has expired', true);
  }
  if (
    request.requester_admin_id === params.adminId &&
    params.decision === 'approve'
  ) {
    throw new ProposerCannotApproveError();
  }

  const existing = await client.query<{ id: string }>(
    `SELECT id FROM admin_decision_logs
     WHERE target_type = $1 AND target_id = $2 AND admin_id = $3`,
    [POLL_CORRECTION_REQUEST_TARGET_TYPE, params.requestId, params.adminId],
  );
  if (existing.rows[0]) {
    throw new CorrectionDecisionAlreadySubmittedError();
  }

  const inserted = await client.query<AdminDecisionRow>(
    `INSERT INTO admin_decision_logs (
       admin_id,
       target_type,
       target_id,
       decision,
       reason_code,
       reason_text,
       submitted_at,
       metadata_json,
       created_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, '{}'::jsonb, $7)
     RETURNING
       id, admin_id, target_type, target_id, decision, reason_code, reason_text,
       submitted_at, metadata_json, created_at`,
    [
      params.adminId,
      POLL_CORRECTION_REQUEST_TARGET_TYPE,
      params.requestId,
      params.decision,
      params.reason_code,
      params.reason_text,
      params.submittedAt,
    ],
  );

  const nextStatus = await resolveNextRequestStatus(client, params.requestId, params.decision);
  const updated = await client.query<CorrectionRequestRow>(
    `UPDATE poll_correction_requests
     SET status = $2, updated_at = $3
     WHERE id = $1
     RETURNING
       id, poll_id, requester_admin_id, correction_target_field, correction_target_id,
       original_text, proposed_text, reason, status, requires_dual_admin,
       spread_score_at_submit, spread_score_locked_until, valid_until,
       submitted_at, created_at, updated_at`,
    [params.requestId, nextStatus, params.submittedAt],
  );

  return {
    decision: { ...inserted.rows[0]!, metadata_json: {} },
    request: updated.rows[0]!,
  };
}

async function resolveNextRequestStatus(
  client: PoolClient,
  requestId: string,
  decision: AdminDecisionValue,
): Promise<CorrectionRequestRow['status']> {
  if (decision === 'reject') {
    return 'rejected';
  }
  const approvals = await client.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM admin_decision_logs
     WHERE target_type = $1
       AND target_id = $2
       AND decision = 'approve'`,
    [POLL_CORRECTION_REQUEST_TARGET_TYPE, requestId],
  );
  const approveCount = Number(approvals.rows[0]?.count ?? 0);
  return approveCount >= 2 ? 'approved' : 'pending';
}
