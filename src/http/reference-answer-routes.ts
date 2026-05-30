import type { IncomingMessage, ServerResponse } from 'node:http';
import { recordReferenceAnswerDiagnostic } from '../logging/safe-diagnostic.js';
import { PollError } from '../polls/errors.js';
import type { PollService } from '../polls/service.js';
import { readJsonBody, sendJson } from './json.js';

type ReferenceAnswerBody = {
  option_id?: string;
};

type ReferenceAnswerRouteContext = {
  pollId: string;
  userId?: string;
  requestBody?: unknown;
};

export async function handlePostReferenceAnswer(
  req: IncomingMessage,
  res: ServerResponse,
  pollId: string,
  pollService: PollService,
  requireUserId: (req: IncomingMessage) => string,
): Promise<void> {
  let userId: string | undefined;
  let requestBody: ReferenceAnswerBody | undefined;

  try {
    userId = requireUserId(req);
    requestBody = await readJsonBody<ReferenceAnswerBody>(req);

    recordReferenceAnswerDiagnostic({
      pollId,
      userId,
      phase: 'request_received',
      requestBody,
    });

    const result = await pollService.submitReferenceAnswer(
      pollId,
      userId,
      requestBody.option_id ?? '',
    );

    recordReferenceAnswerDiagnostic({
      pollId,
      userId,
      phase: 'success',
      requestBody,
    });

    sendJson(res, 201, result);
  } catch (err) {
    handleReferenceAnswerRouteError(res, err, {
      pollId,
      userId,
      requestBody,
    });
  }
}

function handleReferenceAnswerRouteError(
  res: ServerResponse,
  err: unknown,
  ctx: ReferenceAnswerRouteContext,
): void {
  const response = mapRouteError(err);

  recordReferenceAnswerDiagnostic({
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
    return {
      statusCode: err.statusCode,
      error: err.code,
      message: err.message,
    };
  }
  if (err instanceof SyntaxError) {
    return {
      statusCode: 400,
      error: 'INVALID_JSON',
      message: 'Invalid JSON body',
    };
  }
  return {
    statusCode: 500,
    error: 'INTERNAL_ERROR',
    message: 'Internal server error',
  };
}
