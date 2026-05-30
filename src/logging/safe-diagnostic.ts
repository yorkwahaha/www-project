import {
  payloadContainsForbiddenKey,
  scrubLogPayload,
  scrubReferenceAnswerRequestBody,
} from './scrubber.js';

/** In-process diagnostic sink until a real logger/APM is introduced. */
const diagnosticSink: unknown[] = [];

/**
 * Emit a diagnostic record. Payload must already be scrubbed (no raw option fields).
 */
export function emitSafeDiagnostic(scrubbedPayload: unknown): void {
  if (payloadContainsForbiddenKey(scrubbedPayload)) {
    throw new Error('emitSafeDiagnostic: payload must be scrubbed before emission');
  }
  diagnosticSink.push(scrubbedPayload);
}

export type ReferenceAnswerDiagnosticInput = {
  pollId: string;
  userId: string;
  phase: 'request_received' | 'success' | 'error';
  requestBody?: unknown;
  error?: { code: string; message: string };
};

/** Build and emit a scrubbed Reference Answer diagnostic record. */
export function recordReferenceAnswerDiagnostic(
  input: ReferenceAnswerDiagnosticInput,
): unknown {
  const scrubbedRequest = input.requestBody === undefined
    ? undefined
    : scrubReferenceAnswerRequestBody(input.requestBody);

  const payload = scrubLogPayload(
    {
      route: 'POST /polls/:id/reference-answer',
      poll_id: input.pollId,
      user_id: input.userId,
      phase: input.phase,
      ...(scrubbedRequest === undefined ? {} : { request: scrubbedRequest }),
      ...(input.error === undefined ? {} : { error: input.error }),
    },
    { strict: true },
  );

  emitSafeDiagnostic(payload);
  return payload;
}

/** Test-only: read emitted diagnostics. */
export function getDiagnosticRecordsForTests(): readonly unknown[] {
  return diagnosticSink;
}

/** Test-only: reset diagnostic sink between tests. */
export function clearDiagnosticRecordsForTests(): void {
  diagnosticSink.length = 0;
}
