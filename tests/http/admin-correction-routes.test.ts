import { describe, expect, it } from 'vitest';
import { createHttpServer } from '../../src/http/server.js';
import { createPollService } from '../../src/polls/service.js';
import { createInMemoryPollRepository } from '../../src/polls/in-memory-repository.js';
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
  syncPollToPublicRepository,
  defaultAdminId,
  defaultOptionId,
  defaultPollId,
  defaultSubmittedAt,
  nonAdminCredentialId,
  readOnlyAdminId,
  revokedAdminId,
  writeOnlyAdminId,
  withServer,
} from './helpers/admin-http-fixture.js';

const REVIEW_CONTEXT_ALLOWED_KEYS = [
  'request_id',
  'poll_id',
  'request_status',
  'poll_status',
  'correction_target_field',
  'correction_target_id',
  'original_text',
  'proposed_text',
  'requires_dual_admin',
  'valid_until',
  'viewer_has_submitted',
  'decision_summary',
] as const;

function assertSafeApplyResponse(body: Record<string, unknown>): void {
  expect(body.status).toBe('applied');
  expect(typeof body.request_id).toBe('string');
  expect(typeof body.correction_log_id).toBe('string');
  expect(body).not.toHaveProperty('public_notice_id');
  expect(body).not.toHaveProperty('spread_score_at_submit');
  expect(body).not.toHaveProperty('spread_score_locked_until');
  expect(body).not.toHaveProperty('requester_admin_id');
  expect(body).not.toHaveProperty('peer_decisions');
  expect(body).not.toHaveProperty('poll_id');
  expect(body).not.toHaveProperty('correction_target_field');
}

function assertBlindReviewContext(body: Record<string, unknown>): void {
  expectOnlyKeys(body, REVIEW_CONTEXT_ALLOWED_KEYS);
  expect(body.decision_summary).toEqual({ state: 'pending_blind' });
  assertNoAdminReviewDeniedKeys(body);
}

function titleCorrectionBody(pollId: string = defaultPollId) {
  return {
    poll_id: pollId,
    correction_target_field: 'title',
    proposed_text: 'Original Titel',
    reason: 'Spelling',
  };
}

