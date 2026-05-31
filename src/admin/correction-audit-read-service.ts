import {
  decodeCorrectionAuditCursor,
  encodeCorrectionAuditCursor,
  parseCorrectionAuditLimit,
} from './correction-audit-cursor.js';
import type {
  CorrectionAuditDecisionAggregateRow,
  CorrectionAuditReadRepository,
  CorrectionAuditRequestRow,
  GlobalCorrectionAuditListRow,
  PollCorrectionAuditListRow,
} from './correction-audit-read-repository.js';
import { AdminError, AdminForbiddenError, CorrectionRequestNotFoundError } from './errors.js';
import type {
  CorrectionDecisionSummary,
  CorrectionAuditRecord,
  CorrectionAuditTimelineItem,
  GlobalCorrectionAuditList,
  GlobalCorrectionAuditListItem,
  PollCorrectionAuditList,
  PollCorrectionAuditListItem,
} from './types.js';
import type { CorrectionRequestStatus } from './types.js';

export type ListPollCorrectionAuditQuery = {
  limit?: string;
  cursor?: string;
};

export type ListGlobalCorrectionAuditQuery = ListPollCorrectionAuditQuery & {
  status?: string;
  valid_before?: string;
  valid_after?: string;
};

export type CorrectionAuditReadService = {
  getAuditRecord(requestId: string, viewingAdminId: string): Promise<CorrectionAuditRecord>;
  listPollCorrectionAudit(
    pollId: string,
    viewingAdminId: string,
    query?: ListPollCorrectionAuditQuery,
  ): Promise<PollCorrectionAuditList>;
  listGlobalCorrectionAudit(
    viewingAdminId: string,
    query?: ListGlobalCorrectionAuditQuery,
  ): Promise<GlobalCorrectionAuditList>;
};

export function createCorrectionAuditReadService(
  repository: CorrectionAuditReadRepository,
): CorrectionAuditReadService {
  return {
    async getAuditRecord(requestId, viewingAdminId) {
      await requireActiveAdmin(repository, viewingAdminId);
      const request = await repository.findAuditRequestById(requestId);
      if (!request) {
        throw new CorrectionRequestNotFoundError();
      }
      const aggregate = await repository.getDecisionAggregateForRequest(requestId);
      return toAuditRecord(request, aggregate);
    },

    async listPollCorrectionAudit(pollId, viewingAdminId, query = {}) {
      await requireActiveAdmin(repository, viewingAdminId);
      const limit = parseCorrectionAuditLimit(query.limit);
      const cursor = query.cursor
        ? decodeCorrectionAuditCursor(query.cursor)
        : undefined;
      const rows = await repository.listPollCorrectionAudit({
        pollId,
        limit,
        ...(cursor ? { cursor } : {}),
      });
      const hasNext = rows.length > limit;
      const visibleRows = rows.slice(0, limit);
      const last = visibleRows.at(-1);
      return {
        items: visibleRows.map(toListItem),
        next_cursor:
          hasNext && last
            ? encodeCorrectionAuditCursor(last.submitted_at, last.request_id)
            : null,
      };
    },

    async listGlobalCorrectionAudit(viewingAdminId, query = {}) {
      await requireActiveAdmin(repository, viewingAdminId);
      const limit = parseCorrectionAuditLimit(query.limit);
      const cursor = query.cursor
        ? decodeCorrectionAuditCursor(query.cursor)
        : undefined;
      const status = parseCorrectionAuditStatus(query.status);
      const validBefore = parseCorrectionAuditTimestamp(query.valid_before, 'valid_before');
      const validAfter = parseCorrectionAuditTimestamp(query.valid_after, 'valid_after');
      const rows = await repository.listGlobalCorrectionAudit({
        limit,
        ...(cursor ? { cursor } : {}),
        ...(status ? { status } : {}),
        ...(validBefore ? { validBefore } : {}),
        ...(validAfter ? { validAfter } : {}),
      });
      const hasNext = rows.length > limit;
      const visibleRows = rows.slice(0, limit);
      const last = visibleRows.at(-1);
      return {
        items: visibleRows.map(toGlobalListItem),
        next_cursor:
          hasNext && last
            ? encodeCorrectionAuditCursor(last.submitted_at, last.request_id)
            : null,
      };
    },
  };
}

async function requireActiveAdmin(
  repository: CorrectionAuditReadRepository,
  adminUserId: string,
): Promise<void> {
  const admin = await repository.findActiveAdminByUserId(adminUserId);
  if (!admin) {
    throw new AdminForbiddenError();
  }
}

