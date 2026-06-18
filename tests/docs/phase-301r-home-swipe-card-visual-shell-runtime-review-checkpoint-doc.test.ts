import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_301R_DOC =
  'docs/www-project-phase-301r-home-swipe-card-visual-shell-runtime-review-checkpoint-v1.md';
const PHASE_301_DOC =
  'docs/www-project-phase-301-home-swipe-card-visual-shell-v1.md';

describe('Phase 301-R home swipe card visual shell runtime review checkpoint doc', () => {
  it('documents review scope, reviewed commit, conclusion, and boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_301R_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    // Identity + provenance.
    expect(source).toContain('Phase 301-R');
    expect(source).toContain('Home Swipe Card Visual Shell Runtime Review Checkpoint');
    expect(source).toContain('57f023e');
    expect(source).toContain('3c41667');
    expect(source).toContain(PHASE_301_DOC);

    // Review-only posture + approval.
    expect(source).toContain('No runtime change');
    expect(source).toContain('APPROVED');
    expect(source).toContain('Phase 301-R blockers: none identified');
    expect(source).toContain('not release execution');

    // Reviewed surfaces + boundary tokens.
    for (const token of [
      'public/index.html',
      'public-mvp-home.js',
      'public-mvp.css',
      'scripts/smoke-public-local.mjs',
      'data-home-swipe-feed="collecting-only"',
      'isHomeSwipeFeedItemSafe',
      'isExploreFeedItemSafe',
      'fetchExploreFeedPage',
      '/polls/feed',
      'prefers-reduced-motion',
      '13 skipped',
      'stash@{0}',
      'design-drafts/',
      'quality_badge',
      'vote-by-index',
    ]) {
      expect(source, `Phase 301-R doc should mention ${token}`).toContain(token);
    }

    // README index references the checkpoint.
    expect(readme).toContain('Phase 301-R');
    expect(readme).toContain(PHASE_301R_DOC);
  });

  it('records the validation gates run for the checkpoint', async () => {
    const source = await readFile(join(process.cwd(), PHASE_301R_DOC), 'utf8');

    for (const gate of [
      'git diff --check',
      'npm test',
      'npm run typecheck',
      'npm run build',
      'npm run smoke:public:local',
    ]) {
      expect(source, `Phase 301-R doc should record ${gate}`).toContain(gate);
    }
  });
});
