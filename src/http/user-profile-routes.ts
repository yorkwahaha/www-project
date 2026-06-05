import type { IncomingMessage, ServerResponse } from 'node:http';
import type { UserAuthResolver } from '../auth/user-auth-resolver.js';
import { PollError, PollValidationError } from '../polls/errors.js';
import type { PollService } from '../polls/service.js';
import type { UpdateUserProfileInput } from '../polls/types.js';
import { readJsonBody, sendJson } from './json.js';

type UserProfileBody = {
  birth_year_month?: unknown;
  residential_region?: unknown;
};

const PROFILE_VALIDATION_MESSAGE = 'Invalid profile payload';
const PROFILE_BODY_KEYS = ['birth_year_month', 'residential_region'] as const;
const REGION_PATTERN = /^[A-Z]{2}(?:-[A-Z0-9]{2,8}){1,3}$/;

const AUTH_REQUIRED_MESSAGE = 'User authentication is required';

export function createUserProfileRouteHandlers(
  pollService: PollService,
  userAuthResolver: UserAuthResolver,
) {
  return {
    async handleGetProfile(req: IncomingMessage, res: ServerResponse): Promise<void> {
      try {
        const userId = await requireAuthenticatedUserId(req, userAuthResolver);
        sendJson(res, 200, await pollService.getUserProfile(userId));
      } catch (err) {
        handleProfileRouteError(res, err);
      }
    },

    async handlePutProfile(req: IncomingMessage, res: ServerResponse): Promise<void> {
      try {
        const userId = await requireAuthenticatedUserId(req, userAuthResolver);
        const body = await readJsonBody<UserProfileBody>(req);
        sendJson(res, 200, await pollService.updateUserProfile(userId, parseProfileBody(body)));
      } catch (err) {
        handleProfileRouteError(res, err);
      }
    },
  };
}

async function requireAuthenticatedUserId(
  req: IncomingMessage,
  userAuthResolver: UserAuthResolver,
): Promise<string> {
  const auth = await userAuthResolver.resolveUserAuth(req);
  if (auth === null) {
    throw new PollError('AUTH_REQUIRED', AUTH_REQUIRED_MESSAGE, 401);
  }
  return auth.user_id;
}

function parseProfileBody(body: UserProfileBody): UpdateUserProfileInput {
  if (!isPlainObject(body)) {
    throw new PollValidationError(PROFILE_VALIDATION_MESSAGE);
  }
  const keys = Object.keys(body);
  if (
    keys.length !== PROFILE_BODY_KEYS.length ||
    PROFILE_BODY_KEYS.some((key) => !Object.hasOwn(body, key)) ||
    keys.some((key) => !PROFILE_BODY_KEYS.includes(key as (typeof PROFILE_BODY_KEYS)[number]))
  ) {
    throw new PollValidationError(PROFILE_VALIDATION_MESSAGE);
  }
  return {
    birth_year_month: parseBirthYearMonth(body.birth_year_month),
    residential_region: parseResidentialRegion(body.residential_region),
  };
}

function parseBirthYearMonth(value: unknown): Date | null {
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new PollValidationError(PROFILE_VALIDATION_MESSAGE);
  }
  const match = value.match(/^([0-9]{4})-(0[1-9]|1[0-2])$/);
  if (!match) {
    throw new PollValidationError(PROFILE_VALIDATION_MESSAGE);
  }
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
}

function parseResidentialRegion(value: unknown): string | null {
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new PollValidationError(PROFILE_VALIDATION_MESSAGE);
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 64 || !REGION_PATTERN.test(trimmed)) {
    throw new PollValidationError(PROFILE_VALIDATION_MESSAGE);
  }
  return trimmed;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function handleProfileRouteError(res: ServerResponse, err: unknown): void {
  if (err instanceof PollError) {
    sendJson(res, err.statusCode, { error: err.code, message: err.message });
    return;
  }
  if (err instanceof SyntaxError) {
    sendJson(res, 400, { error: 'INVALID_JSON', message: 'Invalid JSON body' });
    return;
  }
  sendJson(res, 500, { error: 'INTERNAL_ERROR', message: 'Internal server error' });
}
