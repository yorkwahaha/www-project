import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_312_DOC =
  'docs/www-project-phase-312-public-mvp-release-readiness-checkpoint-v1.md';
const PHASE_301_GATE_DOC =
  'docs/www-project-phase-301-final-pre-release-gate-checklist-v1.md';
const PHASE_280_DOC =
  'docs/www-project-phase-280-public-mvp-release-authorization-not-executed-status-final-checkpoint-v1.md';
const PHASE_308_DOC =
  'docs/www-project-phase-308-hydrated-homepage-visual-review-checkpoint-v1.md';
const PHASE_311R_DOC =
  'docs/www-project-phase-311r-results-reveal-browser-review-final-checkpoint-v1.md';

describe('Phase 312 public MVP release readiness checkpoint doc', () => {
  it('documents checkpoint scope, reviewed commit, conclusion, and boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_312_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 312');
    expect(source).toContain('Public MVP Release Readiness Checkpoint');
    expect(source).toContain('528ed3c');
    expect(source).toContain(PHASE_301_GATE_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_280_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_308_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_311R_DOC.replace('docs/', './'));

    expect(source).toContain('No runtime change');
    expect(source).toContain('APPROVED for release/deployment planning');
    expect(source).toContain('release candidate');
    expect(source).toContain('Phase 312 blockers: none identified');
    expect(source).toContain('This phase does not deploy');
    expect(source).toContain('not release execution');

    expect(readme).toContain('Phase 312');
    expect(readme).toContain(PHASE_312_DOC);
  });

  it('records release readiness focus areas and non-blocking observations', async () => {
    const source = await readFile(join(process.cwd(), PHASE_312_DOC), 'utf8');

    for (const token of [
      'homepage mixed-feed MVP',
      'Results reveal animation line closed',
      'static frontend module route',
      'public-mvp-home.js',
      'home-feed.js',
      'auth-state-copy.js',
      'public-results-detail-layout.js',
      'collecting',
      'cancelled',
      'unpublished',
      'revealed',
      'locked',
      'post_lock',
      'display-safe',
      'Raw Option Linkage Ban',
      'Official Vote transaction order',
      'eligibility-before-option-resolve',
      'option_index',
      'Registration does not auto-login',
      'Set-Cookie',
      '/users/me',
      'birth_year_month',
      'residential_region',
      'OBS-311-01',
      'EADDRINUSE',
      '3011',
      '3012',
      '3456',
      '3457',
      'NOT EXECUTED',
      'NOT COMPLETED',
      'migrate:check',
      'smoke:public:local',
      '/home/feed',
      '/polls/feed',
      'FU-304-02',
    ]) {
      expect(source, `Phase 312 doc should mention ${token}`).toContain(token);
    }

    for (const section of [
      'Checkpoint session metadata',
      'Pre-checkpoint automated gates',
      'Release readiness checklist',
      'Homepage mixed-feed MVP gates',
      'Results reveal animation gates',
      'Known non-blocking observations',
      'Agent self-check',
    ]) {
      expect(source, `Phase 312 doc should contain section ${section}`).toContain(
        section,
      );
    }
  });

  it('records the validation gates run for the checkpoint', async () => {
    const source = await readFile(join(process.cwd(), PHASE_312_DOC), 'utf8');
    for (const gate of [
      'git diff --check',
      'npm test',
      'npm run typecheck',
      'npm run build',
      'npm run migrate:check',
      'npm run smoke:public:local',
    ]) {
      expect(source, `Phase 312 doc should record ${gate}`).toContain(gate);
    }

    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );
    expect(source).toContain(
      'phase-312-public-mvp-release-readiness-checkpoint-doc.test.ts',
    );
    expect(source).toContain(
      'phase-312-public-mvp-release-readiness-checkpoint.test.ts',
    );
  });
});
