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

export const POLL_CORRECTION_REQUEST_TARGET_TYPE = 'poll_correction_request' as const;

export type AdminDecisionValue = 'approve' | 'reject';

export type AdminDecisionRow = {
  id: string;
  admin_id: string;
  target_type: typeof POLL_CORRECTION_REQUEST_TARGET_TYPE;
  target_id: string;
  decision: AdminDecisionValue;
  reason_code: string;
  reason_text: string;
  submitted_at: Date;
  metadata_json: Record<string, never>;
  created_at: Date;
};

export type SubmitCorrectionDecisionInput = {
  decision: AdminDecisionValue;
  reason_code: string;
  reason_text?: string;
};

export type SubmitCorrectionDecisionResult = {
  request_id: string;
  request_status: CorrectionRequestStatus;
  decision_id: string;
};

export type CorrectionReviewContext = {
  request_id: string;
  poll_id: string;
  request_status: CorrectionRequestStatus;
  poll_status: PollStatus;
  correction_target_field: CorrectionTargetField;
  correction_target_id: string | null;
  original_text: string;
  proposed_text: string;
  requires_dual_admin: boolean;
  valid_until: string;
  viewer_has_submitted: boolean;
  decision_summary: CorrectionDecisionSummary;
};

export type ApplyCorrectionRequestResult = {
  request_id: string;
  request_status: 'applied';
  correction_log_id: string;
  poll_id: string;
  correction_target_field: CorrectionTargetField;
};

export type PollCorrectionLogRow = {
  id: string;
  correction_request_id: string;
  poll_id: string;
  applied_by_admin_id: string;
  correction_target_field: CorrectionTargetField;
  correction_target_id: string | null;
  original_text: string;
  applied_text: string;
  public_notice_id: string | null;
  applied_at: Date;
  created_at: Date;
};

export type CreateSuspendedCorrectionRequestInput = CreateCorrectionRequestInput;

export type CreateSuspendedCorrectionRequestResult = CreateCorrectionRequestResult;

export type ApplySuspendedCorrectionRequestResult = ApplyCorrectionRequestResult & {
  public_notice_id: string;
};

export type CorrectionDecisionSummary =
  | {
      state: 'pending_blind';
    }
  | {
      approve_count: number;
      reject_count: number;
      quorum_met: boolean;
      is_finalized: true;
    };

export type CorrectionAuditTimelineEvent =
  | 'submitted'
  | 'decision_quorum_met'
  | 'rejected'
  | 'expired'
  | 'applied';

export type CorrectionAuditTimelineItem = {
  event: CorrectionAuditTimelineEvent;
  at: string;
};

export type CorrectionAuditRecord = {
  request_id: string;
  poll_id: string;
  request_status: CorrectionRequestStatus;
  poll_status: PollStatus;
  correction_target_field: CorrectionTargetField;
  correction_target_id: string | null;
  original_text: string;
  proposed_text: string;
  requires_dual_admin: boolean;
  submitted_at: string;
  valid_until: string;
  updated_at: string;
  correction_log_id: string | null;
  applied_text: string | null;
  applied_at: string | null;
  has_public_notice: boolean;
  decision_summary: CorrectionDecisionSummary;
  timeline: CorrectionAuditTimelineItem[];
};

export type PollCorrectionAuditListItem = {
  request_id: string;
  request_status: CorrectionRequestStatus;
  correction_target_field: CorrectionTargetField;
  submitted_at: string;
  valid_until: string;
  has_public_notice: boolean;
  correction_log_id?: string;
};

export type PollCorrectionAuditList = {
  items: PollCorrectionAuditListItem[];
  next_cursor: string | null;
};
