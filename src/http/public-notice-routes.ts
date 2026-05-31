import type { IncomingMessage, ServerResponse } from 'node:http';
import type { PublicNoticeService } from '../public-notices/service.js';
import { sendJson } from './json.js';

export function createPublicNoticeRouteHandlers(
  publicNoticeService: PublicNoticeService,
) {
  return {
    async handleGetPollPublicNotices(
      _req: IncomingMessage,
      res: ServerResponse,
      pollId: string,
    ): Promise<void> {
      const result = await publicNoticeService.listVisibleNoticesByPollId(pollId);
      sendJson(res, 200, result);
    },
  };
}
