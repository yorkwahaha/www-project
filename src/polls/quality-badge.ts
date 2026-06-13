import type { QualityBadge, QualityFeedbackAggregateRow } from './types.js';
import { POSITIVE_QUALITY_FEEDBACK_TAGS } from './types.js';

const NEGATIVE_QUALITY_FEEDBACK_TAG = '題目不優' as const;

/** Internal conservative minimum; never exposed via public API. */
const MINIMUM_POSITIVE_FEEDBACK_TOTAL = 3;

export function deriveQualityBadge(
  aggregates: QualityFeedbackAggregateRow[],
): QualityBadge {
  if (aggregates.length === 0) {
    return null;
  }

  let positiveTotal = 0;
  let negativeTotal = 0;

  for (const row of aggregates) {
    if (row.feedback_tag === NEGATIVE_QUALITY_FEEDBACK_TAG) {
      negativeTotal += row.aggregate_count;
      continue;
    }
    if (POSITIVE_QUALITY_FEEDBACK_TAGS.includes(row.feedback_tag)) {
      positiveTotal += row.aggregate_count;
    }
  }

  if (positiveTotal < MINIMUM_POSITIVE_FEEDBACK_TOTAL) {
    return null;
  }

  if (negativeTotal >= positiveTotal) {
    return null;
  }

  return 'positive_feedback';
}
