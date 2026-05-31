import { describe, expect, it } from 'vitest';
import {
  assertNoAdminReviewDeniedKeys,
  expectOnlyKeys,
} from '../helpers/admin-review-payload.js';
import {
  adminBId,
  adminCId,
  adminAuthHeaders,
  adminRequest,
  approveCorrectionRequest,
  createAdminHttpFixture,
  createAdminHttpServer,
  createPendingCorrectionRequest,
  createPendingSuspendedCorrectionRequest,
  createSuspendedAdminHttpFixture,
  defaultAdminId,
  nonAdminCredentialId,
  readOnlyAdminId,
  writeOnlyAdminId,
  withServer,
} from './helpers/admin-http-fixture.js';

const AUDIT_RECORD_ALLOWED_KEYS = [
  'request_id',
  'poll_id',
  'request_status',
  'poll_status',
  'correction_target_field',
  'correction_target_id',
  'original_text',
  'proposed_text',
  'requires_dual_admin',
  'submitted_at',
  'valid_until',
  'updated_at',
  'correction_log_id',
  'applied_text',
  'applied_at',
  'has_public_notice',
  'decision_summary',
  'timeline',
] as const;

const AUDIT_LIST_ITEM_ALLOWED_KEYS = [
  'request_id',
  'request_status',
  'correction_target_field',
  'submitted_at',
  'valid_until',
  'has_public_notice',
] as const;

function expectAuditListPayload(
  body: Record<string, unknown>,
  includePollId: boolean = false,
): void {
  expectOnlyKeys(body, ['items', 'next_cursor']);
  expect(Array.isArray(body.items)).toBe(true);
  for (const item of body.items as Record<string, unknown>[]) {
    const allowedKeys = [
      ...AUDIT_LIST_ITEM_ALLOWED_KEYS,
      ...(includePollId ? ['poll_id'] : []),
      ...(item.correction_log_id === undefined ? [] : ['correction_log_id']),
    ];
    expectOnlyKeys(item, allowedKeys);
  }
}

