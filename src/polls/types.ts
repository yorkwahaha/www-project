import type { TrustLevel } from './trust.js';

export const POLL_STATUSES = [
  'draft',
  'active',
  'closed',
  'deleted',
  'suspended',
  'correction_pending',
] as const;

export type PollStatus = (typeof POLL_STATUSES)[number];

export const PUBLIC_LIFECYCLE_STATES = [
  'draft',
  'collecting',
  'cancelled',
  'revealed',
  'locked',
  'post_lock',
  'unpublished',
] as const;

export type PublicLifecycleState = (typeof PUBLIC_LIFECYCLE_STATES)[number];

export type PollRow = {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  category: string;
  status: PollStatus;
  public_lifecycle_state: PublicLifecycleState;
  eligible_rule_id: string | null;
  published_at: Date | null;
  archived_at: Date | null;
  closes_at: Date;
  revealed_at: Date | null;
  public_lock_ends_at: Date | null;
  cancelled_at: Date | null;
  unpublished_at: Date | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type PollOptionRow = {
  id: string;
  poll_id: string;
  option_order: number;
  option_text: string;
  created_at: Date;
  updated_at: Date;
};

export type UserRow = {
  id: string;
  display_name: string;
  trust_level: TrustLevel;
  status: string;
  birth_year_month: Date | null;
  residential_region: string | null;
  created_at: Date;
  updated_at: Date;
};

export type UserProfile = {
  birth_year_month: string | null;
  residential_region: string | null;
};

export type UpdateUserProfileInput = {
  birth_year_month: Date | null;
  residential_region: string | null;
};

export type PollEligibilityRuleType =
  | 'unrestricted'
  | 'age'
  | 'region'
  | 'age_region';

export type PollEligibilityRuleRow = {
  poll_id: string;
  rule_type: PollEligibilityRuleType;
  min_birth_year_month: Date | null;
  max_birth_year_month: Date | null;
  allowed_regions: string[];
  created_at: Date;
  updated_at: Date;
};

export type PollReferenceAnswerTokenRow = {
  id: string;
  user_id: string;
  poll_id: string;
  answered_at: Date;
  expires_at: Date;
  created_at: Date;
};

export type PollVoteTokenRow = {
  id: string;
  user_id: string;
  poll_id: string;
  voted_at_minute: Date;
  expires_at: Date;
  created_at: Date;
};

export type PollOptionVoteCounterRow = {
  poll_id: string;
  option_id: string;
  shard_id: number;
  vote_count: number;
};

export type PollOptionVoteAggregateRow = {
  option_id: string;
  option_order: number;
  option_text: string;
  vote_count: string;
};

export type PublicFeedPollRow = {
  id: string;
  title: string;
  category: string;
  status: 'active';
  published_at: Date;
};

export type CreatorOwnedPollRow = {
  id: string;
  title: string;
  category: string;
  public_lifecycle_state: PublicLifecycleState;
  closes_at: Date;
  revealed_at: Date | null;
  public_lock_ends_at: Date | null;
  cancelled_at: Date | null;
  unpublished_at: Date | null;
  created_at: Date;
};

export type CreatePollInput = {
  creatorId: string;
  title: string;
  description: string;
  category: string;
  options: string[];
  eligibleRuleId: string | null;
  closesAt: Date;
  publish: boolean;
};

export type PollDetail = {
  poll_id: string;
  public_lifecycle_state: PublicLifecycleState;
  title: string;
  description: string;
  category: string;
  status: PollStatus;
  closes_at: string;
  created_at: string;
  published_at: string | null;
  options: Array<{
    option_index: number;
    label: string;
  }>;
  user_participation_state: null;
};

export type CreatePollResult = {
  poll_id: string;
  status: PollStatus;
  created_at: string;
};

export type DeletePollResult = {
  poll_id: string;
  status: 'deleted';
  deleted_at: string;
};

export type CancelPollResult = {
  public_lifecycle_state: 'cancelled';
  message: '問卷已取消，不會產生公開結果。';
};

export type RevealPollResult = {
  public_lifecycle_state: 'revealed';
  revealed_at: string;
  public_lock_ends_at: string;
};

export type AdvancePublicLifecycleResult = {
  public_lifecycle_state: 'locked' | 'post_lock';
  revealed_at: string;
  public_lock_ends_at: string;
};

export type UnpublishPollResult = {
  public_lifecycle_state: 'unpublished';
  user_message: '此問卷已結束公開鎖定期，並由發起者下架。';
};

export type ReferenceAnswerResult = {
  status: 'recorded';
  reference_answered: true;
};

export type OfficialVoteResult = {
  status: 'voted';
  voted: true;
};

export type PollResultDisplay = {
  poll_id: string;
  public_lifecycle_state: PublicLifecycleState;
  display_mode:
    | 'collecting'
    | 'unavailable'
    | 'bucketed_percentage'
    | 'rounded_with_bucketed_votes'
    | 'precise';
  total_votes_display: '收集中' | '結果不可用' | '30–99' | '100–499' | '500+';
  collecting: boolean;
  options: Array<{
    option_index: number;
    display_label: string;
    display_percentage: string | null;
    display_count: string | null;
  }>;
  updated_display: '最近更新';
  user_message?: string;
};

export type PublicFeedQuery = {
  limit?: number | string;
  cursor?: string;
};

export type ListPublicFeedPollsParams = {
  limit: number;
  cursor?: {
    publishedAt: Date;
    pollId: string;
  };
};

export type PublicFeedResult = {
  polls: Array<{
    poll_id: string;
    title: string;
    category: string;
    status: 'active';
    published_display: '最近發布';
    result_page_url: string;
  }>;
  next_cursor: string | null;
};

export type CreatorOwnedPollListResult = {
  polls: Array<{
    poll_id: string;
    title: string;
    category: string;
    public_lifecycle_state: PublicLifecycleState;
    closes_at: string;
    revealed_at: string | null;
    public_lock_ends_at: string | null;
    cancelled_at: string | null;
    unpublished_at: string | null;
  }>;
};
