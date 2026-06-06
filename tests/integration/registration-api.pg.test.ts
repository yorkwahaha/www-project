import type { Server } from 'node:http';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { TrustedCredentialVerifier } from '../../src/auth/user-auth-resolver.js';
import { createHttpServer } from '../../src/http/server.js';
import { createPgPollRepository } from '../../src/polls/repository.js';
import { createPollService } from '../../src/polls/service.js';
import {
  applyMigrations,
  createIntegrationPool,
  truncateBusinessTables,
} from '../helpers/pg-integration.js';

const userId = '11111111-1111-4111-8111-111111111111';
const registrationOrigin = 'https://www.test';
const registrationToken = 'trusted-registration-token';

async function withServer<T>(server: Server, run: (baseUrl: string) => Promise<T>) {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('failed to bind test server');
  try {
    return await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    );
  }
}

async function request(baseUrl: string, body: unknown) {
  const response = await fetch(`${baseUrl}/registration`, {
    method: 'POST',
    headers: {
      Origin: registrationOrigin,
      Authorization: `Bearer ${registrationToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
    setCookie: response.headers.get('set-cookie'),
  };
}

describe('Registration API PostgreSQL integration', () => {
  const pool = createIntegrationPool();
  const verifier: TrustedCredentialVerifier = (req) =>
    req.headers.authorization === `Bearer ${registrationToken}`
      ? { user_id: userId }
      : null;

  async function readStoredUser() {
    const stored = await pool.query<{
      id: string;
      display_name: string;
      birth_year_month: string | null;
      residential_region: string | null;
    }>(
      `SELECT
         id,
         display_name,
         to_char(birth_year_month, 'YYYY-MM-DD') AS birth_year_month,
         residential_region
       FROM users
       WHERE id = $1`,
      [userId],
    );
    return stored.rows;
  }

  beforeAll(async () => {
    await applyMigrations();
  });

  beforeEach(async () => {
    await truncateBusinessTables(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('creates one verifier-backed user row with profile fields and no session cookie', async () => {
    const repository = createPgPollRepository(pool);
    const server = createHttpServer({
      pollService: createPollService(repository),
      registration: {
        repository,
        trustedCredentialVerifier: verifier,
        config: { allowedOrigins: new Set([registrationOrigin]) },
      },
    });

    await withServer(server, async (baseUrl) => {
      const created = await request(baseUrl, {
        display_name: ' PG Registered User ',
        birth_year_month: '1998-07',
        residential_region: ' TW-TPE ',
      });
      expect(created).toEqual({
        status: 201,
        body: { registered: true, login_required: true },
        setCookie: null,
      });
      expect(await readStoredUser()).toEqual([
        {
          id: userId,
          display_name: 'PG Registered User',
          birth_year_month: '1998-07-01',
          residential_region: 'TW-TPE',
        },
      ]);

      const duplicate = await request(baseUrl, {
        display_name: 'Changed User',
        birth_year_month: '2001-02',
        residential_region: 'TW-KHH',
      });
      expect(duplicate).toEqual({
        status: 409,
        body: {
          error: 'REGISTRATION_CONFLICT',
          message: 'Registration cannot be completed for this credential',
        },
        setCookie: null,
      });
      expect(await readStoredUser()).toEqual([
        {
          id: userId,
          display_name: 'PG Registered User',
          birth_year_month: '1998-07-01',
          residential_region: 'TW-TPE',
        },
      ]);
    });
  });
});
