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
import {
  adminAuthHeaders,
  createTestAdminAuth,
} from '../helpers/admin-auth.js';

const creatorId = '11111111-1111-4111-8111-111111111111';
const adminAId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const adminBId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const adminCId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const nonAdminCredentialId = '99999999-9999-4999-8999-999999999999';
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
  'correction_target_id',
  'review_context',
  'option_id',
  'user_id',
  'session_id',
  'device_id',
  'vote_token',
  'reference_answer_token',
  'poll_vote_tokens',
  'poll_option_vote_counters',
  'public_user_identity',
  'title',
  'body',
] as const;

const PUBLIC_NOTICE_DENIED_KEYS = [
  'correction_request_id',
  'correction_log_id',
  'correction_target_field',
  'correction_target_id',
  ...DENIED_KEYS.filter((key) => key !== 'title' && key !== 'body'),
] as const;

function assertNoDeniedKeys(
  value: unknown,
  deniedKeys: readonly string[] = DENIED_KEYS,
): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      assertNoDeniedKeys(item, deniedKeys);
    }
    return;
  }
  if (typeof value !== 'object' || value === null) {
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    expect(deniedKeys).not.toContain(key);
    assertNoDeniedKeys(item, deniedKeys);
  }
}

function assertGlobalAuditSafeItems(value: unknown): void {
  expect(Array.isArray(value)).toBe(true);
  for (const item of value as Array<Record<string, unknown>>) {
    expect(Object.keys(item).sort()).toEqual([
      'correction_target_field',
      'has_public_notice',
      'poll_id',
      'request_id',
      'request_status',
      'submitted_at',
      'valid_until',
    ]);
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
  adminId?: string,
  body?: unknown,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(adminId ? adminAuthHeaders(adminId) : {}),
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
    pollService,
    server: createHttpServer({
      pollService,
      adminCorrection: createAdminCorrectionServices(pool, {
        now: () => submittedAt,
      }),
      adminAuth: createTestAdminAuth([
        { adminId: adminAId },
        { adminId: adminBId },
        { adminId: adminCId },
        { adminId: nonAdminCredentialId },
      ]),
      publicNoticeService: createPublicNoticeService(
        createPgPublicNoticeRepository(pool),
      ),
    }),
  };
}

