import type { Server } from 'node:http';
import { describe, expect, it } from 'vitest';
import type { TrustedCredentialVerifier } from '../../src/auth/user-auth-resolver.js';
import { createUserAuthResolver } from '../../src/auth/user-auth-resolver.js';
import { createHttpServer } from '../../src/http/server.js';
import { createInMemoryPollRepository } from '../../src/polls/in-memory-repository.js';
import { createPollService } from '../../src/polls/service.js';
import { withServer } from './helpers/admin-http-fixture.js';

const userId = '11111111-1111-4111-8111-111111111111';
const otherUserId = '22222222-2222-4222-8222-222222222222';
const registrationOrigin = 'https://www.test';
const registrationToken = 'trusted-registration-token';
const validBody = {
  display_name: '  Registered User  ',
  birth_year_month: '1998-07',
  residential_region: ' TW-TPE ',
};

function createFixture(options: {
  verifier?: TrustedCredentialVerifier;
  allowedOrigins?: ReadonlySet<string>;
  includeUserAuthResolver?: boolean;
} = {}) {
  const repository = createInMemoryPollRepository();
  const verifier = options.verifier ?? ((req) => {
    return req.headers.authorization === `Bearer ${registrationToken}`
      ? { user_id: userId }
      : null;
  });
  const server = createHttpServer({
    pollService: createPollService(repository),
    ...(options.includeUserAuthResolver
      ? {
          userAuthResolver: createUserAuthResolver({
            mode: 'production',
            trustedCredentialVerifier: verifier,
          }),
        }
      : {}),
    registration: {
      repository,
      trustedCredentialVerifier: verifier,
      config: {
        allowedOrigins: options.allowedOrigins ?? new Set([registrationOrigin]),
      },
    },
  });
  return { repository, server };
}

async function request(
  baseUrl: string,
  method: string,
  path: string,
  options: {
    headers?: Record<string, string>;
    body?: unknown;
  } = {},
): Promise<{
  status: number;
  body: Record<string, unknown> | null;
  setCookie: string | null;
}> {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  return {
    status: response.status,
    body: text === '' ? null : (JSON.parse(text) as Record<string, unknown>),
    setCookie: response.headers.get('set-cookie'),
  };
}

async function register(
  server: Server,
  body: unknown = validBody,
): Promise<ReturnType<typeof request> extends Promise<infer T> ? T : never> {
  return withServer(server, (baseUrl) =>
    request(baseUrl, 'POST', '/registration', {
      headers: {
        Origin: registrationOrigin,
        Authorization: `Bearer ${registrationToken}`,
      },
      body,
    }),
  );
}

