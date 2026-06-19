import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_308_DOC =
  'docs/www-project-phase-308-hydrated-homepage-visual-review-checkpoint-v1.md';
const INDEX_HTML = 'public/index.html';
const HOME_JS = 'public/frontend/public-mvp-home.js';
const HOME_CSS = 'public/frontend/public-mvp.css';
const SERVER_TS = 'src/http/server.ts';
const SMOKE_SCRIPT = 'scripts/smoke-public-local.mjs';

describe('Phase 308 hydrated homepage visual review checkpoint (static guards)', () => {
  it('documents B-306-01 closure and hydrated PASS conclusion', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_308_DOC), 'utf8');

    expect(doc).toContain('B-306-01');
    expect(doc).toContain('B-306-01 remains closed');
    expect(doc).toContain('Hydrated feed visual');
    expect(doc).toContain('PASS');
    expect(doc).toContain('FU-307-01');
    expect(doc).toContain('homepage mixed-feed visual acceptance blocker');
  });

  it('keeps home module routes and smoke guards that unblock hydration', async () => {
    const server = await readFile(join(process.cwd(), SERVER_TS), 'utf8');
    const smoke = await readFile(join(process.cwd(), SMOKE_SCRIPT), 'utf8');

    expect(server).toContain("path === '/frontend/public-mvp-home.js'");
    expect(server).toContain("path === '/frontend/home-feed.js'");
    expect(smoke).toContain('/frontend/public-mvp-home.js');
    expect(smoke).toContain('/frontend/home-feed.js');
    expect(smoke).toContain('fetchHomeFeedPage');
  });

  it('keeps collecting vs revealed visual distinction in home source and CSS', async () => {
    const homeSource = await readFile(join(process.cwd(), HOME_JS), 'utf8');
    const css = await readFile(join(process.cwd(), HOME_CSS), 'utf8');

    expect(homeSource).toContain('mvp-badge-collecting');
    expect(homeSource).toContain('home-swipe-card--revealed');
    expect(homeSource).toContain('mvp-badge-revealed');
    expect(homeSource).toContain('renderHomeRevealedCard');
    expect(homeSource).toContain('home-swipe-card-result-lead');
    expect(homeSource).toContain('home-swipe-card-result-percent');
    expect(homeSource).toContain('home-swipe-card-result-total');

    expect(css).toContain('.home-swipe-card--revealed');
    expect(css).toContain('--home-revealed-wash');
    expect(css).toContain('prefers-reduced-motion');
  });

  it('keeps shell markup, manual load-more, sticky actions, and indexes Phase 308', async () => {
    const indexHtml = await readFile(join(process.cwd(), INDEX_HTML), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    const doc = await readFile(join(process.cwd(), PHASE_308_DOC), 'utf8');

    expect(indexHtml).toContain('data-home-swipe-feed="mixed"');
    expect(indexHtml).toContain('id="home-swipe-stage"');
    expect(indexHtml).toContain('id="home-swipe-load-more"');
    expect(indexHtml).toContain('載入更多');
    expect(indexHtml).toContain('id="home-create-cta"');
    expect(indexHtml).toContain('發起提問');
    expect(indexHtml).toContain('/frontend/public-mvp-home.js');

    expect(readme).toContain(PHASE_308_DOC);
    expect(readme).toContain('Phase 308');
    expect(doc).toContain('NOT EXECUTED');
    expect(doc).toContain('NOT COMPLETED');
    expect(readme).not.toContain('launch completed');
  });
});
