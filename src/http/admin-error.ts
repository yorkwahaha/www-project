import type { ServerResponse } from 'node:http';
import { AdminError } from '../admin/errors.js';
import { sendJson } from './json.js';

export class AdminRouteError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = 'AdminRouteError';
  }
}

export function handleAdminRouteError(res: ServerResponse, err: unknown): void {
  if (err instanceof AdminRouteError) {
    sendJson(res, err.statusCode, { error: err.code, message: err.message });
    return;
  }
  if (err instanceof AdminError) {
    sendJson(res, err.statusCode, { error: err.code, message: err.message });
    return;
  }
  if (err instanceof SyntaxError) {
    sendJson(res, 400, { error: 'INVALID_JSON', message: 'Invalid JSON body' });
    return;
  }
  sendJson(res, 500, { error: 'INTERNAL_ERROR', message: 'Internal server error' });
}
