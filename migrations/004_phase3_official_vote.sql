-- Phase 3: privacy-preserving Official Vote token and aggregate sharded counter.
-- Never add durable user-option linkage or append-only vote events.

CREATE TABLE poll_vote_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id),
  poll_id UUID NOT NULL REFERENCES polls (id) ON DELETE CASCADE,
  voted_at_minute TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT poll_vote_tokens_voted_at_minute_check
    CHECK (voted_at_minute = date_trunc('minute', voted_at_minute)),
  UNIQUE (user_id, poll_id)
);

CREATE INDEX idx_poll_vote_tokens_poll_id ON poll_vote_tokens (poll_id);

CREATE TABLE poll_option_vote_counters (
  poll_id UUID NOT NULL REFERENCES polls (id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options (id) ON DELETE CASCADE,
  shard_id INTEGER NOT NULL,
  vote_count BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (poll_id, option_id, shard_id),
  CONSTRAINT poll_option_vote_counters_shard_id_check
    CHECK (shard_id >= 0 AND shard_id < 8),
  CONSTRAINT poll_option_vote_counters_vote_count_check
    CHECK (vote_count >= 0)
);
