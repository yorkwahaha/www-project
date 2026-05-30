-- Phase 5C: public freshness feed keyset pagination index (polls only).

CREATE INDEX idx_polls_public_feed_freshness
ON polls (published_at DESC, id ASC)
WHERE status = 'active' AND published_at IS NOT NULL;
