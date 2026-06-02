import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createPgPollRepository } from '../../src/polls/repository.js';
import { createPollService } from '../../src/polls/service.js';
import {
  applyMigrations,
  createIntegrationPool,
  truncateBusinessTables,
} from '../helpers/pg-integration.js';

const creatorId = '11111111-1111-4111-8111-111111111111';
const otherCreatorId = '22222222-2222-4222-8222-222222222222';

describe('Creator-owned polls PostgreSQL integration', () => {
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

  it('lists only owned visible rows in deterministic order without a schema change', async () => {
    const repository = createPgPollRepository(pool);
    const service = createPollService(repository);
    await repository.ensureUser(creatorId, 'Creator');
    await repository.ensureUser(otherCreatorId, 'Other creator');
    const first = await service.createCreatorPoll({
      creatorId,
      title: 'First',
      description: '',
      category: 'general',
      options: ['A', 'B'],
      eligibleRuleId: null,
      closesAt: new Date(Date.now() + 86_400_000),
      publish: true,
    });
    const second = await service.createCreatorPoll({
      creatorId,
      title: 'Second',
      description: '',
      category: 'general',
      options: ['A', 'B'],
      eligibleRuleId: null,
      closesAt: new Date(Date.now() + 86_400_000),
      publish: false,
    });
    const hidden = await service.createCreatorPoll({
      creatorId,
      title: 'Hidden',
      description: '',
      category: 'general',
      options: ['A', 'B'],
      eligibleRuleId: null,
      closesAt: new Date(Date.now() + 86_400_000),
      publish: true,
    });
    await service.createCreatorPoll({
      creatorId: otherCreatorId,
      title: 'Other creator',
      description: '',
      category: 'general',
      options: ['A', 'B'],
      eligibleRuleId: null,
      closesAt: new Date(Date.now() + 86_400_000),
      publish: true,
    });
    await pool.query(
      `UPDATE polls
       SET created_at = CASE
         WHEN id = $1 THEN NOW() - INTERVAL '2 minutes'
         WHEN id = $2 THEN NOW() - INTERVAL '1 minute'
         ELSE created_at
       END
       WHERE id IN ($1, $2)`,
      [first.poll_id, second.poll_id],
    );
    await pool.query(
      `UPDATE polls SET status = 'suspended' WHERE id = $1`,
      [hidden.poll_id],
    );

    await expect(service.getCreatorOwnedPolls(creatorId)).resolves.toEqual({
      polls: [
        expect.objectContaining({ poll_id: second.poll_id, title: 'Second' }),
        expect.objectContaining({ poll_id: first.poll_id, title: 'First' }),
      ],
    });
  });

  it('rolls back the reused create transaction when option insertion fails', async () => {
    const repository = createPgPollRepository(pool);
    await repository.ensureUser(creatorId, 'Creator');
    const explosiveOption = {
      trim() {
        throw new Error('simulated option insert failure');
      },
    } as unknown as string;

    await expect(
      repository.createPollWithOptions({
        creatorId,
        title: 'Rollback create',
        description: '',
        category: 'general',
        options: ['A', explosiveOption],
        eligibleRuleId: null,
        closesAt: new Date(Date.now() + 86_400_000),
        publish: true,
      }),
    ).rejects.toThrow('simulated option insert failure');
    await expect(pool.query(`SELECT 1 FROM polls`)).resolves.toMatchObject({ rowCount: 0 });
    await expect(pool.query(`SELECT 1 FROM poll_options`)).resolves.toMatchObject({
      rowCount: 0,
    });
  });
});
