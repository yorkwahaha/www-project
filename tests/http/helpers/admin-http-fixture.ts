import type { Server } from 'node:http';
import { createCorrectionAuditReadService } from '../../../src/admin/correction-audit-read-service.js';
import type { CorrectionAuditReadService } from '../../../src/admin/correction-audit-read-service.js';
import { createCorrectionApplyService } from '../../../src/admin/correction-apply-service.js';
import type { CorrectionApplyService } from '../../../src/admin/correction-apply-service.js';
import { createCorrectionDecisionService } from '../../../src/admin/correction-decision-service.js';
import type { CorrectionDecisionService } from '../../../src/admin/correction-decision-service.js';
import { createCorrectionService } from '../../../src/admin/correction-service.js';
import { createInMemoryCorrectionApplyRepository } from '../../../src/admin/in-memory-correction-apply-repository.js';
import { createInMemoryCorrectionAuditReadRepository } from '../../../src/admin/in-memory-correction-audit-read-repository.js';
import { createInMemoryCorrectionDecisionRepository } from '../../../src/admin/in-memory-correction-decision-repository.js';
import {
  createInMemoryCorrectionRepository,
  type InMemoryCorrectionRepository,
} from '../../../src/admin/in-memory-correction-repository.js';
import type { CorrectionService } from '../../../src/admin/correction-service.js';
import { createInMemorySuspendedCorrectionRepository } from '../../../src/admin/in-memory-suspended-correction-repository.js';
import { createSuspendedCorrectionApplyService } from '../../../src/admin/suspended-correction-apply-service.js';
import type { SuspendedCorrectionApplyService } from '../../../src/admin/suspended-correction-apply-service.js';
import { createSuspendedCorrectionService } from '../../../src/admin/suspended-correction-service.js';
import type { SuspendedCorrectionService } from '../../../src/admin/suspended-correction-service.js';
import { createHttpServer } from '../../../src/http/server.js';
import type { AdminCorrectionServices } from '../../../src/http/admin-routes.js';
import type { AdminAuth } from '../../../src/http/admin-auth.js';
import type { PollOptionRow, PollRow } from '../../../src/polls/types.js';
import { createPollService } from '../../../src/polls/service.js';
import type { PollService } from '../../../src/polls/service.js';
import { createInMemoryPollRepository } from '../../../src/polls/in-memory-repository.js';
import {
  adminAuthHeaders,
  createTestAdminAuth,
} from '../../helpers/admin-auth.js';

export { adminAuthHeaders } from '../../helpers/admin-auth.js';

export const defaultAdminId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const adminBId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
export const adminCId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
export const nonAdminCredentialId = '99999999-9999-4999-8999-999999999999';
export const readOnlyAdminId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
export const writeOnlyAdminId = '12121212-1212-4121-8121-121212121212';
export const revokedAdminId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
export const defaultPollId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
export const defaultOptionId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
export const defaultSubmittedAt = new Date('2026-06-15T10:00:00.000Z');

export async function withServer<T>(
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

export async function adminRequest(
  baseUrl: string,
  method: string,
  path: string,
  options: {
    headers?: Record<string, string>;
    body?: unknown;
  } = {},
): Promise<{ status: number; body: Record<string, unknown> }> {
  const payload = options.body === undefined ? undefined : JSON.stringify(options.body);
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: payload,
  });
  const body = (await response.json()) as Record<string, unknown>;
  return { status: response.status, body };
}

export type AdminHttpFixture = {
  pollService: PollService;
  pollRepo: ReturnType<typeof createInMemoryPollRepository>;
  correctionService: CorrectionService;
  decisionService: CorrectionDecisionService;
  applyService: CorrectionApplyService;
  suspendedCorrectionService: SuspendedCorrectionService;
  suspendedApplyService: SuspendedCorrectionApplyService;
  auditReadService: CorrectionAuditReadService;
  correctionRepo: InMemoryCorrectionRepository;
  adminCorrection: AdminCorrectionServices;
  adminAuth: AdminAuth;
  pollId: string;
  adminId: string;
};

