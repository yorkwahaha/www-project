import type { CorrectionRepository } from './correction-repository.js';
import {
  AdminForbiddenError,
  CorrectionConflictError,
  CorrectionPollNotEligibleError,
  CorrectionPollNotFoundError,
} from './errors.js';
import { isPollEligibleForCorrectionRequest } from './poll-correction-eligibility.js';
import { buildSpreadScoreStubFields } from './spread-score-stub.js';
import { prepareCorrectionRequestFields } from './correction-request-fields.js';
import type { CreateCorrectionRequestInput, CreateCorrectionRequestResult } from './types.js';

export type CorrectionService = {
  createCorrectionRequest(
    input: CreateCorrectionRequestInput,
  ): Promise<CreateCorrectionRequestResult>;
};

export type CreateCorrectionServiceOptions = {
  now?: () => Date;
};

export function createCorrectionService(
  repository: CorrectionRepository,
  options: CreateCorrectionServiceOptions = {},
): CorrectionService {
  const now = options.now ?? (() => new Date());

  return {
    async createCorrectionRequest(input) {
      const admin = await repository.findActiveAdminByUserId(input.adminUserId);
      if (!admin) {
        throw new AdminForbiddenError();
      }

      const poll = await repository.findPollByIdForCorrection(input.pollId);
      if (!poll) {
        throw new CorrectionPollNotFoundError();
      }
      if (!isPollEligibleForCorrectionRequest(poll.status)) {
        throw new CorrectionPollNotEligibleError();
      }

      const fields = await prepareCorrectionRequestFields(repository, input, poll);

      const pending = await repository.findPendingCorrectionRequest({
        pollId: input.pollId,
        correctionTargetField: input.correctionTargetField,
        correctionTargetId: fields.correctionTargetId,
      });
      if (pending) {
        throw new CorrectionConflictError();
      }

      const submittedAt = now();
      const spread = buildSpreadScoreStubFields(submittedAt);

      const inserted = await repository.insertCorrectionRequest({
        poll_id: input.pollId,
        requester_admin_id: input.adminUserId,
        correction_target_field: input.correctionTargetField,
        correction_target_id: fields.correctionTargetId,
        original_text: fields.originalText,
        proposed_text: fields.proposedText,
        reason: fields.reason,
        status: 'pending',
        requires_dual_admin: spread.requiresDualAdmin,
        spread_score_at_submit: spread.spreadScoreAtSubmit,
        spread_score_locked_until: spread.spreadScoreLockedUntil,
        valid_until: spread.validUntil,
        submitted_at: submittedAt,
      });

      return {
        request_id: inserted.id,
        status: 'pending',
        requires_dual_admin: inserted.requires_dual_admin,
        spread_score_at_submit: inserted.spread_score_at_submit,
        valid_until: inserted.valid_until.toISOString(),
      };
    },
  };
}
