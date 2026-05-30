import type { Pool } from 'pg';
import type { PollStatus } from '../polls/types.js';
import { POLL_CORRECTION_REQUEST_TARGET_TYPE } from './types.js';
import type {
  AdminUserRow,
  CorrectionRequestStatus,
  CorrectionTargetField,
} from './types.js';

export type CorrectionAuditRequestRow = {
  request_id: string;
  poll_id: string;
  request_status: CorrectionRequestStatus;
  poll_status: PollStatus;
  correction_target_field: CorrectionTargetField;
  correction_target_id: string | null;
  original_text: string;
  proposed_text: string;
  requires_dual_admin: boolean;
  submitted_at: Date;
  valid_until: Date;
  updated_at: Date;
  correction_log_id: string | null;
  applied_text: string | null;
  applied_at: Date | null;
  has_public_notice: boolean;
};

export type CorrectionAuditDecisionAggregateRow = {
  approve_count: number;
  reject_count: number;
  last_decision_at: Date | null;
  first_reject_at: Date | null;
};

export type PollCorrectionAuditListRow = {
  request_id: string;
  request_status: CorrectionRequestStatus;
  correction_target_field: CorrectionTargetField;
  submitted_at: Date;
  valid_until: Date;
  correction_log_id: string | null;
  has_public_notice: boolean;
};

export type PollCorrectionAuditListParams = {
  pollId: string;
  limit: number;
  cursor?: {
    submittedAt: Date;
    requestId: string;
  };
};

export type CorrectionAuditReadRepository = {
  findActiveAdminByUserId(userId: string): Promise<AdminUserRow | null>;
  findAuditRequestById(requestId: string): Promise<CorrectionAuditRequestRow | null>;
  getDecisionAggregateForRequest(
    requestId: string,
  ): Promise<CorrectionAuditDecisionAggregateRow>;
  listPollCorrectionAudit(
    params: PollCorrectionAuditListParams,
  ): Promise<PollCorrectionAuditListRow[]>;
};

export function createPgCorrectionAuditReadRepository(
  pool: Pool,
): CorrectionAuditReadRepository {
  return {
    findActiveAdminByUserId: async (userId) => {
      const result = await pool.query<AdminUserRow>(
        `SELECT user_id, role, status, created_at, revoked_at
         FROM admin_users
         WHERE user_id = $1 AND status = 'active'`,
        [userId],
      );
      return result.rows[0] ?? null;
    },

    findAuditRequestById: async (requestId) => {
      const result = await pool.query<CorrectionAuditRequestRow>(
        `SELECT
           request.id AS request_id,
           request.poll_id,
           request.status AS request_status,
           poll.status AS poll_status,
           request.correction_target_field,
           request.correction_target_id,
           request.original_text,
           request.proposed_text,
           request.requires_dual_admin,
           request.submitted_at,
           request.valid_until,
           request.updated_at,
           log.id AS correction_log_id,
           log.applied_text,
           log.applied_at,
           (log.public_notice_id IS NOT NULL) AS has_public_notice
         FROM poll_correction_requests request
         INNER JOIN polls poll ON poll.id = request.poll_id
         LEFT JOIN poll_correction_logs log ON log.correction_request_id = request.id
         WHERE request.id = $1`,
        [requestId],
      );
      return result.rows[0] ?? null;
    },

    getDecisionAggregateForRequest: async (requestId) => {
      const result = await pool.query<CorrectionAuditDecisionAggregateRow>(
        `SELECT
           COUNT(*) FILTER (WHERE decision = 'approve')::int AS approve_count,
           COUNT(*) FILTER (WHERE decision = 'reject')::int AS reject_count,
           MAX(submitted_at) AS last_decision_at,
           MIN(submitted_at) FILTER (WHERE decision = 'reject') AS first_reject_at
         FROM admin_decision_logs
         WHERE target_type = $1 AND target_id = $2`,
        [POLL_CORRECTION_REQUEST_TARGET_TYPE, requestId],
      );
      return result.rows[0]!;
    },

    listPollCorrectionAudit: async ({ pollId, limit, cursor }) => {
      const result = await pool.query<PollCorrectionAuditListRow>(
        `SELECT
           request.id AS request_id,
           request.status AS request_status,
           request.correction_target_field,
           request.submitted_at,
           request.valid_until,
           log.id AS correction_log_id,
           (log.public_notice_id IS NOT NULL) AS has_public_notice
         FROM poll_correction_requests request
         LEFT JOIN poll_correction_logs log ON log.correction_request_id = request.id
         WHERE request.poll_id = $1
           AND (
             $2::timestamptz IS NULL
             OR (request.submitted_at, request.id) < ($2::timestamptz, $3::uuid)
           )
         ORDER BY request.submitted_at DESC, request.id DESC
         LIMIT $4`,
        [pollId, cursor?.submittedAt ?? null, cursor?.requestId ?? null, limit + 1],
      );
      return result.rows;
    },
  };
}