describe('GET /admin/correction-requests/:requestId/audit-record', () => {
  it('uses existing admin authentication errors', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const requestId = await createPendingCorrectionRequest(baseUrl, fixture);

      const missing = await adminRequest(
        baseUrl,
        'GET',
        `/admin/correction-requests/${requestId}/audit-record`,
      );
      expect(missing.status).toBe(401);
      expect(missing.body.error).toBe('ADMIN_AUTH_REQUIRED');

      const invalid = await adminRequest(
        baseUrl,
        'GET',
        `/admin/correction-requests/${requestId}/audit-record`,
        { headers: { Authorization: 'Bearer invalid-token' } },
      );
      expect(invalid.status).toBe(401);
      expect(invalid.body.error).toBe('ADMIN_AUTH_INVALID');

      const forbidden = await adminRequest(
        baseUrl,
        'GET',
        `/admin/correction-requests/${requestId}/audit-record`,
        { headers: adminAuthHeaders(nonAdminCredentialId) },
      );
      expect(forbidden.status).toBe(403);
      expect(forbidden.body.error).toBe('ADMIN_FORBIDDEN');
    });
  });

  it('returns 400 INVALID_REQUEST_ID for an invalid request id', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const response = await adminRequest(
        baseUrl,
        'GET',
        '/admin/correction-requests/not-a-uuid/audit-record',
        { headers: adminAuthHeaders(defaultAdminId) },
      );
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('INVALID_REQUEST_ID');
    });
  });

  it('hides partial decision state while a request is pending', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const requestId = await createPendingCorrectionRequest(baseUrl, fixture);
      await adminRequest(
        baseUrl,
        'POST',
        `/admin/correction-requests/${requestId}/decisions`,
        {
          headers: adminAuthHeaders(adminBId),
          body: {
            decision: 'approve',
            reason_code: 'PRIVATE_CODE',
            reason_text: 'Private decision reason',
          },
        },
      );

      const response = await adminRequest(
        baseUrl,
        'GET',
        `/admin/correction-requests/${requestId}/audit-record`,
        { headers: adminAuthHeaders(adminCId) },
      );

      expect(response.status).toBe(200);
      expect(response.body.request_status).toBe('pending');
      expect(response.body.decision_summary).toEqual({ state: 'pending_blind' });
      expect(response.body.timeline).toEqual([
        { event: 'submitted', at: '2026-06-15T10:00:00.000Z' },
      ]);
      expect(response.body.has_public_notice).toBe(false);
      expectOnlyKeys(response.body, AUDIT_RECORD_ALLOWED_KEYS);
      assertNoAdminReviewDeniedKeys(response.body);
    });
  });

  it('returns anonymous finalized aggregates and an applied timeline', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const requestId = await createPendingCorrectionRequest(baseUrl, fixture);
      await approveCorrectionRequest(baseUrl, requestId);
      const applied = await adminRequest(
        baseUrl,
        'POST',
        `/admin/correction-requests/${requestId}/apply`,
        { headers: adminAuthHeaders(defaultAdminId) },
      );
      expect(applied.status).toBe(200);

      const response = await adminRequest(
        baseUrl,
        'GET',
        `/admin/correction-requests/${requestId}/audit-record`,
        { headers: adminAuthHeaders(defaultAdminId) },
      );

      expect(response.status).toBe(200);
      expect(response.body.request_status).toBe('applied');
      expect(response.body.decision_summary).toEqual({
        approve_count: 2,
        reject_count: 0,
        quorum_met: true,
        is_finalized: true,
      });
      expect(response.body.applied_text).toBe('Original Titel');
      expect(response.body.timeline).toEqual([
        { event: 'submitted', at: '2026-06-15T10:00:00.000Z' },
        { event: 'decision_quorum_met', at: '2026-06-15T10:00:00.000Z' },
        { event: 'applied', at: '2026-06-15T10:00:00.000Z' },
      ]);
      expectOnlyKeys(response.body, AUDIT_RECORD_ALLOWED_KEYS);
      assertNoAdminReviewDeniedKeys(response.body);
    });
  });

  it('exposes only notice presence after suspended correction apply', async () => {
    const fixture = createSuspendedAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const requestId = await createPendingSuspendedCorrectionRequest(baseUrl, fixture);
      await approveCorrectionRequest(baseUrl, requestId);
      const applied = await adminRequest(
        baseUrl,
        'POST',
        `/admin/suspended-correction-requests/${requestId}/apply`,
        { headers: adminAuthHeaders(defaultAdminId) },
      );
      expect(applied.status).toBe(200);

      const response = await adminRequest(
        baseUrl,
        'GET',
        `/admin/correction-requests/${requestId}/audit-record`,
        { headers: adminAuthHeaders(defaultAdminId) },
      );

      expect(response.status).toBe(200);
      expect(response.body.has_public_notice).toBe(true);
      expectOnlyKeys(response.body, AUDIT_RECORD_ALLOWED_KEYS);
      assertNoAdminReviewDeniedKeys(response.body);
    });
  });
});

describe('Admin audit read permission boundary', () => {
  it('requires correction:read and rejects legacy identity fallback on every audit read path', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const requestId = await createPendingCorrectionRequest(baseUrl, fixture);
      for (const path of [
        `/admin/correction-requests/${requestId}/audit-record`,
        `/admin/polls/${fixture.pollId}/correction-audit`,
        '/admin/correction-audit',
      ]) {
        const missing = await adminRequest(baseUrl, 'GET', path);
        expect(missing.status).toBe(401);
        expect(missing.body.error).toBe('ADMIN_AUTH_REQUIRED');

        const legacy = await adminRequest(baseUrl, 'GET', path, {
          headers: { 'X-Admin-User-Id': defaultAdminId },
        });
        expect(legacy.status).toBe(401);
        expect(legacy.body.error).toBe('ADMIN_AUTH_REQUIRED');

        const writeOnly = await adminRequest(baseUrl, 'GET', path, {
          headers: adminAuthHeaders(writeOnlyAdminId),
        });
        expect(writeOnly.status).toBe(403);
        expect(writeOnly.body.error).toBe('ADMIN_FORBIDDEN');
      }
    });
  });
});

