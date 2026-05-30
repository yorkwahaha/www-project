import { CorrectionValidationError } from './errors.js';
import type { CorrectionTargetField } from './types.js';

export const MAX_CORRECTION_REASON_LENGTH = 2_000;

/** Trim and collapse internal whitespace for typo comparison. */
export function normalizeCorrectionText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

export function assertNonEmptyReason(reason: string): string {
  const normalized = reason.trim();
  if (!normalized) {
    throw new CorrectionValidationError('reason is required');
  }
  if (normalized.length > MAX_CORRECTION_REASON_LENGTH) {
    throw new CorrectionValidationError(
      `reason must be at most ${MAX_CORRECTION_REASON_LENGTH} characters`,
    );
  }
  return normalized;
}

export function assertValidCorrectionTargetId(
  field: CorrectionTargetField,
  correctionTargetId: string | null | undefined,
): void {
  if (field === 'option_text') {
    if (!correctionTargetId?.trim()) {
      throw new CorrectionValidationError(
        'correctionTargetId is required for option_text corrections',
      );
    }
    return;
  }
  if (correctionTargetId !== null && correctionTargetId !== undefined) {
    throw new CorrectionValidationError(
      'correctionTargetId must not be set for title or description corrections',
    );
  }
}

export function assertTypoOnlyProposedChange(
  originalText: string,
  proposedText: string,
): string {
  const normalizedProposed = normalizeCorrectionText(proposedText);
  if (!normalizedProposed) {
    throw new CorrectionValidationError('proposedText must not be empty');
  }
  const normalizedOriginal = normalizeCorrectionText(originalText);
  if (normalizedProposed === normalizedOriginal) {
    throw new CorrectionValidationError(
      'proposedText must differ from the current text after normalization',
    );
  }
  return normalizedProposed;
}
