-- Phase 54: Real MVP public poll lifecycle schema foundation.
-- Lifecycle fields are server-controlled. This migration adds no public API,
-- result snapshot, raw vote event, notification, trust, feedback, or review table.

ALTER TABLE polls
  ADD COLUMN public_lifecycle_state TEXT,
  ADD COLUMN revealed_at TIMESTAMPTZ,
  ADD COLUMN public_lock_ends_at TIMESTAMPTZ,
  ADD COLUMN cancelled_at TIMESTAMPTZ,
  ADD COLUMN unpublished_at TIMESTAMPTZ;

-- Backfill only mappings that are safe for the future public lifecycle API.
-- Legacy closed is intentionally fail-closed: it does not prove results were revealed.
UPDATE polls
SET public_lifecycle_state = CASE
  WHEN status = 'active' THEN 'collecting'
  WHEN status IN ('suspended', 'correction_pending') AND published_at IS NOT NULL
    THEN 'collecting'
  ELSE 'draft'
END;

ALTER TABLE polls
  ALTER COLUMN public_lifecycle_state SET NOT NULL,
  ADD CONSTRAINT polls_public_lifecycle_state_check CHECK (
    public_lifecycle_state IN (
      'draft',
      'collecting',
      'cancelled',
      'revealed',
      'locked',
      'post_lock',
      'unpublished'
    )
  ),
  ADD CONSTRAINT polls_revealed_at_state_check CHECK (
    revealed_at IS NULL
    OR public_lifecycle_state IN ('revealed', 'locked', 'post_lock', 'unpublished')
  ),
  ADD CONSTRAINT polls_public_lock_ends_at_check CHECK (
    public_lock_ends_at IS NULL
    OR (
      revealed_at IS NOT NULL
      AND public_lock_ends_at = revealed_at + INTERVAL '5 days'
    )
  ),
  ADD CONSTRAINT polls_cancelled_at_state_check CHECK (
    cancelled_at IS NULL OR public_lifecycle_state = 'cancelled'
  ),
  ADD CONSTRAINT polls_unpublished_at_state_check CHECK (
    unpublished_at IS NULL
    OR (
      public_lifecycle_state = 'unpublished'
      AND public_lock_ends_at IS NOT NULL
      AND unpublished_at >= public_lock_ends_at
    )
  );

-- Preserve legacy POST /polls inserts until the public lifecycle service lands.
-- Explicit lifecycle values remain authoritative when supplied by future server code.
CREATE FUNCTION initialize_poll_public_lifecycle_state()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.public_lifecycle_state IS NULL THEN
    NEW.public_lifecycle_state := CASE
      WHEN NEW.status = 'active' THEN 'collecting'
      ELSE 'draft'
    END;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_initialize_poll_public_lifecycle_state
BEFORE INSERT ON polls
FOR EACH ROW
EXECUTE FUNCTION initialize_poll_public_lifecycle_state();

CREATE INDEX idx_polls_public_lifecycle_freshness
  ON polls (public_lifecycle_state, published_at DESC, id ASC);

CREATE INDEX idx_polls_public_lifecycle_creator
  ON polls (creator_id, public_lifecycle_state);

CREATE INDEX idx_polls_collecting_closes_at
  ON polls (closes_at)
  WHERE public_lifecycle_state = 'collecting';

CREATE INDEX idx_polls_locked_public_lock_ends_at
  ON polls (public_lock_ends_at)
  WHERE public_lifecycle_state = 'locked';

CREATE TABLE poll_eligibility_rules (
  poll_id UUID PRIMARY KEY REFERENCES polls (id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL DEFAULT 'unrestricted',
  min_birth_year_month DATE,
  max_birth_year_month DATE,
  allowed_regions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT poll_eligibility_rules_type_check CHECK (
    rule_type IN ('unrestricted', 'age', 'region', 'age_region')
  ),
  CONSTRAINT poll_eligibility_rules_min_birth_month_check CHECK (
    min_birth_year_month IS NULL
    OR min_birth_year_month = date_trunc('month', min_birth_year_month)::DATE
  ),
  CONSTRAINT poll_eligibility_rules_max_birth_month_check CHECK (
    max_birth_year_month IS NULL
    OR max_birth_year_month = date_trunc('month', max_birth_year_month)::DATE
  ),
  CONSTRAINT poll_eligibility_rules_birth_range_check CHECK (
    min_birth_year_month IS NULL
    OR max_birth_year_month IS NULL
    OR min_birth_year_month <= max_birth_year_month
  )
);
