import type { Server } from 'node:http';
import type { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createAdminCorrectionServices } from '../../src/admin/create-admin-correction-services.js';
import { createHttpServer } from '../../src/http/server.js';
import { createPgPollRepository } from '../../src/polls/repository.js';
import { createPollService } from '../../src/polls/service.js';
import { createPgPublicNoticeRepository } from '../../src/public-notices/repository.js';
import { createPublicNoticeService } from '../../src/public-notices/service.js';
import {
  applyMigrations,
  createIntegrationPool,
  truncateBusinessTables,
} from '../helpers/pg-integration.js';

const creatorId = '11111111-1111-4111-8111-111111111111';
const adminAId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const adminBId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const adminCId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const submittedAt = new Date('2026-06-15T10:00:00.000Z');

const DENIED_KEYS = [
  'admin_id',
  'requester_admin_id',
  'applied_by_admin_id',
  'created_by_admin_id',
  'peer_decisions',
  'final_decisions',
  'reason',
  'reason_code',
  'reason_text',
  'spread_score',
  'spread_score_at_submit',
  'spread_score_locked_until',
  'public_notice_id',
  'title',
  'body',
] as const;

function assertNoDeniedKeys(value: unknown): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      assertNoDeniedKeys(item);
    }
    return;
  }
  if (typeof value !== 'object' || value === null) {
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    expect(DENIED_KEYS).not.toContain(key);
    assertNoDeniedKeys(item);
  }
}

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
  try {
    return await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

async function jsonRequest(
  baseUrl: string,
  method: string,
  path: string,
  adminId: string,
  body?: unknown,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-User-Id': adminId,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
  };
}

async function createFixture(pool: Pool, status: 'active' | 'suspended' = 'active') {
  const pollRepo = createPgPollRepository(pool);
  await pollRepo.ensureUser(creatorId, 'Creator');
  for (const [adminId, name] of [
    [adminAId, 'Admin A'],
    [adminBId, 'Admin B'],
    [adminCId, 'Admin C'],
  ] as const) {
    await pollRepo.ensureUser(adminId, name);
    await pool.query(
      `INSERT INTO admin_users (user_id, role, status)
       VALUES ($1, 'admin', 'active')`,
      [adminId],
    );
  }

  const pollService = createPollService(pollRepo);
  const created = await pollService.createPoll(
    {
      creatorId,
      title: 'PG Audit Original Title',
      description: 'PG audit description',
      category: 'general',
      options: ['Alpha', 'Beta'],
      eligibleRuleId: null,
      closesAt: new Date('2026-12-31T12:00:00.000Z'),
      publish: true,
    },
    'Creator',
  );
  if (status === 'suspended') {
    await pool.query(`UPDATE polls SET status = 'suspended' WHERE id = $1`, [
      created.poll_id,
    ]);
  }

  return {
    pollId: created.poll_id,
    server: createHttpServer({
      pollService,
      adminCorrection: createAdminCorrectionServices(pool, {
        now: () => submittedAt,
      }),
      publicNoticeService: createPublicNoticeService(
        createPgPublicNoticeRepository(pool),
      ),
    }),
  };
}

async function approve(baseUrl: string, requestId: string): Promise<void> {
  for (const adminId of [adminBId, adminCId]) {
    const response = await jsonRequest(
      baseUrl,
      'POST',
      `/admin/correction-requests/${requestId}/decisions`,
      adminId,
      {
        decision: 'approve',
        reason_code: 'PRIVATE_CODE',
        reason_text: 'Private decision text',
      },
    );
    expect(response.status).toBe(200);
  }
}

