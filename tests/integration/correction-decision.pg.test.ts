import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createPgCorrectionRepository } from '../../src/admin/correction-repository.js';
import { createPgCorrectionDecisionRepository } from '../../src/admin/correction-decision-repository.js';
import { createCorrectionService } from '../../src/admin/correction-service.js';
import { createCorrectionDecisionService } from '../../src/admin/correction-decision-service.js';
import { CorrectionExpiredError } from '../../src/admin/errors.js';
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

describe('Correction decision PostgreSQL integration', () => {
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

  it('dual approve transitions to approved with two decision logs transactionally', async () => {
    const pollRepo = await seedAdmins(pool);
    const correctionRepo = createPgCorrectionRepository(pool);
    const decisionRepo = createPgCorrectionDecisionRepository(pool);
    const pollService = createPollService(pollRepo);
    const correctionService = createCorrectionService(correctionRepo, {
      now: () => submittedAt,
    });
    const decisionService = createCorrectionDecisionService(decisionRepo, {
      now: () => submittedAt,
    });

    const created = await pollService.createPoll(
      {
        creatorId,
        title: 'PG Title',
        description: 'PG description',
        category: 'general',
        options: ['A', 'B'],
        eligibleRuleId: null,
        closesAt: new Date(Date.now() + 86_400_000),
        publish: true,
      },
      'Creator',
    );

    const pollBefore = await pool.query(
      `SELECT title, description FROM polls WHERE id = $1`,
      [created.poll_id],
    );

    const request = await correctionService.createCorrectionRequest({
      adminUserId: proposerId,
      pollId: created.poll_id,
      correctionTargetField: 'title',
      proposedText: 'PG Titel',
      reason: 'Typo',
    });

    const first = await decisionService.submitCorrectionDecision(request.request_id, adminBId, {
      decision: 'approve',
      reason_code: 'OK',
    });
    expect(first.request_status).toBe('pending');

    const second = await decisionService.submitCorrectionDecision(
      request.request_id,
      adminCId,
      {
        decision: 'approve',
        reason_code: 'OK',
      },
    );
    expect(second.request_status).toBe('approved');

    const statusRow = await pool.query<{ status: string }>(
      `SELECT status FROM poll_correction_requests WHERE id = $1`,
      [request.request_id],
    );
    expect(statusRow.rows[0]?.status).toBe('approved');

    const logs = await pool.query<{ count: string; metadata_json: unknown }>(
      `SELECT COUNT(*)::text AS count,
              COALESCE(jsonb_agg(metadata_json), '[]'::jsonb) AS metadata_json
       FROM admin_decision_logs
       WHERE target_type = 'poll_correction_request' AND target_id = $1`,
      [request.request_id],
    );
    expect(logs.rows[0]?.count).toBe('2');

    const metadataRows = await pool.query<{ metadata_json: Record<string, unknown> }>(
      `SELECT metadata_json FROM admin_decision_logs
       WHERE target_type = 'poll_correction_request' AND target_id = $1`,
      [request.request_id],
    );
    for (const row of metadataRows.rows) {
      expect(row.metadata_json).toEqual({});
    }

    const pollAfter = await pool.query(
      `SELECT title, description FROM polls WHERE id = $1`,
      [created.poll_id],
    );
    expect(pollAfter.rows[0]).toEqual(pollBefore.rows[0]);

    for (const table of ['poll_correction_logs', 'public_notices']) {
      const count = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM ${table}`,
      );
      expect(count.rows[0]?.count).toBe('0');
    }
  });

  it('reject and expire paths persist expected status without side tables', async () => {
    const pollRepo = await seedAdmins(pool);
    const pollService = createPollService(pollRepo);
    const correctionRepo = createPgCorrectionRepository(pool);
    const decisionRepo = createPgCorrectionDecisionRepository(pool);
    const correctionService = createCorrectionService(correctionRepo, {
      now: () => submittedAt,
    });
    const decisionService = createCorrectionDecisionService(decisionRepo, {
      now: () => submittedAt,
    });

    const created = await pollService.createPoll(
      {
        creatorId,
        title: 'Expire Poll',
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
      proposedText: 'Expire Polll',
      reason: 'Typo',
    });

    await pool.query(
      `UPDATE poll_correction_requests SET valid_until = $2 WHERE id = $1`,
      [request.request_id, new Date('2026-06-14T00:00:00.000Z')],
    );

    await expect(
      decisionService.submitCorrectionDecision(request.request_id, adminBId, {
        decision: 'approve',
        reason_code: 'LATE',
      }),
    ).rejects.toBeInstanceOf(CorrectionExpiredError);

    const expired = await pool.query<{ status: string }>(
      `SELECT status FROM poll_correction_requests WHERE id = $1`,
      [request.request_id],
    );
    expect(expired.rows[0]?.status).toBe('expired');

    await truncateBusinessTables(pool);
    await seedAdmins(pool);

    const rejectPoll = await pollService.createPoll(
      {
        creatorId,
        title: 'Reject Poll',
        description: '',
        category: 'general',
        options: ['A', 'B'],
        eligibleRuleId: null,
        closesAt: new Date(Date.now() + 86_400_000),
        publish: true,
      },
      'Creator',
    );

    const rejectRequest = await correctionService.createCorrectionRequest({
      adminUserId: proposerId,
      pollId: rejectPoll.poll_id,
      correctionTargetField: 'title',
      proposedText: 'Reject Polll',
      reason: 'Typo',
    });

    await decisionService.submitCorrectionDecision(rejectRequest.request_id, adminBId, {
      decision: 'reject',
      reason_code: 'NO',
    });

    const rejected = await pool.query<{ status: string }>(
      `SELECT status FROM poll_correction_requests WHERE id = $1`,
      [rejectRequest.request_id],
    );
    expect(rejected.rows[0]?.status).toBe('rejected');
  });
});
