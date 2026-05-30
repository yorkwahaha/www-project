import type { InMemoryCorrectionRepository } from './in-memory-correction-repository.js';
import type {
  CorrectionAuditDecisionAggregateRow,
  CorrectionAuditReadRepository,
  CorrectionAuditRequestRow,
  PollCorrectionAuditListRow,
} from './correction-audit-read-repository.js';
import type { AdminDecisionRow, PollCorrectionLogRow } from './types.js';
import { POLL_CORRECTION_REQUEST_TARGET_TYPE } from './types.js';

export function createInMemoryCorrectionAuditReadRepository(
  base: InMemoryCorrectionRepository,
): CorrectionAuditReadRepository {
  return {
    findActiveAdminByUserId: (userId) => base.findActiveAdminByUserId(userId),

    findAuditRequestById: async (requestId) => {
      const request = base.correctionRequests.get(requestId);
      if (!request) {
        return null;
      }
      const poll = base.polls.get(request.poll_id);
      if (!poll) {
        return null;
      }
      const log = correctionLogs(base).find(
        (row) => row.correction_request_id === requestId,
      );
      const row: CorrectionAuditRequestRow = {
        request_id: request.id,
        poll_id: request.poll_id,
        request_status: request.status,
        poll_status: poll.status,
        correction_target_field: request.correction_target_field,
        correction_target_id: request.correction_target_id,
        original_text: request.original_text,
        proposed_text: request.proposed_text,
        requires_dual_admin: request.requires_dual_admin,
        submitted_at: request.submitted_at,
        valid_until: request.valid_until,
        updated_at: request.updated_at,
        correction_log_id: log?.id ?? null,
        applied_text: log?.applied_text ?? null,
        applied_at: log?.applied_at ?? null,
        has_public_notice: log?.public_notice_id !== null && log !== undefined,
      };
      return row;
    },

    getDecisionAggregateForRequest: async (requestId) => {
      const rows = decisionLogs(base).filter(
        (row) =>
          row.target_type === POLL_CORRECTION_REQUEST_TARGET_TYPE &&
          row.target_id === requestId,
      );
      const rejectRows = rows.filter((row) => row.decision === 'reject');
      const row: CorrectionAuditDecisionAggregateRow = {
        approve_count: rows.filter((item) => item.decision === 'approve').length,
        reject_count: rejectRows.length,
        last_decision_at: latest(rows.map((item) => item.submitted_at)),
        first_reject_at: earliest(rejectRows.map((item) => item.submitted_at)),
      };
      return row;
    },

    listPollCorrectionAudit: async ({ pollId, limit, cursor }) => {
      const rows = [...base.correctionRequests.values()]
        .filter((request) => request.poll_id === pollId)
        .filter((request) => {
          if (!cursor) {
            return true;
          }
          const timeDifference =
            request.submitted_at.getTime() - cursor.submittedAt.getTime();
          return timeDifference < 0 || (timeDifference === 0 && request.id < cursor.requestId);
        })
        .sort(
          (a, b) =>
            b.submitted_at.getTime() - a.submitted_at.getTime() ||
            b.id.localeCompare(a.id),
        )
        .slice(0, limit + 1)
        .map((request): PollCorrectionAuditListRow => {
          const log = correctionLogs(base).find(
            (row) => row.correction_request_id === request.id,
          );
          return {
            request_id: request.id,
            request_status: request.status,
            correction_target_field: request.correction_target_field,
            submitted_at: request.submitted_at,
            valid_until: request.valid_until,
            correction_log_id: log?.id ?? null,
            has_public_notice: log?.public_notice_id !== null && log !== undefined,
          };
        });
      return rows;
    },
  };
}

function decisionLogs(base: InMemoryCorrectionRepository): AdminDecisionRow[] {
  return base.decisionLogs as AdminDecisionRow[];
}

function correctionLogs(base: InMemoryCorrectionRepository): PollCorrectionLogRow[] {
  return base.correctionLogs as PollCorrectionLogRow[];
}

function earliest(values: Date[]): Date | null {
  return values.length === 0
    ? null
    : new Date(Math.min(...values.map((value) => value.getTime())));
}

function latest(values: Date[]): Date | null {
  return values.length === 0
    ? null
    : new Date(Math.max(...values.map((value) => value.getTime())));
}
