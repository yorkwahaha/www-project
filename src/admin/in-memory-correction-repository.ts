import type { PollOptionRow, PollRow } from '../polls/types.js';
import type { CorrectionRepository } from './correction-repository.js';
import type {
  AdminUserRow,
  CorrectionRequestRow,
  CorrectionTargetField,
  InsertCorrectionRequestRow,
  PollRowForCorrection,
} from './types.js';

export type InMemoryCorrectionRepository = CorrectionRepository & {
  readonly admins: Map<string, AdminUserRow>;
  readonly polls: Map<string, PollRow>;
  readonly optionsByPollId: Map<string, PollOptionRow[]>;
  readonly correctionRequests: Map<string, CorrectionRequestRow>;
  readonly decisionLogs: unknown[];
  readonly correctionLogs: unknown[];
  readonly publicNotices: unknown[];
  ensureAdmin(userId: string, status?: AdminUserRow['status']): AdminUserRow;
  setPoll(poll: PollRow): void;
  setOptions(pollId: string, options: PollOptionRow[]): void;
};

export function createInMemoryCorrectionRepository(): InMemoryCorrectionRepository {
  const admins = new Map<string, AdminUserRow>();
  const polls = new Map<string, PollRow>();
  const optionsByPollId = new Map<string, PollOptionRow[]>();
  const correctionRequests = new Map<string, CorrectionRequestRow>();
  const decisionLogs: unknown[] = [];
  const correctionLogs: unknown[] = [];
  const publicNotices: unknown[] = [];

  return {
    admins,
    polls,
    optionsByPollId,
    correctionRequests,
    decisionLogs,
    correctionLogs,
    publicNotices,

    ensureAdmin(userId, status = 'active') {
      const now = new Date();
      const admin: AdminUserRow = {
        user_id: userId,
        role: 'admin',
        status,
        created_at: now,
        revoked_at: status === 'revoked' ? now : null,
      };
      admins.set(userId, admin);
      return admin;
    },

    setPoll(poll) {
      polls.set(poll.id, poll);
    },

    setOptions(pollId, options) {
      optionsByPollId.set(pollId, options);
    },

    async findActiveAdminByUserId(userId) {
      const admin = admins.get(userId);
      if (!admin || admin.status !== 'active') {
        return null;
      }
      return admin;
    },

    async findPollByIdForCorrection(pollId) {
      const poll = polls.get(pollId);
      if (!poll) {
        return null;
      }
      const row: PollRowForCorrection = {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        status: poll.status,
      };
      return row;
    },

    async findOptionTextForPoll(pollId, optionId) {
      const options = optionsByPollId.get(pollId) ?? [];
      const option = options.find((row) => row.id === optionId);
      return option?.option_text ?? null;
    },

    async findPendingCorrectionRequest(params) {
      for (const request of correctionRequests.values()) {
        if (
          request.poll_id === params.pollId &&
          request.correction_target_field === params.correctionTargetField &&
          request.status === 'pending' &&
          request.correction_target_id === params.correctionTargetId
        ) {
          return request;
        }
      }
      return null;
    },

    async insertCorrectionRequest(row) {
      const now = row.submitted_at;
      const inserted: CorrectionRequestRow = {
        id: crypto.randomUUID(),
        poll_id: row.poll_id,
        requester_admin_id: row.requester_admin_id,
        correction_target_field: row.correction_target_field,
        correction_target_id: row.correction_target_id,
        original_text: row.original_text,
        proposed_text: row.proposed_text,
        reason: row.reason,
        status: row.status,
        requires_dual_admin: row.requires_dual_admin,
        spread_score_at_submit: row.spread_score_at_submit,
        spread_score_locked_until: row.spread_score_locked_until,
        valid_until: row.valid_until,
        submitted_at: row.submitted_at,
        created_at: now,
        updated_at: now,
      };
      correctionRequests.set(inserted.id, inserted);
      return inserted;
    },
  };
}
