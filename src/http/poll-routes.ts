import type { IncomingMessage, ServerResponse } from 'node:http';
import type { UserAuthResolver } from '../auth/user-auth-resolver.js';
import { PollError } from '../polls/errors.js';
import type { PublicFeedQuery } from '../polls/types.js';
import type { PollService } from '../polls/service.js';
import {
  handlePostOfficialVote as dispatchOfficialVote,
  handlePostOfficialVoteByIndex as dispatchOfficialVoteByIndex,
} from './official-vote-routes.js';
import { handlePostQualityFeedback as dispatchQualityFeedback } from './quality-feedback-routes.js';
import { handlePostReferenceAnswer as dispatchReferenceAnswer } from './reference-answer-routes.js';
import { sendJson } from './json.js';

const LEGACY_CREATOR_WRITE_RETIRED = {
  error: 'LEGACY_CREATOR_WRITE_RETIRED',
  message: 'Legacy creator-write routes are retired; use /creator/polls',
} as const;

const AUTH_REQUIRED_MESSAGE = 'User authentication is required';

export function createPollRouteHandlers(
  pollService: PollService,
  userAuthResolver: UserAuthResolver,
) {
  const requirePublicVoteUserAuth = (req: IncomingMessage) =>
    resolvePublicVoteUserAuth(req, userAuthResolver);

  return {
    async handlePostPolls(_req: IncomingMessage, res: ServerResponse): Promise<void> {
      sendLegacyCreatorWriteRetired(res);
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
      _req: IncomingMessage,
      res: ServerResponse,
      _pollId: string,
    ): Promise<void> {
      sendLegacyCreatorWriteRetired(res);
    },

    async handlePostCancelPoll(
      _req: IncomingMessage,
      res: ServerResponse,
      _pollId: string,
    ): Promise<void> {
      sendLegacyCreatorWriteRetired(res);
    },

    async handlePostClosePoll(
      _req: IncomingMessage,
      res: ServerResponse,
      _pollId: string,
    ): Promise<void> {
      sendLegacyCreatorWriteRetired(res);
    },

    async handlePostUnpublishPoll(
      _req: IncomingMessage,
      res: ServerResponse,
      _pollId: string,
    ): Promise<void> {
      sendLegacyCreatorWriteRetired(res);
    },

    handlePostReferenceAnswer(
      req: IncomingMessage,
      res: ServerResponse,
      pollId: string,
    ): Promise<void> {
      return dispatchReferenceAnswer(req, res, pollId, pollService, requireUserId);
    },

    async handleGetPublicFeed(
      _req: IncomingMessage,
      res: ServerResponse,
      query: PublicFeedQuery = {},
    ): Promise<void> {
      try {
        const feed = await pollService.getPublicFeed(query);
        sendJson(res, 200, feed);
      } catch (err) {
        handlePollRouteError(res, err);
      }
    },

    async handleGetHomeFeed(
      _req: IncomingMessage,
      res: ServerResponse,
      query: PublicFeedQuery = {},
    ): Promise<void> {
      try {
        const feed = await pollService.getHomeFeed(query);
        sendJson(res, 200, feed);
      } catch (err) {
        handlePollRouteError(res, err);
      }
    },

    async handleGetPollResults(
      _req: IncomingMessage,
      res: ServerResponse,
      pollId: string,
    ): Promise<void> {
      try {
        const result = await pollService.getPollResults(pollId);
        sendJson(res, 200, result);
      } catch (err) {
        handlePollRouteError(res, err);
      }
    },

    handlePostOfficialVote(
      req: IncomingMessage,
      res: ServerResponse,
      pollId: string,
    ): Promise<void> {
      return dispatchOfficialVote(
        req,
        res,
        pollId,
        pollService,
        requirePublicVoteUserAuth,
      );
    },

    handlePostOfficialVoteByIndex(
      req: IncomingMessage,
      res: ServerResponse,
      pollId: string,
    ): Promise<void> {
      return dispatchOfficialVoteByIndex(
        req,
        res,
        pollId,
        pollService,
        requirePublicVoteUserAuth,
      );
    },

    handlePostQualityFeedback(
      req: IncomingMessage,
      res: ServerResponse,
      pollId: string,
    ): Promise<void> {
      return dispatchQualityFeedback(req, res, pollId, pollService);
    },
  };
}

async function resolvePublicVoteUserAuth(
  req: IncomingMessage,
  userAuthResolver: UserAuthResolver,
): Promise<string> {
  const auth = await userAuthResolver.resolveUserAuth(req);
  if (auth === null) {
    throw new PollError('AUTH_REQUIRED', AUTH_REQUIRED_MESSAGE, 401);
  }
  return auth.user_id;
}

function sendLegacyCreatorWriteRetired(res: ServerResponse): void {
  sendJson(res, 410, LEGACY_CREATOR_WRITE_RETIRED);
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
