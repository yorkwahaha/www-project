import { describe, expect, it } from 'vitest';
import { buildSpreadScoreStubFields } from '../../src/admin/spread-score-stub.js';

describe('spread score stub', () => {
  it('returns score 0, dual-admin true, +24h locked_until, +7d valid_until', () => {
    const submittedAt = new Date('2026-06-01T12:00:00.000Z');
    const fields = buildSpreadScoreStubFields(submittedAt);

    expect(fields.spreadScoreAtSubmit).toBe(0);
    expect(fields.requiresDualAdmin).toBe(true);
    expect(fields.spreadScoreLockedUntil.toISOString()).toBe('2026-06-02T12:00:00.000Z');
    expect(fields.validUntil.toISOString()).toBe('2026-06-08T12:00:00.000Z');
  });
});