describe('production registration route foundation', () => {
  it('creates a user with required profile fields without issuing a session', async () => {
    const fixture = createFixture();
    const response = await register(fixture.server);

    expect(response).toEqual({
      status: 201,
      body: {
        registered: true,
        login_required: true,
      },
      setCookie: null,
    });

    const user = await fixture.repository.findUserById(userId);
    expect(user).toMatchObject({
      id: userId,
      display_name: 'Registered User',
      status: 'active',
      trust_level: 'low',
      residential_region: 'TW-TPE',
    });
    expect(user?.birth_year_month).toEqual(new Date('1998-07-01T00:00:00.000Z'));
  });

  it('keeps the route unavailable unless explicitly configured', async () => {
    const server = createHttpServer({
      pollService: createPollService(createInMemoryPollRepository()),
    });

    await withServer(server, async (baseUrl) => {
      const response = await request(baseUrl, 'POST', '/registration', {
        headers: {
          Origin: registrationOrigin,
          Authorization: `Bearer ${registrationToken}`,
        },
        body: validBody,
      });

      expect(response).toEqual({
        status: 404,
        body: { error: 'NOT_FOUND', message: 'Not found' },
        setCookie: null,
      });
    });
  });

  it('fails closed for missing, rejected, throwing, spoofed, or unsafe origins', async () => {
    for (const verifier of [
      () => null,
      () => {
        throw new Error('verifier unavailable');
      },
    ] satisfies TrustedCredentialVerifier[]) {
      const fixture = createFixture({ verifier });
      await withServer(fixture.server, async (baseUrl) => {
        const response = await request(baseUrl, 'POST', '/registration', {
          headers: {
            Origin: registrationOrigin,
            'X-User-Id': userId,
            Cookie: 'creator_session=local-demo-token',
          },
          body: validBody,
        });

        expect(response).toEqual({
          status: 401,
          body: {
            error: 'REGISTRATION_AUTH_REQUIRED',
            message: 'Registration credential verification failed',
          },
          setCookie: null,
        });
        expect(await fixture.repository.findUserById(userId)).toBeNull();
      });
    }

    const fixture = createFixture();
    await withServer(fixture.server, async (baseUrl) => {
      for (const origin of [undefined, 'not-an-origin', 'https://other.test']) {
        const response = await request(baseUrl, 'POST', '/registration', {
          headers: {
            ...(origin === undefined ? {} : { Origin: origin }),
            Authorization: `Bearer ${registrationToken}`,
          },
          body: validBody,
        });
        expect(response.status).toBe(403);
        expect(response.body).toEqual({
          error: 'REGISTRATION_ORIGIN_REJECTED',
          message: 'Registration origin is not allowed',
        });
      }
      expect(await fixture.repository.findUserById(userId)).toBeNull();
    });
  });

  it('rejects missing, malformed, precise, or sensitive fields with neutral errors', async () => {
    const fixture = createFixture();

    await withServer(fixture.server, async (baseUrl) => {
      for (const body of [
        { ...validBody, display_name: '' },
        { ...validBody, display_name: ' '.repeat(2) },
        { ...validBody, display_name: 123 },
        { ...validBody, display_name: `User${String.fromCharCode(7)}` },
        { ...validBody, display_name: 'Line\nBreak' },
        { ...validBody, birth_year_month: '' },
        { ...validBody, birth_year_month: '1998' },
        { ...validBody, birth_year_month: '1998-7' },
        { ...validBody, birth_year_month: '1998-00' },
        { ...validBody, birth_year_month: '1998-13' },
        { ...validBody, birth_year_month: '1998-07-01' },
        { ...validBody, birth_year_month: 199807 },
        { ...validBody, residential_region: 'Taipei Road 1' },
        { ...validBody, residential_region: '12 Example Street' },
        { ...validBody, residential_region: '25.0330,121.5654' },
        { ...validBody, residential_region: 'TW TPE' },
        { ...validBody, residential_region: 'tw-tpe' },
        { ...validBody, residential_region: `TW-${'A'.repeat(63)}` },
        { ...validBody, residential_region: 123 },
        { ...validBody, gender: 'x' },
        { ...validBody, exact_birthday: '1998-07-12' },
        { ...validBody, birthday: '1998-07-12' },
        { ...validBody, date_of_birth: '1998-07-12' },
        { ...validBody, address: 'x' },
        { ...validBody, precise_location: 'x' },
        { ...validBody, latitude: 25.033 },
        { ...validBody, longitude: 121.565 },
        { ...validBody, option_id: 'x' },
        { ...validBody, option_text: 'x' },
        { ...validBody, selected_option_index: 0 },
        { ...validBody, session_id: 'x' },
        { ...validBody, token: 'x' },
        { ...validBody, token_sha256: 'x' },
        { ...validBody, cookie: 'x' },
        { ...validBody, www_session: 'x' },
        { ...validBody, credential_proof: registrationToken },
        { birth_year_month: '1998-07', residential_region: 'TW-TPE' },
        { display_name: 'Registered User', residential_region: 'TW-TPE' },
        { display_name: 'Registered User', birth_year_month: '1998-07' },
        {},
        null,
      ]) {
        const response = await request(baseUrl, 'POST', '/registration', {
          headers: {
            Origin: registrationOrigin,
            Authorization: `Bearer ${registrationToken}`,
          },
          body,
        });

        expect(response).toEqual({
          status: 400,
          body: {
            error: 'REGISTRATION_VALIDATION',
            message: 'Invalid registration payload',
          },
          setCookie: null,
        });
      }

      expect(await fixture.repository.findUserById(userId)).toBeNull();
    });
  });

  it('returns a conflict for duplicate credentials without changing existing profile data', async () => {
    const fixture = createFixture();
    const first = await register(fixture.server);
    expect(first.status).toBe(201);

    const second = await register(fixture.server, {
      display_name: 'Changed User',
      birth_year_month: '2001-02',
      residential_region: 'TW-KHH',
    });

    expect(second).toEqual({
      status: 409,
      body: {
        error: 'REGISTRATION_CONFLICT',
        message: 'Registration cannot be completed for this credential',
      },
      setCookie: null,
    });

    const user = await fixture.repository.findUserById(userId);
    expect(user?.display_name).toBe('Registered User');
    expect(user?.birth_year_month).toEqual(new Date('1998-07-01T00:00:00.000Z'));
    expect(user?.residential_region).toBe('TW-TPE');
  });

  it('does not expose profile fields through users/me after registration', async () => {
    const fixture = createFixture({ includeUserAuthResolver: true });
    const registered = await register(fixture.server);
    expect(registered.status).toBe(201);

    await withServer(fixture.server, async (baseUrl) => {
      const response = await request(baseUrl, 'GET', '/users/me', {
        headers: { Authorization: `Bearer ${registrationToken}` },
      });
      const serialized = JSON.stringify(response.body);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        user_id: userId,
        display_name: 'Registered User',
      });
      expect(serialized).not.toMatch(
        /birth_year_month|residential_region|credential|token_sha256|session_id|www_session|cookie/i,
      );
      expect(serialized).not.toMatch(
        /gender|address|location|vote|poll_id|option_id|option_text|option_index|shard/i,
      );
    });
  });

  it('uses only the verifier-resolved user id, not body, header, or creator-session identity', async () => {
    const fixture = createFixture({
      verifier: () => ({ user_id: otherUserId }),
    });
    await withServer(fixture.server, async (baseUrl) => {
      const response = await request(baseUrl, 'POST', '/registration', {
        headers: {
          Origin: registrationOrigin,
          Authorization: `Bearer ${registrationToken}`,
          'X-User-Id': userId,
          Cookie: 'creator_session=local-demo-token',
        },
        body: validBody,
      });

      expect(response.status).toBe(201);
      expect(await fixture.repository.findUserById(userId)).toBeNull();
      expect(await fixture.repository.findUserById(otherUserId)).toMatchObject({
        id: otherUserId,
        display_name: 'Registered User',
      });
    });
  });
});
