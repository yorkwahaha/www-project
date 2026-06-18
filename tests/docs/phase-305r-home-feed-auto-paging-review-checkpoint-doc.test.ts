import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_305R_DOC =
  'docs/www-project-phase-305r-home-feed-auto-paging-review-checkpoint-v1.md';
const PHASE_305_DOC =
  'docs/www-project-phase-305-home-feed-auto-paging-polish-v1.md';

describe('Phase 305-R home feed auto paging review checkpoint doc', () => {
  it('documents review scope, reviewed commit, conclusion, and boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_305R_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 305-R');
    expect(source).toContain('Home Feed Auto Paging Review Checkpoint');
    expect(source).toContain('5078e66');
    expect(source).toContain('f783fc4');
    expect(source).toContain(PHASE_305_DOC);

    expect(source).toContain('No runtime change');
    expect(source).toContain('APPROVED');
    expect(source).toContain('safe to build on');
    expect(source).toContain('Phase 305-R blockers: none identified');
    expect(source).toContain('not release execution');

    expect(readme).toContain('Phase 305-R');
    expect(readme).toContain(PHASE_305R_DOC);
  });

  it('records the auto-paging and privacy checks the review confirmed', async () => {
    const source = await readFile(join(process.cwd(), PHASE_305R_DOC), 'utf8');

    for (const token of [
      'IntersectionObserver',
      'shouldHomeAutoLoadMore',
      'disconnectAutoLoadObserver',
      'syncAutoLoadObserver',
      'fetchHomeFeedPage',
      'home-feed.js',
      '/home/feed',
      '/polls/feed',
      '載入更多',
      'home-swipe-load-more',
      'isHomeCollectingFeedItemSafe',
      'isHomeRevealedFeedItemSafe',
      'Raw Option Linkage Ban',
      'handleHomeSwipeStageKeydown',
      'prefers-reduced-motion',
      'Phase 301',
      'Phase 303',
      'Phase 304',
      '14',
    ]) {
      expect(source, `Phase 305-R doc should mention ${token}`).toContain(token);
    }

    for (const token of [
      'option_id',
      'option_index',
      'vote_count',
      'user_id',
      'session',
      'request_id',
      'device',
      'trace',
    ]) {
      expect(source, `Phase 305-R doc should cover forbidden field ${token}`).toContain(token);
    }
  });

  it('records the validation gates run for the checkpoint', async () => {
    const source = await readFile(join(process.cwd(), PHASE_305R_DOC), 'utf8');
    for (const gate of [
      'git diff --check',
      'npm test',
      'npm run typecheck',
      'npm run build',
      'npm run smoke:public:local',
    ]) {
      expect(source, `Phase 305-R doc should record ${gate}`).toContain(gate);
    }
  });
});
