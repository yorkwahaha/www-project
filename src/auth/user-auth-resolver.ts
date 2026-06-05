import type { IncomingMessage } from 'node:http';

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
    }
  | {
      mode: 'local_demo' | 'test';
      allowMvpUserIdHeader?: boolean;
      trustedCredentialVerifier?: TrustedCredentialVerifier;
    };

export function createUserAuthResolver(options: UserAuthResolverOptions): UserAuthResolver {
  return {
    async resolveUserAuth(req: IncomingMessage): Promise<AuthenticatedUserContext | null> {
      const verified = options.trustedCredentialVerifier
        ? await options.trustedCredentialVerifier(req)
        : null;
      if (verified !== null) {
        const userId = normalizeUserId(verified.user_id);
        return userId === null ? null : { user_id: userId, source: 'production' };
      }

      if (options.mode === 'production' || options.allowMvpUserIdHeader !== true) {
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
