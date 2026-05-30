import { describe, expect, it } from 'vitest';
import { createCorrectionService } from '../../src/admin/correction-service.js';
import { createCorrectionDecisionService } from '../../src/admin/correction-decision-service.js';
import {
  AdminForbiddenError,
  CorrectionDecisionAlreadySubmittedError,
  CorrectionExpiredError,
  CorrectionRequestNotFoundError,
  CorrectionRequestNotPendingError,
  ProposerCannotApproveError,
} from '../../src/admin/errors.js';
import { createInMemoryCorrectionDecisionRepository } from '../../src/admin/in-memory-correction-decision-repository.js';
import { createInMemoryCorrectionRepository } from '../../src/admin/in-memory-correction-repository.js';
import type { PollOptionRow, PollRow } from '../../src/polls/types.js';

const proposerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const adminBId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const adminCId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const revokedAdminId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const pollId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const submittedAt = new Date('2026-06-15T10:00:00.000Z');

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

function setup() {
  const correctionRepo = createInMemoryCorrectionRepository();
  correctionRepo.ensureAdmin(proposerId);
  correctionRepo.ensureAdmin(adminBId);
  correctionRepo.ensureAdmin(adminCId);
  correctionRepo.setPoll(basePoll());
  const decisionRepo = createInMemoryCorrectionDecisionRepository(correctionRepo);
  const correctionService = createCorrectionService(correctionRepo, { now: () => submittedAt });
  const decisionService = createCorrectionDecisionService(decisionRepo, {
    now: () => submittedAt,
  });
  return { correctionRepo, decisionRepo, correctionService, decisionService };
}

async function createPendingRequest(
  correctionService: ReturnType<typeof createCorrectionService>,
) {
  const created = await correctionService.createCorrectionRequest({
    adminUserId: proposerId,
    pollId,
    correctionTargetField: 'title',
    proposedText: 'Original Titel',
    reason: 'Typo',
  });
  return created.request_id;
}

