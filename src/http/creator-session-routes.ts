import type { IncomingMessage, ServerResponse } from 'node:http';
import type { CreatorSessionConfig } from '../creator-sessions/config.js';
import { CreatorSessionError, invalidCreatorSession } from '../creator-sessions/errors.js';
import type {
  CreatorSessionPrincipal,
  CreatorSessionService,
} from '../creator-sessions/service.js';
import { readJsonBody, sendJson } from './json.js';

export const CREATOR_SESSION_COOKIE_NAME = 'creator_session';
const CREATOR_SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

type LocalTestIssueBody = {
  user_id?: unknown;
};

export function createCreatorSessionRouteHandlers(
  service: CreatorSessionService,
  config: CreatorSessionConfig,
) {
  return {
    async handlePostSession(req: IncomingMessage, res: ServerResponse): Promise<void> {
      try {
        assertCreatorMutationOrigin(req, config);
        if (config.environment === 'production' || !config.localTestIssuerEnabled) {
          throw issuerUnavailable();
        }
        const body = await readJsonBody<LocalTestIssueBody>(req);
        const issued = await service.issueLocalTestSession(body.user_id);
        res.setHeader('Set-Cookie', serializeSessionCookie(issued.cookieToken, config));
        sendJson(res, 201, toSessionResponse(issued.principal));
      } catch (err) {
        handleCreatorSessionRouteError(res, err);
      }
    },

    async handleGetSession(req: IncomingMessage, res: ServerResponse): Promise<void> {
      try {
        sendJson(res, 200, toSessionResponse(await authenticateRequest(req, service)));
      } catch (err) {
        handleCreatorSessionRouteError(res, err);
      }
    },

    async handleDeleteSession(req: IncomingMessage, res: ServerResponse): Promise<void> {
      try {
        assertCreatorMutationOrigin(req, config);
        await service.revokeToken(readCreatorSessionCookie(req));
        res.setHeader('Set-Cookie', serializeClearedSessionCookie(config));
        sendJson(res, 200, { authenticated: false });
      } catch (err) {
        handleCreatorSessionRouteError(res, err);
      }
    },
  };
}

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

function issuerUnavailable(): CreatorSessionError {
  return new CreatorSessionError(
    'CREATOR_SESSION_ISSUER_UNAVAILABLE',
    'Creator session issuer is unavailable',
    503,
  );
}

function authenticateRequest(
  req: IncomingMessage,
  service: CreatorSessionService,
): Promise<CreatorSessionPrincipal> {
  return service.authenticateToken(readCreatorSessionCookie(req));
}

function assertCreatorMutationOrigin(
  req: IncomingMessage,
  config: CreatorSessionConfig,
): void {
  const raw = req.headers.origin;
  if (raw === undefined || Array.isArray(raw) || !config.allowedOrigins.has(raw)) {
    throw new CreatorSessionError(
      'CREATOR_SESSION_ORIGIN_REJECTED',
      'Creator session mutation origin is not allowed',
      403,
    );
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new CreatorSessionError(
      'CREATOR_SESSION_ORIGIN_REJECTED',
      'Creator session mutation origin is not allowed',
      403,
    );
  }
  if (url.origin !== raw || (url.protocol !== 'http:' && url.protocol !== 'https:')) {
    throw new CreatorSessionError(
      'CREATOR_SESSION_ORIGIN_REJECTED',
      'Creator session mutation origin is not allowed',
      403,
    );
  }
}

function serializeSessionCookie(token: string, config: CreatorSessionConfig): string {
  return [
    `${CREATOR_SESSION_COOKIE_NAME}=${token}`,
    'HttpOnly',
    'SameSite=Strict',
    'Path=/creator',
    `Max-Age=${CREATOR_SESSION_MAX_AGE_SECONDS}`,
    ...(config.secureCookie ? ['Secure'] : []),
  ].join('; ');
}

function serializeClearedSessionCookie(config: CreatorSessionConfig): string {
  return [
    `${CREATOR_SESSION_COOKIE_NAME}=`,
    'HttpOnly',
    'SameSite=Strict',
    'Path=/creator',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    ...(config.secureCookie ? ['Secure'] : []),
  ].join('; ');
}

function toSessionResponse(principal: CreatorSessionPrincipal): {
  authenticated: true;
  expires_at: string;
} {
  return {
    authenticated: true,
    expires_at: principal.expiresAt.toISOString(),
  };
}

function handleCreatorSessionRouteError(res: ServerResponse, err: unknown): void {
  if (err instanceof CreatorSessionError) {
    sendJson(res, err.statusCode, { error: err.code, message: err.message });
    return;
  }
  if (err instanceof SyntaxError) {
    sendJson(res, 400, { error: 'INVALID_JSON', message: 'Invalid JSON body' });
    return;
  }
  sendJson(res, 500, { error: 'INTERNAL_ERROR', message: 'Internal server error' });
}
