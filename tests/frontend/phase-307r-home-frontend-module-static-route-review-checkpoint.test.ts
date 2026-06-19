import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_307R_DOC =
  'docs/www-project-phase-307r-home-frontend-module-static-route-review-checkpoint-v1.md';
const SERVER_TS = 'src/http/server.ts';
const SMOKE_SCRIPT = 'scripts/smoke-public-local.mjs';
const HOME_FEED_JS = 'public/frontend/home-feed.js';

const HOME_MODULE_ROUTES = [
  '/frontend/public-mvp-home.js',
  '/frontend/home-feed.js',
] as const;

const SITE_CHROME_ROUTES_STILL_MISSING = [
  '/frontend/auth-state-copy.js',
  '/frontend/login-state-ui.js',
] as const;

describe('Phase 307-R home frontend module static route review checkpoint (static guards)', () => {
  it('keeps Phase 307 home module routes registered via sendPublicFile only', async () => {
    const server = await readFile(join(process.cwd(), SERVER_TS), 'utf8');

    for (const route of HOME_MODULE_ROUTES) {
      expect(server, `server.ts should serve ${route}`).toContain(
        `path === '${route}'`,
      );
      const blockStart = server.indexOf(`path === '${route}'`);
      expect(blockStart).toBeGreaterThan(-1);
      const routeBlock = server.slice(blockStart, blockStart + 280);
      expect(routeBlock, `${route} should use sendPublicFile only`).toContain(
        'sendPublicFile',
      );
      expect(routeBlock, `${route} must not invoke API handlers`).not.toContain(
        'handleGetHomeFeed',
      );
      expect(routeBlock, `${route} must not invoke pollRoutes`).not.toContain(
        'pollRoutes',
      );
    }
  });

  it('keeps smoke guarding missing home module routes that caused B-306-01', async () => {
    const smoke = await readFile(join(process.cwd(), SMOKE_SCRIPT), 'utf8');

    expect(smoke).toContain('/frontend/public-mvp-home.js');
    expect(smoke).toContain('/frontend/home-feed.js');
    expect(smoke).toContain('fetchHomeFeedPage');
    expect(smoke).toContain("'/home/feed'");
  });

  it('records FU-307-01 site chrome follow-up and Phase 310 closure without blocking home feed validators', async () => {
    const server = await readFile(join(process.cwd(), SERVER_TS), 'utf8');
    const homeFeed = await readFile(join(process.cwd(), HOME_FEED_JS), 'utf8');
    const reviewDoc = await readFile(join(process.cwd(), PHASE_307R_DOC), 'utf8');

    for (const route of SITE_CHROME_ROUTES_STILL_MISSING) {
      expect(server, `${route} registered after Phase 310 (FU-307-01 closed)`).toContain(
        `path === '${route}'`,
      );
    }

    expect(homeFeed).toContain('isHomeCollectingFeedItemSafe');
    expect(homeFeed).toContain('isHomeRevealedFeedItemSafe');
    expect(reviewDoc).toContain('FU-307-01');
    expect(reviewDoc).toContain('not a release blocker');
  });

  it('links the review checkpoint doc from the repository', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    const reviewDoc = await readFile(join(process.cwd(), PHASE_307R_DOC), 'utf8');

    expect(readme).toContain(PHASE_307R_DOC);
    expect(reviewDoc).toContain('7f11604');
    expect(reviewDoc).toContain('APPROVED');
    expect(reviewDoc).toContain('B-306-01 is closed');
  });
});
