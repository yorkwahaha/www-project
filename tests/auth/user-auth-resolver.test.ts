import type { IncomingMessage } from 'node:http';
import { describe, expect, it } from 'vitest';
import { createUserAuthResolver } from '../../src/auth/user-auth-resolver.js';

const userId = '11111111-1111-4111-8111-111111111111';

function req(headers: IncomingMessage['headers'] = {}): IncomingMessage {
  return { headers } as IncomingMessage;
}

describe('UserAuthResolver foundation', () => {
  it('fails closed in production when no trusted verifier is configured', async () => {
    const resolver = createUserAuthResolver({ mode: 'production' });

    await expect(
      resolver.resolveUserAuth(req({ 'x-user-id': userId })),
    ).resolves.toBeNull();
  });

  it('does not treat creator_session as production user auth', async () => {
    const resolver = createUserAuthResolver({ mode: 'production' });

    await expect(
      resolver.resolveUserAuth(req({ cookie: 'creator_session=local-demo-token' })),
    ).resolves.toBeNull();
  });

  it('resolves production identity only from an explicit trusted verifier', async () => {
    const resolver = createUserAuthResolver({
      mode: 'production',
      trustedCredentialVerifier: () => ({ user_id: userId }),
    });

    await expect(resolver.resolveUserAuth(req())).resolves.toEqual({
      user_id: userId,
      source: 'production',
    });
  });

  it('allows MVP X-User-Id in local demo only when explicitly configured', async () => {
    const disabled = createUserAuthResolver({ mode: 'local_demo' });
    const enabled = createUserAuthResolver({
      mode: 'local_demo',
      allowMvpUserIdHeader: true,
    });

    await expect(disabled.resolveUserAuth(req({ 'x-user-id': userId }))).resolves.toBeNull();
    await expect(enabled.resolveUserAuth(req({ 'x-user-id': ` ${userId} ` }))).resolves.toEqual({
      user_id: userId,
      source: 'local_demo',
    });
  });

  it('allows MVP X-User-Id in tests only when explicitly configured', async () => {
    const disabled = createUserAuthResolver({ mode: 'test' });
    const enabled = createUserAuthResolver({
      mode: 'test',
      allowMvpUserIdHeader: true,
    });

    await expect(disabled.resolveUserAuth(req({ 'x-user-id': userId }))).resolves.toBeNull();
    await expect(enabled.resolveUserAuth(req({ 'x-user-id': userId }))).resolves.toEqual({
      user_id: userId,
      source: 'test',
    });
  });

  it('ignores forwarded, query, and body-selected identity surfaces', async () => {
    const resolver = createUserAuthResolver({
      mode: 'local_demo',
      allowMvpUserIdHeader: true,
    });

    await expect(
      resolver.resolveUserAuth(
        req({
          'x-forwarded-user': userId,
          'x-authenticated-user-id': userId,
        }),
      ),
    ).resolves.toBeNull();
  });
});
