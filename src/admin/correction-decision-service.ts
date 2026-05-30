import type { CorrectionDecisionRepository } from './correction-decision-repository.js';
import {
  AdminForbiddenError,
  CorrectionRequestNotFoundError,
  CorrectionRequestNotPendingError,
  ProposerCannotApproveError,
} from './errors.js';
import type {
  CorrectionDecisionSummary,
  CorrectionReviewContext,
  SubmitCorrectionDecisionInput,
  SubmitCorrectionDecisionResult,
} from './types.js';

export type CorrectionDecisionService = {
  submitCorrectionDecision(
    requestId: string,
    adminUserId: string,
    input: SubmitCorrectionDecisionInput,
  ): Promise<SubmitCorrectionDecisionResult>;
  getReviewContext(requestId: string, viewingAdminId: string): Promise<CorrectionReviewContext>;
};

export type CreateCorrectionDecisionServiceOptions = {
  now?: () => Date;
};

const FINAL_REQUEST_STATUSES = new Set([
  'approved',
  'rejected',
  'expired',
  'applied',
]);

export function createCorrectionDecisionService(
  repository: CorrectionDecisionRepository,
  options: CreateCorrectionDecisionServiceOptions = {},
): CorrectionDecisionService {
  const now = options.now ?? (() => new Date());

  return {
    async submitCorrectionDecision(requestId, adminUserId, input) {
      const admin = await repository.findActiveAdminByUserId(adminUserId);
      if (!admin) {
        throw new AdminForbiddenError();
      }

      const request = await repository.findCorrectionRequestById(requestId);
      if (!request) {
        throw new CorrectionRequestNotFoundError();
      }
      if (request.status !== 'pending') {
        throw new CorrectionRequestNotPendingError();
      }
      if (
        request.requester_admin_id === adminUserId &&
        input.decision === 'approve'
      ) {
        throw new ProposerCannotApproveError();
      }

      const submittedAt = now();
      const outcome = await repository.submitCorrectionDecisionAtomic({
        requestId,
        adminId: adminUserId,
        decision: input.decision,
        reason_code: input.reason_code,
        reason_text: input.reason_text?.trim() ?? '',
        submittedAt,
      });

      return {
        request_id: outcome.request.id,
        request_status: outcome.request.status,
        decision_id: outcome.decision.id,
      };
    },

    async getReviewContext(requestId, viewingAdminId) {
      const admin = await repository.findActiveAdminByUserId(viewingAdminId);
      if (!admin) {
        throw new AdminForbiddenError();
      }

      const request = await repository.findCorrectionRequestById(requestId);
      if (!request) {
        throw new CorrectionRequestNotFoundError();
      }

      const poll = await repository.findPollByIdForCorrection(request.poll_id);
      if (!poll) {
        throw new CorrectionRequestNotFoundError();
      }

      const decisions = await repository.listAdminDecisionsForRequest(requestId);
      const viewerDecision = decisions.find((row) => row.admin_id === viewingAdminId);
      const isFinal = FINAL_REQUEST_STATUSES.has(request.status);

      const decision_summary = toDecisionSummary(decisions, isFinal);

      return {
        request_id: request.id,
        poll_id: request.poll_id,
        request_status: request.status,
        poll_status: poll.status,
        correction_target_field: request.correction_target_field,
        correction_target_id: request.correction_target_id,
        original_text: request.original_text,
        proposed_text: request.proposed_text,
        requires_dual_admin: request.requires_dual_admin,
        valid_until: request.valid_until.toISOString(),
        viewer_has_submitted: viewerDecision !== undefined,
        decision_summary,
      };
    },
  };
}

function toDecisionSummary(
  decisions: Array<{ decision: 'approve' | 'reject' }>,
  isFinal: boolean,
): CorrectionDecisionSummary {
  if (!isFinal) {
    return { state: 'pending_blind' };
  }

  const approve_count = decisions.filter((row) => row.decision === 'approve').length;
  const reject_count = decisions.filter((row) => row.decision === 'reject').length;
  return {
    approve_count,
    reject_count,
    quorum_met: approve_count >= 2,
    is_finalized: true,
  };
}
