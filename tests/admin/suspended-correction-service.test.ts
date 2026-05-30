import { describe, expect, it } from 'vitest';
import { createCorrectionApplyService } from '../../src/admin/correction-apply-service.js';
import { createCorrectionService } from '../../src/admin/correction-service.js';
import { createCorrectionDecisionService } from '../../src/admin/correction-decision-service.js';
import {
  AdminForbiddenError,
  CorrectionConflictError,
  CorrectionExpiredError,
  CorrectionPollNotCorrectionPendingError,
  CorrectionPollNotEligibleError,
  CorrectionPollNotSuspendedError,
  CorrectionRequestNotApprovedError,
  CorrectionStaleTargetError,
} from '../../src/admin/errors.js';
import { createInMemoryCorrectionApplyRepository } from '../../src/admin/in-memory-correction-apply-repository.js';
import { createInMemoryCorrectionDecisionRepository } from '../../src/admin/in-memory-correction-decision-repository.js';
import { createInMemoryCorrectionRepository } from '../../src/admin/in-memory-correction-repository.js';
import { createInMemorySuspendedCorrectionRepository } from '../../src/admin/in-memory-suspended-correction-repository.js';
import { buildSuspendedCorrectionPublicNotice } from '../../src/admin/public-notice-content.js';
import { createSuspendedCorrectionApplyService } from '../../src/admin/suspended-correction-apply-service.js';
import { createSuspendedCorrectionService } from '../../src/admin/suspended-correction-service.js';
import { isPublicHiddenPoll } from '../../src/polls/public-visibility.js';
import type { PollOptionRow, PollRow } from '../../src/polls/types.js';

const proposerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const adminBId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const adminCId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const applierId = adminBId;
const revokedAdminId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const pollId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const otherPollId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const optionAId = '11111111-1111-4111-8111-111111111111';
const optionBId = '22222222-2222-4222-8222-222222222222';
const submittedAt = new Date('2026-06-15T10:00:00.000Z');

