import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_305R_DOC =
  'docs/www-project-phase-305r-home-feed-auto-paging-review-checkpoint-v1.md';
const HOME_JS = 'public/frontend/public-mvp-home.js';
const HOME_FEED_JS = 'public/frontend/home-feed.js';
const INDEX_HTML = 'public/index.html';

describe('Phase 305-R home feed auto paging review checkpoint (static guards)', () => {
  it('keeps Phase 305 auto-paging duplicate guards and manual fallback in source', async () => {
    const homeSource = await readFile(join(process.cwd(), HOME_JS), 'utf8');
    const indexHtml = await readFile(join(process.cwd(), INDEX_HTML), 'utf8');

    expect(homeSource).toContain('disconnectAutoLoadObserver');
    expect(homeSource).toContain('syncAutoLoadObserver');
    expect(homeSource).toContain('shouldHomeAutoLoadMore');
    expect(homeSource).toMatch(/if\s*\(\s*loading\s*\)\s*\{\s*return;\s*\}/);
    expect(homeSource).toContain('HOME_SWIPE_AUTO_LOAD_INTERSECTION_THRESHOLD');

    expect(indexHtml).toContain('id="home-swipe-load-more"');
    expect(indexHtml).toContain('載入更多');
  });

  it('keeps /home/feed-only consumption and Phase 304 interaction helpers intact', async () => {
    const homeSource = await readFile(join(process.cwd(), HOME_JS), 'utf8');
    const homeFeedSource = await readFile(join(process.cwd(), HOME_FEED_JS), 'utf8');

    expect(homeSource).toContain('fetchHomeFeedPage');
    expect(homeSource).not.toContain('fetchExploreFeedPage');
    expect(homeSource).toContain('handleHomeSwipeStageKeydown');
    expect(homeSource).toContain('attachWholeCardNavigation');

    expect(homeFeedSource).toContain("'/home/feed'");
    expect(homeFeedSource).not.toContain("'/polls/search'");
  });

  it('links the review checkpoint doc from the repository', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    const reviewDoc = await readFile(join(process.cwd(), PHASE_305R_DOC), 'utf8');

    expect(readme).toContain(PHASE_305R_DOC);
    expect(reviewDoc).toContain('5078e66');
    expect(reviewDoc).toContain('APPROVED');
  });
});
