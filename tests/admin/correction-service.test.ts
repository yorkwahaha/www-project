import { describe, expect, it } from 'vitest';
import {
  AdminForbiddenError,
  CorrectionConflictError,
  CorrectionPollNotEligibleError,
  CorrectionPollNotFoundError,
  CorrectionValidationError,
} from '../../src/admin/errors.js';
import { createCorrectionService } from '../../src/admin/correction-service.js';
import { createInMemoryCorrectionRepository } from '../../src/admin/in-memory-correction-repository.js';
import type { PollOptionRow, PollRow } from '../../src/polls/types.js';

const adminId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const otherPollId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const pollId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const optionAId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const optionBId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

function basePoll(overrides: Partial<PollRow> = {}): PollRow {
  const now = new Date('2026-06-01T12:00:00.000Z');
  return {
    id: pollId,
    creator_id: '11111111-1111-4111-8111-111111111111',
    title: 'Original Title',
    description: 'Original description',
    category: 'general',
    status: 'active',
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

function setupRepository(poll: PollRow = basePoll()) {
  const repository = createInMemoryCorrectionRepository();
  repository.ensureAdmin(adminId);
  repository.setPoll(poll);
  repository.setOptions(poll.id, pollOptions());
  return repository;
}

describe('CorrectionService.createCorrectionRequest', () => {
  const submittedAt = new Date('2026-06-15T10:00:00.000Z');

  it('rejects non-admin', async () => {
    const repository = setupRepository();
    const service = createCorrectionService(repository, { now: () => submittedAt });

    await expect(
      service.createCorrectionRequest({
        adminUserId: '99999999-9999-4999-8999-999999999999',
        pollId,
        correctionTargetField: 'title',
        proposedText: 'Revised Title',
        reason: 'Typo fix',
      }),
    ).rejects.toBeInstanceOf(AdminForbiddenError);
  });

  it('rejects inactive or revoked admin', async () => {
    const repository = setupRepository();
    repository.ensureAdmin('ffffffff-ffff-4fff-8fff-ffffffffffff', 'revoked');
    const service = createCorrectionService(repository, { now: () => submittedAt });

    await expect(
      service.createCorrectionRequest({
        adminUserId: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
        pollId,
        correctionTargetField: 'title',
        proposedText: 'Revised Title',
        reason: 'Typo fix',
      }),
    ).rejects.toBeInstanceOf(AdminForbiddenError);
  });

  it.each([
    ['draft', 'draft' as const],
    ['deleted', 'deleted' as const],
    ['suspended', 'suspended' as const],
    ['correction_pending', 'correction_pending' as const],
  ])('rejects %s poll', async (_label, status) => {
    const repository = setupRepository(basePoll({ status }));
    const service = createCorrectionService(repository, { now: () => submittedAt });

    await expect(
      service.createCorrectionRequest({
        adminUserId: adminId,
        pollId,
        correctionTargetField: 'title',
        proposedText: 'Revised Title',
        reason: 'Typo fix',
      }),
    ).rejects.toBeInstanceOf(CorrectionPollNotEligibleError);
  });

  it('rejects nonexistent poll', async () => {
    const repository = setupRepository();
    const service = createCorrectionService(repository, { now: () => submittedAt });

    await expect(
      service.createCorrectionRequest({
        adminUserId: adminId,
        pollId: '99999999-9999-4999-8999-999999999999',
        correctionTargetField: 'title',
        proposedText: 'Revised Title',
        reason: 'Typo fix',
      }),
    ).rejects.toBeInstanceOf(CorrectionPollNotFoundError);
  });

  it('creates title correction with DB original and null target id', async () => {
    const repository = setupRepository();
    const service = createCorrectionService(repository, { now: () => submittedAt });

    const result = await service.createCorrectionRequest({
      adminUserId: adminId,
      pollId,
      correctionTargetField: 'title',
      proposedText: 'Original Titel',
      reason: 'Spelling',
    });

    const stored = repository.correctionRequests.get(result.request_id)!;
    expect(result.status).toBe('pending');
    expect(result.requires_dual_admin).toBe(true);
    expect(result.spread_score_at_submit).toBe(0);
    expect(result.valid_until).toBe('2026-06-22T10:00:00.000Z');
    expect(stored.original_text).toBe('Original Title');
    expect(stored.proposed_text).toBe('Original Titel');
    expect(stored.correction_target_id).toBeNull();
  });

  it('creates description correction with DB original and null target id', async () => {
    const repository = setupRepository();
    const service = createCorrectionService(repository, { now: () => submittedAt });

    const result = await service.createCorrectionRequest({
      adminUserId: adminId,
      pollId,
      correctionTargetField: 'description',
      proposedText: 'Original descrption',
      reason: 'Typo',
    });

    const stored = repository.correctionRequests.get(result.request_id)!;
    expect(stored.original_text).toBe('Original description');
    expect(stored.correction_target_id).toBeNull();
  });

  it('rejects title or description with correctionTargetId', async () => {
    const repository = setupRepository();
    const service = createCorrectionService(repository, { now: () => submittedAt });

    await expect(
      service.createCorrectionRequest({
        adminUserId: adminId,
        pollId,
        correctionTargetField: 'title',
        correctionTargetId: optionAId,
        proposedText: 'Revised',
        reason: 'Typo',
      }),
    ).rejects.toBeInstanceOf(CorrectionValidationError);
  });

  it('rejects option_text without correctionTargetId', async () => {
    const repository = setupRepository();
    const service = createCorrectionService(repository, { now: () => submittedAt });

    await expect(
      service.createCorrectionRequest({
        adminUserId: adminId,
        pollId,
        correctionTargetField: 'option_text',
        proposedText: 'Option A lable',
        reason: 'Typo',
      }),
    ).rejects.toBeInstanceOf(CorrectionValidationError);
  });

  it('rejects option_text target from another poll', async () => {
    const repository = setupRepository();
    const otherPoll = basePoll({ id: otherPollId });
    repository.setPoll(otherPoll);
    repository.setOptions(otherPollId, [
      {
        ...pollOptions()[0]!,
        id: '88888888-8888-4888-8888-888888888888',
        poll_id: otherPollId,
        option_text: 'Other poll option',
      },
    ]);
    const service = createCorrectionService(repository, { now: () => submittedAt });

    await expect(
      service.createCorrectionRequest({
        adminUserId: adminId,
        pollId,
        correctionTargetField: 'option_text',
        correctionTargetId: '88888888-8888-4888-8888-888888888888',
        proposedText: 'Other poll option',
        reason: 'Typo',
      }),
    ).rejects.toBeInstanceOf(CorrectionValidationError);
  });

  it('creates option_text correction with DB option text', async () => {
    const repository = setupRepository();
    const service = createCorrectionService(repository, { now: () => submittedAt });

    const result = await service.createCorrectionRequest({
      adminUserId: adminId,
      pollId,
      correctionTargetField: 'option_text',
      correctionTargetId: optionAId,
      proposedText: 'Option A lable',
      reason: 'Label typo',
    });

    const stored = repository.correctionRequests.get(result.request_id)!;
    expect(stored.original_text).toBe('Option A label');
    expect(stored.correction_target_id).toBe(optionAId);
  });

  it('rejects empty reason', async () => {
    const repository = setupRepository();
    const service = createCorrectionService(repository, { now: () => submittedAt });

    await expect(
      service.createCorrectionRequest({
        adminUserId: adminId,
        pollId,
        correctionTargetField: 'title',
        proposedText: 'Revised Title',
        reason: '   ',
      }),
    ).rejects.toBeInstanceOf(CorrectionValidationError);
  });

  it('leaves poll status unchanged', async () => {
    const poll = basePoll({ status: 'active' });
    const repository = setupRepository(poll);
    const service = createCorrectionService(repository, { now: () => submittedAt });

    await service.createCorrectionRequest({
      adminUserId: adminId,
      pollId,
      correctionTargetField: 'title',
      proposedText: 'Revised Title',
      reason: 'Typo',
    });

    expect(repository.polls.get(pollId)!.status).toBe('active');
  });

  it('allows closed poll corrections', async () => {
    const repository = setupRepository(basePoll({ status: 'closed' }));
    const service = createCorrectionService(repository, { now: () => submittedAt });

    const result = await service.createCorrectionRequest({
      adminUserId: adminId,
      pollId,
      correctionTargetField: 'title',
      proposedText: 'Closed poll title fix',
      reason: 'Typo',
    });

    expect(result.status).toBe('pending');
  });

  it('rejects duplicate pending request for the same target', async () => {
    const repository = setupRepository();
    const service = createCorrectionService(repository, { now: () => submittedAt });
    const input = {
      adminUserId: adminId,
      pollId,
      correctionTargetField: 'title' as const,
      proposedText: 'Revised Title',
      reason: 'Typo',
    };

    await service.createCorrectionRequest(input);
    await expect(service.createCorrectionRequest(input)).rejects.toBeInstanceOf(
      CorrectionConflictError,
    );
  });

  it('does not write decision logs, correction logs, public notices, votes, or counters', async () => {
    const repository = setupRepository();
    const service = createCorrectionService(repository, { now: () => submittedAt });

    await service.createCorrectionRequest({
      adminUserId: adminId,
      pollId,
      correctionTargetField: 'title',
      proposedText: 'Revised Title',
      reason: 'Typo',
    });

    expect(repository.decisionLogs).toHaveLength(0);
    expect(repository.correctionLogs).toHaveLength(0);
    expect(repository.publicNotices).toHaveLength(0);
    expect(repository.correctionRequests.size).toBe(1);
  });
});
