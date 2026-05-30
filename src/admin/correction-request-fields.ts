import { CorrectionValidationError } from './errors.js';
import type { CorrectionRepository } from './correction-repository.js';
import {
  assertNonEmptyReason,
  assertTypoOnlyProposedChange,
  assertValidCorrectionTargetId,
} from './typo-guard.js';
import type { CorrectionTargetField, CreateCorrectionRequestInput } from './types.js';

export type PreparedCorrectionRequestFields = {
  correctionTargetId: string | null;
  originalText: string;
  proposedText: string;
  reason: string;
};

export function resolveCorrectionTargetId(
  field: CorrectionTargetField,
  correctionTargetId: string | null | undefined,
): string | null {
  if (field === 'option_text') {
    return correctionTargetId!.trim();
  }
  return null;
}

export async function prepareCorrectionRequestFields(
  repository: CorrectionRepository,
  input: CreateCorrectionRequestInput,
  poll: { id: string; title: string; description: string },
): Promise<PreparedCorrectionRequestFields> {
  assertValidCorrectionTargetId(input.correctionTargetField, input.correctionTargetId);

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

  return { correctionTargetId, originalText, proposedText, reason };
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
