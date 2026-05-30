import {
  CorrectionDecisionAlreadySubmittedError,
  CorrectionExpiredError,
  CorrectionRequestNotFoundError,
  CorrectionRequestNotPendingError,
  ProposerCannotApproveError,
} from './errors.js';
import type {
  CorrectionDecisionRepository,
  SubmitCorrectionDecisionOutcome,
  SubmitCorrectionDecisionParams,
} from './correction-decision-repository.js';
import type { InMemoryCorrectionRepository } from './in-memory-correction-repository.js';
import type { AdminDecisionRow } from './types.js';
import { restorePollToSuspendedIfCorrectionPendingInMemory } from './suspended-correction-poll-recovery.js';
import { POLL_CORRECTION_REQUEST_TARGET_TYPE } from './types.js';

export function createInMemoryCorrectionDecisionRepository(
  base: InMemoryCorrectionRepository,
): CorrectionDecisionRepository {
  const decisionRows: AdminDecisionRow[] = [];

  return {
    findActiveAdminByUserId: (userId) => base.findActiveAdminByUserId(userId),
    findCorrectionRequestById: async (requestId) =>
      base.correctionRequests.get(requestId) ?? null,
    findPollByIdForCorrection: (pollId) => base.findPollByIdForCorrection(pollId),
    findAdminDecisionForRequest: async (requestId, adminId) =>
      decisionRows.find(
        (row) =>
          row.target_type === POLL_CORRECTION_REQUEST_TARGET_TYPE &&
          row.target_id === requestId &&
          row.admin_id === adminId,
      ) ?? null,
    listAdminDecisionsForRequest: async (requestId) =>
      decisionRows
        .filter(
          (row) =>
            row.target_type === POLL_CORRECTION_REQUEST_TARGET_TYPE &&
            row.target_id === requestId,
        )
        .sort((a, b) => a.submitted_at.getTime() - b.submitted_at.getTime()),
    submitCorrectionDecisionAtomic: (params) =>
      submitInMemory(base, decisionRows, params),
  };
}

async function submitInMemory(
  base: InMemoryCorrectionRepository,
  decisionRows: AdminDecisionRow[],
  params: SubmitCorrectionDecisionParams,
): Promise<SubmitCorrectionDecisionOutcome> {
  const request = base.correctionRequests.get(params.requestId);
  if (!request) {
    throw new CorrectionRequestNotFoundError();
  }
  if (request.status !== 'pending') {
    throw new CorrectionRequestNotPendingError();
  }
  if (params.submittedAt.getTime() > request.valid_until.getTime()) {
    request.status = 'expired';
    request.updated_at = params.submittedAt;
    base.correctionRequests.set(request.id, request);
    restorePollToSuspendedIfCorrectionPendingInMemory(
      base,
      request.poll_id,
      params.submittedAt,
    );
    throw new CorrectionExpiredError();
  }
  if (
    request.requester_admin_id === params.adminId &&
    params.decision === 'approve'
  ) {
    throw new ProposerCannotApproveError();
  }

  const existing = decisionRows.find(
    (row) =>
      row.target_type === POLL_CORRECTION_REQUEST_TARGET_TYPE &&
      row.target_id === params.requestId &&
      row.admin_id === params.adminId,
  );
  if (existing) {
    throw new CorrectionDecisionAlreadySubmittedError();
  }

  const inserted: AdminDecisionRow = {
    id: crypto.randomUUID(),
    admin_id: params.adminId,
    target_type: POLL_CORRECTION_REQUEST_TARGET_TYPE,
    target_id: params.requestId,
    decision: params.decision,
    reason_code: params.reason_code,
    reason_text: params.reason_text,
    submitted_at: params.submittedAt,
    metadata_json: {},
    created_at: params.submittedAt,
  };
  decisionRows.push(inserted);
  base.decisionLogs.push(inserted);

  request.status = resolveNextRequestStatus(decisionRows, params.requestId, params.decision);
  request.updated_at = params.submittedAt;
  base.correctionRequests.set(request.id, request);

  if (request.status === 'rejected') {
    restorePollToSuspendedIfCorrectionPendingInMemory(
      base,
      request.poll_id,
      params.submittedAt,
    );
  }

  return { decision: inserted, request: { ...request } };
}

function resolveNextRequestStatus(
  decisionRows: AdminDecisionRow[],
  requestId: string,
  decision: SubmitCorrectionDecisionParams['decision'],
): 'pending' | 'approved' | 'rejected' {
  if (decision === 'reject') {
    return 'rejected';
  }
  const approveCount = decisionRows.filter(
    (row) =>
      row.target_type === POLL_CORRECTION_REQUEST_TARGET_TYPE &&
      row.target_id === requestId &&
      row.decision === 'approve',
  ).length;
  return approveCount >= 2 ? 'approved' : 'pending';
}
