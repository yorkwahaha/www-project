import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_306_DOC =
  'docs/www-project-phase-306-homepage-real-device-visual-review-checkpoint-v1.md';
const PHASE_305R_DOC =
  'docs/www-project-phase-305r-home-feed-auto-paging-review-checkpoint-v1.md';
const PHASE_301R_DOC =
  'docs/www-project-phase-301r-home-swipe-card-visual-shell-runtime-review-checkpoint-v1.md';
const PHASE_303R_DOC =
  'docs/www-project-phase-303r-public-home-mixed-feed-runtime-privacy-review-checkpoint-v1.md';

describe('Phase 306 homepage real-device visual review checkpoint doc', () => {
  it('documents review scope, reviewed commit, conclusion, and boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_306_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 306');
    expect(source).toContain('Homepage Real-Device Visual Review Checkpoint');
    expect(source).toContain('510d8e7');
    expect(source).toContain(PHASE_305R_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_301R_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_303R_DOC.replace('docs/', './'));

    expect(source).toContain('No runtime change');
    expect(source).toContain('NEEDS FOLLOW-UP');
    expect(source).toContain('B-306-01');
    expect(source).toContain('FU-306-01');
    expect(source).toContain('not release execution');

    expect(readme).toContain('Phase 306');
    expect(readme).toContain(PHASE_306_DOC);
  });

  it('records the visual review focus areas and viewport checks', async () => {
    const source = await readFile(join(process.cwd(), PHASE_306_DOC), 'utf8');

    for (const token of [
      '375',
      '768',
      '1280',
      'Shorts/Reels',
      'macaron',
      'home-swipe-card--revealed',
      'mvp-badge-collecting',
      'mvp-badge-revealed',
      '收集中',
      '看完整結果',
      '載入更多',
      'home-swipe-load-more',
      'IntersectionObserver',
      'prefers-reduced-motion',
      'handleHomeSwipeStageKeydown',
      'fetchHomeFeedPage',
      'home-feed.js',
      'public-mvp-home.js',
      '/home/feed',
      'Raw Option Linkage Ban',
      'demo:public:local',
      'design-drafts/',
      '.tmp-chrome-home-desktop/',
    ]) {
      expect(source, `Phase 306 doc should mention ${token}`).toContain(token);
    }

    for (const section of [
      'Review session metadata',
      'Pre-review automated gates',
      'Runtime visual spot-check',
      'Static / module visual invariant review',
      'Session summary',
      'Agent self-check',
    ]) {
      expect(source, `Phase 306 doc should contain section ${section}`).toContain(
        section,
      );
    }
  });

  it('records the validation gates run for the checkpoint', async () => {
    const source = await readFile(join(process.cwd(), PHASE_306_DOC), 'utf8');
    for (const gate of [
      'git diff --check',
      'npm test',
      'npm run typecheck',
      'npm run build',
      'npm run smoke:public:local',
    ]) {
      expect(source, `Phase 306 doc should record ${gate}`).toContain(gate);
    }

    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );
    expect(source).toContain(
      'phase-306-homepage-real-device-visual-review-checkpoint-doc.test.ts',
    );
    expect(source).toContain(
      'phase-306-homepage-real-device-visual-review-checkpoint.test.ts',
    );
  });
});
