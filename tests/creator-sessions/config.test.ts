import { describe, expect, it } from 'vitest';
import {
  APP_ENV,
  CREATOR_SESSION_ALLOWED_ORIGINS_ENV,
  CREATOR_SESSION_ALLOW_INSECURE_COOKIE_ENV,
  CREATOR_SESSION_LOCAL_TEST_ISSUER_ENABLED_ENV,
  createCreatorSessionConfigFromEnv,
} from '../../src/creator-sessions/config.js';

describe('creator session config', () => {
  it('defaults to production-safe fail-closed settings', () => {
    expect(createCreatorSessionConfigFromEnv({})).toEqual({
      environment: 'production',
      allowedOrigins: new Set(),
      allowInsecureCookie: false,
      localTestIssuerEnabled: false,
      secureCookie: true,
    });
  });

  it('permits explicitly gated local issuer and insecure cookies outside production', () => {
    expect(
      createCreatorSessionConfigFromEnv({
        [APP_ENV]: 'test',
        [CREATOR_SESSION_ALLOWED_ORIGINS_ENV]: '["http://127.0.0.1:3000"]',
        [CREATOR_SESSION_ALLOW_INSECURE_COOKIE_ENV]: 'true',
        [CREATOR_SESSION_LOCAL_TEST_ISSUER_ENABLED_ENV]: 'true',
      }),
    ).toEqual({
      environment: 'test',
      allowedOrigins: new Set(['http://127.0.0.1:3000']),
      allowInsecureCookie: true,
      localTestIssuerEnabled: true,
      secureCookie: false,
    });
  });

  it('rejects local issuer or insecure-cookie overrides in production', () => {
    expect(() =>
      createCreatorSessionConfigFromEnv({
        [APP_ENV]: 'production',
        [CREATOR_SESSION_LOCAL_TEST_ISSUER_ENABLED_ENV]: 'true',
      }),
    ).toThrow(/must not be enabled in production/);

    expect(() =>
      createCreatorSessionConfigFromEnv({
        [APP_ENV]: 'production',
        [CREATOR_SESSION_ALLOW_INSECURE_COOKIE_ENV]: 'true',
      }),
    ).toThrow(/must not be enabled in production/);
  });

  it('requires exact absolute origins and HTTPS origins in production', () => {
    expect(() =>
      createCreatorSessionConfigFromEnv({
        [APP_ENV]: 'test',
        [CREATOR_SESSION_ALLOWED_ORIGINS_ENV]: '["http://example.test/path"]',
      }),
    ).toThrow(/exact absolute HTTP\(S\) origins/);

    expect(() =>
      createCreatorSessionConfigFromEnv({
        [APP_ENV]: 'production',
        [CREATOR_SESSION_ALLOWED_ORIGINS_ENV]: '["http://example.test"]',
      }),
    ).toThrow(/requires HTTPS in production/);
  });
});
