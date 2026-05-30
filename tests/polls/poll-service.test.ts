import { describe, expect, it } from 'vitest';
import { PublishedPollImmutableError } from '../../src/polls/errors.js';
import { createInMemoryPollRepository } from '../../src/polls/in-memory-repository.js';
import { createPollService } from '../../src/polls/service.js';

function futureDate(): Date {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

describe('PollService', () => {
  const creatorId = '11111111-1111-4111-8111-111111111111';

  it('creates a poll with options', async () => {
    const service = createPollService(createInMemoryPollRepository());
    const result = await service.createPoll(
      {
        creatorId,
        title: 'Favorite season?',
        description: 'Pick one',
        category: 'lifestyle',
        options: ['Spring', 'Summer', 'Fall'],
        eligibleRuleId: null,
        closesAt: futureDate(),
        publish: true,
      },
      'Creator A',
    );

    expect(result.status).toBe('active');
    expect(result.poll_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    const detail = await service.getPollById(result.poll_id);
    expect(detail.title).toBe('Favorite season?');
    expect(detail.options).toHaveLength(3);
    expect(detail.options[0]).toEqual({ option_index: 0, label: 'Spring' });
    expect(detail).not.toHaveProperty('option_vote_count');
    expect(detail).not.toHaveProperty('option_vote_ratio');
    expect(detail.user_participation_state).toBeNull();
  });

  it('stores poll options in repository', async () => {
    const repository = createInMemoryPollRepository();
    const service = createPollService(repository);
    const created = await service.createPoll(
      {
        creatorId,
        title: 'Two options',
        description: '',
        category: 'general',
        options: ['Yes', 'No'],
        eligibleRuleId: null,
        closesAt: futureDate(),
        publish: false,
      },
      'Creator B',
    );

    const storedOptions = await repository.listOptionsByPollId(created.poll_id);
    expect(storedOptions).toHaveLength(2);
    expect(storedOptions.map((o) => o.option_text)).toEqual(['Yes', 'No']);
  });

  it('rejects creator content edit after publish', () => {
    const service = createPollService(createInMemoryPollRepository());
    expect(() => service.assertCreatorCannotEditPublishedPoll()).toThrow(
      PublishedPollImmutableError,
    );
  });

  it('soft-deletes poll for creator', async () => {
    const service = createPollService(createInMemoryPollRepository());
    const created = await service.createPoll(
      {
        creatorId,
        title: 'Delete me',
        description: '',
        category: 'general',
        options: ['A', 'B'],
        eligibleRuleId: null,
        closesAt: futureDate(),
        publish: true,
      },
      'Creator C',
    );

    const deleted = await service.deletePoll(created.poll_id, creatorId);
    expect(deleted.status).toBe('deleted');
    expect(deleted.deleted_at).toBeTruthy();

    await expect(service.getPollById(created.poll_id)).rejects.toMatchObject({
      code: 'POLL_NOT_FOUND',
    });
  });
});
