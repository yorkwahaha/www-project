-- Phase 66B: minimal user profile schema foundation.
-- Adds only user-scoped birth month and region fields. No evaluator, snapshots,
-- vote/reference-answer changes, demographic breakdowns, or gender fields.

ALTER TABLE users
  ADD COLUMN birth_year_month DATE,
  ADD COLUMN residential_region TEXT,
  ADD CONSTRAINT users_birth_year_month_check CHECK (
    birth_year_month IS NULL
    OR birth_year_month = date_trunc('month', birth_year_month)::DATE
  ),
  ADD CONSTRAINT users_residential_region_check CHECK (
    residential_region IS NULL
    OR (
      residential_region = btrim(residential_region)
      AND residential_region <> ''
      AND char_length(residential_region) <= 64
    )
  );
