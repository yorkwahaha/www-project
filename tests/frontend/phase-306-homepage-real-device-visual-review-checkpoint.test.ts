import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_306_DOC =
  'docs/www-project-phase-306-homepage-real-device-visual-review-checkpoint-v1.md';
const INDEX_HTML = 'public/index.html';
const HOME_JS = 'public/frontend/public-mvp-home.js';
const HOME_CSS = 'public/frontend/public-mvp.css';

describe('Phase 306 homepage real-device visual review checkpoint (static guards)', () => {
  it('documents the B-306-01 blocker recorded at Phase 306 review', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_306_DOC), 'utf8');

    expect(doc).toContain('B-306-01');
    expect(doc).toContain('public-mvp-home.js');
    expect(doc).toContain('home-feed.js');
    expect(doc).toContain('FU-306-01');
  });

  it('keeps collecting vs revealed visual distinction in home source and CSS', async () => {
    const homeSource = await readFile(join(process.cwd(), HOME_JS), 'utf8');
    const css = await readFile(join(process.cwd(), HOME_CSS), 'utf8');

    expect(homeSource).toContain('mvp-badge-collecting');
    expect(homeSource).toContain('home-swipe-card--revealed');
    expect(homeSource).toContain('mvp-badge-revealed');
    expect(homeSource).toContain('home-swipe-card-result-lead');
    expect(homeSource).toContain('home-swipe-card-result-percent');
    expect(homeSource).toContain('home-swipe-card-result-total');

    expect(css).toContain('.home-swipe-card--revealed');
    expect(css).toContain('--home-revealed-wash');
    expect(css).toContain('prefers-reduced-motion');
  });

  it('keeps shell markup, manual load-more, and sticky actions for visual review', async () => {
    const indexHtml = await readFile(join(process.cwd(), INDEX_HTML), 'utf8');
    const css = await readFile(join(process.cwd(), HOME_CSS), 'utf8');

    expect(indexHtml).toContain('data-home-swipe-feed="mixed"');
    expect(indexHtml).toContain('id="home-swipe-stage"');
    expect(indexHtml).toContain('id="home-swipe-load-more"');
    expect(indexHtml).toContain('載入更多');
    expect(indexHtml).toContain('id="home-create-cta"');
    expect(indexHtml).toContain('發起提問');
    expect(indexHtml).toContain('id="home-register-cta"');
    expect(indexHtml).toContain('id="home-login-cta"');
    expect(indexHtml).toContain('id="home-explore-fallback"');

    expect(css).toContain('.home-swipe-actions');
    expect(css).toContain('scroll-snap-type');
  });

  it('indexes Phase 306 in README without claiming deployment', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    const doc = await readFile(join(process.cwd(), PHASE_306_DOC), 'utf8');

    expect(readme).toContain(PHASE_306_DOC);
    expect(readme).toContain('Phase 306');
    expect(doc).toContain('NOT EXECUTED');
    expect(doc).toContain('NOT COMPLETED');
    expect(readme).not.toContain('launch completed');
  });
});