describe('POST /admin/correction-requests', () => {
  it('returns 401 ADMIN_AUTH_REQUIRED when Authorization is missing', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const response = await adminRequest(baseUrl, 'POST', '/admin/correction-requests', {
        body: titleCorrectionBody(),
      });
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'ADMIN_AUTH_REQUIRED',
        message: 'Admin credentials are required',
      });
    });
  });

  it('does not accept X-User-Id or legacy X-Admin-User-Id as admin fallback', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const response = await adminRequest(baseUrl, 'POST', '/admin/correction-requests', {
        headers: {
          'X-User-Id': defaultAdminId,
          'X-Admin-User-Id': defaultAdminId,
        },
        body: titleCorrectionBody(),
      });
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('ADMIN_AUTH_REQUIRED');
    });
  });

  it('returns 401 ADMIN_AUTH_INVALID for an invalid bearer token', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const response = await adminRequest(baseUrl, 'POST', '/admin/correction-requests', {
        headers: { Authorization: 'Bearer invalid-token' },
        body: titleCorrectionBody(),
      });
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'ADMIN_AUTH_INVALID',
        message: 'Invalid admin credentials',
      });
    });
  });

  it('returns 403 ADMIN_FORBIDDEN when header is valid but user is not active admin', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);
    await withServer(server, async (baseUrl) => {
      const response = await adminRequest(baseUrl, 'POST', '/admin/correction-requests', {
        headers: adminAuthHeaders(nonAdminCredentialId),
        body: titleCorrectionBody(),
      });
      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: 'ADMIN_FORBIDDEN',
        message: 'Active admin permission is required',
      });
    });
  });

  it('returns 403 ADMIN_FORBIDDEN when token maps to a revoked admin_users row', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const response = await adminRequest(baseUrl, 'POST', '/admin/correction-requests', {
        headers: adminAuthHeaders(revokedAdminId),
        body: titleCorrectionBody(),
      });
      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: 'ADMIN_FORBIDDEN',
        message: 'Active admin permission is required',
      });
    });
  });

  it('returns 201 with safe DTO for valid title correction', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const response = await adminRequest(baseUrl, 'POST', '/admin/correction-requests', {
        headers: adminAuthHeaders(fixture.adminId),
        body: titleCorrectionBody(),
      });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('pending');
      expect(response.body.requires_dual_admin).toBe(true);
      expect(response.body.valid_until).toBe('2026-06-22T10:00:00.000Z');
      expect(typeof response.body.request_id).toBe('string');
      expect(response.body).not.toHaveProperty('spread_score_at_submit');
      expect(response.body).not.toHaveProperty('spread_score_locked_until');
      expect(response.body).not.toHaveProperty('public_notice_id');
      expect(response.body).not.toHaveProperty('requester_admin_id');
      expect(response.body).not.toHaveProperty('peer_decisions');
    });
  });

  it('returns 409 CORRECTION_CONFLICT for duplicate pending target', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const headers = adminAuthHeaders(fixture.adminId);
      const first = await adminRequest(baseUrl, 'POST', '/admin/correction-requests', {
        headers,
        body: titleCorrectionBody(),
      });
      expect(first.status).toBe(201);

      const second = await adminRequest(baseUrl, 'POST', '/admin/correction-requests', {
        headers,
        body: titleCorrectionBody(),
      });
      expect(second.status).toBe(409);
      expect(second.body.error).toBe('CORRECTION_CONFLICT');
    });
  });

  it('returns 400 CORRECTION_VALIDATION for invalid option_text target', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const response = await adminRequest(baseUrl, 'POST', '/admin/correction-requests', {
        headers: adminAuthHeaders(fixture.adminId),
        body: {
          poll_id: fixture.pollId,
          correction_target_field: 'option_text',
          proposed_text: 'Option A lable',
          reason: 'Typo',
        },
      });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('CORRECTION_VALIDATION');
    });
  });

  it('returns 400 CORRECTION_VALIDATION for invalid correction_target_field', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const response = await adminRequest(baseUrl, 'POST', '/admin/correction-requests', {
        headers: adminAuthHeaders(fixture.adminId),
        body: {
          ...titleCorrectionBody(),
          correction_target_field: 'category',
        },
      });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('CORRECTION_VALIDATION');
    });
  });

  it('returns 404 NOT_FOUND when adminCorrection is not configured', async () => {
    const server = createHttpServer({
      pollService: createPollService(createInMemoryPollRepository()),
    });

    await withServer(server, async (baseUrl) => {
      const response = await adminRequest(baseUrl, 'POST', '/admin/correction-requests', {
        headers: adminAuthHeaders(defaultAdminId),
        body: titleCorrectionBody(),
      });
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('NOT_FOUND');
    });
  });
});

