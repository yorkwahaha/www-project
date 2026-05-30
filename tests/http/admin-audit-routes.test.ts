import { describe, expect, it } from 'vitest';
import {
  adminBId,
  adminCId,
  adminRequest,
  approveCorrectionRequest,
  createAdminHttpFixture,
  createAdminHttpServer,
  createPendingCorrectionRequest,
  createPendingSuspendedCorrectionRequest,
  createSuspendedAdminHttpFixture,
  defaultAdminId,
  withServer,
} from './helpers/admin-http-fixture.js';

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
        { headers: { 'X-Admin-User-Id': 'not-a-uuid' } },
      );
      expect(invalid.status).toBe(400);
      expect(invalid.body.error).toBe('INVALID_ADMIN_USER_ID');

      const forbidden = await adminRequest(
        baseUrl,
        'GET',
        `/admin/correction-requests/${requestId}/audit-record`,
        {
          headers: {
            'X-Admin-User-Id': '99999999-9999-4999-8999-999999999999',
          },
        },
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
        { headers: { 'X-Admin-User-Id': defaultAdminId } },
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
          headers: { 'X-Admin-User-Id': adminBId },
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
        { headers: { 'X-Admin-User-Id': adminCId } },
      );

      expect(response.status).toBe(200);
      expect(response.body.request_status).toBe('pending');
      expect(response.body.decision_summary).toEqual({ state: 'pending_blind' });
      expect(response.body.timeline).toEqual([
        { event: 'submitted', at: '2026-06-15T10:00:00.000Z' },
      ]);
      expect(response.body.has_public_notice).toBe(false);
      assertNoDeniedKeys(response.body);
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
        { headers: { 'X-Admin-User-Id': defaultAdminId } },
      );
      expect(applied.status).toBe(200);

      const response = await adminRequest(
        baseUrl,
        'GET',
        `/admin/correction-requests/${requestId}/audit-record`,
        { headers: { 'X-Admin-User-Id': defaultAdminId } },
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
      assertNoDeniedKeys(response.body);
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
        { headers: { 'X-Admin-User-Id': defaultAdminId } },
      );
      expect(applied.status).toBe(200);

      const response = await adminRequest(
        baseUrl,
        'GET',
        `/admin/correction-requests/${requestId}/audit-record`,
        { headers: { 'X-Admin-User-Id': defaultAdminId } },
      );

      expect(response.status).toBe(200);
      expect(response.body.has_public_notice).toBe(true);
      assertNoDeniedKeys(response.body);
    });
  });
});

describe('GET /admin/polls/:pollId/correction-audit', () => {
  it('returns a stable paginated safe list ordered by submitted_at then request id', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const headers = { 'X-Admin-User-Id': defaultAdminId };
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
      assertNoDeniedKeys(first.body);
      assertNoDeniedKeys(second.body);
    });
  });

  it('returns an empty list for an unknown poll and rejects unsafe query shapes', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);
    const headers = { 'X-Admin-User-Id': defaultAdminId };

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