function toAuditRecord(
  request: CorrectionAuditRequestRow,
  aggregate: CorrectionAuditDecisionAggregateRow,
): CorrectionAuditRecord {
  const isApplied = request.request_status === 'applied';
  return {
    request_id: request.request_id,
    poll_id: request.poll_id,
    request_status: request.request_status,
    poll_status: request.poll_status,
    correction_target_field: request.correction_target_field,
    correction_target_id: request.correction_target_id,
    original_text: request.original_text,
    proposed_text: request.proposed_text,
    requires_dual_admin: request.requires_dual_admin,
    submitted_at: request.submitted_at.toISOString(),
    valid_until: request.valid_until.toISOString(),
    updated_at: request.updated_at.toISOString(),
    correction_log_id: isApplied ? request.correction_log_id : null,
    applied_text: isApplied ? request.applied_text : null,
    applied_at: isApplied ? request.applied_at?.toISOString() ?? null : null,
    has_public_notice: isApplied && request.has_public_notice,
    decision_summary: toDecisionSummary(request, aggregate),
    timeline: buildTimeline(request, aggregate),
  };
}

function toDecisionSummary(
  request: CorrectionAuditRequestRow,
  aggregate: CorrectionAuditDecisionAggregateRow,
): CorrectionDecisionSummary {
  if (request.request_status === 'pending') {
    return { state: 'pending_blind' };
  }
  return {
    approve_count: aggregate.approve_count,
    reject_count: aggregate.reject_count,
    quorum_met: aggregate.approve_count >= 2,
    is_finalized: true,
  };
}

function buildTimeline(
  request: CorrectionAuditRequestRow,
  aggregate: CorrectionAuditDecisionAggregateRow,
): CorrectionAuditTimelineItem[] {
  const timeline: CorrectionAuditTimelineItem[] = [
    { event: 'submitted', at: request.submitted_at.toISOString() },
  ];

  if (
    (request.request_status === 'approved' || request.request_status === 'applied') &&
    aggregate.last_decision_at
  ) {
    timeline.push({
      event: 'decision_quorum_met',
      at: aggregate.last_decision_at.toISOString(),
    });
  }
  if (request.request_status === 'rejected') {
    timeline.push({
      event: 'rejected',
      at: (aggregate.first_reject_at ?? request.updated_at).toISOString(),
    });
  }
  if (request.request_status === 'expired') {
    timeline.push({ event: 'expired', at: request.updated_at.toISOString() });
  }
  if (request.request_status === 'applied' && request.applied_at) {
    timeline.push({ event: 'applied', at: request.applied_at.toISOString() });
  }

  return timeline.sort(
    (a, b) =>
      a.at.localeCompare(b.at) ||
      TIMELINE_EVENT_ORDER[a.event] - TIMELINE_EVENT_ORDER[b.event],
  );
}

function toListItem(row: PollCorrectionAuditListRow): PollCorrectionAuditListItem {
  const isApplied = row.request_status === 'applied';
  return {
    request_id: row.request_id,
    request_status: row.request_status,
    correction_target_field: row.correction_target_field,
    submitted_at: row.submitted_at.toISOString(),
    valid_until: row.valid_until.toISOString(),
    has_public_notice: isApplied && row.has_public_notice,
    ...(isApplied && row.correction_log_id
      ? { correction_log_id: row.correction_log_id }
      : {}),
  };
}

function toGlobalListItem(
  row: GlobalCorrectionAuditListRow,
): GlobalCorrectionAuditListItem {
  return {
    poll_id: row.poll_id,
    ...toListItem(row),
  };
}

const CORRECTION_AUDIT_STATUSES = new Set<CorrectionRequestStatus>([
  'pending',
  'approved',
  'rejected',
  'expired',
  'applied',
]);

function parseCorrectionAuditStatus(
  value: string | undefined,
): CorrectionRequestStatus | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!CORRECTION_AUDIT_STATUSES.has(value as CorrectionRequestStatus)) {
    throw new AdminError('INVALID_AUDIT_STATUS', 'Invalid audit status');
  }
  return value as CorrectionRequestStatus;
}

function parseCorrectionAuditTimestamp(
  value: string | undefined,
  field: 'valid_before' | 'valid_after',
): Date | undefined {
  if (value === undefined) {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new AdminError('INVALID_AUDIT_TIMESTAMP', `Invalid ${field}`);
  }
  return parsed;
}

const TIMELINE_EVENT_ORDER = {
  submitted: 0,
  decision_quorum_met: 1,
  rejected: 2,
  expired: 3,
  applied: 4,
} satisfies Record<CorrectionAuditTimelineItem['event'], number>;
