import { describe, expect, it } from 'vitest';
import type { CreatorSessionConfig } from '../../src/creator-sessions/config.js';
import { createInMemoryCreatorSessionRepository } from '../../src/creator-sessions/in-memory-repository.js';
import {
  CREATOR_SESSION_TTL_MS,
  createCreatorSessionService,
} from '../../src/creator-sessions/service.js';

const activeUserId = '11111111-1111-4111-8111-111111111111';
const inactiveUserId = '22222222-2222-4222-8222-222222222222';
const token = 'a'.repeat(43);

function config(localTestIssuerEnabled = true): CreatorSessionConfig {
  return {
    environment: 'test',
    allowedOrigins: new Set(['http://creator.test']),
    allowInsecureCookie: true,
    localTestIssuerEnabled,
    secureCookie: false,
  };
}

describe('creator session service', () => {
  it('stores only a digest and enforces fixed absolute 12-hour expiry without refresh', async () => {
    const repository = createInMemoryCreatorSessionRepository();
    repository.seedUser(activeUserId);
    let currentTime = new Date('2026-06-03T00:00:00.000Z');
    const service = createCreatorSessionService(repository, config(), {
      now: () => currentTime,
      generateToken: () => token,
    });

    const issued = await service.issueLocalTestSession(activeUserId);
    const stored = [...repository.sessions.values()][0]!;
    expect(issued.cookieToken).toBe(token);
    expect(stored.token_sha256.toString('utf8')).not.toContain(token);
    expect(stored.expires_at.getTime() - stored.created_at.getTime()).toBe(
      CREATOR_SESSION_TTL_MS,
    );

    currentTime = new Date('2026-06-03T11:59:00.000Z');
    expect(await service.authenticateToken(token)).toEqual({
      userId: activeUserId,
      expiresAt: new Date('2026-06-03T12:00:00.000Z'),
    });
    expect(stored.expires_at).toEqual(new Date('2026-06-03T12:00:00.000Z'));

    currentTime = new Date('2026-06-03T12:00:00.000Z');
    await expect(service.authenticateToken(token)).rejects.toMatchObject({
      code: 'CREATOR_SESSION_INVALID',
      statusCode: 401,
    });
  });

  it('rejects disabled issuer, unknown users, and inactive users', async () => {
    const repository = createInMemoryCreatorSessionRepository();
    repository.seedUser(inactiveUserId, 'suspended');

    await expect(
      createCreatorSessionService(repository, config(false)).issueLocalTestSession(
        activeUserId,
      ),
    ).rejects.toMatchObject({ code: 'CREATOR_SESSION_ISSUER_UNAVAILABLE' });

    const service = createCreatorSessionService(repository, config());
    await expect(service.issueLocalTestSession(activeUserId)).rejects.toMatchObject({
      code: 'CREATOR_SESSION_FORBIDDEN',
    });
    await expect(service.issueLocalTestSession(inactiveUserId)).rejects.toMatchObject({
      code: 'CREATOR_SESSION_FORBIDDEN',
    });
  });

  it('fails closed for injected production issuer config without storing a session', async () => {
    const repository = createInMemoryCreatorSessionRepository();
    repository.seedUser(activeUserId);
    const productionConfig = {
      ...config(),
      environment: 'production' as const,
      localTestIssuerEnabled: true,
    };

    await expect(
      createCreatorSessionService(repository, productionConfig).issueLocalTestSession(
        activeUserId,
      ),
    ).rejects.toMatchObject({ code: 'CREATOR_SESSION_ISSUER_UNAVAILABLE' });
    expect(repository.sessions.size).toBe(0);
  });

  it('rejects unknown, revoked, inactive, and malformed sessions', async () => {
    const repository = createInMemoryCreatorSessionRepository();
    repository.seedUser(activeUserId);
    const service = createCreatorSessionService(repository, config(), {
      generateToken: () => token,
    });
    await service.issueLocalTestSession(activeUserId);

    await expect(service.authenticateToken('b'.repeat(43))).rejects.toMatchObject({
      code: 'CREATOR_SESSION_INVALID',
    });
    await expect(service.authenticateToken('malformed')).rejects.toMatchObject({
      code: 'CREATOR_SESSION_INVALID',
    });

    repository.setUserStatus(activeUserId, 'suspended');
    await expect(service.authenticateToken(token)).rejects.toMatchObject({
      code: 'CREATOR_SESSION_INVALID',
    });
    repository.setUserStatus(activeUserId, 'active');

    await service.revokeToken(token);
    await expect(service.authenticateToken(token)).rejects.toMatchObject({
      code: 'CREATOR_SESSION_INVALID',
    });
  });
});
