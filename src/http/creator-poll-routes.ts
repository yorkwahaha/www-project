import type { IncomingMessage, ServerResponse } from 'node:http';
import type { CreatorSessionConfig } from '../creator-sessions/config.js';
import { CreatorSessionError } from '../creator-sessions/errors.js';
import type { CreatorSessionService } from '../creator-sessions/service.js';
import { PollError } from '../polls/errors.js';
import type { PollService } from '../polls/service.js';
import {
  assertCreatorMutationOrigin,
  authenticateCreatorRequest,
} from './creator-auth.js';
import { readJsonBody, sendJson } from './json.js';

type CreateCreatorPollBody = {
  title?: string;
  description?: string;
  category?: string;
  options?: string[];
  eligible_rule_id?: string | null;
  closes_at?: string;
  publish?: boolean;
};

export function createCreatorPollRouteHandlers(
  pollService: PollService,
  creatorSessionService: CreatorSessionService,
  config: CreatorSessionConfig,
) {
  async function requireCreatorId(req: IncomingMessage): Promise<string> {
    return (await authenticateCreatorRequest(req, creatorSessionService)).userId;
  }

  async function requireCreatorMutation(req: IncomingMessage): Promise<string> {
    assertCreatorMutationOrigin(req, config);
    return requireCreatorId(req);
  }

  return {
    async handlePostCreatorPolls(
      req: IncomingMessage,
      res: ServerResponse,
    ): Promise<void> {
      try {
        const creatorId = await requireCreatorMutation(req);
        const body = await readJsonBody<CreateCreatorPollBody>(req);
        const result = await pollService.createCreatorPoll({
          creatorId,
          title: body.title ?? '',
          description: body.description ?? '',
          category: body.category ?? '',
          options: body.options ?? [],
          eligibleRuleId: body.eligible_rule_id ?? null,
          closesAt: new Date(body.closes_at ?? ''),
          publish: body.publish === true,
        });
        sendJson(res, 201, result);
      } catch (err) {
        handleCreatorPollRouteError(res, err);
      }
    },

    async handleGetCreatorPolls(
      req: IncomingMessage,
      res: ServerResponse,
    ): Promise<void> {
      try {
        sendJson(res, 200, await pollService.getCreatorOwnedPolls(await requireCreatorId(req)));
      } catch (err) {
        handleCreatorPollRouteError(res, err);
      }
    },

    async handleDeleteCreatorPoll(
      req: IncomingMessage,
      res: ServerResponse,
      pollId: string,
    ): Promise<void> {
      try {
        sendJson(res, 200, await pollService.deletePoll(pollId, await requireCreatorMutation(req)));
      } catch (err) {
        handleCreatorPollRouteError(res, err);
      }
    },

    async handlePostCancelCreatorPoll(
      req: IncomingMessage,
      res: ServerResponse,
      pollId: string,
    ): Promise<void> {
      try {
        sendJson(res, 200, await pollService.cancelPoll(pollId, await requireCreatorMutation(req)));
      } catch (err) {
        handleCreatorPollRouteError(res, err);
      }
    },

    async handlePostCloseCreatorPoll(
      req: IncomingMessage,
      res: ServerResponse,
      pollId: string,
    ): Promise<void> {
      try {
        sendJson(res, 200, await pollService.closePoll(pollId, await requireCreatorMutation(req)));
      } catch (err) {
        handleCreatorPollRouteError(res, err);
      }
    },

    async handlePostUnpublishCreatorPoll(
      req: IncomingMessage,
      res: ServerResponse,
      pollId: string,
    ): Promise<void> {
      try {
        sendJson(res, 200, await pollService.unpublishPoll(pollId, await requireCreatorMutation(req)));
      } catch (err) {
        handleCreatorPollRouteError(res, err);
      }
    },
  };
}

function handleCreatorPollRouteError(res: ServerResponse, err: unknown): void {
  if (err instanceof CreatorSessionError || err instanceof PollError) {
    sendJson(res, err.statusCode, { error: err.code, message: err.message });
    return;
  }
  if (err instanceof SyntaxError) {
    sendJson(res, 400, { error: 'INVALID_JSON', message: 'Invalid JSON body' });
    return;
  }
  sendJson(res, 500, { error: 'INTERNAL_ERROR', message: 'Internal server error' });
}
