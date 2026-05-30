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