describe('GET /admin/correction-requests/:requestId/review-context', () => {
  it('requires correction:read and rejects legacy identity fallback', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const requestId = await createPendingCorrectionRequest(baseUrl, fixture);
      const path = `/admin/correction-requests/${requestId}/review-context`;

      const missing = await adminRequest(
        baseUrl,
        'GET',
        path,
      );
      expect(missing.status).toBe(401);
      expect(missing.body.error).toBe('ADMIN_AUTH_REQUIRED');

      const legacy = await adminRequest(baseUrl, 'GET', path, {
        headers: { 'X-Admin-User-Id': adminBId },
      });
      expect(legacy.status).toBe(401);
      expect(legacy.body.error).toBe('ADMIN_AUTH_REQUIRED');

      const writeOnly = await adminRequest(baseUrl, 'GET', path, {
        headers: adminAuthHeaders(writeOnlyAdminId),
      });
      expect(writeOnly.status).toBe(403);
      expect(writeOnly.body.error).toBe('ADMIN_FORBIDDEN');

      const readOnly = await adminRequest(baseUrl, 'GET', path, {
        headers: adminAuthHeaders(readOnlyAdminId),
      });
      expect(readOnly.status).toBe(200);
      assertBlindReviewContext(readOnly.body);
    });
  });

  it('returns 400 INVALID_REQUEST_ID for invalid request id', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const response = await adminRequest(
        baseUrl,
        'GET',
        '/admin/correction-requests/not-a-uuid/review-context',
        { headers: adminAuthHeaders(adminBId) },
      );
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('INVALID_REQUEST_ID');
    });
  });

  it('keeps the decision summary blind while pending even after another admin approved', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const requestId = await createPendingCorrectionRequest(baseUrl, fixture);

      await adminRequest(baseUrl, 'POST', `/admin/correction-requests/${requestId}/decisions`, {
        headers: adminAuthHeaders(adminBId),
        body: { decision: 'approve', reason_code: 'OK' },
      });

      const response = await adminRequest(
        baseUrl,
        'GET',
        `/admin/correction-requests/${requestId}/review-context`,
        { headers: adminAuthHeaders(adminCId) },
      );

      expect(response.status).toBe(200);
      expect(response.body.request_status).toBe('pending');
      expect(response.body.viewer_has_submitted).toBe(false);
      assertBlindReviewContext(response.body);
    });
  });

  it('allows correction_target_id only as admin poll structure metadata', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const created = await adminRequest(baseUrl, 'POST', '/admin/correction-requests', {
        headers: adminAuthHeaders(defaultAdminId),
        body: {
          poll_id: fixture.pollId,
          correction_target_field: 'option_text',
          correction_target_id: defaultOptionId,
          proposed_text: 'Option A lable',
          reason: 'Typo',
        },
      });
      expect(created.status).toBe(201);

      const response = await adminRequest(
        baseUrl,
        'GET',
        `/admin/correction-requests/${created.body.request_id as string}/review-context`,
        { headers: adminAuthHeaders(readOnlyAdminId) },
      );
      expect(response.status).toBe(200);
      expect(response.body.correction_target_field).toBe('option_text');
      expect(response.body.correction_target_id).toBe(defaultOptionId);
      assertBlindReviewContext(response.body);
    });
  });

  it('returns 403 ADMIN_FORBIDDEN when token lacks correction:write', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const response = await adminRequest(baseUrl, 'POST', '/admin/correction-requests', {
        headers: adminAuthHeaders(readOnlyAdminId),
        body: titleCorrectionBody(),
      });
      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: 'ADMIN_FORBIDDEN',
        message: 'Admin permission is required',
      });
    });
  });

  it('returns only an anonymous decision summary after request is approved', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const requestId = await createPendingCorrectionRequest(baseUrl, fixture);

      await adminRequest(baseUrl, 'POST', `/admin/correction-requests/${requestId}/decisions`, {
        headers: adminAuthHeaders(adminBId),
        body: { decision: 'approve', reason_code: 'OK' },
      });
      await adminRequest(baseUrl, 'POST', `/admin/correction-requests/${requestId}/decisions`, {
        headers: adminAuthHeaders(adminCId),
        body: { decision: 'approve', reason_code: 'OK' },
      });

      const response = await adminRequest(
        baseUrl,
        'GET',
        `/admin/correction-requests/${requestId}/review-context`,
        { headers: adminAuthHeaders(adminBId) },
      );

      expect(response.status).toBe(200);
      expect(response.body.request_status).toBe('approved');
      expect(response.body.decision_summary).toEqual({
        approve_count: 2,
        reject_count: 0,
        quorum_met: true,
        is_finalized: true,
      });
      expectOnlyKeys(response.body, REVIEW_CONTEXT_ALLOWED_KEYS);
      assertNoAdminReviewDeniedKeys(response.body);
    });
  });
});

