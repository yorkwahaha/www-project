export class AdminError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'AdminError';
  }
}

export class AdminForbiddenError extends AdminError {
  constructor(message = 'Active admin permission is required') {
    super('ADMIN_FORBIDDEN', message, 403);
  }
}

export class CorrectionValidationError extends AdminError {
  constructor(message: string) {
    super('CORRECTION_VALIDATION', message, 400);
  }
}

export class CorrectionConflictError extends AdminError {
  constructor(message = 'A pending correction request already exists for this target') {
    super('CORRECTION_CONFLICT', message, 409);
  }
}

export class CorrectionPollNotFoundError extends AdminError {
  constructor(message = 'Poll not found') {
    super('POLL_NOT_FOUND', message, 404);
  }
}

export class CorrectionPollNotEligibleError extends AdminError {
  constructor(message = 'Poll is not eligible for typo correction') {
    super('POLL_NOT_ELIGIBLE', message, 400);
  }
}

export class CorrectionRequestNotFoundError extends AdminError {
  constructor(message = 'Correction request not found') {
    super('CORRECTION_REQUEST_NOT_FOUND', message, 404);
  }
}

export class CorrectionRequestNotPendingError extends AdminError {
  constructor(message = 'Correction request is not pending') {
    super('CORRECTION_REQUEST_NOT_PENDING', message, 400);
  }
}

export class ProposerCannotApproveError extends AdminError {
  constructor(message = 'Requester cannot approve their own correction request') {
    super('PROPOSER_CANNOT_APPROVE', message, 403);
  }
}

export class CorrectionDecisionAlreadySubmittedError extends AdminError {
  constructor(message = 'Admin has already submitted a decision for this request') {
    super('CORRECTION_DECISION_ALREADY_SUBMITTED', message, 409);
  }
}

export class CorrectionExpiredError extends AdminError {
  /** Set when the repository committed an `expired` status update before throwing. */
  readonly statusUpdateCommitted: boolean;

  constructor(
    message = 'Correction request has expired',
    statusUpdateCommitted = false,
  ) {
    super('CORRECTION_EXPIRED', message, 400);
    this.statusUpdateCommitted = statusUpdateCommitted;
  }
}
