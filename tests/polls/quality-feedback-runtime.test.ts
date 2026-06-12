import { describe, expect, it } from 'vitest';
import { PollNotFoundError } from '../../src/polls/errors.js';
import { createInMemoryPollRepository } from '../../src/polls/in-memory-repository.js';
import { createPollService } from '../../src/polls/service.js';

const creatorId = '11111111-1111-4111-8111-111111111111';

function futureDate(): Date {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

async function seedPoll() {
  const repository = createInMemoryPollRepository();
  const service = createPollService(repository);
  const created = await service.createPoll(
    {
      creatorId,
      title: 'Quality feedback aggregate',
      description: '',
      category: 'general',
      options: ['A', 'B'],
      eligibleRuleId: null,
      closesAt: futureDate(),
      publish: true,
    },
    'Creator',
  );
  return { repository, service, pollId: created.poll_id };
}

describe('Quality feedback aggregate runtime', () => {
  it('writes the first valid tag with count 1', async () => {
    const { repository, service, pollId } = await seedPoll();

    await expect(
      service.submitQualityFeedback(pollId, '表達清楚'),
    ).resolves.toEqual({ ok: true });

    expect([...repository.qualityFeedbackAggregates.values()]).toEqual([
      expect.objectContaining({
        poll_id: pollId,
        feedback_tag: '表達清楚',
        aggregate_count: 1,
      }),
    ]);
  });

  it('increments the same tag to count 2', async () => {
    const { repository, service, pollId } = await seedPoll();

    await service.submitQualityFeedback(pollId, '表達清楚');
    await service.submitQualityFeedback(pollId, '表達清楚');

    expect(repository.qualityFeedbackAggregates.get(`${pollId}:表達清楚`)).toMatchObject({
      poll_id: pollId,
      feedback_tag: '表達清楚',
      aggregate_count: 2,
    });
  });

  it('keeps different tags in separate aggregate rows', async () => {
    const { repository, service, pollId } = await seedPoll();

    await service.submitQualityFeedback(pollId, '表達清楚');
    await service.submitQualityFeedback(pollId, '值得思考');
    await service.submitQualityFeedback(pollId, '值得思考');

    expect(repository.qualityFeedbackAggregates.get(`${pollId}:表達清楚`)).toMatchObject({
      aggregate_count: 1,
    });
    expect(repository.qualityFeedbackAggregates.get(`${pollId}:值得思考`)).toMatchObject({
      aggregate_count: 2,
    });
  });

  it('checks poll existence without writing vote, token, counter, or option-selection data', async () => {
    const { repository, service } = await seedPoll();

    await expect(
      service.submitQualityFeedback('99999999-9999-4999-8999-999999999999', '期待結果'),
    ).rejects.toBeInstanceOf(PollNotFoundError);

    expect(repository.qualityFeedbackAggregates.size).toBe(0);
    expect(repository.referenceAnswerTokens.size).toBe(0);
    expect(repository.voteTokens.size).toBe(0);
    expect(repository.voteCounters.size).toBe(0);
  });
});