describe('POST /admin/correction-requests/:requestId/decisions', () => {
  it('does not accept X-User-Id as admin fallback', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const requestId = await createPendingCorrectionRequest(baseUrl, fixture);
      const response = await adminRequest(
        baseUrl,
        'POST',
        `/admin/correction-requests/${requestId}/decisions`,
        {
          headers: { 'X-User-Id': adminBId },
          body: { decision: 'approve', reason_code: 'OK' },
        },
      );
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('ADMIN_AUTH_REQUIRED');
    });
  });

  it('returns 403 PROPOSER_CANNOT_APPROVE when proposer tries to approve', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const requestId = await createPendingCorrectionRequest(baseUrl, fixture);
      const response = await adminRequest(
        baseUrl,
        'POST',
        `/admin/correction-requests/${requestId}/decisions`,
        {
          headers: adminAuthHeaders(fixture.adminId),
          body: { decision: 'approve', reason_code: 'SELF' },
        },
      );
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('PROPOSER_CANNOT_APPROVE');
    });
  });

  it('allows proposer to reject and finalizes request as rejected', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const requestId = await createPendingCorrectionRequest(baseUrl, fixture);
      const response = await adminRequest(
        baseUrl,
        'POST',
        `/admin/correction-requests/${requestId}/decisions`,
        {
          headers: adminAuthHeaders(fixture.adminId),
          body: { decision: 'reject', reason_code: 'WITHDRAW' },
        },
      );
      expect(response.status).toBe(200);
      expect(response.body.request_status).toBe('rejected');
    });
  });

  it('keeps request pending after first approve and approves after second', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const requestId = await createPendingCorrectionRequest(baseUrl, fixture);

      const first = await adminRequest(
        baseUrl,
        'POST',
        `/admin/correction-requests/${requestId}/decisions`,
        {
          headers: adminAuthHeaders(adminBId),
          body: { decision: 'approve', reason_code: 'OK' },
        },
      );
      expect(first.status).toBe(200);
      expect(first.body.request_status).toBe('pending');

      const second = await adminRequest(
        baseUrl,
        'POST',
        `/admin/correction-requests/${requestId}/decisions`,
        {
          headers: adminAuthHeaders(adminCId),
          body: { decision: 'approve', reason_code: 'OK' },
        },
      );
      expect(second.status).toBe(200);
      expect(second.body.request_status).toBe('approved');
    });
  });

  it('finalizes rejected on any reject from reviewer', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const requestId = await createPendingCorrectionRequest(baseUrl, fixture);
      const response = await adminRequest(
        baseUrl,
        'POST',
        `/admin/correction-requests/${requestId}/decisions`,
        {
          headers: adminAuthHeaders(adminBId),
          body: { decision: 'reject', reason_code: 'NOT_TYPO' },
        },
      );
      expect(response.status).toBe(200);
      expect(response.body.request_status).toBe('rejected');
    });
  });

  it('returns 409 CORRECTION_DECISION_ALREADY_SUBMITTED on duplicate decision', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const requestId = await createPendingCorrectionRequest(baseUrl, fixture);
      const path = `/admin/correction-requests/${requestId}/decisions`;
      const headers = adminAuthHeaders(adminBId);
      const body = { decision: 'approve', reason_code: 'OK' };

      const first = await adminRequest(baseUrl, 'POST', path, { headers, body });
      expect(first.status).toBe(200);

      const second = await adminRequest(baseUrl, 'POST', path, {
        headers,
        body: { decision: 'approve', reason_code: 'AGAIN' },
      });
      expect(second.status).toBe(409);
      expect(second.body.error).toBe('CORRECTION_DECISION_ALREADY_SUBMITTED');
    });
  });

  it('returns 400 CORRECTION_EXPIRED when request is past valid_until', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const requestId = await createPendingCorrectionRequest(baseUrl, fixture);
      const stored = fixture.correctionRepo.correctionRequests.get(requestId)!;
      stored.valid_until = new Date('2026-06-14T00:00:00.000Z');
      fixture.correctionRepo.correctionRequests.set(requestId, stored);

      const response = await adminRequest(
        baseUrl,
        'POST',
        `/admin/correction-requests/${requestId}/decisions`,
        {
          headers: adminAuthHeaders(adminBId),
          body: { decision: 'approve', reason_code: 'LATE' },
        },
      );
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('CORRECTION_EXPIRED');
      expect(fixture.correctionRepo.correctionRequests.get(requestId)!.status).toBe(
        'expired',
      );
    });
  });
});

