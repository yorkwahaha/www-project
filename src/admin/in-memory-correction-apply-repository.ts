import type { CorrectionApplyRepository, ApplyCorrectionRequestParams } from './correction-apply-repository.js';
import {
  CorrectionAlreadyAppliedError,
  CorrectionExpiredError,
  CorrectionPollNotEligibleError,
  CorrectionPollNotFoundError,
  CorrectionRequestNotApprovedError,
  CorrectionRequestNotFoundError,
  CorrectionStaleTargetError,
  CorrectionValidationError,
} from './errors.js';
import type { InMemoryCorrectionRepository } from './in-memory-correction-repository.js';
import { isPollEligibleForCorrectionRequest } from './poll-correction-eligibility.js';
import type {
  ApplyCorrectionRequestResult,
  PollCorrectionLogRow,
  CorrectionRequestRow,
} from './types.js';

export function createInMemoryCorrectionApplyRepository(
  base: InMemoryCorrectionRepository,
): CorrectionApplyRepository {
  return {
    findActiveAdminByUserId: (userId) => base.findActiveAdminByUserId(userId),
    applyCorrectionRequestAtomic: (params) => applyInMemory(base, params),
  };
}

async function applyInMemory(
  base: InMemoryCorrectionRepository,
  params: ApplyCorrectionRequestParams,
): Promise<ApplyCorrectionRequestResult> {
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
  if (params.appliedAt.getTime() > request.valid_until.getTime()) {
    request.status = 'expired';
    request.updated_at = params.appliedAt;
    base.correctionRequests.set(request.id, request);
    throw new CorrectionExpiredError('Correction request has expired', true);
  }

  assertApplyTargetShape(request);

  const poll = base.polls.get(request.poll_id);
  if (!poll) {
    throw new CorrectionPollNotFoundError();
  }
  if (!isPollEligibleForCorrectionRequest(poll.status)) {
    throw new CorrectionPollNotEligibleError();
  }

  const updated = applyTargetTextInMemory(base, request, params.appliedAt);
  if (!updated) {
    throw new CorrectionStaleTargetError();
  }

  const log: PollCorrectionLogRow = {
    id: crypto.randomUUID(),
    correction_request_id: request.id,
    poll_id: request.poll_id,
    applied_by_admin_id: params.appliedByAdminId,
    correction_target_field: request.correction_target_field,
    correction_target_id: request.correction_target_id,
    original_text: request.original_text,
    applied_text: request.proposed_text,
    public_notice_id: null,
    applied_at: params.appliedAt,
    created_at: params.appliedAt,
  };
  base.correctionLogs.push(log);

  request.status = 'applied';
  request.updated_at = params.appliedAt;
  base.correctionRequests.set(request.id, request);

  return {
    request_id: request.id,
    request_status: 'applied',
    correction_log_id: log.id,
    poll_id: request.poll_id,
    correction_target_field: request.correction_target_field,
  };
}

function assertApplyTargetShape(request: CorrectionRequestRow): void {
  if (request.correction_target_field === 'option_text') {
    if (!request.correction_target_id) {
      throw new CorrectionValidationError(
        'correction_target_id is required for option_text corrections',
      );
    }
    return;
  }
  if (request.correction_target_id !== null) {
    throw new CorrectionValidationError(
      'correction_target_id must not be set for title or description corrections',
    );
  }
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
