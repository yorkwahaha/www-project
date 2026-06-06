-- Phase 78: production user session schema foundation.
-- Stores only digest-backed account session lifecycle data. No poll, option,
-- request, device, profile, analytics, or answer-choice linkage.

CREATE TABLE user_sessions (
  session_id UUID PRIMARY KEY,
  token_sha256 BYTEA NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users (id),
  created_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  CONSTRAINT user_sessions_token_sha256_length_check
    CHECK (octet_length(token_sha256) = 32),
  CONSTRAINT user_sessions_expires_at_check
    CHECK (expires_at > created_at),
  CONSTRAINT user_sessions_revoked_at_check
    CHECK (revoked_at IS NULL OR revoked_at >= created_at),
  CONSTRAINT user_sessions_last_used_at_check
    CHECK (
      last_used_at IS NULL
      OR (
        last_used_at >= created_at
        AND last_used_at <= expires_at
      )
    )
);

CREATE INDEX idx_user_sessions_user_id
  ON user_sessions (user_id);

CREATE INDEX idx_user_sessions_cleanup
  ON user_sessions (expires_at, revoked_at);

CREATE INDEX idx_user_sessions_active_user
  ON user_sessions (user_id, expires_at)
  WHERE revoked_at IS NULL;
