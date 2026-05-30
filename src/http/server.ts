import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { PollService } from '../polls/service.js';
import { sendJson } from './json.js';
import { createPollRouteHandlers } from './poll-routes.js';

const POLL_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type HttpServerOptions = {
  pollService: PollService;
};

export function createHttpServer(options: HttpServerOptions) {
  const pollRoutes = createPollRouteHandlers(options.pollService);

  return createServer(async (req, res) => {
    try {
      await routeRequest(req, res, pollRoutes);
    } catch {
      sendJson(res, 500, { error: 'INTERNAL_ERROR', message: 'Internal server error' });
    }
  });
}

async function routeRequest(
  req: IncomingMessage,
  res: ServerResponse,
  pollRoutes: ReturnType<typeof createPollRouteHandlers>,
): Promise<void> {
  const method = req.method ?? 'GET';
  const url = new URL(req.url ?? '/', 'http://localhost');
  const path = url.pathname;

  if (method === 'GET' && path === '/health') {
    sendJson(res, 200, { status: 'ok', phase: 1 });
    return;
  }

  if (method === 'PUT' || method === 'PATCH') {
    if (path === '/polls' || path.startsWith('/polls/')) {
      sendJson(res, 405, {
        error: 'METHOD_NOT_ALLOWED',
        message: 'Poll content cannot be edited after publish',
      });
      return;
    }
  }

  if (path === '/polls' && method === 'POST') {
    await pollRoutes.handlePostPolls(req, res);
    return;
  }

  const pollMatch = path.match(/^\/polls\/([^/]+)$/);
  if (pollMatch) {
    const pollId = pollMatch[1]!;
    if (!POLL_ID_PATTERN.test(pollId)) {
      sendJson(res, 400, { error: 'INVALID_POLL_ID', message: 'Invalid poll id' });
      return;
    }
    if (method === 'GET') {
      await pollRoutes.handleGetPoll(req, res, pollId);
      return;
    }
    if (method === 'DELETE') {
      await pollRoutes.handleDeletePoll(req, res, pollId);
      return;
    }
  }

  sendJson(res, 404, { error: 'NOT_FOUND', message: 'Not found' });
}
