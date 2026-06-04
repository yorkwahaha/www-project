import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('legacy creator-write route source guard', () => {
  it('retires only legacy /polls creator writes and leaves public routes wired', async () => {
    const routeSource = await readFile(
      join(process.cwd(), 'src/http/poll-routes.ts'),
      'utf8',
    );
    const serverSource = await readFile(
      join(process.cwd(), 'src/http/server.ts'),
      'utf8',
    );

    for (const handler of [
      'handlePostPolls',
      'handleDeletePoll',
      'handlePostCancelPoll',
      'handlePostClosePoll',
      'handlePostUnpublishPoll',
    ]) {
      const start = findRouteHandler(routeSource, handler);
      const end = routeSource.indexOf('},', start);
      expect(start).toBeGreaterThan(-1);
      expect(end).toBeGreaterThan(start);
      expect(routeSource.slice(start, end)).toContain('sendLegacyCreatorWriteRetired');
    }

    for (const handler of [
      'handlePostReferenceAnswer',
      'handleGetPublicFeed',
      'handleGetPollResults',
      'handlePostOfficialVote',
      'handlePostOfficialVoteByIndex',
      'handleGetPoll',
    ]) {
      const start = findRouteHandler(routeSource, handler);
      const end = routeSource.indexOf('},', start);
      expect(start).toBeGreaterThan(-1);
      expect(end).toBeGreaterThan(start);
      expect(routeSource.slice(start, end)).not.toContain(
        'sendLegacyCreatorWriteRetired',
      );
    }

    expect(serverSource).toContain("path === '/polls' && method === 'POST'");
    expect(serverSource).toContain('/^\\/polls\\/([^/]+)\\/(cancel|close|unpublish)$/');
    expect(serverSource).toContain("method === 'DELETE'");
    for (const publicPath of [
      "path === '/polls/feed' && method === 'GET'",
      '/^\\/polls\\/([^/]+)\\/reference-answer$/',
      '/^\\/polls\\/([^/]+)\\/vote$/',
      '/^\\/polls\\/([^/]+)\\/vote-by-index$/',
      '/^\\/polls\\/([^/]+)\\/results$/',
    ]) {
      expect(serverSource).toContain(publicPath);
    }

    expect(routeSource).not.toMatch(/LEGACY_CREATOR_WRITE.*(ALLOW|ENABLE|BYPASS)/);
  });
});

function findRouteHandler(source: string, handler: string): number {
  const asyncStart = source.indexOf(`    async ${handler}`);
  return asyncStart >= 0 ? asyncStart : source.indexOf(`    ${handler}`);
}
