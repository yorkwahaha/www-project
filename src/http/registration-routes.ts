import type { IncomingMessage, ServerResponse } from 'node:http';
import type { TrustedCredentialVerifier } from '../auth/user-auth-resolver.js';
import type { PollRepository } from '../polls/repository.js';
import { readJsonBody, sendJson } from './json.js';

type RegistrationBody = {
  display_name?: unknown;
  birth_year_month?: unknown;
  residential_region?: unknown;
};

export type RegistrationConfig = {
  allowedOrigins: ReadonlySet<string>;
};

export type RegistrationRouteOptions = {
  repository: Pick<PollRepository, 'findUserById' | 'createRegisteredUser'>;
  trustedCredentialVerifier: TrustedCredentialVerifier;
  config: RegistrationConfig;
};

const REGISTRATION_VALIDATION_MESSAGE = 'Invalid registration payload';
const REGISTRATION_BODY_KEYS = [
  'display_name',
  'birth_year_month',
  'residential_region',
] as const;
const DISPLAY_NAME_MAX_LENGTH = 80;
const REGION_PATTERN = /^[A-Z]{2}(?:-[A-Z0-9]{2,8}){1,3}$/;

export function createRegistrationRouteHandlers(options: RegistrationRouteOptions) {
  return {
    async handlePostRegistration(
      req: IncomingMessage,
      res: ServerResponse,
    ): Promise<void> {
      try {
        assertRegistrationMutationOrigin(req, options.config);
        const verified = await verifyTrustedCredential(
          req,
          options.trustedCredentialVerifier,
        );
        if (verified === null) {
          throw new RegistrationRouteError(
            'REGISTRATION_AUTH_REQUIRED',
            'Registration credential verification failed',
            401,
          );
        }

        const userId = normalizeUserId(verified.user_id);
        if (userId === null) {
          throw new RegistrationRouteError(
            'REGISTRATION_AUTH_REQUIRED',
            'Registration credential verification failed',
            401,
          );
        }

        const body = await readJsonBody<RegistrationBody>(req);
        const input = parseRegistrationBody(body);
        const existing = await options.repository.findUserById(userId);
        if (existing !== null) {
          throw new RegistrationRouteError(
            'REGISTRATION_CONFLICT',
            'Registration cannot be completed for this credential',
            409,
          );
        }

        const created = await options.repository.createRegisteredUser({
          userId,
          ...input,
        });
        if (created === null) {
          throw new RegistrationRouteError(
            'REGISTRATION_CONFLICT',
            'Registration cannot be completed for this credential',
            409,
          );
        }

        sendJson(res, 201, {
          registered: true,
          login_required: true,
        });
      } catch (err) {
        handleRegistrationRouteError(res, err);
      }
    },
  };
}

function parseRegistrationBody(body: RegistrationBody): {
  displayName: string;
  birthYearMonth: Date;
  residentialRegion: string;
} {
  if (!isPlainObject(body)) {
    throw invalidRegistrationPayload();
  }
  const keys = Object.keys(body);
  if (
    keys.length !== REGISTRATION_BODY_KEYS.length ||
    REGISTRATION_BODY_KEYS.some((key) => !Object.hasOwn(body, key)) ||
    keys.some(
      (key) =>
        !REGISTRATION_BODY_KEYS.includes(
          key as (typeof REGISTRATION_BODY_KEYS)[number],
        ),
    )
  ) {
    throw invalidRegistrationPayload();
  }
  return {
    displayName: parseDisplayName(body.display_name),
    birthYearMonth: parseBirthYearMonth(body.birth_year_month),
    residentialRegion: parseResidentialRegion(body.residential_region),
  };
}

function parseDisplayName(value: unknown): string {
  if (typeof value !== 'string') {
    throw invalidRegistrationPayload();
  }
  if (/[\u0000-\u001f\u007f]/.test(value)) {
    throw invalidRegistrationPayload();
  }
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (
    trimmed.length === 0 ||
    trimmed.length > DISPLAY_NAME_MAX_LENGTH
  ) {
    throw invalidRegistrationPayload();
  }
  return trimmed;
}

function parseBirthYearMonth(value: unknown): Date {
  if (typeof value !== 'string') {
    throw invalidRegistrationPayload();
  }
  const match = value.match(/^([0-9]{4})-(0[1-9]|1[0-2])$/);
  if (!match) {
    throw invalidRegistrationPayload();
  }
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
}

function parseResidentialRegion(value: unknown): string {
  if (typeof value !== 'string') {
    throw invalidRegistrationPayload();
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 64 || !REGION_PATTERN.test(trimmed)) {
    throw invalidRegistrationPayload();
  }
  return trimmed;
}

function assertRegistrationMutationOrigin(
  req: IncomingMessage,
  config: RegistrationConfig,
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

function normalizeUserId(raw: string): string | null {
  const userId = raw.trim();
  return userId === '' ? null : userId;
}

function rejectedOrigin(): Error {
  return new RegistrationRouteError(
    'REGISTRATION_ORIGIN_REJECTED',
    'Registration origin is not allowed',
    403,
  );
}

function invalidRegistrationPayload(): Error {
  return new RegistrationRouteError(
    'REGISTRATION_VALIDATION',
    REGISTRATION_VALIDATION_MESSAGE,
    400,
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

class RegistrationRouteError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
  }
}

function handleRegistrationRouteError(res: ServerResponse, err: unknown): void {
  if (err instanceof RegistrationRouteError) {
    sendJson(res, err.statusCode, { error: err.code, message: err.message });
    return;
  }
  if (err instanceof SyntaxError) {
    sendJson(res, 400, { error: 'INVALID_JSON', message: 'Invalid JSON body' });
    return;
  }
  sendJson(res, 500, { error: 'INTERNAL_ERROR', message: 'Internal server error' });
}
