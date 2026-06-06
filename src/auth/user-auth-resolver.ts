import type { IncomingMessage } from 'node:http';
import { createProductionCredentialVerifierFromEnv } from './production-credential-verifier.js';
import {
  readUserSessionCookie,
  sha256UserSessionToken,
} from './session-cookie.js';
import type { UserSessionRepository } from '../user-sessions/repository.js';

export type UserAuthSource = 'production' | 'local_demo' | 'test';

export type AuthenticatedUserContext = {
  user_id: string;
  source: UserAuthSource;
};

export type TrustedCredentialVerifier = (
  req: IncomingMessage,
) => Promise<{ user_id: string } | null> | { user_id: string } | null;

export type UserAuthResolver = {
  resolveUserAuth(req: IncomingMessage): Promise<AuthenticatedUserContext | null>;
};

export type UserAuthResolverOptions =
  | {
      mode: 'production';
      trustedCredentialVerifier?: TrustedCredentialVerifier;
      userSessionRepository?: UserSessionRepository;
      now?: () => Date;
    }
  | {
      mode: 'local_demo' | 'test';
      allowMvpUserIdHeader?: boolean;
      trustedCredentialVerifier?: TrustedCredentialVerifier;
      userSessionRepository?: UserSessionRepository;
      now?: () => Date;
    };

export function createUserAuthResolver(options: UserAuthResolverOptions): UserAuthResolver {
  return {
    async resolveUserAuth(req: IncomingMessage): Promise<AuthenticatedUserContext | null> {
      const verified = await resolveTrustedCredential(req, options.trustedCredentialVerifier);
      if (verified !== null) {
        const userId = normalizeUserId(verified.user_id);
        return userId === null ? null : { user_id: userId, source: 'production' };
      }

      if (options.mode === 'production') {
        const sessionUserId = await resolveUserSession(
          req,
          options.userSessionRepository,
          options.now?.() ?? new Date(),
        );
        return sessionUserId === null
          ? null
          : { user_id: sessionUserId, source: 'production' };
      }

      if (options.allowMvpUserIdHeader !== true) {
        return null;
      }

      const userId = readMvpUserIdHeader(req);
      return userId === null ? null : { user_id: userId, source: options.mode };
    },
  };
}

function readMvpUserIdHeader(req: IncomingMessage): string | null {
  const raw = req.headers['x-user-id'];
  if (typeof raw !== 'string') {
    return null;
  }
  return normalizeUserId(raw);
}

function normalizeUserId(raw: string): string | null {
  const userId = raw.trim();
  return userId === '' ? null : userId;
}

export function createDefaultTestUserAuthResolver(): UserAuthResolver {
  return createUserAuthResolver({
    mode: 'test',
    allowMvpUserIdHeader: true,
  });
}

export function createUserAuthResolverFromEnv(
  env: NodeJS.ProcessEnv = process.env,
  options: {
    userSessionRepository?: UserSessionRepository;
    now?: () => Date;
  } = {},
): UserAuthResolver {
  const appEnv = parseAppEnvironment(env.APP_ENV);
  if (appEnv === 'production') {
    const trustedCredentialVerifier = createProductionCredentialVerifierFromEnv(env);
    return createUserAuthResolver({
      mode: 'production',
      ...(trustedCredentialVerifier === undefined ? {} : { trustedCredentialVerifier }),
      ...(options.userSessionRepository === undefined
        ? {}
        : { userSessionRepository: options.userSessionRepository }),
      ...(options.now === undefined ? {} : { now: options.now }),
    });
  }
  return createUserAuthResolver({
    mode: appEnv === 'test' ? 'test' : 'local_demo',
    allowMvpUserIdHeader: true,
  });
}

async function resolveTrustedCredential(
  req: IncomingMessage,
  verifier: TrustedCredentialVerifier | undefined,
): Promise<{ user_id: string } | null> {
  if (verifier === undefined) {
    return null;
  }
  try {
    return await verifier(req);
  } catch {
    return null;
  }
}

async function resolveUserSession(
  req: IncomingMessage,
  repository: UserSessionRepository | undefined,
  now: Date,
): Promise<string | null> {
  if (repository === undefined) {
    return null;
  }

  const rawToken = readUserSessionCookie(req);
  if (rawToken === null) {
    return null;
  }

  const session = await repository.findSessionByDigest(sha256UserSessionToken(rawToken));
  if (
    session === null ||
    session.user_status !== 'active' ||
    session.revoked_at !== null ||
    session.expires_at.getTime() <= now.getTime()
  ) {
    return null;
  }

  const markedUsed = await repository.markSessionUsed(session.session_id, now);
  return markedUsed ? session.user_id : null;
}

function parseAppEnvironment(
  raw: string | undefined,
): 'development' | 'test' | 'production' {
  const value = raw?.trim() || 'production';
  if (value === 'development' || value === 'test' || value === 'production') {
    return value;
  }
  throw new Error('APP_ENV must be development, test, or production');
}
