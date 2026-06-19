import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_310_DOC =
  'docs/www-project-phase-310-site-chrome-frontend-module-static-route-fix-v1.md';
const SERVER_TS = 'src/http/server.ts';
const RESULTS_HTML = 'public/results.html';
const LAYOUT_JS = 'public/frontend/public-mvp-layout.js';

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

describe('Phase 310 site chrome frontend module static route fix', () => {
  it('registers FU-307-01 site chrome module routes in server.ts', async () => {
    const server = await readFile(join(process.cwd(), SERVER_TS), 'utf8');

    for (const route of SITE_CHROME_MODULE_ROUTES) {
      expect(server, `server.ts should serve ${route}`).toContain(
        `path === '${route}'`,
      );
      expect(server, `server.ts should sendPublicFile for ${route}`).toMatch(
        new RegExp(
          `sendPublicFile\\([\\s\\S]*?['"]frontend/${route.replace('/frontend/', '')}['"]`,
        ),
      );
    }
  });

  it('registers result-page static imports required for /results runtime', async () => {
    const server = await readFile(join(process.cwd(), SERVER_TS), 'utf8');

    for (const route of RESULTS_RUNTIME_MODULE_ROUTES) {
      expect(server, `server.ts should serve ${route}`).toContain(
        `path === '${route}'`,
      );
    }
  });

  it('keeps results.html referencing layout without changing rendering files', async () => {
    const resultsHtml = await readFile(join(process.cwd(), RESULTS_HTML), 'utf8');
    const layoutSource = await readFile(join(process.cwd(), LAYOUT_JS), 'utf8');
    const doc = await readFile(join(process.cwd(), PHASE_310_DOC), 'utf8');

    expect(resultsHtml).toContain('/frontend/public-mvp-layout.js');
    expect(layoutSource).toContain("from './auth-state-copy.js'");
    expect(layoutSource).toContain("from './login-state-ui.js'");
    expect(doc).toContain('public/frontend/auth-state-copy.js');
    expect(doc).not.toContain('result-page.js reveal logic changed');
  });

  it('indexes Phase 310 in README and closes FU-307-01', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    const doc = await readFile(join(process.cwd(), PHASE_310_DOC), 'utf8');

    expect(readme).toContain(PHASE_310_DOC);
    expect(readme).toContain('FU-307-01');
    expect(doc).toContain('FU-307-01 CLOSED');
  });
});
