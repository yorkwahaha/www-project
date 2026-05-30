import type { IncomingMessage, ServerResponse } from 'node:http';
import { recordOfficialVoteDiagnostic } from '../logging/safe-diagnostic.js';
import { PollError } from '../polls/errors.js';
import type { PollService } from '../polls/service.js';
import { readJsonBody, sendJson } from './json.js';

type OfficialVoteBody = {
  option_id?: string;
};

type OfficialVoteRouteContext = {
  pollId: string;
  userId?: string;
  requestBody?: unknown;
};

export async function handlePostOfficialVote(
  req: IncomingMessage,
  res: ServerResponse,
  pollId: string,
  pollService: PollService,
  requireUserId: (req: IncomingMessage) => string,
): Promise<void> {
  let userId: string | undefined;
  let requestBody: OfficialVoteBody | undefined;

  try {
    userId = requireUserId(req);
    requestBody = await readJsonBody<OfficialVoteBody>(req);

    recordOfficialVoteDiagnostic({
      pollId,
      userId,
      phase: 'request_received',
      requestBody,
    });

    const result = await pollService.castOfficialVote(
      pollId,
      userId,
      requestBody.option_id ?? '',
    );
    requestBody = undefined;

    recordOfficialVoteDiagnostic({
      pollId,
      userId,
      phase: 'success',
    });

    sendJson(res, 201, result);
  } catch (err) {
    handleOfficialVoteRouteError(res, err, { pollId, userId, requestBody });
  }
}

function handleOfficialVoteRouteError(
  res: ServerResponse,
  err: unknown,
  ctx: OfficialVoteRouteContext,
): void {
  const response = mapRouteError(err);

  recordOfficialVoteDiagnostic({
    pollId: ctx.pollId,
    userId: ctx.userId ?? 'unknown',
    phase: 'error',
    requestBody: ctx.requestBody,
    error: { code: response.error, message: response.message },
  });

  sendJson(res, response.statusCode, {
    error: response.error,
    message: response.message,
  });
}

function mapRouteError(err: unknown): {
  statusCode: number;
  error: string;
  message: string;
} {
  if (err instanceof PollError) {
    return { statusCode: err.statusCode, error: err.code, message: err.message };
  }
  if (err instanceof SyntaxError) {
    return { statusCode: 400, error: 'INVALID_JSON', message: 'Invalid JSON body' };
  }
  return { statusCode: 500, error: 'INTERNAL_ERROR', message: 'Internal server error' };
}
