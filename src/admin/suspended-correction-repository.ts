import type { Pool, PoolClient } from 'pg';
import {
  CorrectionAlreadyAppliedError,
  CorrectionExpiredError,
  CorrectionPollNotCorrectionPendingError,
  CorrectionPollNotFoundError,
  CorrectionPollNotSuspendedError,
  CorrectionRequestNotApprovedError,
  CorrectionRequestNotFoundError,
  CorrectionStaleTargetError,
} from './errors.js';
import { assertApplyTargetShape, applyTargetTextUpdate } from './correction-apply-target.js';
import type { CorrectionRepository } from './correction-repository.js';
import { isPollEligibleForSuspendedCorrectionApply } from './poll-correction-eligibility.js';
import { buildSuspendedCorrectionPublicNotice } from './public-notice-content.js';
import { restorePollToSuspendedIfCorrectionPending } from './suspended-correction-poll-recovery.js';
import type {
  AdminUserRow,
  ApplySuspendedCorrectionRequestResult,
  CorrectionRequestRow,
  CreateSuspendedCorrectionRequestResult,
  InsertCorrectionRequestRow,
  PollRowForCorrection,
} from './types.js';

export type CreateSuspendedCorrectionRequestParams = {
  row: InsertCorrectionRequestRow;
};

export type ApplySuspendedCorrectionRequestParams = {
  requestId: string;
  appliedByAdminId: string;
  appliedAt: Date;
};

export type SuspendedCorrectionRepository = CorrectionRepository & {
  findActiveAdminByUserId(userId: string): Promise<AdminUserRow | null>;
  createSuspendedCorrectionRequestAtomic(
    params: CreateSuspendedCorrectionRequestParams,
  ): Promise<CreateSuspendedCorrectionRequestResult>;
  applySuspendedCorrectionRequestAtomic(
    params: ApplySuspendedCorrectionRequestParams,
  ): Promise<ApplySuspendedCorrectionRequestResult>;
};

export function createPgSuspendedCorrectionRepository(
  pool: Pool,
  correctionRepo: CorrectionRepository,
): SuspendedCorrectionRepository {
  return {
    ...correctionRepo,
    findActiveAdminByUserId: (userId) => findActiveAdminByUserId(pool, userId),
    createSuspendedCorrectionRequestAtomic: (params) =>
      createSuspendedCorrectionRequestAtomic(pool, params),
    applySuspendedCorrectionRequestAtomic: (params) =>
      applySuspendedCorrectionRequestAtomic(pool, params),
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

async function createSuspendedCorrectionRequestAtomic(
  pool: Pool,
  params: CreateSuspendedCorrectionRequestParams,
): Promise<CreateSuspendedCorrectionRequestResult> {
  const client = await pool.connect();
  const row = params.row;
  try {
    await client.query('BEGIN');
    const pollLock = await client.query<PollRowForCorrection>(
      `SELECT id, title, description, status
       FROM polls
       WHERE id = $1
       FOR UPDATE`,
      [row.poll_id],
    );
    const poll = pollLock.rows[0];
    if (!poll) {
      throw new CorrectionPollNotFoundError();
    }
    if (poll.status !== 'suspended') {
      throw new CorrectionPollNotSuspendedError();
    }

    const inserted = await client.query<CorrectionRequestRow>(
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

    const statusUpdate = await client.query(
      `UPDATE polls
       SET status = 'correction_pending', updated_at = $2
       WHERE id = $1 AND status = 'suspended'`,
      [row.poll_id, row.submitted_at],
    );
    if ((statusUpdate.rowCount ?? 0) === 0) {
      throw new CorrectionPollNotSuspendedError();
    }

    await client.query('COMMIT');
    const request = inserted.rows[0]!;
    return {
      request_id: request.id,
      status: 'pending',
      requires_dual_admin: request.requires_dual_admin,
      spread_score_at_submit: request.spread_score_at_submit,
      valid_until: request.valid_until.toISOString(),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function applySuspendedCorrectionRequestAtomic(
  pool: Pool,
  params: ApplySuspendedCorrectionRequestParams,
): Promise<ApplySuspendedCorrectionRequestResult> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await applySuspendedCorrectionOnClient(client, params);
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

async function applySuspendedCorrectionOnClient(
  client: PoolClient,
  params: ApplySuspendedCorrectionRequestParams,
): Promise<ApplySuspendedCorrectionRequestResult> {
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

  const pollLock = await client.query<PollRowForCorrection>(
    `SELECT id, title, description, status
     FROM polls
     WHERE id = $1
     FOR UPDATE`,
    [request.poll_id],
  );
  const poll = pollLock.rows[0];
  if (!poll) {
    throw new CorrectionPollNotFoundError();
  }
  if (!isPollEligibleForSuspendedCorrectionApply(poll.status)) {
    throw new CorrectionPollNotCorrectionPendingError();
  }

  if (params.appliedAt.getTime() > request.valid_until.getTime()) {
    await client.query(
      `UPDATE poll_correction_requests
       SET status = 'expired', updated_at = $2
       WHERE id = $1 AND status = 'approved'`,
      [params.requestId, params.appliedAt],
    );
    await restorePollToSuspendedIfCorrectionPending(
      client,
      request.poll_id,
      params.appliedAt,
    );
    await client.query('COMMIT');
    throw new CorrectionExpiredError('Correction request has expired', true);
  }

  assertApplyTargetShape(request);

  const rowsUpdated = await applyTargetTextUpdate(client, request, params.appliedAt);
  if (rowsUpdated === 0) {
    throw new CorrectionStaleTargetError();
  }

  const noticeContent = buildSuspendedCorrectionPublicNotice(params.appliedAt);
  const notice = await client.query<{ id: string }>(
    `INSERT INTO public_notices (
       poll_id, notice_type, title, body, created_by_admin_id, created_at
     )
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      request.poll_id,
      noticeContent.notice_type,
      noticeContent.title,
      noticeContent.body,
      params.appliedByAdminId,
      params.appliedAt,
    ],
  );
  const noticeId = notice.rows[0]!.id;

  const log = await client.query<{ id: string }>(
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
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
     RETURNING id`,
    [
      request.id,
      request.poll_id,
      params.appliedByAdminId,
      request.correction_target_field,
      request.correction_target_id,
      request.original_text,
      request.proposed_text,
      noticeId,
      params.appliedAt,
    ],
  );

  const pollStatusUpdate = await client.query(
    `UPDATE polls
     SET status = 'active', updated_at = $2
     WHERE id = $1 AND status = 'correction_pending'`,
    [request.poll_id, params.appliedAt],
  );
  if ((pollStatusUpdate.rowCount ?? 0) === 0) {
    throw new CorrectionPollNotCorrectionPendingError();
  }

  await client.query(
    `UPDATE poll_correction_requests
     SET status = 'applied', updated_at = $2
     WHERE id = $1 AND status = 'approved'`,
    [params.requestId, params.appliedAt],
  );

  return {
    request_id: request.id,
    request_status: 'applied',
    correction_log_id: log.rows[0]!.id,
    poll_id: request.poll_id,
    correction_target_field: request.correction_target_field,
    public_notice_id: noticeId,
  };
}
