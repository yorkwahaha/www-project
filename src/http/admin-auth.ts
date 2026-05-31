import { createHash, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { AdminRouteError } from './admin-error.js';

export const ADMIN_AUTH_CREDENTIALS_ENV = 'ADMIN_AUTH_CREDENTIALS_JSON';

const ADMIN_PERMISSIONS = ['correction:read', 'correction:write'] as const;
const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export type AdminCredentialConfig = {
  token_sha256: string;
  admin_user_id: string;
  role: 'admin';
  permissions: AdminPermission[];
};

export type AdminPrincipal = {
  adminUserId: string;
  role: 'admin';
  permissions: ReadonlySet<AdminPermission>;
};

export type AdminAuth = {
  authenticate(req: IncomingMessage): AdminPrincipal;
  requirePermission(
    principal: AdminPrincipal,
    permission: AdminPermission,
  ): string;
};

export function createAdminAuth(credentials: AdminCredentialConfig[]): AdminAuth {
  const normalizedCredentials = credentials.map(normalizeCredential);
  if (normalizedCredentials.length === 0) {
    throw new Error(`${ADMIN_AUTH_CREDENTIALS_ENV} must not be empty`);
  }
  const uniqueDigests = new Set(
    normalizedCredentials.map((credential) => credential.tokenDigest.toString('hex')),
  );
  if (uniqueDigests.size !== normalizedCredentials.length) {
    throw new Error(`${ADMIN_AUTH_CREDENTIALS_ENV} contains duplicate token_sha256`);
  }

  return {
    authenticate(req) {
      const token = readBearerToken(req);
      const digest = Buffer.from(sha256AdminToken(token), 'hex');
      let credential: (typeof normalizedCredentials)[number] | undefined;
      for (const candidate of normalizedCredentials) {
        if (timingSafeEqual(digest, candidate.tokenDigest)) {
          credential = candidate;
        }
      }
      if (!credential) {
        throw invalidCredential();
      }
      return {
        adminUserId: credential.adminUserId,
        role: credential.role,
        permissions: credential.permissions,
      };
    },

    requirePermission(principal, permission) {
      if (principal.role !== 'admin' || !principal.permissions.has(permission)) {
        throw new AdminRouteError(
          'ADMIN_FORBIDDEN',
          'Admin permission is required',
          403,
        );
      }
      return principal.adminUserId;
    },
  };
}

export function createAdminAuthFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): AdminAuth {
  const raw = env[ADMIN_AUTH_CREDENTIALS_ENV]?.trim();
  if (!raw) {
    throw new Error(`${ADMIN_AUTH_CREDENTIALS_ENV} is required`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`${ADMIN_AUTH_CREDENTIALS_ENV} must be valid JSON`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error(`${ADMIN_AUTH_CREDENTIALS_ENV} must be a JSON array`);
  }
  return createAdminAuth(parsed as AdminCredentialConfig[]);
}

export function sha256AdminToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

function readBearerToken(req: IncomingMessage): string {
  const raw = req.headers.authorization;
  if (raw === undefined || raw === '') {
    throw new AdminRouteError(
      'ADMIN_AUTH_REQUIRED',
      'Admin credentials are required',
      401,
    );
  }
  if (Array.isArray(raw)) {
    throw invalidCredential();
  }
  const match = raw.match(/^Bearer ([^\s]+)$/);
  if (!match) {
    throw invalidCredential();
  }
  return match[1]!;
}

function normalizeCredential(config: AdminCredentialConfig): {
  tokenDigest: Buffer;
  adminUserId: string;
  role: 'admin';
  permissions: ReadonlySet<AdminPermission>;
} {
  if (
    typeof config !== 'object' ||
    config === null ||
    typeof config.token_sha256 !== 'string' ||
    !SHA256_HEX_PATTERN.test(config.token_sha256) ||
    typeof config.admin_user_id !== 'string' ||
    !UUID_PATTERN.test(config.admin_user_id) ||
    config.role !== 'admin' ||
    !Array.isArray(config.permissions) ||
    config.permissions.some(
      (permission) => !ADMIN_PERMISSIONS.includes(permission),
    )
  ) {
    throw new Error(`Invalid ${ADMIN_AUTH_CREDENTIALS_ENV} credential entry`);
  }
  return {
    tokenDigest: Buffer.from(config.token_sha256, 'hex'),
    adminUserId: config.admin_user_id,
    role: config.role,
    permissions: new Set(config.permissions),
  };
}

function invalidCredential(): AdminRouteError {
  return new AdminRouteError(
    'ADMIN_AUTH_INVALID',
    'Invalid admin credentials',
    401,
  );
}
