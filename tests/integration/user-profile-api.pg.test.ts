import type { Server } from 'node:http';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createHttpServer } from '../../src/http/server.js';
import { createPgPollRepository } from '../../src/polls/repository.js';
import { createPollService } from '../../src/polls/service.js';
import {
  applyMigrations,
  createIntegrationPool,
  truncateBusinessTables,
} from '../helpers/pg-integration.js';

const userId = '11111111-1111-4111-8111-111111111111';

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

async function request(baseUrl: string, method: 'GET' | 'PUT', body?: unknown) {
  const response = await fetch(`${baseUrl}/users/me/profile`, {
    method,
    headers: {
      'X-User-Id': userId,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
  };
}

describe('User profile API PostgreSQL integration', () => {
  const pool = createIntegrationPool();

  async function readStoredProfile() {
    const stored = await pool.query<{
      birth_year_month: string | null;
      residential_region: string | null;
    }>(
      `SELECT
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

  it('updates, reads, clears, and rejects invalid payloads without partial profile writes', async () => {
    const repository = createPgPollRepository(pool);
    await repository.ensureUser(userId, 'Profile User');
    const server = createHttpServer({ pollService: createPollService(repository) });

    await withServer(server, async (baseUrl) => {
      const updated = await request(baseUrl, 'PUT', {
        birth_year_month: '1998-07',
        residential_region: ' TW-TPE ',
      });
      const readBack = await request(baseUrl, 'GET');

      expect(updated).toEqual({
        status: 200,
        body: { birth_year_month: '1998-07', residential_region: 'TW-TPE' },
      });
      expect(readBack).toEqual(updated);

      let stored = await readStoredProfile();
      expect(stored).toEqual([
        { birth_year_month: '1998-07-01', residential_region: 'TW-TPE' },
      ]);

      const invalid = await request(baseUrl, 'PUT', {
        birth_year_month: '1999-08',
        residential_region: 'Taipei Road 1',
      });
      expect(invalid).toEqual({
        status: 400,
        body: { error: 'POLL_VALIDATION', message: 'Invalid profile payload' },
      });
      stored = await readStoredProfile();
      expect(stored).toEqual([
        { birth_year_month: '1998-07-01', residential_region: 'TW-TPE' },
      ]);

      const cleared = await request(baseUrl, 'PUT', {
        birth_year_month: null,
        residential_region: null,
      });
      expect(cleared).toEqual({
        status: 200,
        body: { birth_year_month: null, residential_region: null },
      });
      stored = await readStoredProfile();
      expect(stored).toEqual([
        { birth_year_month: null, residential_region: null },
      ]);
    });
  });
});
