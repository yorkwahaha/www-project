import { describe, expect, it } from 'vitest';
import { deriveQualityBadge } from '../../src/polls/quality-badge.js';
import type { QualityFeedbackAggregateRow } from '../../src/polls/types.js';

const pollId = '11111111-1111-4111-8111-111111111111';

function aggregate(
  feedbackTag: QualityFeedbackAggregateRow['feedback_tag'],
  aggregateCount: number,
): QualityFeedbackAggregateRow {
  return {
    poll_id: pollId,
    feedback_tag: feedbackTag,
    aggregate_count: aggregateCount,
    updated_at: new Date(),
  };
}

describe('deriveQualityBadge', () => {
  it('returns null when no feedback aggregate exists', () => {
    expect(deriveQualityBadge([])).toBeNull();
  });

  it('returns null when positive feedback is below the conservative minimum', () => {
    expect(deriveQualityBadge([aggregate('表達清楚', 2)])).toBeNull();
  });

  it('returns null when only negative feedback exists', () => {
    expect(deriveQualityBadge([aggregate('題目不優', 5)])).toBeNull();
  });

  it('returns null when negative feedback meets or exceeds positive feedback', () => {
    expect(
      deriveQualityBadge([
        aggregate('表達清楚', 2),
        aggregate('值得思考', 1),
        aggregate('題目不優', 3),
      ]),
    ).toBeNull();
  });

  it('returns positive_feedback when positive feedback meets the conservative threshold', () => {
    expect(
      deriveQualityBadge([
        aggregate('表達清楚', 2),
        aggregate('值得思考', 1),
      ]),
    ).toBe('positive_feedback');
  });

  it('returns positive_feedback when positive feedback dominates negative feedback', () => {
    expect(
      deriveQualityBadge([
        aggregate('表達清楚', 4),
        aggregate('題目不優', 1),
      ]),
    ).toBe('positive_feedback');
  });
});
