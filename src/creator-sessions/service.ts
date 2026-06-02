import { createHash, randomBytes } from 'node:crypto';
import type { CreatorSessionConfig } from './config.js';
import { CreatorSessionError, invalidCreatorSession } from './errors.js';
import type {
  CreatorSessionLookupRow,
  CreatorSessionRepository,
} from './repository.js';

export const CREATOR_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export type CreatorSessionPrincipal = {
  userId: string;
  expiresAt: Date;
};

export type CreatorSessionService = {
  issueLocalTestSession(userId: unknown): Promise<{
    cookieToken: string;
    principal: CreatorSessionPrincipal;
  }>;
  authenticateToken(token: string): Promise<CreatorSessionPrincipal>;
  revokeToken(token: string): Promise<void>;
};

export function createCreatorSessionService(
  repository: CreatorSessionRepository,
  config: CreatorSessionConfig,
  options: {
    now?: () => Date;
    generateToken?: () => string;
  } = {},
): CreatorSessionService {
  const now = options.now ?? (() => new Date());
  const generateToken = options.generateToken ?? (() => randomBytes(32).toString('base64url'));

  return {
    async issueLocalTestSession(userId) {
      if (config.environment === 'production' || !config.localTestIssuerEnabled) {
        throw new CreatorSessionError(
          'CREATOR_SESSION_ISSUER_UNAVAILABLE',
          'Creator session issuer is unavailable',
          503,
        );
      }
      if (typeof userId !== 'string' || !UUID_PATTERN.test(userId)) {
        throw new CreatorSessionError(
          'CREATOR_SESSION_FORBIDDEN',
          'Active local test user is required',
          403,
        );
      }
      const user = await repository.findUserById(userId);
      if (!user || user.status !== 'active') {
        throw new CreatorSessionError(
          'CREATOR_SESSION_FORBIDDEN',
          'Active local test user is required',
          403,
        );
      }

      const cookieToken = generateToken();
      assertTokenFormat(cookieToken);
      const createdAt = now();
      const expiresAt = new Date(createdAt.getTime() + CREATOR_SESSION_TTL_MS);
      await repository.insertSession({
        token_sha256: sha256CreatorSessionToken(cookieToken),
        user_id: user.id,
        created_at: createdAt,
        expires_at: expiresAt,
        revoked_at: null,
      });
      return {
        cookieToken,
        principal: { userId: user.id, expiresAt },
      };
    },

    async authenticateToken(token) {
      assertTokenFormat(token);
      const session = await repository.findSessionByDigest(
        sha256CreatorSessionToken(token),
      );
      return requireActiveSession(session, now());
    },

    async revokeToken(token) {
      assertTokenFormat(token);
      const digest = sha256CreatorSessionToken(token);
      requireActiveSession(await repository.findSessionByDigest(digest), now());
      if (!(await repository.revokeSession(digest, now()))) {
        throw invalidCreatorSession();
      }
    },
  };
}

export function sha256CreatorSessionToken(token: string): Buffer {
  return createHash('sha256').update(token, 'utf8').digest();
}

function assertTokenFormat(token: string): void {
  if (!TOKEN_PATTERN.test(token)) {
    throw invalidCreatorSession();
  }
}

function requireActiveSession(
  session: CreatorSessionLookupRow | null,
  now: Date,
): CreatorSessionPrincipal {
  if (
    !session ||
    session.revoked_at !== null ||
    session.expires_at.getTime() <= now.getTime() ||
    session.user_status !== 'active'
  ) {
    throw invalidCreatorSession();
  }
  return { userId: session.user_id, expiresAt: session.expires_at };
}
