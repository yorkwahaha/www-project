import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_312_DOC =
  'docs/www-project-phase-312-public-mvp-release-readiness-checkpoint-v1.md';
const SERVER_TS = 'src/http/server.ts';
const SMOKE_SCRIPT = 'scripts/smoke-public-local.mjs';
const RESULT_PAGE_JS = 'public/frontend/result-page.js';
const HOME_FEED_JS = 'public/frontend/home-feed.js';

const HOME_MODULE_ROUTES = [
  '/frontend/public-mvp-home.js',
  '/frontend/home-feed.js',
] as const;

const SITE_CHROME_MODULE_ROUTES = [
  '/frontend/auth-state-copy.js',
  '/frontend/login-state-ui.js',
  '/frontend/login-state-read.js',
  '/frontend/login-state-logout.js',
] as const;

const RESULTS_RUNTIME_MODULE_ROUTES = [
  '/frontend/public-results-detail-layout.js',
  '/frontend/public-vote-detail-layout.js',
  '/frontend/poll-lifecycle-controls.js',
  '/frontend/creator-flow-copy.js',
] as const;

describe('Phase 312 public MVP release readiness checkpoint (static guards)', () => {
  it('records release candidate approval and closed frontend arcs', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_312_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('528ed3c');
    expect(doc).toContain('APPROVED for release/deployment planning');
    expect(doc).toContain('**Release blockers identified:** none');
    expect(doc).toContain('Homepage mixed-feed MVP line closed');
    expect(doc).toContain('Results reveal animation line closed');
    expect(doc).toContain('OBS-311-01');
    expect(readme).toContain(PHASE_312_DOC);
    expect(readme).toContain('Phase 312');
  });

  it('keeps static module route coverage guarded for home, site chrome, and results', async () => {
    const server = await readFile(join(process.cwd(), SERVER_TS), 'utf8');
    const smoke = await readFile(join(process.cwd(), SMOKE_SCRIPT), 'utf8');

    for (const route of [
      ...HOME_MODULE_ROUTES,
      ...SITE_CHROME_MODULE_ROUTES,
      ...RESULTS_RUNTIME_MODULE_ROUTES,
    ]) {
      expect(server, `server.ts should serve ${route}`).toContain(`path === '${route}'`);
      expect(smoke, `smoke should fetch ${route}`).toContain(route);
    }
  });

  it('keeps result visibility and home feed privacy validators unchanged', async () => {
    const resultPage = await readFile(join(process.cwd(), RESULT_PAGE_JS), 'utf8');
    const homeFeed = await readFile(join(process.cwd(), HOME_FEED_JS), 'utf8');
    const doc = await readFile(join(process.cwd(), PHASE_312_DOC), 'utf8');

    expect(resultPage).toContain('shouldApplyResultsAggregateReveal');
    expect(resultPage).toContain("return mode === 'aggregate'");
    expect(homeFeed).toContain('isHomeCollectingFeedItemSafe');
    expect(homeFeed).toContain('isHomeRevealedFeedItemSafe');
    expect(doc).toContain('Raw Option Linkage Ban');
    expect(doc).toContain('eligibility-before-option-resolve');
  });

  it('reaffirms README release-state wording without deployment claims', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    const doc = await readFile(join(process.cwd(), PHASE_312_DOC), 'utf8');

    expect(readme).toContain('actual deployment **NOT EXECUTED**');
    expect(readme).toContain('formal launch **NOT COMPLETED**');
    expect(doc).toContain('Actual deployment remains NOT EXECUTED');
    expect(doc).not.toContain('deployment executed');
    expect(doc).not.toContain('formal launch completed');
  });
});
