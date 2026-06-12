-- Phase 177: quality feedback aggregate schema foundation.
-- Poll-level aggregate only. No runtime API or feedback event storage.

CREATE TABLE poll_quality_feedback_aggregate (
  poll_id UUID NOT NULL REFERENCES polls (id) ON DELETE CASCADE,
  feedback_tag TEXT NOT NULL,
  aggregate_count BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT poll_quality_feedback_aggregate_feedback_tag_check
    CHECK (
      feedback_tag IN (
        '表達清楚',
        '選項公平',
        '值得思考',
        '期待結果',
        '題目不優'
      )
    ),
  CONSTRAINT poll_quality_feedback_aggregate_count_check
    CHECK (aggregate_count >= 0),
  CONSTRAINT poll_quality_feedback_aggregate_poll_tag_unique
    UNIQUE (poll_id, feedback_tag)
);
