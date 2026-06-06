import type { IncomingMessage } from 'node:http';
import { describe, expect, it } from 'vitest';
import {
  createProductionCredentialVerifier,
  createProductionCredentialVerifierFromEnv,
  sha256UserCredentialToken,
  USER_AUTH_CREDENTIALS_ENV,
} from '../../src/auth/production-credential-verifier.js';
import { createUserAuthResolverFromEnv } from '../../src/auth/user-auth-resolver.js';

const userId = '11111111-1111-4111-8111-111111111111';
const otherUserId = '22222222-2222-4222-8222-222222222222';
const token = 'production-user-token';

function req(headers: IncomingMessage['headers'] = {}): IncomingMessage {
  return { headers } as IncomingMessage;
}

function credential(
  overrides: Partial<{
    token: string;
    user_id: string;
    expires_at: string;
    revoked_at: string | null;
  }> = {},
) {
  const rawToken = overrides.token ?? token;
  return {
    token_sha256: sha256UserCredentialToken(rawToken),
    user_id: overrides.user_id ?? userId,
    expires_at: overrides.expires_at ?? '2099-01-01T00:00:00.000Z',
    ...(overrides.revoked_at === undefined ? {} : { revoked_at: overrides.revoked_at }),
  };
}

describe('Production credential verifier foundation', () => {
  it('verifies opaque Bearer credentials from a digest registry', async () => {
    const verifier = createProductionCredentialVerifier([credential()]);

    await expect(
      await verifier(req({ authorization: `Bearer ${token}` })),
    ).toEqual({ user_id: userId });
  });

  it('fails closed for missing, malformed, expired, revoked, or unknown credentials', async () => {
    const verifier = createProductionCredentialVerifier(
      [
        credential({ expires_at: '2025-01-01T00:00:00.000Z' }),
        credential({
          token: 'revoked-token',
          user_id: otherUserId,
          revoked_at: '2026-01-01T00:00:00.000Z',
        }),
      ],
      { now: () => new Date('2026-06-06T00:00:00.000Z') },
    );

    await expect(await verifier(req())).toBeNull();
    await expect(await verifier(req({ authorization: 'Basic wrong' }))).toBeNull();
    await expect(await verifier(req({ authorization: `Bearer ${token}` }))).toBeNull();
    await expect(
      await verifier(req({ authorization: 'Bearer revoked-token' })),
    ).toBeNull();
    await expect(
      await verifier(req({ authorization: 'Bearer unknown-token' })),
    ).toBeNull();
  });

  it('does not accept raw X-User-Id or creator_session as production credentials', async () => {
    const verifier = createProductionCredentialVerifier([credential()]);

    await expect(
      await verifier(req({ 'x-user-id': userId, cookie: 'creator_session=local-demo-token' })),
    ).toBeNull();
  });

  it('loads production verifier config from env when explicitly configured', async () => {
    const verifier = createProductionCredentialVerifierFromEnv({
      [USER_AUTH_CREDENTIALS_ENV]: JSON.stringify([credential()]),
    });

    expect(verifier).toBeDefined();
    await expect(
      await verifier!(req({ authorization: `Bearer ${token}` })),
    ).toEqual({ user_id: userId });
  });

  it('returns no verifier when env config is absent so production can fail closed', () => {
    expect(createProductionCredentialVerifierFromEnv({})).toBeUndefined();
  });

  it('rejects malformed, empty, duplicate, or invalid credential registries at startup', () => {
    expect(() =>
      createProductionCredentialVerifierFromEnv({
        [USER_AUTH_CREDENTIALS_ENV]: 'not-json',
      }),
    ).toThrow(`${USER_AUTH_CREDENTIALS_ENV} must be valid JSON`);
    expect(() =>
      createProductionCredentialVerifierFromEnv({
        [USER_AUTH_CREDENTIALS_ENV]: JSON.stringify({ token_sha256: 'x' }),
      }),
    ).toThrow(`${USER_AUTH_CREDENTIALS_ENV} must be a JSON array`);
    expect(() => createProductionCredentialVerifier([])).toThrow(
      `${USER_AUTH_CREDENTIALS_ENV} must not be empty`,
    );
    expect(() =>
      createProductionCredentialVerifier([credential(), credential()]),
    ).toThrow(`${USER_AUTH_CREDENTIALS_ENV} contains duplicate token_sha256`);
    expect(() =>
      createProductionCredentialVerifier([
        { ...credential(), user_id: 'not-a-user-id' },
      ]),
    ).toThrow(`Invalid ${USER_AUTH_CREDENTIALS_ENV} credential entry`);
  });

  it('wires production env verifier through UserAuthResolver and still rejects X-User-Id fallback', async () => {
    const resolver = createUserAuthResolverFromEnv({
      APP_ENV: 'production',
      [USER_AUTH_CREDENTIALS_ENV]: JSON.stringify([credential()]),
    });

    await expect(
      resolver.resolveUserAuth(req({ authorization: `Bearer ${token}` })),
    ).resolves.toEqual({ user_id: userId, source: 'production' });
    await expect(
      resolver.resolveUserAuth(req({ 'x-user-id': userId })),
    ).resolves.toBeNull();
  });
});
