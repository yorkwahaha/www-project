import { createHash, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { TrustedCredentialVerifier } from './user-auth-resolver.js';

export const USER_AUTH_CREDENTIALS_ENV = 'USER_AUTH_CREDENTIALS_JSON';

const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ProductionUserCredentialConfig = {
  token_sha256: string;
  user_id: string;
  expires_at: string;
  revoked_at?: string | null;
};

export type ProductionCredentialVerifierOptions = {
  now?: () => Date;
};

export function createProductionCredentialVerifier(
  credentials: ProductionUserCredentialConfig[],
  options: ProductionCredentialVerifierOptions = {},
): TrustedCredentialVerifier {
  const normalizedCredentials = credentials.map(normalizeCredential);
  if (normalizedCredentials.length === 0) {
    throw new Error(`${USER_AUTH_CREDENTIALS_ENV} must not be empty`);
  }
  const uniqueDigests = new Set(
    normalizedCredentials.map((credential) => credential.tokenDigest.toString('hex')),
  );
  if (uniqueDigests.size !== normalizedCredentials.length) {
    throw new Error(`${USER_AUTH_CREDENTIALS_ENV} contains duplicate token_sha256`);
  }

  return (req) => {
    const token = readBearerToken(req);
    if (token === null) {
      return null;
    }

    const digest = Buffer.from(sha256UserCredentialToken(token), 'hex');
    const now = options.now?.() ?? new Date();
    for (const credential of normalizedCredentials) {
      if (
        timingSafeEqual(digest, credential.tokenDigest) &&
        credential.revokedAt === null &&
        credential.expiresAt.getTime() > now.getTime()
      ) {
        return { user_id: credential.userId };
      }
    }
    return null;
  };
}

export function createProductionCredentialVerifierFromEnv(
  env: NodeJS.ProcessEnv = process.env,
  options: ProductionCredentialVerifierOptions = {},
): TrustedCredentialVerifier | undefined {
  const raw = env[USER_AUTH_CREDENTIALS_ENV]?.trim();
  if (!raw) {
    return undefined;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`${USER_AUTH_CREDENTIALS_ENV} must be valid JSON`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error(`${USER_AUTH_CREDENTIALS_ENV} must be a JSON array`);
  }
  return createProductionCredentialVerifier(
    parsed as ProductionUserCredentialConfig[],
    options,
  );
}

export function sha256UserCredentialToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

function readBearerToken(req: IncomingMessage): string | null {
  const raw = req.headers.authorization;
  if (raw === undefined || raw === '' || Array.isArray(raw)) {
    return null;
  }
  const match = raw.match(/^Bearer ([^\s]+)$/);
  return match?.[1] ?? null;
}

function normalizeCredential(config: ProductionUserCredentialConfig): {
  tokenDigest: Buffer;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
} {
  if (
    typeof config !== 'object' ||
    config === null ||
    typeof config.token_sha256 !== 'string' ||
    !SHA256_HEX_PATTERN.test(config.token_sha256) ||
    typeof config.user_id !== 'string' ||
    !UUID_PATTERN.test(config.user_id) ||
    typeof config.expires_at !== 'string'
  ) {
    throw new Error(`Invalid ${USER_AUTH_CREDENTIALS_ENV} credential entry`);
  }

  const expiresAt = parseConfigDate(config.expires_at);
  const revokedAt = config.revoked_at == null ? null : parseConfigDate(config.revoked_at);
  return {
    tokenDigest: Buffer.from(config.token_sha256, 'hex'),
    userId: config.user_id,
    expiresAt,
    revokedAt,
  };
}

function parseConfigDate(raw: string): Date {
  const parsed = new Date(raw);
  if (!Number.isFinite(parsed.getTime())) {
    throw new Error(`Invalid ${USER_AUTH_CREDENTIALS_ENV} credential entry`);
  }
  return parsed;
}