describe('GET /admin/polls/:pollId/correction-audit', () => {
  it('returns a stable paginated safe list ordered by submitted_at then request id', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const headers = adminAuthHeaders(defaultAdminId);
      const createdIds: string[] = [];
      for (const body of [
        {
          poll_id: fixture.pollId,
          correction_target_field: 'title',
          proposed_text: 'Original Titel',
          reason: 'Private request reason',
        },
        {
          poll_id: fixture.pollId,
          correction_target_field: 'description',
          proposed_text: 'Original descriptino',
          reason: 'Private request reason',
        },
      ]) {
        const created = await adminRequest(baseUrl, 'POST', '/admin/correction-requests', {
          headers,
          body,
        });
        expect(created.status).toBe(201);
        createdIds.push(created.body.request_id as string);
      }

      const first = await adminRequest(
        baseUrl,
        'GET',
        `/admin/polls/${fixture.pollId}/correction-audit?limit=1`,
        { headers },
      );
      expect(first.status).toBe(200);
      expect(first.body.items).toHaveLength(1);
      expect(typeof first.body.next_cursor).toBe('string');

      const second = await adminRequest(
        baseUrl,
        'GET',
        `/admin/polls/${fixture.pollId}/correction-audit?limit=1&cursor=${first.body.next_cursor as string}`,
        { headers },
      );
      expect(second.status).toBe(200);
      expect(second.body.items).toHaveLength(1);
      expect(second.body.next_cursor).toBeNull();

      const returnedIds = [
        ...((first.body.items as Record<string, unknown>[]).map(
          (item) => item.request_id as string,
        )),
        ...((second.body.items as Record<string, unknown>[]).map(
          (item) => item.request_id as string,
        )),
      ];
      expect(new Set(returnedIds)).toEqual(new Set(createdIds));
      expectAuditListPayload(first.body);
      expectAuditListPayload(second.body);
      assertNoAdminReviewDeniedKeys(first.body);
      assertNoAdminReviewDeniedKeys(second.body);
    });
  });

  it('returns an empty list for an unknown poll and rejects unsafe query shapes', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);
    const headers = adminAuthHeaders(defaultAdminId);

    await withServer(server, async (baseUrl) => {
      const empty = await adminRequest(
        baseUrl,
        'GET',
        '/admin/polls/99999999-9999-4999-8999-999999999999/correction-audit',
        { headers },
      );
      expect(empty.status).toBe(200);
      expect(empty.body).toEqual({ items: [], next_cursor: null });

      const invalidLimit = await adminRequest(
        baseUrl,
        'GET',
        `/admin/polls/${fixture.pollId}/correction-audit?limit=51`,
        { headers },
      );
      expect(invalidLimit.status).toBe(400);
      expect(invalidLimit.body.error).toBe('INVALID_AUDIT_LIMIT');

      const unsupported = await adminRequest(
        baseUrl,
        'GET',
        `/admin/polls/${fixture.pollId}/correction-audit?sort=spread_score`,
        { headers },
      );
      expect(unsupported.status).toBe(400);
      expect(unsupported.body.error).toBe('UNSUPPORTED_QUERY_PARAMS');

      const invalidCursor = await adminRequest(
        baseUrl,
        'GET',
        `/admin/polls/${fixture.pollId}/correction-audit?cursor=not-a-cursor`,
        { headers },
      );
      expect(invalidCursor.status).toBe(400);
      expect(invalidCursor.body.error).toBe('INVALID_AUDIT_CURSOR');

      const unauthenticated = await adminRequest(
        baseUrl,
        'GET',
        `/admin/polls/${fixture.pollId}/correction-audit?sort=spread_score`,
      );
      expect(unauthenticated.status).toBe(401);
      expect(unauthenticated.body.error).toBe('ADMIN_AUTH_REQUIRED');
    });
  });
});