describe('Admin correction audit HTTP PostgreSQL', () => {
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

  it('reads applied active correction audit without denied governance fields', async () => {
    const fixture = await createFixture(pool);

    await withBoundServer(fixture.server, async (baseUrl) => {
      const created = await jsonRequest(
        baseUrl,
        'POST',
        '/admin/correction-requests',
        adminAId,
        {
          poll_id: fixture.pollId,
          correction_target_field: 'title',
          proposed_text: 'PG Audit Original Titel',
          reason: 'Private request reason',
        },
      );
      expect(created.status).toBe(201);
      const requestId = created.body.request_id as string;

      const firstApprove = await jsonRequest(
        baseUrl,
        'POST',
        `/admin/correction-requests/${requestId}/decisions`,
        adminBId,
        {
          decision: 'approve',
          reason_code: 'PRIVATE_CODE',
          reason_text: 'Private decision text',
        },
      );
      expect(firstApprove.status).toBe(200);

      const pending = await jsonRequest(
        baseUrl,
        'GET',
        `/admin/correction-requests/${requestId}/audit-record`,
        adminCId,
      );
      expect(pending.status).toBe(200);
      expect(pending.body.decision_summary).toEqual({ state: 'pending_blind' });
      assertNoDeniedKeys(pending.body);

      const secondApprove = await jsonRequest(
        baseUrl,
        'POST',
        `/admin/correction-requests/${requestId}/decisions`,
        adminCId,
        { decision: 'approve', reason_code: 'PRIVATE_CODE' },
      );
      expect(secondApprove.status).toBe(200);

      const applied = await jsonRequest(
        baseUrl,
        'POST',
        `/admin/correction-requests/${requestId}/apply`,
        adminAId,
      );
      expect(applied.status).toBe(200);

      const audit = await jsonRequest(
        baseUrl,
        'GET',
        `/admin/correction-requests/${requestId}/audit-record`,
        adminAId,
      );
      expect(audit.status).toBe(200);
      expect(audit.body.decision_summary).toEqual({
        approve_count: 2,
        reject_count: 0,
        quorum_met: true,
        is_finalized: true,
      });
      expect(audit.body.has_public_notice).toBe(false);
      assertNoDeniedKeys(audit.body);

      const list = await jsonRequest(
        baseUrl,
        'GET',
        `/admin/polls/${fixture.pollId}/correction-audit`,
        adminAId,
      );
      expect(list.status).toBe(200);
      expect(list.body.items).toHaveLength(1);
      assertNoDeniedKeys(list.body);

      const globalList = await jsonRequest(
        baseUrl,
        'GET',
        '/admin/correction-audit?status=applied&limit=1',
        adminAId,
      );
      expect(globalList.status).toBe(200);
      expect(globalList.body.items).toEqual([
        {
          request_id: requestId,
          poll_id: fixture.pollId,
          request_status: 'applied',
          correction_target_field: 'title',
          submitted_at: '2026-06-15T10:00:00.000Z',
          valid_until: '2026-06-22T10:00:00.000Z',
          has_public_notice: false,
          correction_log_id: applied.body.correction_log_id,
        },
      ]);
      assertNoDeniedKeys(globalList.body);
    });
  });

  it('derives notice presence for suspended apply without exposing notice content', async () => {
    const fixture = await createFixture(pool, 'suspended');

    await withBoundServer(fixture.server, async (baseUrl) => {
      const created = await jsonRequest(
        baseUrl,
        'POST',
        '/admin/suspended-correction-requests',
        adminAId,
        {
          poll_id: fixture.pollId,
          correction_target_field: 'title',
          proposed_text: 'PG Audit Suspended Titel',
          reason: 'Private request reason',
        },
      );
      expect(created.status).toBe(201);
      const requestId = created.body.request_id as string;

      await approve(baseUrl, requestId);
      const applied = await jsonRequest(
        baseUrl,
        'POST',
        `/admin/suspended-correction-requests/${requestId}/apply`,
        adminAId,
      );
      expect(applied.status).toBe(200);

      const audit = await jsonRequest(
        baseUrl,
        'GET',
        `/admin/correction-requests/${requestId}/audit-record`,
        adminAId,
      );
      expect(audit.status).toBe(200);
      expect(audit.body.has_public_notice).toBe(true);
      assertNoDeniedKeys(audit.body);

      const notices = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM public_notices`,
      );
      expect(notices.rows[0]?.count).toBe('1');

      const publicNotices = await jsonRequest(
        baseUrl,
        'GET',
        `/polls/${fixture.pollId}/public-notices`,
        adminAId,
      );
      expect(publicNotices.status).toBe(200);
      expect(publicNotices.body.notices).toEqual([
        {
          notice_id: applied.body.public_notice_id,
          poll_id: fixture.pollId,
          notice_type: 'suspended_typo_correction_applied',
          title: 'Poll typo correction applied',
          body: [
            'Poll was previously suspended.',
            'Admin typo correction was applied.',
            'Correction did not change semantic direction.',
            'Correction apply time: 2026-06-15T10:00:00.000Z.',
          ].join('\n'),
          created_at: '2026-06-15T10:00:00.000Z',
        },
      ]);
    });
  });
});
