import type { Server } from 'node:http';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createAdminCorrectionServices } from '../../src/admin/create-admin-correction-services.js';
import { createHttpServer } from '../../src/http/server.js';
import { createPgPollRepository } from '../../src/polls/repository.js';
import { createPollService } from '../../src/polls/service.js';
import {
  applyMigrations,
  createIntegrationPool,
  truncateBusinessTables,
} from '../helpers/pg-integration.js';
import {
  adminAuthHeaders,
  createTestAdminAuth,
} from '../helpers/admin-auth.js';

const creatorId = '11111111-1111-4111-8111-111111111111';
const adminId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const submittedAt = new Date('2026-06-15T10:00:00.000Z');

async function withBoundServer<T>(
  server: Server,
  run: (baseUrl: string) => Promise<T>,
): Promise<T> {
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('failed to bind test server');
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    return await run(baseUrl);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

describe('Admin correction HTTP PostgreSQL smoke', () => {
  const pool = createIntegrationPool();

  beforeAll(async () => {
    await applyMigrations();
  });

  beforeEach(async () => {
    await truncateBusinessTables(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('POST /admin/correction-requests returns safe DTO; poll stays active; no public notice', async () => {
    const pollRepo = createPgPollRepository(pool);
    await pollRepo.ensureUser(creatorId, 'Creator');
    await pollRepo.ensureUser(adminId, 'Admin');
    await pool.query(
      `INSERT INTO admin_users (user_id, role, status)
       VALUES ($1, 'admin', 'active')`,
      [adminId],
    );

    const pollService = createPollService(pollRepo);
    const created = await pollService.createPoll(
      {
        creatorId,
        title: 'PG HTTP Original Title',
        description: 'PG description',
        category: 'general',
        options: ['Alpha', 'Beta'],
        eligibleRuleId: null,
        closesAt: new Date(Date.now() + 86_400_000),
        publish: true,
      },
      'Creator',
    );

    const server = createHttpServer({
      pollService,
      adminCorrection: createAdminCorrectionServices(pool, {
        now: () => submittedAt,
      }),
      adminAuth: createTestAdminAuth([{ adminId }]),
    });

    await withBoundServer(server, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/admin/correction-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...adminAuthHeaders(adminId),
        },
        body: JSON.stringify({
          poll_id: created.poll_id,
          correction_target_field: 'title',
          proposed_text: 'PG HTTP Original Titel',
          reason: 'Typo',
        }),
      });
      const body = (await response.json()) as Record<string, unknown>;

      expect(response.status).toBe(201);
      expect(body.status).toBe('pending');
      expect(body.requires_dual_admin).toBe(true);
      expect(body.valid_until).toBe('2026-06-22T10:00:00.000Z');
      expect(typeof body.request_id).toBe('string');
      expect(body).not.toHaveProperty('spread_score_at_submit');
      expect(body).not.toHaveProperty('spread_score_locked_until');
      expect(body).not.toHaveProperty('public_notice_id');
      expect(body).not.toHaveProperty('requester_admin_id');
      expect(body).not.toHaveProperty('peer_decisions');

      const pollRow = await pool.query<{ status: string; title: string }>(
        `SELECT status, title FROM polls WHERE id = $1`,
        [created.poll_id],
      );
      expect(pollRow.rows[0]?.status).toBe('active');
      expect(pollRow.rows[0]?.title).toBe('PG HTTP Original Title');

      const notices = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM public_notices`,
      );
      expect(notices.rows[0]?.count).toBe('0');

      const publicGet = await fetch(`${baseUrl}/polls/${created.poll_id}`);
      expect(publicGet.status).toBe(200);
      const publicBody = (await publicGet.json()) as Record<string, unknown>;
      expect(publicBody.poll_id).toBe(created.poll_id);
      expect(publicBody).not.toHaveProperty('option_vote_count');
    });
  });
});
