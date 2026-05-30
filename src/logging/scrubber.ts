/**
 * Logging / metrics / error payload scrubber (spec §14, Phase 0).
 * Removes answer-choice fields and does not emit user-option linkage.
 */

/** Keys removed from structured log payloads (case-sensitive). */
export const SCRUB_FIELD_KEYS = [
  'option_id',
  'option_text',
  'selected_option_index',
  'encrypted_option_id',
  'answer_payload',
  'answer_snapshot',
  'vote_snapshot',
  'result_snapshot',
  'eligibility_snapshot',
  'raw_body',
  'raw_request_body',
  'raw_payload',
] as const;

const SCRUB_KEY_SET = new Set<string>(SCRUB_FIELD_KEYS);

/** Keys whose object values are fully redacted (may contain nested option data). */
const REDACT_VALUE_KEYS = new Set<string>(['body', 'payload', 'request_body']);

const REDACTED = '[redacted]';

export type ScrubOptions = {
  /** When true, reject payloads that still contain forbidden keys after scrub. */
  strict?: boolean;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Deep-scrub a log/metrics/error payload for privacy-safe emission.
 * Does not add identifiers or option fields; only removes or redacts.
 */
export function scrubLogPayload(
  input: unknown,
  options: ScrubOptions = {},
): unknown {
  const scrubbed = scrubValue(input);
  if (options.strict && payloadContainsForbiddenKey(scrubbed)) {
    throw new Error('scrubLogPayload: forbidden key remained after scrub');
  }
  return scrubbed;
}

/** Scrubs the sensitive Reference Answer body before diagnostic boundaries. */
export function scrubReferenceAnswerRequestBody(input: unknown): unknown {
  return scrubLogPayload({ body: input }, { strict: true });
}

/** Scrubs the sensitive Official Vote body before diagnostic boundaries. */
export function scrubOfficialVoteRequestBody(input: unknown): unknown {
  return scrubLogPayload({ body: input }, { strict: true });
}

function scrubValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => scrubValue(item));
  }
  if (!isPlainObject(value)) {
    return value;
  }

  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (SCRUB_KEY_SET.has(key)) {
      continue;
    }
    if (REDACT_VALUE_KEYS.has(key)) {
      out[key] = REDACTED;
      continue;
    }
    out[key] = scrubValue(child);
  }
  return out;
}

/** Returns true if any forbidden key exists anywhere in the structure. */
export function payloadContainsForbiddenKey(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => payloadContainsForbiddenKey(item));
  }
  if (!isPlainObject(value)) {
    return false;
  }
  for (const [key, child] of Object.entries(value)) {
    if (SCRUB_KEY_SET.has(key)) {
      return true;
    }
    if (payloadContainsForbiddenKey(child)) {
      return true;
    }
  }
  return false;
}

/** JSON-safe check: serialized output must not contain scrubbed field names as keys. */
export function serializedPayloadIsScrubClean(value: unknown): boolean {
  const json = JSON.stringify(value);
  for (const key of SCRUB_FIELD_KEYS) {
    if (json.includes(`"${key}"`)) {
      return false;
    }
  }
  return true;
}
