-- Phase 65A: minimal backend creator-session foundation.
-- Stores only a digest-backed creator identity session. No poll or option linkage.

CREATE TABLE creator_sessions (
  token_sha256 BYTEA PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users (id),
  created_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  CONSTRAINT creator_sessions_token_sha256_length_check
    CHECK (octet_length(token_sha256) = 32),
  CONSTRAINT creator_sessions_expires_at_check
    CHECK (expires_at > created_at),
  CONSTRAINT creator_sessions_revoked_at_check
    CHECK (revoked_at IS NULL OR revoked_at >= created_at)
);

CREATE INDEX idx_creator_sessions_user_id
  ON creator_sessions (user_id);

CREATE INDEX idx_creator_sessions_cleanup
  ON creator_sessions (expires_at, revoked_at);
