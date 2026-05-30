import { AdminError } from './errors.js';

const AUDIT_DEFAULT_LIMIT = 20;
const AUDIT_MAX_LIMIT = 50;
const CURSOR_VERSION_PREFIX = 'v1.';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CorrectionAuditCursorKeyset = {
  submittedAt: Date;
  requestId: string;
};

export function parseCorrectionAuditLimit(value: string | undefined): number {
  if (value === undefined) {
    return AUDIT_DEFAULT_LIMIT;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > AUDIT_MAX_LIMIT) {
    throw new AdminError('INVALID_AUDIT_LIMIT', 'Audit limit must be an integer from 1 to 50');
  }
  return parsed;
}

export function encodeCorrectionAuditCursor(
  submittedAt: Date,
  requestId: string,
): string {
  const payload = JSON.stringify({
    s: submittedAt.toISOString(),
    i: requestId,
  });
  return `${CURSOR_VERSION_PREFIX}${Buffer.from(payload, 'utf8').toString('base64url')}`;
}

export function decodeCorrectionAuditCursor(cursor: string): CorrectionAuditCursorKeyset {
  if (!cursor.startsWith(CURSOR_VERSION_PREFIX)) {
    throw invalidCursor();
  }
  const encoded = cursor.slice(CURSOR_VERSION_PREFIX.length);
  if (!encoded) {
    throw invalidCursor();
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    throw invalidCursor();
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('s' in parsed) ||
    !('i' in parsed) ||
    typeof parsed.s !== 'string' ||
    typeof parsed.i !== 'string'
  ) {
    throw invalidCursor();
  }
  const submittedAt = new Date(parsed.s);
  if (Number.isNaN(submittedAt.getTime()) || !UUID_PATTERN.test(parsed.i)) {
    throw invalidCursor();
  }
  return { submittedAt, requestId: parsed.i };
}

function invalidCursor(): AdminError {
  return new AdminError('INVALID_AUDIT_CURSOR', 'Invalid audit cursor');
}
