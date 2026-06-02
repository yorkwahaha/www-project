export class PollError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'PollError';
  }
}

export class PollNotFoundError extends PollError {
  constructor(message = 'Poll not found') {
    super('POLL_NOT_FOUND', message, 404);
  }
}

export class PollForbiddenError extends PollError {
  constructor(message = 'Forbidden') {
    super('POLL_FORBIDDEN', message, 403);
  }
}

export class PollValidationError extends PollError {
  constructor(message: string) {
    super('POLL_VALIDATION', message, 400);
  }
}

export class PollLifecycleConflictError extends PollError {
  constructor(message = 'Poll lifecycle transition is not allowed') {
    super('LIFECYCLE_CONFLICT', message, 409);
  }
}

export class PollAlreadyCancelledError extends PollError {
  constructor(message = 'Poll is already cancelled') {
    super('ALREADY_CANCELLED', message, 409);
  }
}

export class PollAlreadyUnpublishedError extends PollError {
  constructor(message = 'Poll is already unpublished') {
    super('ALREADY_UNPUBLISHED', message, 409);
  }
}

export class PollLockedPeriodConflictError extends PollError {
  constructor(message = 'Poll public lock period has not ended') {
    super('LOCKED_PERIOD_CONFLICT', message, 409);
  }
}

export class InvalidFeedLimitError extends PollError {
  constructor(message = 'Feed limit must be an integer from 1 to 50') {
    super('INVALID_FEED_LIMIT', message, 400);
  }
}

export class InvalidFeedCursorError extends PollError {
  constructor(message = 'Invalid feed cursor') {
    super('INVALID_FEED_CURSOR', message, 400);
  }
}

export class ReferenceAnswerDuplicateError extends PollError {
  constructor(message = 'Reference Answer already recorded for this poll') {
    super('REFERENCE_ANSWER_DUPLICATE', message, 409);
  }
}

export class OfficialVoteDuplicateError extends PollError {
  constructor(message = 'Official Vote already recorded for this poll') {
    super('OFFICIAL_VOTE_DUPLICATE', message, 409);
  }
}

/** Creator cannot edit poll content after publish (Phase 1+). */
export class PublishedPollImmutableError extends PollError {
  constructor(message = 'Published polls cannot be edited by the creator') {
    super('PUBLISHED_POLL_IMMUTABLE', message, 403);
  }
}
