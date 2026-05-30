import type { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PollNotFoundError, PollValidationError } from '../../src/polls/errors.js';
import { createPgPollRepository } from '../../src/polls/repository.js';
import { createPollService } from '../../src/polls/service.js';
import {
  applyMigrations,
  createIntegrationPool,
  setUserTrustLevel,
  truncateBusinessTables,
} from '../helpers/pg-integration.js';

const creatorId = '11111111-1111-4111-8111-111111111111';
const lowTrustUserId = '22222222-2222-4222-8222-222222222222';
const officialUserId = '33333333-3333-4333-8333-333333333333';

async function createPublishedPoll(
  service: ReturnType<typeof createPollService>,
  title: string,
) {
  return service.createPoll(
    {
      creatorId,
      title,
      description: '',
      category: 'general',
      options: ['Option A', 'Option B'],
      eligibleRuleId: null,
      closesAt: new Date(Date.now() + 86_400_000),
      publish: true,
    },
    'Creator',
  );
}

describe('Poll visibility PostgreSQL integration', () => {
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

  it('hides draft polls from public read routes', async () => {
    const repository = createPgPollRepository(pool);
    const service = createPollService(repository);
    await repository.ensureUser(creatorId, 'Creator');

    const draft = await service.createPoll(
      {
        creatorId,
        title: 'Draft',
        description: '',
        category: 'general',
        options: ['A', 'B'],
        eligibleRuleId: null,
        closesAt: new Date(Date.now() + 86_400_000),
        publish: false,
      },
      'Creator',
    );

    await expect(service.getPollById(draft.poll_id)).rejects.toBeInstanceOf(PollNotFoundError);
    await expect(service.getPollResults(draft.poll_id)).rejects.toBeInstanceOf(
      PollNotFoundError,
    );
  });

  it('allows archived poll direct read but rejects participation', async () => {
    const repository = createPgPollRepository(pool);
    const service = createPollService(repository, { selectShardId: () => 2 });
    await repository.ensureUser(creatorId, 'Creator');
    await repository.ensureUser(lowTrustUserId, 'Low trust');
    await repository.ensureUser(officialUserId, 'Official');
    await setUserTrustLevel(pool, officialUserId, 'official');

    const archived = await createPublishedPoll(service, 'Archived');
    await pool.query(
      `UPDATE polls SET archived_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [archived.poll_id],
    );

    await expect(service.getPollById(archived.poll_id)).resolves.toMatchObject({
      poll_id: archived.poll_id,
    });
    await expect(service.getPollResults(archived.poll_id)).resolves.toMatchObject({
      poll_id: archived.poll_id,
    });

    const [option] = await repository.listOptionsByPollId(archived.poll_id);
    await expect(
      service.submitReferenceAnswer(archived.poll_id, lowTrustUserId, option!.id),
    ).rejects.toBeInstanceOf(PollValidationError);
    await expect(
      service.castOfficialVote(archived.poll_id, officialUserId, option!.id),
    ).rejects.toBeInstanceOf(PollValidationError);
  });
});
