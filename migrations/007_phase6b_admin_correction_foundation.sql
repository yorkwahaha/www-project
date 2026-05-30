-- Phase 6B.1: admin governance foundation (schema only).
-- Admin permission is separate from users.trust_level (official vote eligibility).
-- No durable user-option linkage. correction_target_id is poll structure metadata only.

CREATE TABLE admin_users (
  user_id UUID PRIMARY KEY REFERENCES users (id),
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  CONSTRAINT admin_users_role_check CHECK (role IN ('admin')),
  CONSTRAINT admin_users_status_check CHECK (status IN ('active', 'revoked')),
  CONSTRAINT admin_users_revoked_at_check CHECK (
    (status = 'revoked' AND revoked_at IS NOT NULL)
    OR (status = 'active' AND revoked_at IS NULL)
  )
);

CREATE INDEX idx_admin_users_status ON admin_users (status);

CREATE TABLE poll_correction_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls (id) ON DELETE CASCADE,
  requester_admin_id UUID NOT NULL REFERENCES admin_users (user_id),
  correction_target_field TEXT NOT NULL,
  correction_target_id UUID REFERENCES poll_options (id),
  original_text TEXT NOT NULL,
  proposed_text TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requires_dual_admin BOOLEAN NOT NULL DEFAULT TRUE,
  spread_score_at_submit INTEGER NOT NULL DEFAULT 0,
  spread_score_locked_until TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT poll_correction_requests_target_field_check CHECK (
    correction_target_field IN ('title', 'description', 'option_text')
  ),
  CONSTRAINT poll_correction_requests_status_check CHECK (
    status IN ('pending', 'approved', 'rejected', 'expired', 'applied')
  ),
  CONSTRAINT poll_correction_requests_spread_score_nonneg_check CHECK (
    spread_score_at_submit >= 0
  ),
  CONSTRAINT poll_correction_requests_option_target_check CHECK (
    (correction_target_field = 'option_text' AND correction_target_id IS NOT NULL)
    OR (correction_target_field <> 'option_text' AND correction_target_id IS NULL)
  )
);

CREATE INDEX idx_poll_correction_requests_poll_status
  ON poll_correction_requests (poll_id, status);

CREATE INDEX idx_poll_correction_requests_status_valid_until
  ON poll_correction_requests (status, valid_until);

CREATE TABLE admin_decision_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin_users (user_id),
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  decision TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  reason_text TEXT NOT NULL DEFAULT '',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT admin_decision_logs_decision_check CHECK (
    decision IN ('approve', 'reject')
  ),
  CONSTRAINT admin_decision_logs_unique_admin_target UNIQUE (
    target_type,
    target_id,
    admin_id
  )
);

CREATE INDEX idx_admin_decision_logs_target
  ON admin_decision_logs (target_type, target_id);

CREATE TABLE public_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls (id) ON DELETE CASCADE,
  notice_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_by_admin_id UUID NOT NULL REFERENCES admin_users (user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_public_notices_poll_id ON public_notices (poll_id);

CREATE TABLE poll_correction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correction_request_id UUID NOT NULL REFERENCES poll_correction_requests (id),
  poll_id UUID NOT NULL REFERENCES polls (id) ON DELETE CASCADE,
  applied_by_admin_id UUID NOT NULL REFERENCES admin_users (user_id),
  correction_target_field TEXT NOT NULL,
  correction_target_id UUID REFERENCES poll_options (id),
  original_text TEXT NOT NULL,
  applied_text TEXT NOT NULL,
  public_notice_id UUID REFERENCES public_notices (id),
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT poll_correction_logs_target_field_check CHECK (
    correction_target_field IN ('title', 'description', 'option_text')
  ),
  CONSTRAINT poll_correction_logs_option_target_check CHECK (
    (correction_target_field = 'option_text' AND correction_target_id IS NOT NULL)
    OR (correction_target_field <> 'option_text' AND correction_target_id IS NULL)
  )
);

CREATE INDEX idx_poll_correction_logs_poll_id ON poll_correction_logs (poll_id);

CREATE INDEX idx_poll_correction_logs_request_id
  ON poll_correction_logs (correction_request_id);
