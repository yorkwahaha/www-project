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
