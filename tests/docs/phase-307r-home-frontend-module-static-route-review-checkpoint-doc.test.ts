import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_307R_DOC =
  'docs/www-project-phase-307r-home-frontend-module-static-route-review-checkpoint-v1.md';
const PHASE_307_DOC =
  'docs/www-project-phase-307-home-frontend-module-static-route-fix-v1.md';
const PHASE_306_DOC =
  'docs/www-project-phase-306-homepage-real-device-visual-review-checkpoint-v1.md';

describe('Phase 307-R home frontend module static route review checkpoint doc', () => {
  it('documents review scope, reviewed commit, conclusion, and boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_307R_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 307-R');
    expect(source).toContain('Home Frontend Module Static Route Review Checkpoint');
    expect(source).toContain('7f11604');
    expect(source).toContain('09b5535');
    expect(source).toContain(PHASE_307_DOC);
    expect(source).toContain(PHASE_306_DOC.replace('docs/', './'));

    expect(source).toContain('No runtime change');
    expect(source).toContain('APPROVED');
    expect(source).toContain('safe to build on');
    expect(source).toContain('Phase 307-R blockers: none identified');
    expect(source).toContain('not release execution');

    expect(readme).toContain('Phase 307-R');
    expect(readme).toContain(PHASE_307R_DOC);
  });

  it('records B-306-01 closure and the static-route checks the review confirmed', async () => {
    const source = await readFile(join(process.cwd(), PHASE_307R_DOC), 'utf8');

    for (const token of [
      'B-306-01',
      'FU-306-01 CLOSED',
      'FU-307-01',
      'sendPublicFile',
      '/frontend/public-mvp-home.js',
      '/frontend/home-feed.js',
      'public-poll-card.js',
      'quality-feedback-badge.js',
      'public-unavailable-state.js',
      'public-page-copy.js',
      'public-keyboard-focus-a11y.js',
      'aria-busy',
      'mountHomeSwipeFeed',
      'smoke-public-local.mjs',
      'isHomeCollectingFeedItemSafe',
      'isHomeRevealedFeedItemSafe',
      '/home/feed',
      '/polls/feed',
      'Raw Option Linkage Ban',
      'auth-state-copy.js',
      'login-state-ui.js',
      '14',
    ]) {
      expect(source, `Phase 307-R doc should mention ${token}`).toContain(token);
    }
  });

  it('records the validation gates run for the checkpoint', async () => {
    const source = await readFile(join(process.cwd(), PHASE_307R_DOC), 'utf8');
    for (const gate of [
      'git diff --check',
      'npm test',
      'npm run typecheck',
      'npm run build',
      'npm run smoke:public:local',
    ]) {
      expect(source, `Phase 307-R doc should record ${gate}`).toContain(gate);
    }

    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );
    expect(source).toContain(
      'phase-307r-home-frontend-module-static-route-review-checkpoint-doc.test.ts',
    );
    expect(source).toContain(
      'phase-307r-home-frontend-module-static-route-review-checkpoint.test.ts',
    );
  });
});
