import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createCorrectionApplyService } from '../../src/admin/correction-apply-service.js';
import { createPgCorrectionApplyRepository } from '../../src/admin/correction-apply-repository.js';
import { createCorrectionService } from '../../src/admin/correction-service.js';
import { createPgCorrectionRepository } from '../../src/admin/correction-repository.js';
import { createPgCorrectionDecisionRepository } from '../../src/admin/correction-decision-repository.js';
import { createPgSuspendedCorrectionRepository } from '../../src/admin/suspended-correction-repository.js';
import { createCorrectionDecisionService } from '../../src/admin/correction-decision-service.js';
import { createSuspendedCorrectionApplyService } from '../../src/admin/suspended-correction-apply-service.js';
import { createSuspendedCorrectionService } from '../../src/admin/suspended-correction-service.js';
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

describe('Suspended correction PostgreSQL integration', () => {
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

  it('suspended create → dual approve → apply restores poll active with notice and log', async () => {
    const pollRepo = await seedAdmins(pool);
    const pollService = createPollService(pollRepo);
    const correctionRepo = createPgCorrectionRepository(pool);
    const suspendedRepo = createPgSuspendedCorrectionRepository(pool, correctionRepo);
    const decisionRepo = createPgCorrectionDecisionRepository(pool);
    const now = () => submittedAt;
    const suspendedService = createSuspendedCorrectionService(suspendedRepo, { now });
    const decisionService = createCorrectionDecisionService(decisionRepo, { now });
    const suspendedApplyService = createSuspendedCorrectionApplyService(suspendedRepo, {
      now,
    });

    const created = await pollService.createPoll(
      {
        creatorId,
        title: 'PG Suspended Title',
        description: 'PG description',
        category: 'general',
        options: ['Alpha', 'Beta'],
        eligibleRuleId: null,
        closesAt: new Date(Date.now() + 86_400_000),
        publish: true,
      },
      'Creator',
    );

    await pool.query(`UPDATE polls SET status = 'suspended' WHERE id = $1`, [created.poll_id]);

    const pollBefore = await pool.query<{
      title: string;
      status: string;
      published_at: Date;
    }>(`SELECT title, status, published_at FROM polls WHERE id = $1`, [created.poll_id]);

    const tokensBefore = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM poll_vote_tokens`,
    );
    const countersBefore = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM poll_option_vote_counters`,
    );

    const request = await suspendedService.createSuspendedCorrectionRequest({
      adminUserId: proposerId,
      pollId: created.poll_id,
      correctionTargetField: 'title',
      proposedText: 'PG Suspended Titel',
      reason: 'Typo',
    });

    const pendingPoll = await pool.query<{ status: string }>(
      `SELECT status FROM polls WHERE id = $1`,
      [created.poll_id],
    );
    expect(pendingPoll.rows[0]?.status).toBe('correction_pending');

    await approveRequest(decisionService, request.request_id);
    await suspendedApplyService.applySuspendedCorrectionRequest(request.request_id, adminBId);

    const pollAfter = await pool.query<{
      title: string;
      status: string;
      published_at: Date;
    }>(`SELECT title, status, published_at FROM polls WHERE id = $1`, [created.poll_id]);
    expect(pollAfter.rows[0]?.title).toBe('PG Suspended Titel');
    expect(pollAfter.rows[0]?.status).toBe('active');
    expect(pollAfter.rows[0]?.published_at.toISOString()).toBe(
      pollBefore.rows[0]?.published_at.toISOString(),
    );

    const requestRow = await pool.query<{ status: string }>(
      `SELECT status FROM poll_correction_requests WHERE id = $1`,
      [request.request_id],
    );
    expect(requestRow.rows[0]?.status).toBe('applied');

    const notices = await pool.query<{ count: string; body: string }>(
      `SELECT COUNT(*)::text AS count, MAX(body) AS body FROM public_notices`,
    );
    expect(notices.rows[0]?.count).toBe('1');
    expect(notices.rows[0]?.body).toContain('Poll was previously suspended.');
    expect(notices.rows[0]?.body).not.toMatch(/spread_score|voter_id|vote_token/i);

    const logs = await pool.query<{ count: string; public_notice_id: string | null }>(
      `SELECT COUNT(*)::text AS count, MAX(public_notice_id::text) AS public_notice_id
       FROM poll_correction_logs`,
    );
    expect(logs.rows[0]?.count).toBe('1');
    expect(logs.rows[0]?.public_notice_id).not.toBeNull();

    const tokensAfter = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM poll_vote_tokens`,
    );
    const countersAfter = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM poll_option_vote_counters`,
    );
    expect(tokensAfter.rows[0]?.count).toBe(tokensBefore.rows[0]?.count);
    expect(countersAfter.rows[0]?.count).toBe(countersBefore.rows[0]?.count);
  });

  it('rejected suspended request restores poll to suspended', async () => {
    const pollRepo = await seedAdmins(pool);
    const pollService = createPollService(pollRepo);
    const correctionRepo = createPgCorrectionRepository(pool);
    const suspendedRepo = createPgSuspendedCorrectionRepository(pool, correctionRepo);
    const decisionRepo = createPgCorrectionDecisionRepository(pool);
    const now = () => submittedAt;
    const suspendedService = createSuspendedCorrectionService(suspendedRepo, { now });
    const decisionService = createCorrectionDecisionService(decisionRepo, { now });

    const created = await pollService.createPoll(
      {
        creatorId,
        title: 'Reject Path',
        description: '',
        category: 'general',
        options: ['A', 'B'],
        eligibleRuleId: null,
        closesAt: new Date(Date.now() + 86_400_000),
        publish: true,
      },
      'Creator',
    );
    await pool.query(`UPDATE polls SET status = 'suspended' WHERE id = $1`, [created.poll_id]);

    const request = await suspendedService.createSuspendedCorrectionRequest({
      adminUserId: proposerId,
      pollId: created.poll_id,
      correctionTargetField: 'title',
      proposedText: 'Reject Pathd',
      reason: 'Typo',
    });

    await decisionService.submitCorrectionDecision(request.request_id, adminBId, {
      decision: 'reject',
      reason_code: 'NO',
    });

    const pollStatus = await pool.query<{ status: string }>(
      `SELECT status FROM polls WHERE id = $1`,
      [created.poll_id],
    );
    expect(pollStatus.rows[0]?.status).toBe('suspended');

    const noticeCount = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM public_notices`,
    );
    expect(noticeCount.rows[0]?.count).toBe('0');
  });

  it('6B.4 apply leaves public_notices empty for active-path correction', async () => {
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
        title: 'Active Path',
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
      proposedText: 'Active Pathh',
      reason: 'Typo',
    });
    await approveRequest(decisionService, request.request_id);
    await applyService.applyCorrectionRequest(request.request_id, adminBId);

    const notices = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM public_notices`,
    );
    expect(notices.rows[0]?.count).toBe('0');

    const logNotice = await pool.query<{ public_notice_id: string | null }>(
      `SELECT public_notice_id FROM poll_correction_logs WHERE correction_request_id = $1`,
      [request.request_id],
    );
    expect(logNotice.rows[0]?.public_notice_id).toBeNull();
  });
});
