import { describe, expect, it } from 'vitest';
import { createCorrectionApplyService } from '../../src/admin/correction-apply-service.js';
import { createCorrectionService } from '../../src/admin/correction-service.js';
import { createCorrectionDecisionService } from '../../src/admin/correction-decision-service.js';
import {
  AdminForbiddenError,
  CorrectionAlreadyAppliedError,
  CorrectionExpiredError,
  CorrectionPollNotEligibleError,
  CorrectionRequestNotApprovedError,
  CorrectionStaleTargetError,
} from '../../src/admin/errors.js';
import { createInMemoryCorrectionApplyRepository } from '../../src/admin/in-memory-correction-apply-repository.js';
import { createInMemoryCorrectionDecisionRepository } from '../../src/admin/in-memory-correction-decision-repository.js';
import { createInMemoryCorrectionRepository } from '../../src/admin/in-memory-correction-repository.js';
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

function setup(poll: PollRow = basePoll()) {
  const correctionRepo = createInMemoryCorrectionRepository();
  correctionRepo.ensureAdmin(proposerId);
  correctionRepo.ensureAdmin(adminBId);
  correctionRepo.ensureAdmin(adminCId);
  correctionRepo.setPoll(poll);
  correctionRepo.setOptions(poll.id, pollOptions());
  const decisionRepo = createInMemoryCorrectionDecisionRepository(correctionRepo);
  const applyRepo = createInMemoryCorrectionApplyRepository(correctionRepo);
  const now = () => submittedAt;
  const correctionService = createCorrectionService(correctionRepo, { now });
  const decisionService = createCorrectionDecisionService(decisionRepo, { now });
  const applyService = createCorrectionApplyService(applyRepo, { now });
  return { correctionRepo, correctionService, decisionService, applyService };
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

describe('CorrectionApplyService.applyCorrectionRequest', () => {
  it('applies approved title correction to polls.title and marks request applied', async () => {
    const { correctionRepo, correctionService, decisionService, applyService } = setup();
    const created = await correctionService.createCorrectionRequest({
      adminUserId: proposerId,
      pollId,
      correctionTargetField: 'title',
      proposedText: 'Original Titel',
      reason: 'Typo',
    });
    await approveRequest(decisionService, created.request_id);

    const result = await applyService.applyCorrectionRequest(created.request_id, applierId);

    expect(result.request_status).toBe('applied');
    expect(correctionRepo.polls.get(pollId)!.title).toBe('Original Titel');
    expect(correctionRepo.correctionRequests.get(created.request_id)!.status).toBe('applied');
    expect(correctionRepo.correctionLogs).toHaveLength(1);
    expect(correctionRepo.correctionLogs[0]).toMatchObject({
      public_notice_id: null,
      original_text: 'Original Title',
      applied_text: 'Original Titel',
    });
  });

  it('applies approved description correction', async () => {
    const { correctionRepo, correctionService, decisionService, applyService } = setup();
    const created = await correctionService.createCorrectionRequest({
      adminUserId: proposerId,
      pollId,
      correctionTargetField: 'description',
      proposedText: 'Original descrption',
      reason: 'Typo',
    });
    await approveRequest(decisionService, created.request_id);

    await applyService.applyCorrectionRequest(created.request_id, applierId);

    expect(correctionRepo.polls.get(pollId)!.description).toBe('Original descrption');
  });

  it('applies approved option_text only for same-poll option', async () => {
    const { correctionRepo, correctionService, decisionService, applyService } = setup();
    const created = await correctionService.createCorrectionRequest({
      adminUserId: proposerId,
      pollId,
      correctionTargetField: 'option_text',
      correctionTargetId: optionAId,
      proposedText: 'Option A lable',
      reason: 'Typo',
    });
    await approveRequest(decisionService, created.request_id);

    await applyService.applyCorrectionRequest(created.request_id, applierId);

    const options = correctionRepo.optionsByPollId.get(pollId)!;
    expect(options.find((row) => row.id === optionAId)!.option_text).toBe('Option A lable');
    expect(options.find((row) => row.id === optionBId)!.option_text).toBe('Option B label');
  });

  it('rejects apply when only one approve (pending request)', async () => {
    const { correctionService, decisionService, applyService } = setup();
    const created = await correctionService.createCorrectionRequest({
      adminUserId: proposerId,
      pollId,
      correctionTargetField: 'title',
      proposedText: 'Original Titel',
      reason: 'Typo',
    });
    await decisionService.submitCorrectionDecision(created.request_id, adminBId, {
      decision: 'approve',
      reason_code: 'OK',
    });

    await expect(
      applyService.applyCorrectionRequest(created.request_id, applierId),
    ).rejects.toBeInstanceOf(CorrectionRequestNotApprovedError);
  });

  it('rejects apply for rejected, expired, and applied requests', async () => {
    const { correctionRepo, correctionService, decisionService, applyService } = setup();
    const created = await correctionService.createCorrectionRequest({
      adminUserId: proposerId,
      pollId,
      correctionTargetField: 'title',
      proposedText: 'Original Titel',
      reason: 'Typo',
    });

    await decisionService.submitCorrectionDecision(created.request_id, adminBId, {
      decision: 'reject',
      reason_code: 'NO',
    });
    await expect(
      applyService.applyCorrectionRequest(created.request_id, applierId),
    ).rejects.toBeInstanceOf(CorrectionRequestNotApprovedError);

    const expiredRequest = await correctionService.createCorrectionRequest({
      adminUserId: proposerId,
      pollId,
      correctionTargetField: 'description',
      proposedText: 'Original descrption',
      reason: 'Typo',
    });
    const stored = correctionRepo.correctionRequests.get(expiredRequest.request_id)!;
    stored.status = 'expired';
    correctionRepo.correctionRequests.set(expiredRequest.request_id, stored);
    await expect(
      applyService.applyCorrectionRequest(expiredRequest.request_id, applierId),
    ).rejects.toBeInstanceOf(CorrectionRequestNotApprovedError);

    const approved = await correctionService.createCorrectionRequest({
      adminUserId: proposerId,
      pollId,
      correctionTargetField: 'title',
      proposedText: 'Revised Title',
      reason: 'Typo2',
    });
    await approveRequest(decisionService, approved.request_id);
    await applyService.applyCorrectionRequest(approved.request_id, applierId);
    await expect(
      applyService.applyCorrectionRequest(approved.request_id, applierId),
    ).rejects.toBeInstanceOf(CorrectionAlreadyAppliedError);
  });

  it('expires approved request past valid_until without text or log changes', async () => {
    const { correctionRepo, correctionService, decisionService, applyService } = setup();
    const created = await correctionService.createCorrectionRequest({
      adminUserId: proposerId,
      pollId,
      correctionTargetField: 'title',
      proposedText: 'Original Titel',
      reason: 'Typo',
    });
    await approveRequest(decisionService, created.request_id);
    const stored = correctionRepo.correctionRequests.get(created.request_id)!;
    stored.valid_until = new Date('2026-06-14T00:00:00.000Z');
    correctionRepo.correctionRequests.set(created.request_id, stored);

    await expect(
      applyService.applyCorrectionRequest(created.request_id, applierId),
    ).rejects.toBeInstanceOf(CorrectionExpiredError);

    expect(correctionRepo.correctionRequests.get(created.request_id)!.status).toBe('expired');
    expect(correctionRepo.polls.get(pollId)!.title).toBe('Original Title');
    expect(correctionRepo.correctionLogs).toHaveLength(0);
  });

  it('leaves request approved when original_text is stale', async () => {
    const { correctionRepo, correctionService, decisionService, applyService } = setup();
    const created = await correctionService.createCorrectionRequest({
      adminUserId: proposerId,
      pollId,
      correctionTargetField: 'title',
      proposedText: 'Original Titel',
      reason: 'Typo',
    });
    await approveRequest(decisionService, created.request_id);
    correctionRepo.polls.get(pollId)!.title = 'Changed externally';

    await expect(
      applyService.applyCorrectionRequest(created.request_id, applierId),
    ).rejects.toBeInstanceOf(CorrectionStaleTargetError);

    expect(correctionRepo.correctionRequests.get(created.request_id)!.status).toBe('approved');
    expect(correctionRepo.correctionLogs).toHaveLength(0);
  });

  it('fails option_text apply when option belongs to another poll', async () => {
    const { correctionRepo, applyService } = setup();
    const otherPoll = basePoll({ id: otherPollId });
    correctionRepo.setPoll(otherPoll);
    const crossOptionId = '88888888-8888-4888-8888-888888888888';
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

    await expect(
      applyService.applyCorrectionRequest(requestId, applierId),
    ).rejects.toBeInstanceOf(CorrectionStaleTargetError);
  });

  it('rejects inactive or revoked admin', async () => {
    const { correctionRepo, correctionService, decisionService, applyService } = setup();
    correctionRepo.ensureAdmin(revokedAdminId, 'revoked');
    const created = await correctionService.createCorrectionRequest({
      adminUserId: proposerId,
      pollId,
      correctionTargetField: 'title',
      proposedText: 'Original Titel',
      reason: 'Typo',
    });
    await approveRequest(decisionService, created.request_id);

    await expect(
      applyService.applyCorrectionRequest(created.request_id, revokedAdminId),
    ).rejects.toBeInstanceOf(AdminForbiddenError);
  });

  it.each([
    ['suspended', 'suspended' as const],
    ['correction_pending', 'correction_pending' as const],
  ])('rejects apply when poll becomes %s after approval', async (_label, status) => {
    const { correctionRepo, correctionService, decisionService, applyService } = setup();
    const created = await correctionService.createCorrectionRequest({
      adminUserId: proposerId,
      pollId,
      correctionTargetField: 'title',
      proposedText: 'Original Titel',
      reason: 'Typo',
    });
    await approveRequest(decisionService, created.request_id);
    correctionRepo.polls.get(pollId)!.status = status;

    await expect(
      applyService.applyCorrectionRequest(created.request_id, applierId),
    ).rejects.toBeInstanceOf(CorrectionPollNotEligibleError);
  });

  it('allows apply on closed poll when request is approved', async () => {
    const { correctionRepo, correctionService, decisionService, applyService } = setup(
      basePoll({ status: 'closed' }),
    );
    const created = await correctionService.createCorrectionRequest({
      adminUserId: proposerId,
      pollId,
      correctionTargetField: 'title',
      proposedText: 'Original Titel',
      reason: 'Typo',
    });
    await approveRequest(decisionService, created.request_id);

    await applyService.applyCorrectionRequest(created.request_id, applierId);

    expect(correctionRepo.polls.get(pollId)!.status).toBe('closed');
    expect(correctionRepo.correctionRequests.get(created.request_id)!.status).toBe('applied');
  });

  it('does not write public_notices or admin_decision_logs on apply', async () => {
    const { correctionRepo, correctionService, decisionService, applyService } = setup();
    const created = await correctionService.createCorrectionRequest({
      adminUserId: proposerId,
      pollId,
      correctionTargetField: 'title',
      proposedText: 'Original Titel',
      reason: 'Typo',
    });
    await approveRequest(decisionService, created.request_id);
    const decisionCountBefore = correctionRepo.decisionLogs.length;

    await applyService.applyCorrectionRequest(created.request_id, applierId);

    expect(correctionRepo.publicNotices).toHaveLength(0);
    expect(correctionRepo.decisionLogs).toHaveLength(decisionCountBefore);
  });

  it('does not change poll.status or published_at on apply', async () => {
    const { correctionRepo, correctionService, decisionService, applyService } = setup();
    const before = basePoll();
    const publishedAt = before.published_at;
    const created = await correctionService.createCorrectionRequest({
      adminUserId: proposerId,
      pollId,
      correctionTargetField: 'title',
      proposedText: 'Original Titel',
      reason: 'Typo',
    });
    await approveRequest(decisionService, created.request_id);

    await applyService.applyCorrectionRequest(created.request_id, applierId);

    const poll = correctionRepo.polls.get(pollId)!;
    expect(poll.status).toBe('active');
    expect(poll.published_at).toEqual(publishedAt);
  });

  it('rejects pending request via decision guard before apply path', async () => {
    const { correctionService, applyService } = setup();
    const created = await correctionService.createCorrectionRequest({
      adminUserId: proposerId,
      pollId,
      correctionTargetField: 'title',
      proposedText: 'Original Titel',
      reason: 'Typo',
    });

    await expect(
      applyService.applyCorrectionRequest(created.request_id, applierId),
    ).rejects.toBeInstanceOf(CorrectionRequestNotApprovedError);
  });
});
