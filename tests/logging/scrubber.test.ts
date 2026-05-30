import { describe, expect, it } from 'vitest';
import {
  scrubLogPayload,
  serializedPayloadIsScrubClean,
  payloadContainsForbiddenKey,
  scrubReferenceAnswerRequestBody,
} from '../../src/logging/scrubber.js';

describe('scrubLogPayload', () => {
  it('removes option_id and does not retain user-option linkage fields', () => {
    const input = {
      request_id: 'req-1',
      user_id: 'user-42',
      poll_id: 'poll-9',
      option_id: 'opt-secret',
      success: false,
      latency_ms: 12,
    };

    const output = scrubLogPayload(input) as Record<string, unknown>;

    expect(output).not.toHaveProperty('option_id');
    expect(payloadContainsForbiddenKey(output)).toBe(false);
    expect(serializedPayloadIsScrubClean(output)).toBe(true);

    expect(output.request_id).toBe('req-1');
    expect(output.user_id).toBe('user-42');
    expect(output.poll_id).toBe('poll-9');
    expect(output.latency_ms).toBe(12);
  });

  it('scrubs nested option fields and raw body without adding linkage', () => {
    const input = {
      request_id: 'req-2',
      session_id: 'sess-1',
      poll_id: 'poll-1',
      error: {
        message: 'validation failed',
        body: { option_id: 'opt-1', option_text: 'Yes' },
      },
    };

    const output = scrubLogPayload(input) as Record<string, unknown>;
    const err = output.error as Record<string, unknown>;

    expect(serializedPayloadIsScrubClean(output)).toBe(true);
    expect(err.body).toBe('[redacted]');
    expect(JSON.stringify(output)).not.toContain('opt-1');
  });

  it('redacts Reference Answer request body before diagnostics', () => {
    const output = scrubReferenceAnswerRequestBody({
      option_id: 'opt-secret',
      answer_payload: { selected_option_index: 1 },
    });

    expect(output).toEqual({ body: '[redacted]' });
    expect(JSON.stringify(output)).not.toContain('opt-secret');
    expect(serializedPayloadIsScrubClean(output)).toBe(true);
  });
});
