export class CreatorSessionError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = 'CreatorSessionError';
  }
}

export function invalidCreatorSession(): CreatorSessionError {
  return new CreatorSessionError(
    'CREATOR_SESSION_INVALID',
    'Valid creator session is required',
    401,
  );
}