export function createAdminHttpFixture(
  poll: PollRow = basePoll(),
  options: {
    adminId?: string;
    pollOptions?: PollOptionRow[];
    extraAdminIds?: string[];
  } = {},
): AdminHttpFixture {
  const adminId = options.adminId ?? defaultAdminId;
  const pollId = poll.id;
  const correctionRepo = createInMemoryCorrectionRepository();
  correctionRepo.ensureAdmin(adminId);
  correctionRepo.ensureAdmin(readOnlyAdminId);
  correctionRepo.ensureAdmin(writeOnlyAdminId);
  correctionRepo.ensureAdmin(revokedAdminId, 'revoked');
  for (const extraAdminId of options.extraAdminIds ?? [adminBId, adminCId]) {
    correctionRepo.ensureAdmin(extraAdminId);
  }
  correctionRepo.setPoll(poll);
  correctionRepo.setOptions(pollId, options.pollOptions ?? defaultPollOptions(pollId));

  const correctionService = createCorrectionService(correctionRepo, {
    now: () => defaultSubmittedAt,
  });
  const decisionRepo = createInMemoryCorrectionDecisionRepository(correctionRepo);
  const decisionService = createCorrectionDecisionService(decisionRepo, {
    now: () => defaultSubmittedAt,
  });
  const applyRepo = createInMemoryCorrectionApplyRepository(correctionRepo);
  const applyService = createCorrectionApplyService(applyRepo, {
    now: () => defaultSubmittedAt,
  });
  const suspendedRepo = createInMemorySuspendedCorrectionRepository(correctionRepo);
  const suspendedCorrectionService = createSuspendedCorrectionService(suspendedRepo, {
    now: () => defaultSubmittedAt,
  });
  const suspendedApplyService = createSuspendedCorrectionApplyService(suspendedRepo, {
    now: () => defaultSubmittedAt,
  });
  const auditReadService = createCorrectionAuditReadService(
    createInMemoryCorrectionAuditReadRepository(correctionRepo),
  );
  const adminCorrection: AdminCorrectionServices = {
    auditReadService,
    correctionService,
    decisionService,
    applyService,
    suspendedCorrectionService,
    suspendedApplyService,
  };
  const adminAuth = createTestAdminAuth([
    { adminId: defaultAdminId },
    { adminId: adminBId },
    { adminId: adminCId },
    { adminId: nonAdminCredentialId },
    { adminId: readOnlyAdminId, permissions: ['correction:read'] },
    { adminId: writeOnlyAdminId, permissions: ['correction:write'] },
    { adminId: revokedAdminId },
  ]);

  const pollRepo = createInMemoryPollRepository();
  void pollRepo.ensureUser(poll.creator_id, 'Creator');
  syncPollToPublicRepository(correctionRepo, pollRepo, pollId);
  const pollService = createPollService(pollRepo);

  return {
    pollService,
    pollRepo,
    correctionService,
    decisionService,
    applyService,
    suspendedCorrectionService,
    suspendedApplyService,
    auditReadService,
    correctionRepo,
    adminCorrection,
    adminAuth,
    pollId,
    adminId,
  };
}

export function createSuspendedAdminHttpFixture(): AdminHttpFixture {
  return createAdminHttpFixture(
    basePoll({ status: 'suspended', title: 'Suspended Title' }),
  );
}

export function syncPollToPublicRepository(
  correctionRepo: InMemoryCorrectionRepository,
  pollRepo: ReturnType<typeof createInMemoryPollRepository>,
  pollId: string,
): void {
  const poll = correctionRepo.polls.get(pollId);
  if (!poll) {
    return;
  }
  pollRepo.polls.set(pollId, { ...poll });
  const options = correctionRepo.optionsByPollId.get(pollId);
  if (options) {
    pollRepo.options.set(
      pollId,
      options.map((row) => ({ ...row })),
    );
  }
}

function suspendedTitleCorrectionBody(pollId: string) {
  return {
    poll_id: pollId,
    correction_target_field: 'title',
    proposed_text: 'Suspended Titel',
    reason: 'Typo after suspension',
  };
}

export async function createPendingSuspendedCorrectionRequest(
  baseUrl: string,
  fixture: AdminHttpFixture,
  proposerId: string = fixture.adminId,
): Promise<string> {
  const created = await adminRequest(
    baseUrl,
    'POST',
    '/admin/suspended-correction-requests',
    {
      headers: adminAuthHeaders(proposerId),
      body: suspendedTitleCorrectionBody(fixture.pollId),
    },
  );
  if (created.status !== 201) {
    throw new Error(`expected 201 suspended create, got ${created.status}`);
  }
  syncPollToPublicRepository(fixture.correctionRepo, fixture.pollRepo, fixture.pollId);
  return created.body.request_id as string;
}

export async function createPendingCorrectionRequest(
  baseUrl: string,
  fixture: AdminHttpFixture,
  proposerId: string = fixture.adminId,
): Promise<string> {
  const created = await adminRequest(baseUrl, 'POST', '/admin/correction-requests', {
    headers: adminAuthHeaders(proposerId),
    body: {
      poll_id: fixture.pollId,
      correction_target_field: 'title',
      proposed_text: 'Original Titel',
      reason: 'Typo',
    },
  });
  if (created.status !== 201) {
    throw new Error(`expected 201 create, got ${created.status}`);
  }
  return created.body.request_id as string;
}

export async function approveCorrectionRequest(
  baseUrl: string,
  requestId: string,
): Promise<void> {
  for (const reviewerId of [adminBId, adminCId]) {
    const response = await adminRequest(
      baseUrl,
      'POST',
      `/admin/correction-requests/${requestId}/decisions`,
      {
        headers: adminAuthHeaders(reviewerId),
        body: { decision: 'approve', reason_code: 'OK' },
      },
    );
    if (response.status !== 200) {
      throw new Error(`expected 200 approve, got ${response.status}`);
    }
  }
}

export function createAdminHttpServer(fixture: AdminHttpFixture): Server {
  return createHttpServer({
    pollService: fixture.pollService,
    adminCorrection: fixture.adminCorrection,
    adminAuth: fixture.adminAuth,
  });
}

function basePoll(overrides: Partial<PollRow> = {}): PollRow {
  const now = new Date('2026-06-01T12:00:00.000Z');
  return {
    id: defaultPollId,
    creator_id: '11111111-1111-4111-8111-111111111111',
    title: 'Original Title',
    description: 'Original description',
    category: 'general',
    status: 'active',
    public_lifecycle_state: 'collecting',
    eligible_rule_id: null,
    published_at: now,
    archived_at: null,
    closes_at: new Date('2026-12-31T12:00:00.000Z'),
    deleted_at: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

function defaultPollOptions(pollId: string): PollOptionRow[] {
  const now = new Date('2026-06-01T12:00:00.000Z');
  return [
    {
      id: defaultOptionId,
      poll_id: pollId,
      option_order: 0,
      option_text: 'Option A label',
      created_at: now,
      updated_at: now,
    },
  ];
}
