import { describe, expect, it } from 'vitest';
import { CorrectionValidationError } from '../../src/admin/errors.js';
import {
  assertNonEmptyReason,
  assertTypoOnlyProposedChange,
  assertValidCorrectionTargetId,
  normalizeCorrectionText,
} from '../../src/admin/typo-guard.js';

describe('typo guard', () => {
  it('rejects empty proposed text after trim', () => {
    expect(() => assertTypoOnlyProposedChange('Hello', '   ')).toThrow(
      CorrectionValidationError,
    );
  });

  it('rejects identical normalized text', () => {
    expect(() => assertTypoOnlyProposedChange('hello  world', 'hello world')).toThrow(
      CorrectionValidationError,
    );
  });

  it('accepts simple punctuation and spacing typo correction', () => {
    const proposed = assertTypoOnlyProposedChange(
      'Favourite colour',
      'Favorite color',
    );
    expect(proposed).toBe('Favorite color');
    expect(normalizeCorrectionText('  a   b  ')).toBe('a b');
  });

  it('rejects empty reason and accepts trimmed reason', () => {
    expect(() => assertNonEmptyReason('   ')).toThrow(CorrectionValidationError);
    expect(assertNonEmptyReason('  typo fix  ')).toBe('typo fix');
  });

  it('requires correctionTargetId for option_text only', () => {
    expect(() => assertValidCorrectionTargetId('option_text', null)).toThrow(
      CorrectionValidationError,
    );
    expect(() => assertValidCorrectionTargetId('title', 'opt-id')).toThrow(
      CorrectionValidationError,
    );
    expect(() => assertValidCorrectionTargetId('title', null)).not.toThrow();
    expect(() => assertValidCorrectionTargetId('option_text', 'opt-id')).not.toThrow();
  });
});
