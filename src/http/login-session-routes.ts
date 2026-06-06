import { randomBytes, randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { TrustedCredentialVerifier } from '../auth/user-auth-resolver.js';
import {
  readUserSessionCookie,
  sha256UserSessionToken,
  USER_SESSION_COOKIE_NAME,
  USER_SESSION_TOKEN_PATTERN,
} from '../auth/session-cookie.js';
import type { UserSessionRepository } from '../user-sessions/repository.js';
import { sendJson } from './json.js';

export const LOGIN_SESSION_COOKIE_NAME = USER_SESSION_COOKIE_NAME;
export const LOGIN_SESSION_ALLOWED_ORIGINS_ENV =
  'LOGIN_SESSION_ALLOWED_ORIGINS_JSON';
export const sha256SessionToken = sha256UserSessionToken;

const RAW_SESSION_TOKEN_BYTES = 32;
const DEFAULT_SESSION_TTL_SECONDS = 12 * 60 * 60;

export type LoginSessionConfig = {
  allowedOrigins: ReadonlySet<string>;
  sessionTtlSeconds?: number;
};

export type LoginSessionRouteOptions = {
  repository: UserSessionRepository;
  trustedCredentialVerifier: TrustedCredentialVerifier;
  config: LoginSessionConfig;
  now?: () => Date;
  generateToken?: () => string;
};

export function createLoginSessionRouteHandlers(options: LoginSessionRouteOptions) {
  const sessionTtlSeconds =
    options.config.sessionTtlSeconds ?? DEFAULT_SESSION_TTL_SECONDS;
  if (!Number.isInteger(sessionTtlSeconds) || sessionTtlSeconds <= 0) {
    throw new Error('Login session TTL must be a positive integer');
  }

  return {
    async handlePostSession(req: IncomingMessage, res: ServerResponse): Promise<void> {
      try {
        assertLoginSessionMutationOrigin(req, options.config);
        const verified = await verifyTrustedCredential(
          req,
          options.trustedCredentialVerifier,
        );
        if (verified === null) {
          sendJson(res, 401, {
            error: 'LOGIN_AUTH_REQUIRED',
            message: 'Login credential verification failed',
          });
          return;
        }

        const user = await options.repository.findUserById(verified.user_id);
        if (!user || user.status !== 'active') {
          sendJson(res, 401, {
            error: 'LOGIN_AUTH_REQUIRED',
            message: 'Login credential verification failed',
          });
          return;
        }

        const now = options.now?.() ?? new Date();
        const expiresAt = new Date(now.getTime() + sessionTtlSeconds * 1000);
        const rawToken = options.generateToken?.() ?? generateRawSessionToken();
        if (!USER_SESSION_TOKEN_PATTERN.test(rawToken)) {
          throw new Error('Generated login session token is invalid');
        }

        await options.repository.insertSession({
          session_id: randomUUID(),
          token_sha256: sha256UserSessionToken(rawToken),
          user_id: user.id,
          created_at: now,
          expires_at: expiresAt,
          revoked_at: null,
          last_used_at: null,
        });

        res.setHeader(
          'Set-Cookie',
          serializeLoginSessionCookie(rawToken, sessionTtlSeconds),
        );
        sendJson(res, 201, {
          authenticated: true,
          expires_at: expiresAt.toISOString(),
        });
      } catch (err) {
        handleLoginSessionRouteError(res, err);
      }
    },

    async handleDeleteSession(req: IncomingMessage, res: ServerResponse): Promise<void> {
      try {
        assertLoginSessionMutationOrigin(req, options.config);
        const rawToken = readUserSessionCookie(req);
        if (rawToken !== null) {
          const now = options.now?.() ?? new Date();
          const session = await options.repository.findSessionByDigest(
            sha256UserSessionToken(rawToken),
          );
          if (
            session !== null &&
            session.user_status === 'active' &&
            session.revoked_at === null &&
            session.expires_at.getTime() > now.getTime()
          ) {
            await options.repository.revokeSession(session.session_id, now);
          }
        }

        res.setHeader('Set-Cookie', serializeClearedLoginSessionCookie());
        res.statusCode = 204;
        res.end();
      } catch (err) {
        handleLoginSessionRouteError(res, err);
      }
    },
  };
}

export function createLoginSessionConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): LoginSessionConfig {
  return {
    allowedOrigins: parseAllowedOrigins(env[LOGIN_SESSION_ALLOWED_ORIGINS_ENV]),
  };
}

function generateRawSessionToken(): string {
  return randomBytes(RAW_SESSION_TOKEN_BYTES).toString('base64url');
}

function serializeLoginSessionCookie(token: string, maxAgeSeconds: number): string {
  return [
    `${LOGIN_SESSION_COOKIE_NAME}=${token}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${maxAgeSeconds}`,
  ].join('; ');
}

function serializeClearedLoginSessionCookie(): string {
  return [
    `${LOGIN_SESSION_COOKIE_NAME}=`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Path=/',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
  ].join('; ');
}

function assertLoginSessionMutationOrigin(
  req: IncomingMessage,
  config: LoginSessionConfig,
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

function parseAllowedOrigins(raw: string | undefined): ReadonlySet<string> {
  if (raw === undefined || raw.trim() === '') {
    return new Set();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`${LOGIN_SESSION_ALLOWED_ORIGINS_ENV} must be valid JSON`);
  }
  if (!Array.isArray(parsed) || parsed.some((origin) => typeof origin !== 'string')) {
    throw new Error(`${LOGIN_SESSION_ALLOWED_ORIGINS_ENV} must be a JSON string array`);
  }

  const origins = new Set<string>();
  for (const origin of parsed) {
    let url: URL;
    try {
      url = new URL(origin);
    } catch {
      throw invalidOrigin();
    }
    if (
      (url.protocol !== 'http:' && url.protocol !== 'https:') ||
      url.origin !== origin ||
      url.username !== '' ||
      url.password !== '' ||
      url.pathname !== '/' ||
      url.search !== '' ||
      url.hash !== ''
    ) {
      throw invalidOrigin();
    }
    origins.add(origin);
  }
  return origins;
}

function rejectedOrigin(): Error {
  return new LoginSessionRouteError(
    'LOGIN_SESSION_ORIGIN_REJECTED',
    'Login session mutation origin is not allowed',
    403,
  );
}

function invalidOrigin(): Error {
  return new Error(
    `${LOGIN_SESSION_ALLOWED_ORIGINS_ENV} entries must be exact absolute HTTP(S) origins`,
  );
}

async function verifyTrustedCredential(
  req: IncomingMessage,
  verifier: TrustedCredentialVerifier,
): Promise<{ user_id: string } | null> {
  try {
    return await verifier(req);
  } catch {
    return null;
  }
}

class LoginSessionRouteError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
  }
}

function handleLoginSessionRouteError(res: ServerResponse, err: unknown): void {
  if (err instanceof LoginSessionRouteError) {
    sendJson(res, err.statusCode, { error: err.code, message: err.message });
    return;
  }
  sendJson(res, 500, { error: 'INTERNAL_ERROR', message: 'Internal server error' });
}
