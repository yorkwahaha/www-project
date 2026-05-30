import type { IncomingMessage, ServerResponse } from 'node:http';
import { PollError } from '../polls/errors.js';
import { scrubReferenceAnswerRequestBody } from '../logging/scrubber.js';
import type { PollService } from '../polls/service.js';
import { readJsonBody, sendJson } from './json.js';

type CreatePollBody = {
  title?: string;
  description?: string;
  category?: string;
  options?: string[];
  eligible_rule_id?: string | null;
  closes_at?: string;
  publish?: boolean;
};

type ReferenceAnswerBody = {
  option_id?: string;
};

export function createPollRouteHandlers(pollService: PollService) {
  return {
    async handlePostPolls(req: IncomingMessage, res: ServerResponse): Promise<void> {
      try {
        const creatorId = requireUserId(req);
        const displayName = req.headers['x-display-name']?.toString() ?? 'Creator';
        const body = await readJsonBody<CreatePollBody>(req);
        const result = await pollService.createPoll(
          {
            creatorId,
            title: body.title ?? '',
            description: body.description ?? '',
            category: body.category ?? '',
            options: body.options ?? [],
            eligibleRuleId: body.eligible_rule_id ?? null,
            closesAt: new Date(body.closes_at ?? ''),
            publish: body.publish === true,
          },
          displayName,
        );
        sendJson(res, 201, result);
      } catch (err) {
        handlePollRouteError(res, err);
      }
    },

    async handleGetPoll(
      _req: IncomingMessage,
      res: ServerResponse,
      pollId: string,
    ): Promise<void> {
      try {
        const detail = await pollService.getPollById(pollId);
        sendJson(res, 200, detail);
      } catch (err) {
        handlePollRouteError(res, err);
      }
    },

    async handleDeletePoll(
      req: IncomingMessage,
      res: ServerResponse,
      pollId: string,
    ): Promise<void> {
      try {
        const creatorId = requireUserId(req);
        const result = await pollService.deletePoll(pollId, creatorId);
        sendJson(res, 200, result);
      } catch (err) {
        handlePollRouteError(res, err);
      }
    },

    async handlePostReferenceAnswer(
      req: IncomingMessage,
      res: ServerResponse,
      pollId: string,
    ): Promise<void> {
      try {
        const userId = requireUserId(req);
        const body = await readJsonBody<ReferenceAnswerBody>(req);
        // Establish a scrubbed diagnostic boundary before request data can escape.
        scrubReferenceAnswerRequestBody(body);
        const result = await pollService.submitReferenceAnswer(
          pollId,
          userId,
          body.option_id ?? '',
        );
        sendJson(res, 201, result);
      } catch (err) {
        handlePollRouteError(res, err);
      }
    },
  };
}

function requireUserId(req: IncomingMessage): string {
  const userId = req.headers['x-user-id']?.toString().trim();
  if (!userId) {
    throw new PollError('AUTH_REQUIRED', 'X-User-Id header is required', 401);
  }
  return userId;
}

function handlePollRouteError(res: ServerResponse, err: unknown): void {
  if (err instanceof PollError) {
    sendJson(res, err.statusCode, { error: err.code, message: err.message });
    return;
  }
  if (err instanceof SyntaxError) {
    sendJson(res, 400, { error: 'INVALID_JSON', message: 'Invalid JSON body' });
    return;
  }
  sendJson(res, 500, { error: 'INTERNAL_ERROR', message: 'Internal server error' });
}
