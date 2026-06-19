import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_311R_DOC =
  'docs/www-project-phase-311r-results-reveal-browser-review-final-checkpoint-v1.md';
const PHASE_311_DOC =
  'docs/www-project-phase-311-results-reveal-animation-browser-visual-review-checkpoint-v1.md';
const PHASE_309_DOC =
  'docs/www-project-phase-309-results-reveal-animation-v1.md';
const PHASE_310_DOC =
  'docs/www-project-phase-310-site-chrome-frontend-module-static-route-fix-v1.md';
const PHASE_310R_DOC =
  'docs/www-project-phase-310r-site-chrome-results-module-route-review-checkpoint-v1.md';

describe('Phase 311-R results reveal browser review final checkpoint doc', () => {
  it('documents review scope, reviewed commit, conclusion, and boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_311R_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 311-R');
    expect(source).toContain('Results Reveal Animation Browser Review Final Checkpoint');
    expect(source).toContain('cfee183');
    expect(source).toContain('FU-304-02');
    expect(source).toContain(PHASE_309_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_310_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_310R_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_311_DOC.replace('docs/', './'));

    expect(source).toContain('No runtime change');
    expect(source).toContain('APPROVED');
    expect(source).toContain('results reveal animation line closed');
    expect(source).toContain('Phase 311-R blockers: none identified');
    expect(source).toContain('not release execution');

    expect(readme).toContain('Phase 311-R');
    expect(readme).toContain(PHASE_311R_DOC);
  });

  it('records closure review focus areas and deferred observations', async () => {
    const source = await readFile(join(process.cwd(), PHASE_311R_DOC), 'utf8');

    for (const token of [
      '375',
      '768',
      '1280',
      'collecting',
      'cancelled',
      'unpublished',
      'unavailable',
      'results-aggregate-reveal',
      'data-results-reveal-ready',
      'prefers-reduced-motion',
      'shouldApplyResultsAggregateReveal',
      'syncResultsAggregateRevealPresentation',
      'resolveResultRenderMode',
      'OBS-311-01',
      'NON-BLOCKING',
      'deferred',
      '3011',
      '3012',
      'demo:public:local',
      '已載入問卷卡片',
      'Raw Option Linkage Ban',
      'homepage hydration carry-forward',
      'skip-link',
    ]) {
      expect(source, `Phase 311-R doc should mention ${token}`).toContain(token);
    }

    for (const section of [
      'Review session metadata',
      'Pre-review automated gates',
      'Phase 311 browser review sufficiency',
      'Reduced-motion and keyboard/focus',
      'Homepage hydration carry-forward',
      'Agent self-check',
    ]) {
      expect(source, `Phase 311-R doc should contain section ${section}`).toContain(
        section,
      );
    }
  });

  it('records the validation gates run for the checkpoint', async () => {
    const source = await readFile(join(process.cwd(), PHASE_311R_DOC), 'utf8');
    for (const gate of [
      'git diff --check',
      'npm test',
      'npm run typecheck',
      'npm run build',
      'npm run smoke:public:local',
    ]) {
      expect(source, `Phase 311-R doc should record ${gate}`).toContain(gate);
    }

    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );
    expect(source).toContain(
      'phase-311r-results-reveal-browser-review-final-checkpoint-doc.test.ts',
    );
    expect(source).toContain(
      'phase-311r-results-reveal-browser-review-final-checkpoint.test.ts',
    );
  });
});
