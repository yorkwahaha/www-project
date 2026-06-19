import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_310R_DOC =
  'docs/www-project-phase-310r-site-chrome-results-module-route-review-checkpoint-v1.md';
const SERVER_TS = 'src/http/server.ts';
const SMOKE_SCRIPT = 'scripts/smoke-public-local.mjs';
const HOME_FEED_JS = 'public/frontend/home-feed.js';
const RESULT_PAGE_JS = 'public/frontend/result-page.js';

const PHASE_310_MODULE_ROUTES = [
  '/frontend/auth-state-copy.js',
  '/frontend/login-state-ui.js',
  '/frontend/login-state-read.js',
  '/frontend/login-state-logout.js',
  '/frontend/public-results-detail-layout.js',
  '/frontend/public-vote-detail-layout.js',
  '/frontend/poll-lifecycle-controls.js',
  '/frontend/creator-flow-copy.js',
] as const;

describe('Phase 310-R site chrome results module route review checkpoint (static guards)', () => {
  it('keeps Phase 310 module routes registered via sendPublicFile only', async () => {
    const server = await readFile(join(process.cwd(), SERVER_TS), 'utf8');

    for (const route of PHASE_310_MODULE_ROUTES) {
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
        'handleGetPollResults',
      );
      expect(routeBlock, `${route} must not invoke pollRoutes`).not.toContain(
        'pollRoutes',
      );
    }
  });

  it('keeps smoke guarding site-chrome and result-page module routes', async () => {
    const smoke = await readFile(join(process.cwd(), SMOKE_SCRIPT), 'utf8');

    for (const route of PHASE_310_MODULE_ROUTES) {
      expect(smoke, `smoke should fetch ${route}`).toContain(route);
    }
    expect(smoke).toContain('site chrome module for results layout graph');
    expect(smoke).toContain('result-page static import for /results runtime');
  });

  it('records FU-307-01 closure without altering home feed or result reveal validators', async () => {
    const homeFeed = await readFile(join(process.cwd(), HOME_FEED_JS), 'utf8');
    const resultPage = await readFile(join(process.cwd(), RESULT_PAGE_JS), 'utf8');
    const reviewDoc = await readFile(join(process.cwd(), PHASE_310R_DOC), 'utf8');

    expect(homeFeed).toContain('isHomeCollectingFeedItemSafe');
    expect(homeFeed).toContain('isHomeRevealedFeedItemSafe');
    expect(resultPage).toContain('syncResultsAggregateRevealPresentation');
    expect(resultPage).toContain('shouldApplyResultsAggregateReveal');
    expect(reviewDoc).toContain('FU-307-01 CLOSED');
    expect(reviewDoc).toContain('3457');
    expect(reviewDoc).toContain('3456');
  });

  it('links the review checkpoint doc from the repository', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    const reviewDoc = await readFile(join(process.cwd(), PHASE_310R_DOC), 'utf8');

    expect(readme).toContain(PHASE_310R_DOC);
    expect(reviewDoc).toContain('be6b83a');
    expect(reviewDoc).toContain('APPROVED');
    expect(reviewDoc).toContain('FU-307-01 is closed');
  });
});
