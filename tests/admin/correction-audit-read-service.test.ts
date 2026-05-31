import { describe, expect, it } from 'vitest';
import { createCorrectionAuditReadService } from '../../src/admin/correction-audit-read-service.js';
import type { CorrectionAuditReadRepository } from '../../src/admin/correction-audit-read-repository.js';

const adminId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const requestId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const pollId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const submittedAt = new Date('2026-06-15T10:00:00.000Z');
const decidedAt = new Date('2026-06-15T11:00:00.000Z');
const appliedAt = new Date('2026-06-15T12:00:00.000Z');

function createRepository(
  requestStatus: 'pending' | 'applied',
): CorrectionAuditReadRepository {
  return {
    findActiveAdminByUserId: async () => ({
      user_id: adminId,
      role: 'admin',
      status: 'active',
      created_at: submittedAt,
      revoked_at: null,
    }),
    findAuditRequestById: async () => ({
      request_id: requestId,
      poll_id: pollId,
      request_status: requestStatus,
      poll_status: 'active',
      correction_target_field: 'title',
      correction_target_id: null,
      original_text: 'Original Title',
      proposed_text: 'Original Titel',
      requires_dual_admin: true,
      submitted_at: submittedAt,
      valid_until: new Date('2026-06-22T10:00:00.000Z'),
      updated_at: appliedAt,
      correction_log_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      applied_text: 'Original Titel',
      applied_at: appliedAt,
      has_public_notice: true,
    }),
    getDecisionAggregateForRequest: async () => ({
      approve_count: requestStatus === 'pending' ? 1 : 2,
      reject_count: 0,
      last_decision_at: decidedAt,
      first_reject_at: null,
    }),
    listPollCorrectionAudit: async () => [],
    listGlobalCorrectionAudit: async () => [],
  };
}

describe('CorrectionAuditReadService', () => {
  it('masks partial decision aggregates while pending', async () => {
    const service = createCorrectionAuditReadService(createRepository('pending'));
    const record = await service.getAuditRecord(requestId, adminId);

    expect(record.decision_summary).toEqual({ state: 'pending_blind' });
    expect(record.correction_log_id).toBeNull();
    expect(record.applied_text).toBeNull();
    expect(record.applied_at).toBeNull();
    expect(record.has_public_notice).toBe(false);
    expect(record.timeline).toEqual([
      { event: 'submitted', at: '2026-06-15T10:00:00.000Z' },
    ]);
  });

  it('assembles a neutral applied lifecycle timeline', async () => {
    const service = createCorrectionAuditReadService(createRepository('applied'));
    const record = await service.getAuditRecord(requestId, adminId);

    expect(record.decision_summary).toEqual({
      approve_count: 2,
      reject_count: 0,
      quorum_met: true,
      is_finalized: true,
    });
    expect(record.timeline).toEqual([
      { event: 'submitted', at: '2026-06-15T10:00:00.000Z' },
      { event: 'decision_quorum_met', at: '2026-06-15T11:00:00.000Z' },
      { event: 'applied', at: '2026-06-15T12:00:00.000Z' },
    ]);
    expect(record.has_public_notice).toBe(true);
  });

  it('omits joined log details from non-applied list items', async () => {
    const repository = createRepository('pending');
    repository.listPollCorrectionAudit = async () => [
      {
        request_id: requestId,
        request_status: 'pending',
        correction_target_field: 'title',
        submitted_at: submittedAt,
        valid_until: new Date('2026-06-22T10:00:00.000Z'),
        correction_log_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        has_public_notice: true,
      },
    ];
    const service = createCorrectionAuditReadService(repository);
    const result = await service.listPollCorrectionAudit(pollId, adminId);

    expect(result.items).toEqual([
      {
        request_id: requestId,
        request_status: 'pending',
        correction_target_field: 'title',
        submitted_at: '2026-06-15T10:00:00.000Z',
        valid_until: '2026-06-22T10:00:00.000Z',
        has_public_notice: false,
      },
    ]);
  });
});
