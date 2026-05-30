import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createPgCorrectionApplyRepository } from '../../src/admin/correction-apply-repository.js';
import { createCorrectionApplyService } from '../../src/admin/correction-apply-service.js';
import { createPgCorrectionRepository } from '../../src/admin/correction-repository.js';
import { createPgCorrectionDecisionRepository } from '../../src/admin/correction-decision-repository.js';
import { createCorrectionService } from '../../src/admin/correction-service.js';
import { createCorrectionDecisionService } from '../../src/admin/correction-decision-service.js';
import { createPgPollRepository } from '../../src/polls/repository.js';
import { createPollService } from '../../src/polls/service.js';
import {
  applyMigrations,
  createIntegrationPool,
  truncateBusinessTables,
} from '../helpers/pg-integration.js';

const creatorId = '11111111-1111-4111-8111-111111111111';
const proposerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const adminBId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const adminCId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const submittedAt = new Date('2026-06-15T10:00:00.000Z');

async function seedAdmins(pool: ReturnType<typeof createIntegrationPool>) {
  const pollRepo = createPgPollRepository(pool);
  await pollRepo.ensureUser(creatorId, 'Creator');
  for (const adminId of [proposerId, adminBId, adminCId]) {
    await pollRepo.ensureUser(adminId, `Admin ${adminId.slice(0, 8)}`);
    await pool.query(
      `INSERT INTO admin_users (user_id, role, status)
       VALUES ($1, 'admin', 'active')`,
      [adminId],
    );
  }
  return pollRepo;
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

describe('Correction apply PostgreSQL integration', () => {
  const pool = createIntegrationPool();

  beforeAll(async () => {
    await applyMigrations();
  });

  beforeEach(async () => {
    await truncateBusinessTables(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('create → dual approve → apply updates title and writes one correction log', async () => {
    const pollRepo = await seedAdmins(pool);
    const pollService = createPollService(pollRepo);
    const correctionRepo = createPgCorrectionRepository(pool);
    const decisionRepo = createPgCorrectionDecisionRepository(pool);
    const applyRepo = createPgCorrectionApplyRepository(pool);
    const now = () => submittedAt;
    const correctionService = createCorrectionService(correctionRepo, { now });
    const decisionService = createCorrectionDecisionService(decisionRepo, { now });
    const applyService = createCorrectionApplyService(applyRepo, { now });

    const created = await pollService.createPoll(
      {
        creatorId,
        title: 'PG Apply Title',
        description: 'PG description',
        category: 'general',
        options: ['Alpha', 'Beta'],
        eligibleRuleId: null,
        closesAt: new Date(Date.now() + 86_400_000),
        publish: true,
      },
      'Creator',
    );

    const pollBefore = await pool.query<{
      title: string;
      description: string;
      status: string;
      published_at: Date;
    }>(
      `SELECT title, description, status, published_at FROM polls WHERE id = $1`,
      [created.poll_id],
    );

    const tokensBefore = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM poll_vote_tokens`,
    );
    const countersBefore = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM poll_option_vote_counters`,
    );

    const request = await correctionService.createCorrectionRequest({
      adminUserId: proposerId,
      pollId: created.poll_id,
      correctionTargetField: 'title',
      proposedText: 'PG Apply Titel',
      reason: 'Typo',
    });
    await approveRequest(decisionService, request.request_id);

    const applied = await applyService.applyCorrectionRequest(
      request.request_id,
      adminBId,
    );
    expect(applied.request_status).toBe('applied');

    const requestRow = await pool.query<{ status: string }>(
      `SELECT status FROM poll_correction_requests WHERE id = $1`,
      [request.request_id],
    );
    expect(requestRow.rows[0]?.status).toBe('applied');

    const pollAfter = await pool.query<{
      title: string;
      description: string;
      status: string;
      published_at: Date;
    }>(
      `SELECT title, description, status, published_at FROM polls WHERE id = $1`,
      [created.poll_id],
    );
    expect(pollAfter.rows[0]?.title).toBe('PG Apply Titel');
    expect(pollAfter.rows[0]?.description).toBe(pollBefore.rows[0]?.description);
    expect(pollAfter.rows[0]?.status).toBe(pollBefore.rows[0]?.status);
    expect(pollAfter.rows[0]?.published_at.toISOString()).toBe(
      pollBefore.rows[0]?.published_at.toISOString(),
    );

    const logs = await pool.query<{
      count: string;
      public_notice_id: string | null;
      original_text: string;
      applied_text: string;
    }>(
      `SELECT COUNT(*)::text AS count,
              MAX(public_notice_id::text) AS public_notice_id,
              MAX(original_text) AS original_text,
              MAX(applied_text) AS applied_text
       FROM poll_correction_logs
       WHERE correction_request_id = $1`,
      [request.request_id],
    );
    expect(logs.rows[0]?.count).toBe('1');
    expect(logs.rows[0]?.public_notice_id).toBeNull();
    expect(logs.rows[0]?.original_text).toBe('PG Apply Title');
    expect(logs.rows[0]?.applied_text).toBe('PG Apply Titel');

    const notices = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM public_notices`,
    );
    expect(notices.rows[0]?.count).toBe('0');

    const decisionLogCount = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM admin_decision_logs`,
    );
    expect(Number(decisionLogCount.rows[0]?.count)).toBe(2);

    const tokensAfter = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM poll_vote_tokens`,
    );
    const countersAfter = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM poll_option_vote_counters`,
    );
    expect(tokensAfter.rows[0]?.count).toBe(tokensBefore.rows[0]?.count);
    expect(countersAfter.rows[0]?.count).toBe(countersBefore.rows[0]?.count);
  });

  it('duplicate apply fails after first successful apply', async () => {
    const pollRepo = await seedAdmins(pool);
    const pollService = createPollService(pollRepo);
    const correctionRepo = createPgCorrectionRepository(pool);
    const decisionRepo = createPgCorrectionDecisionRepository(pool);
    const applyRepo = createPgCorrectionApplyRepository(pool);
    const now = () => submittedAt;
    const correctionService = createCorrectionService(correctionRepo, { now });
    const decisionService = createCorrectionDecisionService(decisionRepo, { now });
    const applyService = createCorrectionApplyService(applyRepo, { now });

    const created = await pollService.createPoll(
      {
        creatorId,
        title: 'Dup Apply',
        description: '',
        category: 'general',
        options: ['A', 'B'],
        eligibleRuleId: null,
        closesAt: new Date(Date.now() + 86_400_000),
        publish: true,
      },
      'Creator',
    );

    const request = await correctionService.createCorrectionRequest({
      adminUserId: proposerId,
      pollId: created.poll_id,
      correctionTargetField: 'title',
      proposedText: 'Dup Applly',
      reason: 'Typo',
    });
    await approveRequest(decisionService, request.request_id);
    await applyService.applyCorrectionRequest(request.request_id, adminBId);

    await expect(
      applyService.applyCorrectionRequest(request.request_id, adminCId),
    ).rejects.toMatchObject({ code: 'CORRECTION_ALREADY_APPLIED' });

    const logCount = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM poll_correction_logs`,
    );
    expect(logCount.rows[0]?.count).toBe('1');
  });
});
