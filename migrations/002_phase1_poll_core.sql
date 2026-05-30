-- Phase 1: users, polls, poll_options only (no vote / reference / counter tables).

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  trust_level TEXT NOT NULL DEFAULT 'low',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_trust_level_check CHECK (trust_level IN ('low', 'official')),
  CONSTRAINT users_status_check CHECK (status IN ('active', 'suspended'))
);

CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users (id),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  status TEXT NOT NULL,
  eligible_rule_id TEXT,
  published_at TIMESTAMPTZ,
  closes_at TIMESTAMPTZ NOT NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT polls_status_check CHECK (
    status IN (
      'draft',
      'active',
      'closed',
      'deleted',
      'suspended',
      'correction_pending'
    )
  )
);

CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls (id) ON DELETE CASCADE,
  option_order INTEGER NOT NULL,
  option_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (poll_id, option_order)
);

CREATE INDEX idx_polls_creator_id ON polls (creator_id);
CREATE INDEX idx_poll_options_poll_id ON poll_options (poll_id);
