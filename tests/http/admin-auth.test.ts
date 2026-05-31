import type { IncomingMessage } from 'node:http';
import { describe, expect, it } from 'vitest';
import {
  ADMIN_AUTH_CREDENTIALS_ENV,
  createAdminAuth,
  createAdminAuthFromEnv,
  sha256AdminToken,
} from '../../src/http/admin-auth.js';
import {
  adminAuthHeaders,
  adminRequest,
  createAdminHttpFixture,
  createAdminHttpServer,
  withServer,
} from './helpers/admin-http-fixture.js';

const adminId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const token = 'phase-12-test-admin-token';

function credential(permissions: Array<'correction:read' | 'correction:write'>) {
  return {
    token_sha256: sha256AdminToken(token),
    admin_user_id: adminId,
    role: 'admin' as const,
    permissions,
  };
}

function requestWithAuthorization(authorization?: string): IncomingMessage {
  return {
    headers: authorization === undefined ? {} : { authorization },
  } as IncomingMessage;
}

describe('Admin Auth v1', () => {
  it('loads SHA-256 credential registry from env and authorizes declared permissions', () => {
    const auth = createAdminAuthFromEnv({
      [ADMIN_AUTH_CREDENTIALS_ENV]: JSON.stringify([
        credential(['correction:read']),
      ]),
    });
    const principal = auth.authenticate(
      requestWithAuthorization(`Bearer ${token}`),
    );

    expect(auth.requirePermission(principal, 'correction:read')).toBe(adminId);
    expect(() => auth.requirePermission(principal, 'correction:write')).toThrow(
      'Admin permission is required',
    );
  });

  it('separates missing and invalid credentials without returning token details', () => {
    const auth = createAdminAuth([credential(['correction:read'])]);

    expect(() => auth.authenticate(requestWithAuthorization())).toThrow(
      'Admin credentials are required',
    );
    expect(() =>
      auth.authenticate(requestWithAuthorization('Bearer wrong-token')),
    ).toThrow('Invalid admin credentials');
  });

  it('rejects malformed or ambiguous credential registries at startup', () => {
    expect(() => createAdminAuthFromEnv({})).toThrow(
      `${ADMIN_AUTH_CREDENTIALS_ENV} is required`,
    );
    expect(() => createAdminAuth([])).toThrow(
      `${ADMIN_AUTH_CREDENTIALS_ENV} must not be empty`,
    );
    expect(() => createAdminAuth([credential(['correction:read']), credential([
      'correction:write',
    ])])).toThrow(`${ADMIN_AUTH_CREDENTIALS_ENV} contains duplicate token_sha256`);
  });

  it('protects the admin prefix while leaving public poll reads unchanged', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const missing = await adminRequest(baseUrl, 'GET', '/admin/not-found');
      expect(missing.status).toBe(401);
      expect(missing.body).toEqual({
        error: 'ADMIN_AUTH_REQUIRED',
        message: 'Admin credentials are required',
      });

      const invalid = await adminRequest(baseUrl, 'GET', '/admin/not-found', {
        headers: { Authorization: 'Bearer private-invalid-token' },
      });
      expect(invalid.status).toBe(401);
      expect(JSON.stringify(invalid.body)).not.toContain('private-invalid-token');

      const authenticated = await adminRequest(
        baseUrl,
        'GET',
        '/admin/not-found',
        { headers: adminAuthHeaders(fixture.adminId) },
      );
      expect(authenticated.status).toBe(404);

      const publicPoll = await fetch(`${baseUrl}/polls/${fixture.pollId}`);
      expect(publicPoll.status).toBe(200);
    });
  });
});