async function createPendingCorrectionRequest(
  baseUrl: string,
  pollId: string,
  proposedText: string,
): Promise<string> {
  const created = await jsonRequest(
    baseUrl,
    'POST',
    '/admin/correction-requests',
    adminAId,
    {
      poll_id: pollId,
      correction_target_field: 'title',
      proposed_text: proposedText,
      reason: 'Private request reason',
    },
  );
  expect(created.status).toBe(201);
  return created.body.request_id as string;
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
      assertNoDeniedKeys(publicNotices.body, PUBLIC_NOTICE_DENIED_KEYS);
    });
  });

  it('keeps unknown, hidden, notice-free, and non-allowlisted public notice rows private', async () => {
    const fixture = await createFixture(pool);
    const noticeId = crypto.randomUUID();

    await withBoundServer(fixture.server, async (baseUrl) => {
      const unknown = await jsonRequest(
        baseUrl,
        'GET',
        `/polls/${crypto.randomUUID()}/public-notices`,
      );
      expect(unknown.status).toBe(200);
      expect(unknown.body).toEqual({ notices: [] });

      const noticeFree = await jsonRequest(
        baseUrl,
        'GET',
        `/polls/${fixture.pollId}/public-notices`,
      );
      expect(noticeFree.status).toBe(200);
      expect(noticeFree.body).toEqual({ notices: [] });

      await pool.query(
        `INSERT INTO public_notices (
           id, poll_id, notice_type, title, body, created_by_admin_id, created_at
         )
         VALUES ($1, $2, 'internal_admin_note', 'Internal title', 'Internal body', $3, $4)`,
        [crypto.randomUUID(), fixture.pollId, adminAId, submittedAt],
      );
      const internalOnly = await jsonRequest(
        baseUrl,
        'GET',
        `/polls/${fixture.pollId}/public-notices`,
      );
      expect(internalOnly.status).toBe(200);
      expect(internalOnly.body).toEqual({ notices: [] });

      await pool.query(
        `INSERT INTO public_notices (
           id, poll_id, notice_type, title, body, created_by_admin_id, created_at
         )
         VALUES ($1, $2, 'suspended_typo_correction_applied', $3, $4, $5, $6)`,
        [noticeId, fixture.pollId, 'Public title', 'Public body', adminAId, submittedAt],
      );
      const visible = await jsonRequest(
        baseUrl,
        'GET',
        `/polls/${fixture.pollId}/public-notices`,
      );
      expect(visible.status).toBe(200);
      expect(visible.body).toEqual({
        notices: [
          {
            notice_id: noticeId,
            poll_id: fixture.pollId,
            notice_type: 'suspended_typo_correction_applied',
            title: 'Public title',
            body: 'Public body',
            created_at: submittedAt.toISOString(),
          },
        ],
      });
      assertNoDeniedKeys(visible.body, PUBLIC_NOTICE_DENIED_KEYS);

      await pool.query(`UPDATE polls SET status = 'suspended' WHERE id = $1`, [
        fixture.pollId,
      ]);
      const hidden = await jsonRequest(
        baseUrl,
        'GET',
        `/polls/${fixture.pollId}/public-notices`,
      );
      expect(hidden.status).toBe(200);
      expect(hidden.body).toEqual({ notices: [] });
    });
  });

  it('paginates the global audit queue with fixed safe ordering and default limit', async () => {
    const fixture = await createFixture(pool);
    const secondPoll = await fixture.pollService.createPoll(
      {
        creatorId,
        title: 'PG Audit Second Poll',
        description: 'PG audit second poll description',
        category: 'general',
        options: ['Alpha', 'Beta'],
        eligibleRuleId: null,
        closesAt: new Date('2026-12-31T12:00:00.000Z'),
        publish: true,
      },
      'Creator',
    );

    await withBoundServer(fixture.server, async (baseUrl) => {
      const requestIds: string[] = [];
      for (let index = 0; index < 21; index += 1) {
        requestIds.push(
          await createPendingCorrectionRequest(
            baseUrl,
            index % 2 === 0 ? fixture.pollId : secondPoll.poll_id,
            `PG Audit Titel ${index}`,
          ),
        );
      }
      const rowCountBefore = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM poll_correction_requests`,
      );

      const first = await jsonRequest(baseUrl, 'GET', '/admin/correction-audit', adminAId);
      expect(first.status).toBe(200);
      expect(first.body.items).toHaveLength(20);
      expect(first.body.next_cursor).toEqual(expect.stringMatching(/^v1\./));
      expect(first.body.next_cursor).not.toContain(requestIds[0]!);

      const second = await jsonRequest(
        baseUrl,
        'GET',
        `/admin/correction-audit?cursor=${encodeURIComponent(first.body.next_cursor as string)}`,
        adminAId,
      );
      expect(second.status).toBe(200);
      expect(second.body.items).toHaveLength(1);
      expect(second.body.next_cursor).toBeNull();

      const returnedIds = [
        ...(first.body.items as Array<Record<string, unknown>>),
        ...(second.body.items as Array<Record<string, unknown>>),
      ].map((item) => item.request_id);
      expect(returnedIds).toEqual([...requestIds].sort().reverse());
      expect(
        new Set(
          (first.body.items as Array<Record<string, unknown>>).map((item) => item.poll_id),
        ),
      ).toEqual(new Set([fixture.pollId, secondPoll.poll_id]));
      assertNoDeniedKeys(first.body);
      assertNoDeniedKeys(second.body);
      assertGlobalAuditSafeItems(first.body.items);
      assertGlobalAuditSafeItems(second.body.items);

      const rowCountAfter = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM poll_correction_requests`,
      );
      expect(rowCountAfter.rows[0]?.count).toBe(rowCountBefore.rows[0]?.count);
    });
  });

  it('applies safe global audit filters and rejects unsafe query shapes', async () => {
    const fixture = await createFixture(pool);

    await withBoundServer(fixture.server, async (baseUrl) => {
      const requestId = await createPendingCorrectionRequest(
        baseUrl,
        fixture.pollId,
        'PG Audit Filter Titel',
      );
      const rejected = await jsonRequest(
        baseUrl,
        'POST',
        `/admin/correction-requests/${requestId}/decisions`,
        adminBId,
        { decision: 'reject', reason_code: 'PRIVATE_CODE', reason_text: 'Private reason' },
      );
      expect(rejected.status).toBe(200);

      for (const query of [
        'status=rejected',
        'valid_before=2026-06-22T10:00:00.000Z',
        'valid_after=2026-06-22T10:00:00.000Z',
        'limit=1',
        'limit=50',
      ]) {
        const response = await jsonRequest(
          baseUrl,
          'GET',
          `/admin/correction-audit?${query}`,
          adminAId,
        );
        expect(response.status).toBe(200);
        expect(response.body.items).toHaveLength(1);
        assertNoDeniedKeys(response.body);
        assertGlobalAuditSafeItems(response.body.items);
      }

      for (const query of [
        'valid_before=2026-06-22T09:59:59.999Z',
        'valid_after=2026-06-22T10:00:00.001Z',
      ]) {
        const response = await jsonRequest(
          baseUrl,
          'GET',
          `/admin/correction-audit?${query}`,
          adminAId,
        );
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ items: [], next_cursor: null });
      }

      for (const [query, error] of [
        ['limit=0', 'INVALID_AUDIT_LIMIT'],
        ['limit=51', 'INVALID_AUDIT_LIMIT'],
        ['cursor=not-a-cursor', 'INVALID_AUDIT_CURSOR'],
        ['status=unknown', 'INVALID_AUDIT_STATUS'],
        ['valid_before=not-a-date', 'INVALID_AUDIT_TIMESTAMP'],
        ['sort=spread_score', 'UNSUPPORTED_QUERY_PARAMS'],
      ]) {
        const response = await jsonRequest(
          baseUrl,
          'GET',
          `/admin/correction-audit?${query}`,
          adminAId,
        );
        expect(response.status).toBe(400);
        expect(response.body.error).toBe(error);
      }

      const missing = await jsonRequest(baseUrl, 'GET', '/admin/correction-audit');
      expect(missing.status).toBe(401);
      expect(missing.body.error).toBe('ADMIN_AUTH_REQUIRED');

      const forbidden = await jsonRequest(
        baseUrl,
        'GET',
        '/admin/correction-audit',
        nonAdminCredentialId,
      );
      expect(forbidden.status).toBe(403);
      expect(forbidden.body.error).toBe('ADMIN_FORBIDDEN');
    });
  });
});
