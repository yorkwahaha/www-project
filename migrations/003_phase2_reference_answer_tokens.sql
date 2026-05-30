-- Phase 2: Design B Reference Answer participation tokens only.
-- Selected options must never be persisted or counted.

CREATE TABLE poll_reference_answer_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id),
  poll_id UUID NOT NULL REFERENCES polls (id) ON DELETE CASCADE,
  answered_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT poll_reference_answer_tokens_answered_at_minute_check
    CHECK (answered_at = date_trunc('minute', answered_at)),
  UNIQUE (user_id, poll_id)
);

CREATE INDEX idx_poll_reference_answer_tokens_poll_id
  ON poll_reference_answer_tokens (poll_id);