describe('GET /admin/correction-audit', () => {
  it('returns a stable paginated safe global list with poll ids', async () => {
    const fixture = createAdminHttpFixture();
    const secondPollId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
    fixture.correctionRepo.setPoll({
      ...fixture.correctionRepo.polls.get(fixture.pollId)!,
      id: secondPollId,
      title: 'Second poll',
    });
    const server = createAdminHttpServer(fixture);
    const headers = adminAuthHeaders(defaultAdminId);

    await withServer(server, async (baseUrl) => {
      for (const pollId of [fixture.pollId, secondPollId]) {
        const created = await adminRequest(baseUrl, 'POST', '/admin/correction-requests', {
          headers,
          body: {
            poll_id: pollId,
            correction_target_field: 'title',
            proposed_text: `Typo ${pollId}`,
            reason: 'Private request reason',
          },
        });
        expect(created.status).toBe(201);
      }

      const first = await adminRequest(
        baseUrl,
        'GET',
        '/admin/correction-audit?limit=1',
        { headers },
      );
      expect(first.status).toBe(200);
      expect(first.body.items).toHaveLength(1);
      expect(typeof first.body.next_cursor).toBe('string');

      const second = await adminRequest(
        baseUrl,
        'GET',
        `/admin/correction-audit?limit=1&cursor=${first.body.next_cursor as string}`,
        { headers },
      );
      expect(second.status).toBe(200);
      expect(second.body.items).toHaveLength(1);
      expect(second.body.next_cursor).toBeNull();

      const items = [
        ...(first.body.items as Record<string, unknown>[]),
        ...(second.body.items as Record<string, unknown>[]),
      ];
      expect(new Set(items.map((item) => item.poll_id))).toEqual(
        new Set([fixture.pollId, secondPollId]),
      );
      expectAuditListPayload(first.body, true);
      expectAuditListPayload(second.body, true);
      assertNoAdminReviewDeniedKeys(first.body);
      assertNoAdminReviewDeniedKeys(second.body);
    });
  });

  it('allows correction:read token to GET global audit queue', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      await createPendingCorrectionRequest(baseUrl, fixture);

      const response = await adminRequest(baseUrl, 'GET', '/admin/correction-audit', {
        headers: adminAuthHeaders(readOnlyAdminId),
      });
      expect(response.status).toBe(200);
      expect((response.body.items as unknown[]).length).toBeGreaterThanOrEqual(1);
      expectAuditListPayload(response.body, true);
      assertNoAdminReviewDeniedKeys(response.body);
    });
  });

  it('supports safe status and validity filters', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);
    const headers = adminAuthHeaders(defaultAdminId);

    await withServer(server, async (baseUrl) => {
      const requestId = await createPendingCorrectionRequest(baseUrl, fixture);
      const rejected = await adminRequest(
        baseUrl,
        'POST',
        `/admin/correction-requests/${requestId}/decisions`,
        {
          headers: adminAuthHeaders(adminBId),
          body: { decision: 'reject', reason_code: 'PRIVATE_CODE' },
        },
      );
      expect(rejected.status).toBe(200);

      const byStatus = await adminRequest(
        baseUrl,
        'GET',
        '/admin/correction-audit?status=rejected',
        { headers },
      );
      expect(byStatus.status).toBe(200);
      expect(byStatus.body.items).toHaveLength(1);

      const beforeWindow = await adminRequest(
        baseUrl,
        'GET',
        '/admin/correction-audit?valid_before=2026-06-21T00:00:00.000Z',
        { headers },
      );
      expect(beforeWindow.status).toBe(200);
      expect(beforeWindow.body).toEqual({ items: [], next_cursor: null });

      const afterWindow = await adminRequest(
        baseUrl,
        'GET',
        '/admin/correction-audit?valid_after=2026-06-23T00:00:00.000Z',
        { headers },
      );
      expect(afterWindow.status).toBe(200);
      expect(afterWindow.body).toEqual({ items: [], next_cursor: null });
      expectAuditListPayload(byStatus.body, true);
      assertNoAdminReviewDeniedKeys(byStatus.body);
    });
  });

  it('uses existing admin guards and rejects unsafe query shapes', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);
    const headers = adminAuthHeaders(defaultAdminId);

    await withServer(server, async (baseUrl) => {
      const empty = await adminRequest(baseUrl, 'GET', '/admin/correction-audit', {
        headers,
      });
      expect(empty.status).toBe(200);
      expect(empty.body).toEqual({ items: [], next_cursor: null });

      const missing = await adminRequest(baseUrl, 'GET', '/admin/correction-audit');
      expect(missing.status).toBe(401);
      expect(missing.body.error).toBe('ADMIN_AUTH_REQUIRED');

      const forbidden = await adminRequest(baseUrl, 'GET', '/admin/correction-audit', {
        headers: adminAuthHeaders(nonAdminCredentialId),
      });
      expect(forbidden.status).toBe(403);
      expect(forbidden.body.error).toBe('ADMIN_FORBIDDEN');

      for (const [query, error] of [
        ['limit=51', 'INVALID_AUDIT_LIMIT'],
        ['cursor=not-a-cursor', 'INVALID_AUDIT_CURSOR'],
        ['status=unknown', 'INVALID_AUDIT_STATUS'],
        ['valid_before=not-a-date', 'INVALID_AUDIT_TIMESTAMP'],
        ['sort=spread_score', 'UNSUPPORTED_QUERY_PARAMS'],
      ]) {
        const response = await adminRequest(
          baseUrl,
          'GET',
          `/admin/correction-audit?${query}`,
          { headers },
        );
        expect(response.status).toBe(400);
        expect(response.body.error).toBe(error);
      }
    });
  });
});
