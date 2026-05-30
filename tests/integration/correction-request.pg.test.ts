import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createPgCorrectionRepository } from '../../src/admin/correction-repository.js';
import { createCorrectionService } from '../../src/admin/correction-service.js';
import { CorrectionValidationError } from '../../src/admin/errors.js';
import { createPgPollRepository } from '../../src/polls/repository.js';
import { createPollService } from '../../src/polls/service.js';
import {
  applyMigrations,
  createIntegrationPool,
  truncateBusinessTables,
} from '../helpers/pg-integration.js';

const creatorId = '11111111-1111-4111-8111-111111111111';
const adminId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const submittedAt = new Date('2026-06-15T10:00:00.000Z');

async function seedActiveAdmin(
  pool: ReturnType<typeof createIntegrationPool>,
  pollRepo: ReturnType<typeof createPgPollRepository>,
) {
  await pollRepo.ensureUser(creatorId, 'Creator');
  await pollRepo.ensureUser(adminId, 'Admin');
  await pool.query(
    `INSERT INTO admin_users (user_id, role, status)
     VALUES ($1, 'admin', 'active')`,
    [adminId],
  );
}

describe('Correction request PostgreSQL integration', () => {
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

  it('inserts a title correction request via createPgCorrectionRepository', async () => {
    const pollRepo = createPgPollRepository(pool);
    const correctionRepo = createPgCorrectionRepository(pool);
    const pollService = createPollService(pollRepo);
    const correctionService = createCorrectionService(correctionRepo, {
      now: () => submittedAt,
    });

    await seedActiveAdmin(pool, pollRepo);

    const created = await pollService.createPoll(
      {
        creatorId,
        title: 'PG Original Title',
        description: 'PG description',
        category: 'general',
        options: ['Option A', 'Option B'],
        eligibleRuleId: null,
        closesAt: new Date(Date.now() + 86_400_000),
        publish: true,
      },
      'Creator',
    );

    const result = await correctionService.createCorrectionRequest({
      adminUserId: adminId,
      pollId: created.poll_id,
      correctionTargetField: 'title',
      proposedText: 'PG Original Titel',
      reason: 'Typo fix',
    });

    const requests = await pool.query<{
      id: string;
      status: string;
      requires_dual_admin: boolean;
      spread_score_at_submit: number;
      original_text: string;
      proposed_text: string;
      correction_target_id: string | null;
      spread_score_locked_until: Date;
      valid_until: Date;
    }>(
      `SELECT id, status, requires_dual_admin, spread_score_at_submit,
              original_text, proposed_text, correction_target_id,
              spread_score_locked_until, valid_until
       FROM poll_correction_requests
       WHERE id = $1`,
      [result.request_id],
    );

    expect(requests.rows).toHaveLength(1);
    expect(requests.rows[0]).toMatchObject({
      id: result.request_id,
      status: 'pending',
      requires_dual_admin: true,
      spread_score_at_submit: 0,
      original_text: 'PG Original Title',
      proposed_text: 'PG Original Titel',
      correction_target_id: null,
    });
    expect(requests.rows[0]!.spread_score_locked_until.toISOString()).toBe(
      '2026-06-16T10:00:00.000Z',
    );
    expect(requests.rows[0]!.valid_until.toISOString()).toBe('2026-06-22T10:00:00.000Z');

    const pollStatus = await pool.query<{ status: string }>(
      `SELECT status FROM polls WHERE id = $1`,
      [created.poll_id],
    );
    expect(pollStatus.rows[0]?.status).toBe('active');

    for (const table of [
      'admin_decision_logs',
      'poll_correction_logs',
      'public_notices',
    ]) {
      const count = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM ${table}`,
      );
      expect(count.rows[0]?.count).toBe('0');
    }
  });

  it('inserts option_text correction for same-poll option and rejects cross-poll option id', async () => {
    const pollRepo = createPgPollRepository(pool);
    const correctionRepo = createPgCorrectionRepository(pool);
    const pollService = createPollService(pollRepo);
    const correctionService = createCorrectionService(correctionRepo, {
      now: () => submittedAt,
    });

    await seedActiveAdmin(pool, pollRepo);

    const pollA = await pollService.createPoll(
      {
        creatorId,
        title: 'Poll A',
        description: '',
        category: 'general',
        options: ['Alpha', 'Beta'],
        eligibleRuleId: null,
        closesAt: new Date(Date.now() + 86_400_000),
        publish: true,
      },
      'Creator',
    );
    const pollB = await pollService.createPoll(
      {
        creatorId,
        title: 'Poll B',
        description: '',
        category: 'general',
        options: ['Gamma', 'Delta'],
        eligibleRuleId: null,
        closesAt: new Date(Date.now() + 86_400_000),
        publish: true,
      },
      'Creator',
    );

    const [optionA] = await pollRepo.listOptionsByPollId(pollA.poll_id);
    const [optionB] = await pollRepo.listOptionsByPollId(pollB.poll_id);
    if (!optionA || !optionB) {
      throw new Error('expected poll options');
    }

    const optionResult = await correctionService.createCorrectionRequest({
      adminUserId: adminId,
      pollId: pollA.poll_id,
      correctionTargetField: 'option_text',
      correctionTargetId: optionA.id,
      proposedText: 'Alpa',
      reason: 'Label typo',
    });

    const stored = await pool.query<{ original_text: string; correction_target_id: string }>(
      `SELECT original_text, correction_target_id
       FROM poll_correction_requests
       WHERE id = $1`,
      [optionResult.request_id],
    );
    expect(stored.rows[0]).toEqual({
      original_text: 'Alpha',
      correction_target_id: optionA.id,
    });

    await expect(
      correctionService.createCorrectionRequest({
        adminUserId: adminId,
        pollId: pollA.poll_id,
        correctionTargetField: 'option_text',
        correctionTargetId: optionB.id,
        proposedText: 'Gamma typo',
        reason: 'Cross poll attempt',
      }),
    ).rejects.toBeInstanceOf(CorrectionValidationError);
  });
});
