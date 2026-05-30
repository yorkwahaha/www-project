import {
  CorrectionAlreadyAppliedError,
  CorrectionExpiredError,
  CorrectionPollNotCorrectionPendingError,
  CorrectionPollNotFoundError,
  CorrectionPollNotSuspendedError,
  CorrectionRequestNotApprovedError,
  CorrectionRequestNotFoundError,
  CorrectionStaleTargetError,
} from './errors.js';
import { assertApplyTargetShape } from './correction-apply-target.js';
import type {
  CreateSuspendedCorrectionRequestParams,
  ApplySuspendedCorrectionRequestParams,
  SuspendedCorrectionRepository,
} from './suspended-correction-repository.js';
import type { InMemoryCorrectionRepository } from './in-memory-correction-repository.js';
import { isPollEligibleForSuspendedCorrectionApply } from './poll-correction-eligibility.js';
import { buildSuspendedCorrectionPublicNotice } from './public-notice-content.js';
import { restorePollToSuspendedIfCorrectionPendingInMemory } from './suspended-correction-poll-recovery.js';
import type {
  ApplySuspendedCorrectionRequestResult,
  CorrectionRequestRow,
  CreateSuspendedCorrectionRequestResult,
  PollCorrectionLogRow,
} from './types.js';

export function createInMemorySuspendedCorrectionRepository(
  base: InMemoryCorrectionRepository,
): SuspendedCorrectionRepository {
  return {
    findActiveAdminByUserId: (userId) => base.findActiveAdminByUserId(userId),
    findPollByIdForCorrection: (pollId) => base.findPollByIdForCorrection(pollId),
    findOptionTextForPoll: (pollId, optionId) => base.findOptionTextForPoll(pollId, optionId),
    findPendingCorrectionRequest: (params) => base.findPendingCorrectionRequest(params),
    insertCorrectionRequest: (row) => base.insertCorrectionRequest(row),
    createSuspendedCorrectionRequestAtomic: (params) =>
      createSuspendedInMemory(base, params),
    applySuspendedCorrectionRequestAtomic: (params) => applySuspendedInMemory(base, params),
  };
}

async function createSuspendedInMemory(
  base: InMemoryCorrectionRepository,
  params: CreateSuspendedCorrectionRequestParams,
) {
  const row = params.row;
  const poll = base.polls.get(row.poll_id);
  if (!poll) {
    throw new CorrectionPollNotFoundError();
  }
  if (poll.status !== 'suspended') {
    throw new CorrectionPollNotSuspendedError();
  }

  const inserted = await base.insertCorrectionRequest(row);
  poll.status = 'correction_pending';
  poll.updated_at = row.submitted_at;
  base.polls.set(poll.id, poll);

  const result: CreateSuspendedCorrectionRequestResult = {
    request_id: inserted.id,
    status: 'pending',
    requires_dual_admin: inserted.requires_dual_admin,
    spread_score_at_submit: inserted.spread_score_at_submit,
    valid_until: inserted.valid_until.toISOString(),
  };
  return result;
}

async function applySuspendedInMemory(
  base: InMemoryCorrectionRepository,
  params: ApplySuspendedCorrectionRequestParams,
) {
  const request = base.correctionRequests.get(params.requestId);
  if (!request) {
    throw new CorrectionRequestNotFoundError();
  }
  if (request.status === 'applied') {
    throw new CorrectionAlreadyAppliedError();
  }
  if (request.status !== 'approved') {
    throw new CorrectionRequestNotApprovedError();
  }

  const poll = base.polls.get(request.poll_id);
  if (!poll) {
    throw new CorrectionPollNotFoundError();
  }
  if (!isPollEligibleForSuspendedCorrectionApply(poll.status)) {
    throw new CorrectionPollNotCorrectionPendingError();
  }

  if (params.appliedAt.getTime() > request.valid_until.getTime()) {
    request.status = 'expired';
    request.updated_at = params.appliedAt;
    base.correctionRequests.set(request.id, request);
    restorePollToSuspendedIfCorrectionPendingInMemory(
      base,
      request.poll_id,
      params.appliedAt,
    );
    throw new CorrectionExpiredError('Correction request has expired', true);
  }

  assertApplyTargetShape(request);

  const updated = applyTargetTextInMemory(base, request, params.appliedAt);
  if (!updated) {
    throw new CorrectionStaleTargetError();
  }

  const noticeContent = buildSuspendedCorrectionPublicNotice(params.appliedAt);
  const notice = {
    id: crypto.randomUUID(),
    poll_id: request.poll_id,
    ...noticeContent,
    created_by_admin_id: params.appliedByAdminId,
    created_at: params.appliedAt,
  };
  base.publicNotices.push(notice);

  const log: PollCorrectionLogRow = {
    id: crypto.randomUUID(),
    correction_request_id: request.id,
    poll_id: request.poll_id,
    applied_by_admin_id: params.appliedByAdminId,
    correction_target_field: request.correction_target_field,
    correction_target_id: request.correction_target_id,
    original_text: request.original_text,
    applied_text: request.proposed_text,
    public_notice_id: notice.id,
    applied_at: params.appliedAt,
    created_at: params.appliedAt,
  };
  base.correctionLogs.push(log);

  poll.status = 'active';
  poll.updated_at = params.appliedAt;
  base.polls.set(poll.id, poll);

  request.status = 'applied';
  request.updated_at = params.appliedAt;
  base.correctionRequests.set(request.id, request);

  const result: ApplySuspendedCorrectionRequestResult = {
    request_id: request.id,
    request_status: 'applied',
    correction_log_id: log.id,
    poll_id: request.poll_id,
    correction_target_field: request.correction_target_field,
    public_notice_id: notice.id,
  };
  return result;
}

function applyTargetTextInMemory(
  base: InMemoryCorrectionRepository,
  request: CorrectionRequestRow,
  appliedAt: Date,
): boolean {
  const poll = base.polls.get(request.poll_id);
  if (!poll) {
    return false;
  }

  if (request.correction_target_field === 'title') {
    if (poll.title !== request.original_text) {
      return false;
    }
    poll.title = request.proposed_text;
    poll.updated_at = appliedAt;
    base.polls.set(poll.id, poll);
    return true;
  }

  if (request.correction_target_field === 'description') {
    if (poll.description !== request.original_text) {
      return false;
    }
    poll.description = request.proposed_text;
    poll.updated_at = appliedAt;
    base.polls.set(poll.id, poll);
    return true;
  }

  const options = base.optionsByPollId.get(request.poll_id) ?? [];
  const option = options.find((row) => row.id === request.correction_target_id);
  if (!option || option.option_text !== request.original_text) {
    return false;
  }
  option.option_text = request.proposed_text;
  option.updated_at = appliedAt;
  base.optionsByPollId.set(request.poll_id, options);
  return true;
}