describe('POST /admin/correction-requests/:requestId/apply', () => {
  const applyPath = (requestId: string) =>
    `/admin/correction-requests/${requestId}/apply`;

  it('applies approved title correction with safe DTO', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const requestId = await createPendingCorrectionRequest(baseUrl, fixture);
      await approveCorrectionRequest(baseUrl, requestId);

      const response = await adminRequest(baseUrl, 'POST', applyPath(requestId), {
        headers: adminAuthHeaders(adminBId),
      });

      expect(response.status).toBe(200);
      assertSafeApplyResponse(response.body);
      expect(response.body.request_id).toBe(requestId);
      expect(fixture.correctionRepo.polls.get(fixture.pollId)!.title).toBe('Original Titel');
    });
  });

  it('applies approved option_text correction with safe DTO', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const created = await adminRequest(baseUrl, 'POST', '/admin/correction-requests', {
        headers: adminAuthHeaders(fixture.adminId),
        body: {
          poll_id: fixture.pollId,
          correction_target_field: 'option_text',
          correction_target_id: defaultOptionId,
          proposed_text: 'Option A lable',
          reason: 'Typo',
        },
      });
      expect(created.status).toBe(201);
      const requestId = created.body.request_id as string;
      await approveCorrectionRequest(baseUrl, requestId);

      const response = await adminRequest(baseUrl, 'POST', applyPath(requestId), {
        headers: adminAuthHeaders(adminBId),
      });

      expect(response.status).toBe(200);
      assertSafeApplyResponse(response.body);
      const options = fixture.correctionRepo.optionsByPollId.get(fixture.pollId)!;
      expect(options[0]!.option_text).toBe('Option A lable');
    });
  });

  it('returns 400 CORRECTION_REQUEST_NOT_APPROVED when request is still pending', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const requestId = await createPendingCorrectionRequest(baseUrl, fixture);
      const response = await adminRequest(baseUrl, 'POST', applyPath(requestId), {
        headers: adminAuthHeaders(adminBId),
      });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('CORRECTION_REQUEST_NOT_APPROVED');
    });
  });

  it('returns 409 CORRECTION_STALE_TARGET when live text changed', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const requestId = await createPendingCorrectionRequest(baseUrl, fixture);
      await approveCorrectionRequest(baseUrl, requestId);
      fixture.correctionRepo.polls.get(fixture.pollId)!.title = 'Changed after approval';

      const response = await adminRequest(baseUrl, 'POST', applyPath(requestId), {
        headers: adminAuthHeaders(adminBId),
      });
      expect(response.status).toBe(409);
      expect(response.body.error).toBe('CORRECTION_STALE_TARGET');
    });
  });

  it('returns 409 CORRECTION_ALREADY_APPLIED on repeat apply', async () => {
    const fixture = createAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const requestId = await createPendingCorrectionRequest(baseUrl, fixture);
      await approveCorrectionRequest(baseUrl, requestId);
      const headers = adminAuthHeaders(adminBId);

      const first = await adminRequest(baseUrl, 'POST', applyPath(requestId), { headers });
      expect(first.status).toBe(200);

      const second = await adminRequest(baseUrl, 'POST', applyPath(requestId), { headers });
      expect(second.status).toBe(409);
      expect(second.body.error).toBe('CORRECTION_ALREADY_APPLIED');
    });
  });
});

describe('POST /admin/suspended-correction-requests', () => {
  it('creates request and moves poll to correction_pending', async () => {
    const fixture = createSuspendedAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const response = await adminRequest(
        baseUrl,
        'POST',
        '/admin/suspended-correction-requests',
        {
          headers: adminAuthHeaders(fixture.adminId),
          body: {
            poll_id: fixture.pollId,
            correction_target_field: 'title',
            proposed_text: 'Suspended Titel',
            reason: 'Typo',
          },
        },
      );

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('pending');
      expect(response.body.poll_status).toBe('correction_pending');
      expect(response.body).not.toHaveProperty('spread_score_at_submit');
      expect(response.body).not.toHaveProperty('requester_admin_id');
      expect(fixture.correctionRepo.polls.get(fixture.pollId)!.status).toBe(
        'correction_pending',
      );
    });
  });

  it('keeps correction_pending poll hidden from GET /polls/:id', async () => {
    const fixture = createSuspendedAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      await createPendingSuspendedCorrectionRequest(baseUrl, fixture);
      syncPollToPublicRepository(fixture.correctionRepo, fixture.pollRepo, fixture.pollId);

      const response = await adminRequest(baseUrl, 'GET', `/polls/${fixture.pollId}`, {});
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('POLL_NOT_FOUND');
      expect(JSON.stringify(response.body)).not.toMatch(/correction_pending|suspended/i);
    });
  });

  it('does not accept X-User-Id as admin fallback', async () => {
    const fixture = createSuspendedAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const response = await adminRequest(
        baseUrl,
        'POST',
        '/admin/suspended-correction-requests',
        {
          headers: { 'X-User-Id': fixture.adminId },
          body: {
            poll_id: fixture.pollId,
            correction_target_field: 'title',
            proposed_text: 'Suspended Titel',
            reason: 'Typo',
          },
        },
      );
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('ADMIN_AUTH_REQUIRED');
    });
  });
});