describe('CorrectionDecisionService', () => {
  it('first approve keeps request pending; two approves set approved with two logs', async () => {
    const { correctionRepo, decisionService, correctionService } = setup();
    const requestId = await createPendingRequest(correctionService);

    const first = await decisionService.submitCorrectionDecision(requestId, adminBId, {
      decision: 'approve',
      reason_code: 'TYPO_OK',
    });
    expect(first.request_status).toBe('pending');
    expect(correctionRepo.correctionRequests.get(requestId)!.status).toBe('pending');

    const second = await decisionService.submitCorrectionDecision(requestId, adminCId, {
      decision: 'approve',
      reason_code: 'TYPO_OK',
    });
    expect(second.request_status).toBe('approved');
    expect(correctionRepo.decisionLogs).toHaveLength(2);
    expect(correctionRepo.correctionRequests.get(requestId)!.status).toBe('approved');
  });

  it('any reject makes request rejected immediately', async () => {
    const { correctionRepo, decisionService, correctionService } = setup();
    const requestId = await createPendingRequest(correctionService);

    const result = await decisionService.submitCorrectionDecision(requestId, adminBId, {
      decision: 'reject',
      reason_code: 'NOT_TYPO',
      reason_text: 'Meaning change',
    });

    expect(result.request_status).toBe('rejected');
    expect(correctionRepo.decisionLogs).toHaveLength(1);
    expect(correctionRepo.correctionRequests.get(requestId)!.status).toBe('rejected');
  });

  it('rejects proposer approve without writing a log', async () => {
    const { correctionRepo, decisionService, correctionService } = setup();
    const requestId = await createPendingRequest(correctionService);

    await expect(
      decisionService.submitCorrectionDecision(requestId, proposerId, {
        decision: 'approve',
        reason_code: 'SELF',
      }),
    ).rejects.toBeInstanceOf(ProposerCannotApproveError);

    expect(correctionRepo.decisionLogs).toHaveLength(0);
  });

  it('allows proposer reject and marks request rejected', async () => {
    const { correctionRepo, decisionService, correctionService } = setup();
    const requestId = await createPendingRequest(correctionService);

    const result = await decisionService.submitCorrectionDecision(requestId, proposerId, {
      decision: 'reject',
      reason_code: 'WITHDRAW',
    });

    expect(result.request_status).toBe('rejected');
    expect(correctionRepo.decisionLogs).toHaveLength(1);
  });

  it('rejects duplicate decision by same admin', async () => {
    const { decisionService, correctionService } = setup();
    const requestId = await createPendingRequest(correctionService);

    await decisionService.submitCorrectionDecision(requestId, adminBId, {
      decision: 'approve',
      reason_code: 'OK',
    });
    await expect(
      decisionService.submitCorrectionDecision(requestId, adminBId, {
        decision: 'approve',
        reason_code: 'OK_AGAIN',
      }),
    ).rejects.toBeInstanceOf(CorrectionDecisionAlreadySubmittedError);
  });

  it('rejects inactive or revoked admin', async () => {
    const { correctionRepo, decisionService, correctionService } = setup();
    correctionRepo.ensureAdmin(revokedAdminId, 'revoked');
    const requestId = await createPendingRequest(correctionService);

    await expect(
      decisionService.submitCorrectionDecision(requestId, revokedAdminId, {
        decision: 'approve',
        reason_code: 'NO',
      }),
    ).rejects.toBeInstanceOf(AdminForbiddenError);
  });

  it('rejects decision on non-pending request', async () => {
    const { correctionRepo, decisionService, correctionService } = setup();
    const requestId = await createPendingRequest(correctionService);
    await decisionService.submitCorrectionDecision(requestId, adminBId, {
      decision: 'reject',
      reason_code: 'NO',
    });

    await expect(
      decisionService.submitCorrectionDecision(requestId, adminCId, {
        decision: 'approve',
        reason_code: 'LATE',
      }),
    ).rejects.toBeInstanceOf(CorrectionRequestNotPendingError);
  });

  it('marks expired request and blocks decision', async () => {
    const { correctionRepo, decisionService, correctionService } = setup();
    const requestId = await createPendingRequest(correctionService);
    const stored = correctionRepo.correctionRequests.get(requestId)!;
    stored.valid_until = new Date('2026-06-14T00:00:00.000Z');
    correctionRepo.correctionRequests.set(requestId, stored);

    await expect(
      decisionService.submitCorrectionDecision(requestId, adminBId, {
        decision: 'approve',
        reason_code: 'LATE',
      }),
    ).rejects.toBeInstanceOf(CorrectionExpiredError);

    expect(correctionRepo.correctionRequests.get(requestId)!.status).toBe('expired');
    expect(correctionRepo.decisionLogs).toHaveLength(0);
  });

  it('blind review hides peer decisions until final status', async () => {
    const { decisionService, correctionService } = setup();
    const requestId = await createPendingRequest(correctionService);

    await decisionService.submitCorrectionDecision(requestId, adminBId, {
      decision: 'approve',
      reason_code: 'OK',
      reason_text: 'B reason',
    });

    const undecidedView = await decisionService.getReviewContext(requestId, adminCId);
    expect(undecidedView.viewer_has_submitted).toBe(false);
    expect(undecidedView.peer_decisions).toBeNull();
    expect(undecidedView.final_decisions).toBeNull();
    expect(undecidedView.request_status).toBe('pending');

    const decidedPendingView = await decisionService.getReviewContext(requestId, adminBId);
    expect(decidedPendingView.viewer_has_submitted).toBe(true);
    expect(decidedPendingView.peer_decisions).toBeNull();
    expect(decidedPendingView.final_decisions).toBeNull();

    await decisionService.submitCorrectionDecision(requestId, adminCId, {
      decision: 'approve',
      reason_code: 'OK',
      reason_text: 'C reason',
    });

    const finalView = await decisionService.getReviewContext(requestId, adminCId);
    expect(finalView.request_status).toBe('approved');
    expect(finalView.final_decisions).toHaveLength(2);
    expect(finalView.final_decisions!.map((row) => row.admin_id).sort()).toEqual(
      [adminBId, adminCId].sort(),
    );
    expect(finalView.peer_decisions).toBeNull();
  });

  it('does not modify polls or poll_options', async () => {
    const { correctionRepo, decisionService, correctionService } = setup();
    const pollBefore = { ...correctionRepo.polls.get(pollId)! };
    const requestId = await createPendingRequest(correctionService);

    await decisionService.submitCorrectionDecision(requestId, adminBId, {
      decision: 'approve',
      reason_code: 'OK',
    });
    await decisionService.submitCorrectionDecision(requestId, adminCId, {
      decision: 'approve',
      reason_code: 'OK',
    });

    expect(correctionRepo.polls.get(pollId)).toEqual(pollBefore);
  });

  it('does not write correction logs or public notices', async () => {
    const { correctionRepo, decisionService, correctionService } = setup();
    const requestId = await createPendingRequest(correctionService);

    await decisionService.submitCorrectionDecision(requestId, adminBId, {
      decision: 'approve',
      reason_code: 'OK',
    });

    expect(correctionRepo.correctionLogs).toHaveLength(0);
    expect(correctionRepo.publicNotices).toHaveLength(0);
  });

  it('stores metadata_json as empty object without option linkage keys', async () => {
    const { correctionRepo, decisionService, correctionService } = setup();
    const requestId = await createPendingRequest(correctionService);

    await decisionService.submitCorrectionDecision(requestId, adminBId, {
      decision: 'approve',
      reason_code: 'OK',
    });

    const log = correctionRepo.decisionLogs[0] as {
      metadata_json: Record<string, unknown>;
    };
    expect(log.metadata_json).toEqual({});
    expect(log.metadata_json).not.toHaveProperty('option_id');
    expect(log.metadata_json).not.toHaveProperty('user_id');
  });

  it('rejects review context for unknown request', async () => {
    const { decisionService } = setup();

    await expect(
      decisionService.getReviewContext('99999999-9999-4999-8999-999999999999', adminBId),
    ).rejects.toBeInstanceOf(CorrectionRequestNotFoundError);
  });
});