function basePoll(overrides: Partial<PollRow> = {}): PollRow {
  const now = new Date('2026-06-01T12:00:00.000Z');
  return {
    id: pollId,
    creator_id: '33333333-3333-4333-8333-333333333333',
    title: 'Suspended Title',
    description: 'Suspended description',
    category: 'general',
    status: 'suspended',
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

function pollOptions(): PollOptionRow[] {
  const now = new Date('2026-06-01T12:00:00.000Z');
  return [
    {
      id: optionAId,
      poll_id: pollId,
      option_order: 0,
      option_text: 'Option A label',
      created_at: now,
      updated_at: now,
    },
    {
      id: optionBId,
      poll_id: pollId,
      option_order: 1,
      option_text: 'Option B label',
      created_at: now,
      updated_at: now,
    },
  ];
}

function setupSuspended(poll: PollRow = basePoll()) {
  const correctionRepo = createInMemoryCorrectionRepository();
  correctionRepo.ensureAdmin(proposerId);
  correctionRepo.ensureAdmin(adminBId);
  correctionRepo.ensureAdmin(adminCId);
  correctionRepo.setPoll(poll);
  correctionRepo.setOptions(poll.id, pollOptions());
  const suspendedRepo = createInMemorySuspendedCorrectionRepository(correctionRepo);
  const decisionRepo = createInMemoryCorrectionDecisionRepository(correctionRepo);
  const applyRepo = createInMemoryCorrectionApplyRepository(correctionRepo);
  const now = () => submittedAt;
  const suspendedService = createSuspendedCorrectionService(suspendedRepo, { now });
  const decisionService = createCorrectionDecisionService(decisionRepo, { now });
  const suspendedApplyService = createSuspendedCorrectionApplyService(suspendedRepo, { now });
  const activeApplyService = createCorrectionApplyService(applyRepo, { now });
  const activeCorrectionService = createCorrectionService(correctionRepo, { now });
  return {
    correctionRepo,
    suspendedService,
    decisionService,
    suspendedApplyService,
    activeApplyService,
    activeCorrectionService,
  };
}

async function approveRequest(
  decisionService: ReturnType<typeof createCorrectionDecisionService>,
  requestId: string,
) {
  await decisionService.submitCorrectionDecision(requestId, adminBId, {
    decision: 'approve',
    reason_code: 'OK',
  });
  await decisionService.submitCorrectionDecision(requestId, adminCId, {
    decision: 'approve',
    reason_code: 'OK',
  });
}

describe('SuspendedCorrectionService', () => {
  it('creates request on suspended poll and moves poll to correction_pending', async () => {
    const { correctionRepo, suspendedService } = setupSuspended();
    const result = await suspendedService.createSuspendedCorrectionRequest({
      adminUserId: proposerId,
      pollId,
      correctionTargetField: 'title',
      proposedText: 'Suspended Titel',
      reason: 'Typo',
    });

    expect(result.status).toBe('pending');
    expect(correctionRepo.correctionRequests.get(result.request_id)!.status).toBe('pending');
    expect(correctionRepo.polls.get(pollId)!.status).toBe('correction_pending');
    expect(correctionRepo.polls.get(pollId)!.title).toBe('Suspended Title');
    expect(correctionRepo.correctionLogs).toHaveLength(0);
    expect(correctionRepo.publicNotices).toHaveLength(0);
  });

  it('rejects suspended create on active or closed poll', async () => {
    const { suspendedService } = setupSuspended(basePoll({ status: 'active' }));
    await expect(
      suspendedService.createSuspendedCorrectionRequest({
        adminUserId: proposerId,
        pollId,
        correctionTargetField: 'title',
        proposedText: 'X',
        reason: 'Typo',
      }),
    ).rejects.toBeInstanceOf(CorrectionPollNotSuspendedError);
  });

  it('rejects duplicate pending suspended request', async () => {
    const { suspendedService } = setupSuspended();
    const input = {
      adminUserId: proposerId,
      pollId,
      correctionTargetField: 'title' as const,
      proposedText: 'Suspended Titel',
      reason: 'Typo',
    };
    await suspendedService.createSuspendedCorrectionRequest(input);
    await expect(suspendedService.createSuspendedCorrectionRequest(input)).rejects.toBeInstanceOf(
      CorrectionConflictError,
    );
  });

  it('keeps correction_pending public-hidden', () => {
    const poll = basePoll({ status: 'correction_pending' });
    expect(isPublicHiddenPoll(poll)).toBe(true);
  });

  it('suspended apply updates text, poll active, notice and log linked', async () => {
    const { correctionRepo, suspendedService, decisionService, suspendedApplyService } =
      setupSuspended();
    const created = await suspendedService.createSuspendedCorrectionRequest({
      adminUserId: proposerId,
      pollId,
      correctionTargetField: 'title',
      proposedText: 'Suspended Titel',
      reason: 'Typo',
    });
    await approveRequest(decisionService, created.request_id);

    const applied = await suspendedApplyService.applySuspendedCorrectionRequest(
      created.request_id,
      applierId,
    );

    expect(applied.request_status).toBe('applied');
    expect(correctionRepo.polls.get(pollId)!.status).toBe('active');
    expect(correctionRepo.polls.get(pollId)!.title).toBe('Suspended Titel');
    expect(correctionRepo.publicNotices).toHaveLength(1);
    expect(correctionRepo.correctionLogs).toHaveLength(1);
    const log = correctionRepo.correctionLogs[0] as { public_notice_id: string | null };
    const notice = correctionRepo.publicNotices[0] as { id: string; body: string };
    expect(log.public_notice_id).toBe(notice.id);
    expect(notice.body).toContain('Poll was previously suspended.');
    expect(notice.body).toContain('Admin typo correction was applied.');
    expect(notice.body).not.toMatch(/spread|voter|token|session|device|trace/i);
  });

  it('notice template matches buildSuspendedCorrectionPublicNotice', () => {
    const notice = buildSuspendedCorrectionPublicNotice(submittedAt);
    expect(notice.body).toContain(submittedAt.toISOString());
    expect(notice.title.length).toBeGreaterThan(0);
  });

  it('rejects suspended apply when request not approved', async () => {
    const { suspendedService, suspendedApplyService } = setupSuspended();
    const created = await suspendedService.createSuspendedCorrectionRequest({
      adminUserId: proposerId,
      pollId,
      correctionTargetField: 'title',
      proposedText: 'Suspended Titel',
      reason: 'Typo',
    });

    await expect(
      suspendedApplyService.applySuspendedCorrectionRequest(created.request_id, applierId),
    ).rejects.toBeInstanceOf(CorrectionRequestNotApprovedError);
  });

  it('expires approved request and restores poll to suspended', async () => {
    const { correctionRepo, suspendedService, decisionService, suspendedApplyService } =
      setupSuspended();
    const created = await suspendedService.createSuspendedCorrectionRequest({
      adminUserId: proposerId,
      pollId,
      correctionTargetField: 'title',
      proposedText: 'Suspended Titel',
      reason: 'Typo',
    });
    await approveRequest(decisionService, created.request_id);
    const stored = correctionRepo.correctionRequests.get(created.request_id)!;
    stored.valid_until = new Date('2026-06-14T00:00:00.000Z');
    correctionRepo.correctionRequests.set(created.request_id, stored);

    await expect(
      suspendedApplyService.applySuspendedCorrectionRequest(created.request_id, applierId),
    ).rejects.toBeInstanceOf(CorrectionExpiredError);

    expect(correctionRepo.correctionRequests.get(created.request_id)!.status).toBe('expired');
    expect(correctionRepo.polls.get(pollId)!.status).toBe('suspended');
    expect(correctionRepo.correctionLogs).toHaveLength(0);
    expect(correctionRepo.publicNotices).toHaveLength(0);
  });

  it('stale text leaves request approved and poll correction_pending', async () => {
    const { correctionRepo, suspendedService, decisionService, suspendedApplyService } =
      setupSuspended();
    const created = await suspendedService.createSuspendedCorrectionRequest({
      adminUserId: proposerId,
      pollId,
      correctionTargetField: 'title',
      proposedText: 'Suspended Titel',
      reason: 'Typo',
    });
    await approveRequest(decisionService, created.request_id);
    correctionRepo.polls.get(pollId)!.title = 'Changed';

    await expect(
      suspendedApplyService.applySuspendedCorrectionRequest(created.request_id, applierId),
    ).rejects.toBeInstanceOf(CorrectionStaleTargetError);

    expect(correctionRepo.correctionRequests.get(created.request_id)!.status).toBe('approved');
    expect(correctionRepo.polls.get(pollId)!.status).toBe('correction_pending');
    expect(correctionRepo.publicNotices).toHaveLength(0);
  });

  it('6B.4 apply rejects correction_pending poll', async () => {
    const { correctionRepo, suspendedService, decisionService, activeApplyService } =
      setupSuspended();
    const created = await suspendedService.createSuspendedCorrectionRequest({
      adminUserId: proposerId,
      pollId,
      correctionTargetField: 'title',
      proposedText: 'Suspended Titel',
      reason: 'Typo',
    });
    await approveRequest(decisionService, created.request_id);

    await expect(
      activeApplyService.applyCorrectionRequest(created.request_id, applierId),
    ).rejects.toBeInstanceOf(CorrectionPollNotEligibleError);
  });

  it('rejected suspended request restores poll to suspended', async () => {
    const { correctionRepo, suspendedService, decisionService } = setupSuspended();
    const created = await suspendedService.createSuspendedCorrectionRequest({
      adminUserId: proposerId,
      pollId,
      correctionTargetField: 'title',
      proposedText: 'Suspended Titel',
      reason: 'Typo',
    });
    expect(correctionRepo.polls.get(pollId)!.status).toBe('correction_pending');

    await decisionService.submitCorrectionDecision(created.request_id, adminBId, {
      decision: 'reject',
      reason_code: 'NO',
    });

    expect(correctionRepo.correctionRequests.get(created.request_id)!.status).toBe('rejected');
    expect(correctionRepo.polls.get(pollId)!.status).toBe('suspended');
  });

  it('rejected active-path request does not change poll status', async () => {
    const { correctionRepo, activeCorrectionService, decisionService } = setupSuspended(
      basePoll({ status: 'active' }),
    );
    const created = await activeCorrectionService.createCorrectionRequest({
      adminUserId: proposerId,
      pollId,
      correctionTargetField: 'title',
      proposedText: 'Active Titel',
      reason: 'Typo',
    });

    await decisionService.submitCorrectionDecision(created.request_id, adminBId, {
      decision: 'reject',
      reason_code: 'NO',
    });

    expect(correctionRepo.polls.get(pollId)!.status).toBe('active');
  });

  it('rejects inactive admin on create and apply', async () => {
    const { correctionRepo, suspendedService, decisionService, suspendedApplyService } =
      setupSuspended();
    correctionRepo.ensureAdmin(revokedAdminId, 'revoked');
    await expect(
      suspendedService.createSuspendedCorrectionRequest({
        adminUserId: revokedAdminId,
        pollId,
        correctionTargetField: 'title',
        proposedText: 'X',
        reason: 'Typo',
      }),
    ).rejects.toBeInstanceOf(AdminForbiddenError);

    const created = await suspendedService.createSuspendedCorrectionRequest({
      adminUserId: proposerId,
      pollId,
      correctionTargetField: 'title',
      proposedText: 'Suspended Titel',
      reason: 'Typo',
    });
    await approveRequest(decisionService, created.request_id);
    await expect(
      suspendedApplyService.applySuspendedCorrectionRequest(created.request_id, revokedAdminId),
    ).rejects.toBeInstanceOf(AdminForbiddenError);
  });

  it('cross-poll option fails on suspended apply', async () => {
    const { correctionRepo, suspendedApplyService } = setupSuspended();
    const crossOptionId = '88888888-8888-4888-8888-888888888888';
    correctionRepo.setPoll(basePoll({ id: otherPollId }));
    correctionRepo.setOptions(otherPollId, [
      {
        ...pollOptions()[0]!,
        id: crossOptionId,
        poll_id: otherPollId,
        option_text: 'Other poll option',
      },
    ]);

    const requestId = crypto.randomUUID();
    correctionRepo.correctionRequests.set(requestId, {
      id: requestId,
      poll_id: pollId,
      requester_admin_id: proposerId,
      correction_target_field: 'option_text',
      correction_target_id: crossOptionId,
      original_text: 'Other poll option',
      proposed_text: 'Other poll option',
      reason: 'Cross',
      status: 'approved',
      requires_dual_admin: true,
      spread_score_at_submit: 0,
      spread_score_locked_until: new Date('2026-06-16T10:00:00.000Z'),
      valid_until: new Date('2026-06-22T10:00:00.000Z'),
      submitted_at: submittedAt,
      created_at: submittedAt,
      updated_at: submittedAt,
    });
    correctionRepo.polls.get(pollId)!.status = 'correction_pending';

    await expect(
      suspendedApplyService.applySuspendedCorrectionRequest(requestId, applierId),
    ).rejects.toBeInstanceOf(CorrectionStaleTargetError);
  });

  it('does not change published_at on suspended apply', async () => {
    const { correctionRepo, suspendedService, decisionService, suspendedApplyService } =
      setupSuspended();
    const publishedAt = correctionRepo.polls.get(pollId)!.published_at;
    const created = await suspendedService.createSuspendedCorrectionRequest({
      adminUserId: proposerId,
      pollId,
      correctionTargetField: 'title',
      proposedText: 'Suspended Titel',
      reason: 'Typo',
    });
    await approveRequest(decisionService, created.request_id);
    await suspendedApplyService.applySuspendedCorrectionRequest(created.request_id, applierId);

    expect(correctionRepo.polls.get(pollId)!.published_at).toEqual(publishedAt);
  });
});
