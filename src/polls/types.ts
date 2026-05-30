export const POLL_STATUSES = [
  'draft',
  'active',
  'closed',
  'deleted',
  'suspended',
  'correction_pending',
] as const;

export type PollStatus = (typeof POLL_STATUSES)[number];

export type PollRow = {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  category: string;
  status: PollStatus;
  eligible_rule_id: string | null;
  published_at: Date | null;
  closes_at: Date;
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
  trust_level: string;
  status: string;
  created_at: Date;
  updated_at: Date;
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
