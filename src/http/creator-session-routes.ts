import type { IncomingMessage, ServerResponse } from 'node:http';
import type { CreatorSessionConfig } from '../creator-sessions/config.js';
import { CreatorSessionError } from '../creator-sessions/errors.js';
import type { CreatorSessionPrincipal, CreatorSessionService } from '../creator-sessions/service.js';
import {
  assertCreatorMutationOrigin,
  authenticateCreatorRequest,
  CREATOR_SESSION_COOKIE_NAME,
  readCreatorSessionCookie,
} from './creator-auth.js';
import { readJsonBody, sendJson } from './json.js';

export { CREATOR_SESSION_COOKIE_NAME } from './creator-auth.js';
const CREATOR_SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;

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
        sendJson(res, 200, toSessionResponse(await authenticateCreatorRequest(req, service)));
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

function issuerUnavailable(): CreatorSessionError {
  return new CreatorSessionError(
    'CREATOR_SESSION_ISSUER_UNAVAILABLE',
    'Creator session issuer is unavailable',
    503,
  );
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
