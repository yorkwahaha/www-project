import type { IncomingMessage } from 'node:http';
import type { CreatorSessionConfig } from '../creator-sessions/config.js';
import { CreatorSessionError, invalidCreatorSession } from '../creator-sessions/errors.js';
import type {
  CreatorSessionPrincipal,
  CreatorSessionService,
} from '../creator-sessions/service.js';

export const CREATOR_SESSION_COOKIE_NAME = 'creator_session';
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function readCreatorSessionCookie(req: IncomingMessage): string {
  const raw = req.headers.cookie;
  if (raw === undefined || Array.isArray(raw)) {
    throw invalidCreatorSession();
  }

  const matches: string[] = [];
  for (const segment of raw.split(';')) {
    const trimmed = segment.trim();
    const separator = trimmed.indexOf('=');
    if (separator < 1) {
      continue;
    }
    if (trimmed.slice(0, separator) === CREATOR_SESSION_COOKIE_NAME) {
      matches.push(trimmed.slice(separator + 1));
    }
  }
  if (matches.length !== 1 || !TOKEN_PATTERN.test(matches[0]!)) {
    throw invalidCreatorSession();
  }
  return matches[0]!;
}

export function authenticateCreatorRequest(
  req: IncomingMessage,
  service: CreatorSessionService,
): Promise<CreatorSessionPrincipal> {
  return service.authenticateToken(readCreatorSessionCookie(req));
}

export function assertCreatorMutationOrigin(
  req: IncomingMessage,
  config: CreatorSessionConfig,
): void {
  const raw = req.headers.origin;
  if (raw === undefined || Array.isArray(raw) || !config.allowedOrigins.has(raw)) {
    throw rejectedOrigin();
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw rejectedOrigin();
  }
  if (url.origin !== raw || (url.protocol !== 'http:' && url.protocol !== 'https:')) {
    throw rejectedOrigin();
  }
}

function rejectedOrigin(): CreatorSessionError {
  return new CreatorSessionError(
    'CREATOR_SESSION_ORIGIN_REJECTED',
    'Creator session mutation origin is not allowed',
    403,
  );
}
