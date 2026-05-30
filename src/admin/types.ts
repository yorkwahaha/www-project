import type { PollStatus } from '../polls/types.js';

export const CORRECTION_TARGET_FIELDS = [
  'title',
  'description',
  'option_text',
] as const;

export type CorrectionTargetField = (typeof CORRECTION_TARGET_FIELDS)[number];

export type AdminUserRow = {
  user_id: string;
  role: 'admin';
  status: 'active' | 'revoked';
  created_at: Date;
  revoked_at: Date | null;
};

export type CorrectionRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'applied';

export type PollRowForCorrection = {
  id: string;
  title: string;
  description: string;
  status: PollStatus;
};

export type CorrectionRequestRow = {
  id: string;
  poll_id: string;
  requester_admin_id: string;
  correction_target_field: CorrectionTargetField;
  correction_target_id: string | null;
  original_text: string;
  proposed_text: string;
  reason: string;
  status: CorrectionRequestStatus;
  requires_dual_admin: boolean;
  spread_score_at_submit: number;
  spread_score_locked_until: Date;
  valid_until: Date;
  submitted_at: Date;
  created_at: Date;
  updated_at: Date;
};

export type CreateCorrectionRequestInput = {
  adminUserId: string;
  pollId: string;
  correctionTargetField: CorrectionTargetField;
  correctionTargetId?: string | null;
  proposedText: string;
  reason: string;
};

export type CreateCorrectionRequestResult = {
  request_id: string;
  status: 'pending';
  requires_dual_admin: boolean;
  spread_score_at_submit: number;
  valid_until: string;
};

export type InsertCorrectionRequestRow = {
  poll_id: string;
  requester_admin_id: string;
  correction_target_field: CorrectionTargetField;
  correction_target_id: string | null;
  original_text: string;
  proposed_text: string;
  reason: string;
  status: 'pending';
  requires_dual_admin: boolean;
  spread_score_at_submit: number;
  spread_score_locked_until: Date;
  valid_until: Date;
  submitted_at: Date;
};
