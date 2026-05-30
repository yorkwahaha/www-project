import { describe, expect, it } from 'vitest';
import {
  clearDiagnosticRecordsForTests,
  emitSafeDiagnostic,
  getDiagnosticRecordsForTests,
  recordReferenceAnswerDiagnostic,
  recordOfficialVoteDiagnostic,
} from '../../src/logging/safe-diagnostic.js';
import { scrubLogPayload } from '../../src/logging/scrubber.js';

describe('safe diagnostic', () => {
  it('rejects unscrubbed payloads', () => {
    expect(() =>
      emitSafeDiagnostic({ user_id: 'u1', option_id: 'opt-1' }),
    ).toThrow(/scrubbed/);
  });

  it('records scrubbed Reference Answer diagnostics without option_id', () => {
    clearDiagnosticRecordsForTests();
    const secretOptionId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

    recordReferenceAnswerDiagnostic({
      pollId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      userId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      phase: 'request_received',
      requestBody: { option_id: secretOptionId },
    });

    const records = getDiagnosticRecordsForTests();
    expect(records).toHaveLength(1);
    const json = JSON.stringify(records);
    expect(json).not.toContain(secretOptionId);
    expect(json).not.toContain('option_id');
  });

  it('allows explicitly scrubbed payloads', () => {
    clearDiagnosticRecordsForTests();
    emitSafeDiagnostic(
      scrubLogPayload({ poll_id: 'p1', user_id: 'u1', success: true }),
    );
    expect(getDiagnosticRecordsForTests()).toHaveLength(1);
  });

  it('records scrubbed Official Vote diagnostics without option_id', () => {
    clearDiagnosticRecordsForTests();
    const secretOptionId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

    recordOfficialVoteDiagnostic({
      pollId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      userId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      phase: 'error',
      requestBody: { option_id: secretOptionId },
      error: { code: 'POLL_VALIDATION', message: 'Selected option is invalid.' },
    });

    const json = JSON.stringify(getDiagnosticRecordsForTests());
    expect(json).not.toContain(secretOptionId);
    expect(json).not.toContain('option_id');
  });
});
