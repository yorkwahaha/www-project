import type { CorrectionRepository } from './correction-repository.js';
import { prepareCorrectionRequestFields } from './correction-request-fields.js';
import type { SuspendedCorrectionRepository } from './suspended-correction-repository.js';
import {
  AdminForbiddenError,
  CorrectionConflictError,
  CorrectionPollNotFoundError,
  CorrectionPollNotSuspendedError,
} from './errors.js';
import { isPollEligibleForSuspendedCorrectionRequest } from './poll-correction-eligibility.js';
import { buildSpreadScoreStubFields } from './spread-score-stub.js';
import type {
  CreateSuspendedCorrectionRequestInput,
  CreateSuspendedCorrectionRequestResult,
} from './types.js';

export type SuspendedCorrectionService = {
  createSuspendedCorrectionRequest(
    input: CreateSuspendedCorrectionRequestInput,
  ): Promise<CreateSuspendedCorrectionRequestResult>;
};

export type CreateSuspendedCorrectionServiceOptions = {
  now?: () => Date;
};

export function createSuspendedCorrectionService(
  repository: SuspendedCorrectionRepository,
  options: CreateSuspendedCorrectionServiceOptions = {},
): SuspendedCorrectionService {
  const now = options.now ?? (() => new Date());

  return {
    async createSuspendedCorrectionRequest(input) {
      const admin = await repository.findActiveAdminByUserId(input.adminUserId);
      if (!admin) {
        throw new AdminForbiddenError();
      }

      const poll = await repository.findPollByIdForCorrection(input.pollId);
      if (!poll) {
        throw new CorrectionPollNotFoundError();
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
      if (!isPollEligibleForSuspendedCorrectionRequest(poll.status)) {
        throw new CorrectionPollNotSuspendedError();
      }

      const submittedAt = now();
      const spread = buildSpreadScoreStubFields(submittedAt);

      return repository.createSuspendedCorrectionRequestAtomic({
        row: {
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
        },
      });
    },
  };
}
