import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_310R_DOC =
  'docs/www-project-phase-310r-site-chrome-results-module-route-review-checkpoint-v1.md';
const PHASE_310_DOC =
  'docs/www-project-phase-310-site-chrome-frontend-module-static-route-fix-v1.md';
const PHASE_309_DOC =
  'docs/www-project-phase-309-results-reveal-animation-v1.md';
const PHASE_307R_DOC =
  'docs/www-project-phase-307r-home-frontend-module-static-route-review-checkpoint-v1.md';

describe('Phase 310-R site chrome results module route review checkpoint doc', () => {
  it('documents review scope, reviewed commit, conclusion, and boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_310R_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 310-R');
    expect(source).toContain('Site Chrome and Results Module Static Route Review Checkpoint');
    expect(source).toContain('be6b83a');
    expect(source).toContain('328becf');
    expect(source).toContain(PHASE_310_DOC);
    expect(source).toContain(PHASE_309_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_307R_DOC.replace('docs/', './'));

    expect(source).toContain('No runtime change');
    expect(source).toContain('APPROVED');
    expect(source).toContain('safe to build on');
    expect(source).toContain('Phase 310-R blockers: none identified');
    expect(source).toContain('not release execution');

    expect(readme).toContain('Phase 310-R');
    expect(readme).toContain(PHASE_310R_DOC);
  });

  it('records FU-307-01 closure and the static-route checks the review confirmed', async () => {
    const source = await readFile(join(process.cwd(), PHASE_310R_DOC), 'utf8');

    for (const token of [
      'FU-307-01 CLOSED',
      'sendPublicFile',
      '/frontend/auth-state-copy.js',
      '/frontend/login-state-ui.js',
      '/frontend/login-state-read.js',
      '/frontend/login-state-logout.js',
      'public-results-detail-layout.js',
      'public-vote-detail-layout.js',
      'poll-lifecycle-controls.js',
      'creator-flow-copy.js',
      '/results/demo?ui_state=revealed',
      '載入結果中',
      'Phase 309 reveal',
      'mountHomeSwipeFeed',
      'isHomeCollectingFeedItemSafe',
      'isHomeRevealedFeedItemSafe',
      '/home/feed',
      '/polls/feed',
      'Raw Option Linkage Ban',
      '3456',
      '3457',
      'EADDRINUSE',
      'smoke-public-local.mjs',
      '14',
    ]) {
      expect(source, `Phase 310-R doc should mention ${token}`).toContain(token);
    }
  });

  it('records the validation gates run for the checkpoint', async () => {
    const source = await readFile(join(process.cwd(), PHASE_310R_DOC), 'utf8');
    for (const gate of [
      'git diff --check',
      'npm test',
      'npm run typecheck',
      'npm run build',
      'npm run smoke:public:local',
    ]) {
      expect(source, `Phase 310-R doc should record ${gate}`).toContain(gate);
    }

    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );
    expect(source).toContain(
      'phase-310r-site-chrome-results-module-route-review-checkpoint-doc.test.ts',
    );
    expect(source).toContain(
      'phase-310r-site-chrome-results-module-route-review-checkpoint.test.ts',
    );
  });
});
