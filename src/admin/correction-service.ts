import type { CorrectionRepository } from './correction-repository.js';
import {
  AdminForbiddenError,
  CorrectionConflictError,
  CorrectionPollNotEligibleError,
  CorrectionPollNotFoundError,
  CorrectionValidationError,
} from './errors.js';
import { isPollEligibleForCorrectionRequest } from './poll-correction-eligibility.js';
import { buildSpreadScoreStubFields } from './spread-score-stub.js';
import {
  assertNonEmptyReason,
  assertTypoOnlyProposedChange,
  assertValidCorrectionTargetId,
} from './typo-guard.js';
import type {
  CorrectionTargetField,
  CreateCorrectionRequestInput,
  CreateCorrectionRequestResult,
} from './types.js';

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

      assertValidCorrectionTargetId(
        input.correctionTargetField,
        input.correctionTargetId,
      );

      const correctionTargetId = resolveCorrectionTargetId(
        input.correctionTargetField,
        input.correctionTargetId,
      );
      const originalText = await resolveOriginalText(
        repository,
        poll,
        input.correctionTargetField,
        correctionTargetId,
      );

      const proposedText = assertTypoOnlyProposedChange(originalText, input.proposedText);
      const reason = assertNonEmptyReason(input.reason);

      const pending = await repository.findPendingCorrectionRequest({
        pollId: input.pollId,
        correctionTargetField: input.correctionTargetField,
        correctionTargetId,
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
        correction_target_id: correctionTargetId,
        original_text: originalText,
        proposed_text: proposedText,
        reason,
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

function resolveCorrectionTargetId(
  field: CorrectionTargetField,
  correctionTargetId: string | null | undefined,
): string | null {
  if (field === 'option_text') {
    return correctionTargetId!.trim();
  }
  return null;
}

async function resolveOriginalText(
  repository: CorrectionRepository,
  poll: { id: string; title: string; description: string },
  field: CorrectionTargetField,
  correctionTargetId: string | null,
): Promise<string> {
  if (field === 'title') {
    return poll.title;
  }
  if (field === 'description') {
    return poll.description;
  }
  if (!correctionTargetId) {
    throw new CorrectionValidationError(
      'correctionTargetId is required for option_text corrections',
    );
  }
  const optionText = await repository.findOptionTextForPoll(poll.id, correctionTargetId);
  if (optionText === null) {
    throw new CorrectionValidationError('correction target option is not part of this poll');
  }
  return optionText;
}
