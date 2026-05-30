import { InvalidFeedCursorError, InvalidFeedLimitError } from './errors.js';
import { FEED_DEFAULT_LIMIT, FEED_MAX_LIMIT } from './feed-config.js';

const CURSOR_VERSION_PREFIX = 'v1.';
const POLL_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type PublicFeedCursorKeyset = {
  publishedAt: Date;
  pollId: string;
};

export function parseFeedLimit(value: number | string | undefined): number {
  if (value === undefined) {
    return FEED_DEFAULT_LIMIT;
  }
  const parsed =
    typeof value === 'number' ? value : Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > FEED_MAX_LIMIT) {
    throw new InvalidFeedLimitError();
  }
  return parsed;
}

export function encodeFeedCursor(publishedAt: Date, pollId: string): string {
  const payload = JSON.stringify({
    p: publishedAt.toISOString(),
    i: pollId,
  });
  return `${CURSOR_VERSION_PREFIX}${Buffer.from(payload, 'utf8').toString('base64url')}`;
}

export function decodeFeedCursor(cursor: string): PublicFeedCursorKeyset {
  if (!cursor.startsWith(CURSOR_VERSION_PREFIX)) {
    throw new InvalidFeedCursorError();
  }
  const encoded = cursor.slice(CURSOR_VERSION_PREFIX.length);
  if (!encoded) {
    throw new InvalidFeedCursorError();
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    throw new InvalidFeedCursorError();
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('p' in parsed) ||
    !('i' in parsed) ||
    typeof parsed.p !== 'string' ||
    typeof parsed.i !== 'string'
  ) {
    throw new InvalidFeedCursorError();
  }
  const publishedAt = new Date(parsed.p);
  if (Number.isNaN(publishedAt.getTime())) {
    throw new InvalidFeedCursorError();
  }
  if (!POLL_ID_PATTERN.test(parsed.i)) {
    throw new InvalidFeedCursorError();
  }
  return { publishedAt, pollId: parsed.i };
}
