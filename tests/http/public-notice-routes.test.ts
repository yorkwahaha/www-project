import { describe, expect, it } from 'vitest';
import { createHttpServer } from '../../src/http/server.js';
import { createInMemoryPublicNoticeRepository } from '../../src/public-notices/in-memory-repository.js';
import { createPublicNoticeService } from '../../src/public-notices/service.js';
import {
  adminBId,
  adminAuthHeaders,
  adminRequest,
  approveCorrectionRequest,
  createAdminHttpFixture,
  createPendingSuspendedCorrectionRequest,
  createSuspendedAdminHttpFixture,
  defaultPollId,
  withServer,
} from './helpers/admin-http-fixture.js';

const DENIED_KEYS = [
  'admin_id',
  'created_by_admin_id',
  'requester_admin_id',
  'applied_by_admin_id',
  'reason',
  'reason_code',
  'reason_text',
  'peer_decisions',
  'final_decisions',
  'review_context',
  'option_id',
  'user_id',
  'session_id',
  'device_id',
  'request_id',
  'vote_token',
  'reference_answer_token',
] as const;

function createServer(fixture: ReturnType<typeof createAdminHttpFixture>) {
  return createHttpServer({
    pollService: fixture.pollService,
    adminCorrection: fixture.adminCorrection,
    adminAuth: fixture.adminAuth,
    publicNoticeService: createPublicNoticeService(
      createInMemoryPublicNoticeRepository(
        fixture.correctionRepo.polls,
        fixture.correctionRepo.publicNotices,
      ),
    ),
  });
}

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
  for (const [key, nestedValue] of Object.entries(value)) {
    expect(DENIED_KEYS).not.toContain(key);
    assertNoDeniedKeys(nestedValue);
  }
}

describe('GET /polls/:pollId/public-notices', () => {
  it('returns public-safe notice content after suspended correction apply', async () => {
    const fixture = createSuspendedAdminHttpFixture();
    const server = createServer(fixture);

    await withServer(server, async (baseUrl) => {
      const requestId = await createPendingSuspendedCorrectionRequest(baseUrl, fixture);
      await approveCorrectionRequest(baseUrl, requestId);
      const applied = await adminRequest(
        baseUrl,
        'POST',
        `/admin/suspended-correction-requests/${requestId}/apply`,
        { headers: adminAuthHeaders(adminBId) },
      );
      expect(applied.status).toBe(200);

      const response = await adminRequest(
        baseUrl,
        'GET',
        `/polls/${fixture.pollId}/public-notices`,
      );

      expect(response.status).toBe(200);
      expect(response.body.notices).toEqual([
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
      assertNoDeniedKeys(response.body);
    });
  });

  it('filters internal notice types and does not expose private storage fields', async () => {
    const fixture = createAdminHttpFixture();
    fixture.correctionRepo.publicNotices.push({
      id: crypto.randomUUID(),
      poll_id: fixture.pollId,
      notice_type: 'internal_admin_note',
      title: 'Internal only',
      body: 'Private workflow context',
      created_by_admin_id: fixture.adminId,
      created_at: new Date('2026-06-15T10:00:00.000Z'),
    });
    const server = createServer(fixture);

    await withServer(server, async (baseUrl) => {
      const response = await adminRequest(
        baseUrl,
        'GET',
        `/polls/${fixture.pollId}/public-notices`,
      );
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ notices: [] });
      assertNoDeniedKeys(response.body);
    });
  });

  it('returns an empty list for unknown, hidden, or notice-free polls', async () => {
    const activeFixture = createAdminHttpFixture();
    const activeServer = createServer(activeFixture);
    await withServer(activeServer, async (baseUrl) => {
      const noNotices = await adminRequest(
        baseUrl,
        'GET',
        `/polls/${defaultPollId}/public-notices`,
      );
      expect(noNotices.status).toBe(200);
      expect(noNotices.body).toEqual({ notices: [] });

      const unknown = await adminRequest(
        baseUrl,
        'GET',
        `/polls/${crypto.randomUUID()}/public-notices`,
      );
      expect(unknown.status).toBe(200);
      expect(unknown.body).toEqual({ notices: [] });
    });

    const hiddenFixture = createSuspendedAdminHttpFixture();
    hiddenFixture.correctionRepo.publicNotices.push({
      id: crypto.randomUUID(),
      poll_id: hiddenFixture.pollId,
      notice_type: 'suspended_typo_correction_applied',
      title: 'Should remain hidden',
      body: 'Should remain hidden',
      created_by_admin_id: hiddenFixture.adminId,
      created_at: new Date('2026-06-15T10:00:00.000Z'),
    });
    const hiddenServer = createServer(hiddenFixture);
    await withServer(hiddenServer, async (baseUrl) => {
      const hidden = await adminRequest(
        baseUrl,
        'GET',
        `/polls/${hiddenFixture.pollId}/public-notices`,
      );
      expect(hidden.status).toBe(200);
      expect(hidden.body).toEqual({ notices: [] });
    });
  });

  it('returns 400 INVALID_POLL_ID for an invalid poll id', async () => {
    const fixture = createAdminHttpFixture();
    const server = createServer(fixture);

    await withServer(server, async (baseUrl) => {
      const response = await adminRequest(
        baseUrl,
        'GET',
        '/polls/not-a-uuid/public-notices',
      );
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('INVALID_POLL_ID');
    });
  });
});
