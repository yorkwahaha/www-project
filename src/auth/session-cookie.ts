import { createHash } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

export const USER_SESSION_COOKIE_NAME = 'www_session';
export const USER_SESSION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function sha256UserSessionToken(token: string): Buffer {
  return createHash('sha256').update(token, 'utf8').digest();
}

export function readUserSessionCookie(req: IncomingMessage): string | null {
  const raw = req.headers.cookie;
  if (raw === undefined || Array.isArray(raw)) {
    return null;
  }

  const matches: string[] = [];
  for (const segment of raw.split(';')) {
    const trimmed = segment.trim();
    const separator = trimmed.indexOf('=');
    if (separator < 1) {
      continue;
    }
    if (trimmed.slice(0, separator) === USER_SESSION_COOKIE_NAME) {
      matches.push(trimmed.slice(separator + 1));
    }
  }
  if (matches.length !== 1 || !USER_SESSION_TOKEN_PATTERN.test(matches[0]!)) {
    return null;
  }
  return matches[0]!;
}
