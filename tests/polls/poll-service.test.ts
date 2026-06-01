import { describe, expect, it } from 'vitest';
import { PublishedPollImmutableError } from '../../src/polls/errors.js';
import {
  INVALID_REFERENCE_ANSWER_OPTION_MESSAGE,
  REFERENCE_ANSWER_LOW_TRUST_ONLY_MESSAGE,
} from '../../src/polls/reference-answer-messages.js';
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
    expect(detail.public_lifecycle_state).toBe('collecting');
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

  it('records Reference Answer token without selected option data', async () => {
    const repository = createInMemoryPollRepository();
    const service = createPollService(repository);
    const created = await service.createPoll(
      {
        creatorId,
        title: 'Reference answer',
        description: '',
        category: 'general',
        options: ['A', 'B'],
        eligibleRuleId: null,
        closesAt: futureDate(),
        publish: true,
      },
      'Creator D',
    );
    const [option] = await repository.listOptionsByPollId(created.poll_id);

    await expect(
      service.submitReferenceAnswer(created.poll_id, creatorId, option!.id),
    ).resolves.toEqual({ status: 'recorded', reference_answered: true });

    const [token] = [...repository.referenceAnswerTokens.values()];
    expect(token).toMatchObject({ user_id: creatorId, poll_id: created.poll_id });
    expect(token!.answered_at.getSeconds()).toBe(0);
    expect(token!.answered_at.getMilliseconds()).toBe(0);
    expect(token).not.toHaveProperty('option_id');
    expect(token).not.toHaveProperty('encrypted_option_id');
    expect(token).not.toHaveProperty('answer_payload');
  });

  it('rejects official-trust users from Reference Answer', async () => {
    const repository = createInMemoryPollRepository();
    const officialUserId = '55555555-5555-4555-8555-555555555555';
    await repository.ensureUser(officialUserId, 'Official');
    repository.setUserTrustLevel(officialUserId, 'official');
    const service = createPollService(repository);
    const created = await service.createPoll(
      {
        creatorId,
        title: 'Official user poll',
        description: '',
        category: 'general',
        options: ['A', 'B'],
        eligibleRuleId: null,
        closesAt: futureDate(),
        publish: true,
      },
      'Creator F',
    );
    const [option] = await repository.listOptionsByPollId(created.poll_id);

    await expect(
      service.submitReferenceAnswer(created.poll_id, officialUserId, option!.id),
    ).rejects.toMatchObject({
      code: 'POLL_FORBIDDEN',
      message: REFERENCE_ANSWER_LOW_TRUST_ONLY_MESSAGE,
    });
  });

  it('uses option_id only for validation and blocks duplicate Reference Answer', async () => {
    const repository = createInMemoryPollRepository();
    const service = createPollService(repository);
    const created = await service.createPoll(
      {
        creatorId,
        title: 'Duplicate reference answer',
        description: '',
        category: 'general',
        options: ['A', 'B'],
        eligibleRuleId: null,
        closesAt: futureDate(),
        publish: true,
      },
      'Creator E',
    );
    const [option] = await repository.listOptionsByPollId(created.poll_id);

    await expect(
      service.submitReferenceAnswer(
        created.poll_id,
        creatorId,
        '99999999-9999-4999-8999-999999999999',
      ),
    ).rejects.toMatchObject({
      code: 'POLL_VALIDATION',
      message: INVALID_REFERENCE_ANSWER_OPTION_MESSAGE,
    });
    expect(repository.referenceAnswerTokens.size).toBe(0);

    await service.submitReferenceAnswer(created.poll_id, creatorId, option!.id);
    await expect(
      service.submitReferenceAnswer(created.poll_id, creatorId, option!.id),
    ).rejects.toMatchObject({ code: 'REFERENCE_ANSWER_DUPLICATE' });
    expect(repository.referenceAnswerTokens.size).toBe(1);
  });
});