describe('POST /admin/suspended-correction-requests/:requestId/apply', () => {
  const suspendedApplyPath = (requestId: string) =>
    `/admin/suspended-correction-requests/${requestId}/apply`;

  it('applies after approval with public_notice_id and active poll_status', async () => {
    const fixture = createSuspendedAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const requestId = await createPendingSuspendedCorrectionRequest(baseUrl, fixture);
      await approveCorrectionRequest(baseUrl, requestId);

      const response = await adminRequest(baseUrl, 'POST', suspendedApplyPath(requestId), {
        headers: adminAuthHeaders(adminBId),
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('applied');
      expect(response.body.poll_status).toBe('active');
      expect(typeof response.body.public_notice_id).toBe('string');
      expect(typeof response.body.correction_log_id).toBe('string');
      expect(response.body).not.toHaveProperty('spread_score_at_submit');
      expect(fixture.correctionRepo.polls.get(fixture.pollId)!.status).toBe('active');
      expect(fixture.correctionRepo.publicNotices).toHaveLength(1);
    });
  });

  it('returns 400 CORRECTION_REQUEST_NOT_APPROVED when still pending', async () => {
    const fixture = createSuspendedAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const requestId = await createPendingSuspendedCorrectionRequest(baseUrl, fixture);
      const response = await adminRequest(baseUrl, 'POST', suspendedApplyPath(requestId), {
        headers: adminAuthHeaders(adminBId),
      });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('CORRECTION_REQUEST_NOT_APPROVED');
    });
  });

  it('returns 409 CORRECTION_STALE_TARGET when live text changed', async () => {
    const fixture = createSuspendedAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const requestId = await createPendingSuspendedCorrectionRequest(baseUrl, fixture);
      await approveCorrectionRequest(baseUrl, requestId);
      fixture.correctionRepo.polls.get(fixture.pollId)!.title = 'Changed after approval';

      const response = await adminRequest(baseUrl, 'POST', suspendedApplyPath(requestId), {
        headers: adminAuthHeaders(adminBId),
      });
      expect(response.status).toBe(409);
      expect(response.body.error).toBe('CORRECTION_STALE_TARGET');
    });
  });

  it('returns 409 CORRECTION_ALREADY_APPLIED on repeat apply', async () => {
    const fixture = createSuspendedAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const requestId = await createPendingSuspendedCorrectionRequest(baseUrl, fixture);
      await approveCorrectionRequest(baseUrl, requestId);
      const headers = adminAuthHeaders(adminBId);

      const first = await adminRequest(baseUrl, 'POST', suspendedApplyPath(requestId), {
        headers,
      });
      expect(first.status).toBe(200);

      const second = await adminRequest(baseUrl, 'POST', suspendedApplyPath(requestId), {
        headers,
      });
      expect(second.status).toBe(409);
      expect(second.body.error).toBe('CORRECTION_ALREADY_APPLIED');
    });
  });

  it('does not accept X-User-Id as admin fallback', async () => {
    const fixture = createSuspendedAdminHttpFixture();
    const server = createAdminHttpServer(fixture);

    await withServer(server, async (baseUrl) => {
      const requestId = await createPendingSuspendedCorrectionRequest(baseUrl, fixture);
      await approveCorrectionRequest(baseUrl, requestId);

      const response = await adminRequest(baseUrl, 'POST', suspendedApplyPath(requestId), {
        headers: { 'X-User-Id': adminBId },
      });
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('ADMIN_AUTH_REQUIRED');
    });
  });
});
