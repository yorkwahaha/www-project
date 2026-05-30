import type { Pool, PoolClient } from 'pg';
import {
  CorrectionAlreadyAppliedError,
  CorrectionExpiredError,
  CorrectionPollNotEligibleError,
  CorrectionPollNotFoundError,
  CorrectionRequestNotApprovedError,
  CorrectionRequestNotFoundError,
  CorrectionStaleTargetError,
  CorrectionValidationError,
} from './errors.js';
import { isPollEligibleForCorrectionRequest } from './poll-correction-eligibility.js';
import type {
  AdminUserRow,
  ApplyCorrectionRequestResult,
  CorrectionRequestRow,
  PollCorrectionLogRow,
  PollRowForCorrection,
} from './types.js';

export type ApplyCorrectionRequestParams = {
  requestId: string;
  appliedByAdminId: string;
  appliedAt: Date;
};

export type CorrectionApplyRepository = {
  findActiveAdminByUserId(userId: string): Promise<AdminUserRow | null>;
  applyCorrectionRequestAtomic(
    params: ApplyCorrectionRequestParams,
  ): Promise<ApplyCorrectionRequestResult>;
};

export function createPgCorrectionApplyRepository(pool: Pool): CorrectionApplyRepository {
  return {
    findActiveAdminByUserId: (userId) => findActiveAdminByUserId(pool, userId),
    applyCorrectionRequestAtomic: (params) => applyCorrectionRequestAtomic(pool, params),
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

async function applyCorrectionRequestAtomic(
  pool: Pool,
  params: ApplyCorrectionRequestParams,
): Promise<ApplyCorrectionRequestResult> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await applyCorrectionRequestOnClient(client, params);
    await client.query('COMMIT');
    return result;
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

async function applyCorrectionRequestOnClient(
  client: PoolClient,
  params: ApplyCorrectionRequestParams,
): Promise<ApplyCorrectionRequestResult> {
  const locked = await client.query<CorrectionRequestRow>(
    `${CORRECTION_REQUEST_SELECT} WHERE id = $1 FOR UPDATE`,
    [params.requestId],
  );
  const request = locked.rows[0];
  if (!request) {
    throw new CorrectionRequestNotFoundError();
  }

  if (request.status === 'applied') {
    throw new CorrectionAlreadyAppliedError();
  }
  if (request.status !== 'approved') {
    throw new CorrectionRequestNotApprovedError();
  }

  if (params.appliedAt.getTime() > request.valid_until.getTime()) {
    await client.query(
      `UPDATE poll_correction_requests
       SET status = 'expired', updated_at = $2
       WHERE id = $1 AND status = 'approved'`,
      [params.requestId, params.appliedAt],
    );
    await client.query('COMMIT');
    throw new CorrectionExpiredError('Correction request has expired', true);
  }

  assertApplyTargetShape(request);

  const poll = await client.query<PollRowForCorrection>(
    `SELECT id, title, description, status
     FROM polls
     WHERE id = $1`,
    [request.poll_id],
  );
  const pollRow = poll.rows[0];
  if (!pollRow) {
    throw new CorrectionPollNotFoundError();
  }
  if (!isPollEligibleForCorrectionRequest(pollRow.status)) {
    throw new CorrectionPollNotEligibleError();
  }

  const rowsUpdated = await applyTargetTextUpdate(client, request, params.appliedAt);
  if (rowsUpdated === 0) {
    throw new CorrectionStaleTargetError();
  }

  const log = await client.query<PollCorrectionLogRow>(
    `INSERT INTO poll_correction_logs (
       correction_request_id,
       poll_id,
       applied_by_admin_id,
       correction_target_field,
       correction_target_id,
       original_text,
       applied_text,
       public_notice_id,
       applied_at,
       created_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, $8, $8)
     RETURNING
       id, correction_request_id, poll_id, applied_by_admin_id,
       correction_target_field, correction_target_id,
       original_text, applied_text, public_notice_id, applied_at, created_at`,
    [
      request.id,
      request.poll_id,
      params.appliedByAdminId,
      request.correction_target_field,
      request.correction_target_id,
      request.original_text,
      request.proposed_text,
      params.appliedAt,
    ],
  );

  await client.query(
    `UPDATE poll_correction_requests
     SET status = 'applied', updated_at = $2
     WHERE id = $1 AND status = 'approved'`,
    [params.requestId, params.appliedAt],
  );

  const insertedLog = log.rows[0]!;
  return {
    request_id: request.id,
    request_status: 'applied',
    correction_log_id: insertedLog.id,
    poll_id: request.poll_id,
    correction_target_field: request.correction_target_field,
  };
}

function assertApplyTargetShape(request: CorrectionRequestRow): void {
  if (request.correction_target_field === 'option_text') {
    if (!request.correction_target_id) {
      throw new CorrectionValidationError(
        'correction_target_id is required for option_text corrections',
      );
    }
    return;
  }
  if (request.correction_target_id !== null) {
    throw new CorrectionValidationError(
      'correction_target_id must not be set for title or description corrections',
    );
  }
}

async function applyTargetTextUpdate(
  client: PoolClient,
  request: CorrectionRequestRow,
  appliedAt: Date,
): Promise<number> {
  const field = request.correction_target_field;
  if (field === 'title') {
    const result = await client.query(
      `UPDATE polls
       SET title = $2, updated_at = $3
       WHERE id = $1 AND title = $4`,
      [request.poll_id, request.proposed_text, appliedAt, request.original_text],
    );
    return result.rowCount ?? 0;
  }
  if (field === 'description') {
    const result = await client.query(
      `UPDATE polls
       SET description = $2, updated_at = $3
       WHERE id = $1 AND description = $4`,
      [request.poll_id, request.proposed_text, appliedAt, request.original_text],
    );
    return result.rowCount ?? 0;
  }
  const result = await client.query(
    `UPDATE poll_options
     SET option_text = $3, updated_at = $4
     WHERE id = $1 AND poll_id = $2 AND option_text = $5`,
    [
      request.correction_target_id,
      request.poll_id,
      request.proposed_text,
      appliedAt,
      request.original_text,
    ],
  );
  return result.rowCount ?? 0;
}
