import type { IncomingMessage } from 'node:http';
import { AdminRouteError } from './admin-error.js';

export const ADMIN_USER_ID_HEADER = 'x-admin-user-id';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function requireAdminUserId(req: IncomingMessage): string {
  const raw = req.headers[ADMIN_USER_ID_HEADER];
  if (raw === undefined || raw === '') {
    throw new AdminRouteError(
      'ADMIN_AUTH_REQUIRED',
      'X-Admin-User-Id header is required',
      401,
    );
  }
  const adminUserId = raw.toString().trim();
  if (!UUID_PATTERN.test(adminUserId)) {
    throw new AdminRouteError(
      'INVALID_ADMIN_USER_ID',
      'Invalid X-Admin-User-Id',
      400,
    );
  }
  return adminUserId;
}
