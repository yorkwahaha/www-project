import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_307_DOC =
  'docs/www-project-phase-307-home-frontend-module-static-route-fix-v1.md';
const SERVER_TS = 'src/http/server.ts';
const INDEX_HTML = 'public/index.html';

const HOME_MODULE_ROUTES = [
  '/frontend/public-mvp-home.js',
  '/frontend/home-feed.js',
] as const;

const HOME_TRANSITIVE_ROUTES = [
  '/frontend/public-poll-card.js',
  '/frontend/quality-feedback-badge.js',
  '/frontend/public-unavailable-state.js',
  '/frontend/public-page-copy.js',
  '/frontend/public-keyboard-focus-a11y.js',
] as const;

describe('Phase 307 home frontend module static route fix', () => {
  it('registers FU-306-01 home module routes in server.ts', async () => {
    const server = await readFile(join(process.cwd(), SERVER_TS), 'utf8');

    for (const route of HOME_MODULE_ROUTES) {
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

  it('registers transitive static imports required by the home module graph', async () => {
    const server = await readFile(join(process.cwd(), SERVER_TS), 'utf8');

    for (const route of HOME_TRANSITIVE_ROUTES) {
      expect(server, `server.ts should serve ${route}`).toContain(
        `path === '${route}'`,
      );
    }
  });

  it('keeps index.html referencing the home client without changing rendering files', async () => {
    const indexHtml = await readFile(join(process.cwd(), INDEX_HTML), 'utf8');
    const doc = await readFile(join(process.cwd(), PHASE_307_DOC), 'utf8');

    expect(indexHtml).toContain('/frontend/public-mvp-home.js');
    expect(doc).toContain('public/frontend/public-mvp-home.js');
    expect(doc).toContain('public/frontend/home-feed.js');
    expect(doc).not.toContain('renderHomeSwipeCard changed');
  });

  it('indexes Phase 307 in README and closes FU-306-01', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    const doc = await readFile(join(process.cwd(), PHASE_307_DOC), 'utf8');

    expect(readme).toContain(PHASE_307_DOC);
    expect(readme).toContain('FU-306-01');
    expect(doc).toContain('B-306-01 resolved');
  });
});
