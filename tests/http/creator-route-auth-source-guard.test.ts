import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Creator route auth source guard', () => {
  it('routes creator poll auth through UserAuthResolver instead of direct X-User-Id reads', async () => {
    const creatorAuth = await readFile(
      join(process.cwd(), 'src/http/creator-auth.ts'),
      'utf8',
    );
    const creatorPollRoutes = await readFile(
      join(process.cwd(), 'src/http/creator-poll-routes.ts'),
      'utf8',
    );
    const creatorSessionRoutes = await readFile(
      join(process.cwd(), 'src/http/creator-session-routes.ts'),
      'utf8',
    );
    const serverSource = await readFile(join(process.cwd(), 'src/http/server.ts'), 'utf8');

    expect(creatorAuth).toContain('requireCreatorRouteUserId');
    expect(creatorAuth).toContain('userAuthResolver.resolveUserAuth');
    expect(creatorAuth).not.toMatch(/req\.headers\['x-user-id'\]/i);
    expect(creatorAuth).not.toMatch(/headers\['x-user-id'\]/i);

    expect(creatorPollRoutes).toContain('UserAuthResolver');
    expect(creatorPollRoutes).toContain('requireCreatorRouteUserId');
    expect(creatorPollRoutes).not.toContain('authenticateCreatorRequest');
    expect(creatorPollRoutes).not.toMatch(/req\.headers\['x-user-id'\]/i);

    expect(creatorSessionRoutes).toContain('userAuthResolver.resolveUserAuth');
    expect(creatorSessionRoutes).not.toMatch(/req\.headers\['x-user-id'\]/i);

    expect(serverSource).toMatch(
      /createCreatorPollRouteHandlers\([\s\S]*userAuthResolver/,
    );
    expect(serverSource).toMatch(
      /createCreatorSessionRouteHandlers\([\s\S]*userAuthResolver/,
    );
  });
});
