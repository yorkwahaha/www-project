-- Phase 6A: discovery archive column + public feed partial index predicate.

ALTER TABLE polls
  ADD COLUMN archived_at TIMESTAMPTZ NULL;

ALTER TABLE polls
  ADD CONSTRAINT polls_archived_requires_publish_check
  CHECK (archived_at IS NULL OR published_at IS NOT NULL);

ALTER TABLE polls
  ADD CONSTRAINT polls_archived_not_draft_check
  CHECK (archived_at IS NULL OR status <> 'draft');

DROP INDEX IF EXISTS idx_polls_public_feed_freshness;

CREATE INDEX idx_polls_public_feed_freshness
ON polls (published_at DESC, id ASC)
WHERE status = 'active'
  AND published_at IS NOT NULL
  AND archived_at IS NULL;
