export const APP_ENV = 'APP_ENV';
export const CREATOR_SESSION_ALLOWED_ORIGINS_ENV =
  'CREATOR_SESSION_ALLOWED_ORIGINS_JSON';
export const CREATOR_SESSION_ALLOW_INSECURE_COOKIE_ENV =
  'CREATOR_SESSION_ALLOW_INSECURE_COOKIE';
export const CREATOR_SESSION_LOCAL_TEST_ISSUER_ENABLED_ENV =
  'CREATOR_SESSION_LOCAL_TEST_ISSUER_ENABLED';

export type CreatorSessionEnvironment = 'development' | 'test' | 'production';

export type CreatorSessionConfig = {
  environment: CreatorSessionEnvironment;
  allowedOrigins: ReadonlySet<string>;
  allowInsecureCookie: boolean;
  localTestIssuerEnabled: boolean;
  secureCookie: boolean;
};

export function createCreatorSessionConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): CreatorSessionConfig {
  const environment = parseEnvironment(env[APP_ENV]);
  const allowInsecureCookie = parseBooleanEnv(
    env[CREATOR_SESSION_ALLOW_INSECURE_COOKIE_ENV],
    CREATOR_SESSION_ALLOW_INSECURE_COOKIE_ENV,
  );
  const localTestIssuerEnabled = parseBooleanEnv(
    env[CREATOR_SESSION_LOCAL_TEST_ISSUER_ENABLED_ENV],
    CREATOR_SESSION_LOCAL_TEST_ISSUER_ENABLED_ENV,
  );

  if (environment === 'production' && allowInsecureCookie) {
    throw new Error(
      `${CREATOR_SESSION_ALLOW_INSECURE_COOKIE_ENV} must not be enabled in production`,
    );
  }
  if (environment === 'production' && localTestIssuerEnabled) {
    throw new Error(
      `${CREATOR_SESSION_LOCAL_TEST_ISSUER_ENABLED_ENV} must not be enabled in production`,
    );
  }

  return {
    environment,
    allowedOrigins: parseAllowedOrigins(
      env[CREATOR_SESSION_ALLOWED_ORIGINS_ENV],
      environment,
    ),
    allowInsecureCookie,
    localTestIssuerEnabled,
    secureCookie: environment === 'production' || !allowInsecureCookie,
  };
}

function parseEnvironment(raw: string | undefined): CreatorSessionEnvironment {
  const value = raw?.trim() || 'production';
  if (value === 'development' || value === 'test' || value === 'production') {
    return value;
  }
  throw new Error(`${APP_ENV} must be development, test, or production`);
}

function parseBooleanEnv(raw: string | undefined, name: string): boolean {
  if (raw === undefined || raw.trim() === '') {
    return false;
  }
  if (raw === 'true') {
    return true;
  }
  if (raw === 'false') {
    return false;
  }
  throw new Error(`${name} must be true or false`);
}

function parseAllowedOrigins(
  raw: string | undefined,
  environment: CreatorSessionEnvironment,
): ReadonlySet<string> {
  if (raw === undefined || raw.trim() === '') {
    return new Set();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`${CREATOR_SESSION_ALLOWED_ORIGINS_ENV} must be valid JSON`);
  }
  if (!Array.isArray(parsed) || parsed.some((origin) => typeof origin !== 'string')) {
    throw new Error(`${CREATOR_SESSION_ALLOWED_ORIGINS_ENV} must be a JSON string array`);
  }

  const origins = new Set<string>();
  for (const origin of parsed) {
    let url: URL;
    try {
      url = new URL(origin);
    } catch {
      throw invalidOrigin();
    }
    if (
      (url.protocol !== 'http:' && url.protocol !== 'https:') ||
      url.origin !== origin ||
      url.username !== '' ||
      url.password !== '' ||
      url.pathname !== '/' ||
      url.search !== '' ||
      url.hash !== ''
    ) {
      throw invalidOrigin();
    }
    if (environment === 'production' && url.protocol !== 'https:') {
      throw new Error(`${CREATOR_SESSION_ALLOWED_ORIGINS_ENV} requires HTTPS in production`);
    }
    origins.add(origin);
  }
  return origins;
}

function invalidOrigin(): Error {
  return new Error(
    `${CREATOR_SESSION_ALLOWED_ORIGINS_ENV} entries must be exact absolute HTTP(S) origins`,
  );
}
