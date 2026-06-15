import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_291_DOC =
  'docs/www-project-phase-291-public-mvp-backlog-reprioritization-checkpoint-v1.md';
const PHASE_292_DOC =
  'docs/www-project-phase-292-public-mvp-manual-qa-follow-up-execution-record-v1.md';
const PHASE_293_DOC =
  'docs/www-project-phase-293-public-mvp-post-release-monitoring-notes-draft-v1.md';
const PHASE_294_DOC =
  'docs/www-project-phase-294-public-mvp-documentation-archive-phase-index-maintenance-v1.md';
const PHASE_295_DOC =
  'docs/www-project-phase-295-vote-page-error-ux-evaluation-plan-v1.md';
const PHASE_296_DOC =
  'docs/www-project-phase-296-public-mvp-backlog-planning-checkpoint-v1.md';

const PHASE_291_295_DOC_PATHS = [
  PHASE_291_DOC,
  PHASE_292_DOC,
  PHASE_293_DOC,
  PHASE_294_DOC,
  PHASE_295_DOC,
] as const;

describe('Phase 296 public MVP backlog planning checkpoint doc', () => {
  it('documents consolidation, status, next-phase tiers, and Phase 295 implementation gate', async () => {
    const source = await readFile(join(process.cwd(), PHASE_296_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 296');
    expect(source).toContain('Backlog Planning Checkpoint');
    expect(source).toContain('docs/tests/README only');
    expect(source).toContain('2a40205');
    expect(source).toContain(PHASE_291_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_292_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_293_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_294_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_295_DOC.replace('docs/', './'));

    for (const statusField of [
      'Launch approved for manual release preparation',
      'Operator release execution authorized',
      'Actual deployment NOT EXECUTED',
      'Formal launch NOT COMPLETED',
      'No deploy scripts added',
      'No production configuration changed',
    ]) {
      expect(source).toContain(statusField);
    }

    for (const section of [
      'Phase 291–295 Consolidation Summary',
      'backlog reprioritization checkpoint complete',
      'overall PASS',
      'post-release monitoring notes draft recorded',
      'documentation archive / phase index maintenance complete',
      'vote-page error UX evaluation plan recorded',
      'Phase 295 Implementation Gate',
      'Next-Phase Candidate Classification',
      'Not Recommended Now',
      'Topic Quick Lookup',
    ]) {
      expect(source).toContain(section);
    }

    for (const tier of [
      'Low risk — docs / index maintenance',
      'Medium risk — manual QA / a11y / fallback review',
      'High risk — vote error UX / production / release execution',
    ]) {
      expect(source).toContain(tier);
    }

    for (const notNow of [
      'Production deployment',
      'Deploy script / config change',
      'Vote-page error UX **implementation** without high-risk review',
      'Copy constants merge',
      'Analytics / metrics / APM / debug tracking',
    ]) {
      expect(source).toContain(notNow);
    }

    expect(source).toContain('plan-only — does not authorize runtime implementation');
    expect(source).toContain('separate numbered high-risk implementation phase');
    expect(source).toContain('privacy/vote-integrity review');

    for (const rule of [
      'does not execute release',
      'does not deploy',
      'does not add deploy scripts',
      'does not change production configuration',
      'eligibility-before-option-resolve',
      'option_index',
      'Raw Option Linkage Ban',
      'hidden aggregate',
      'UserAuthResolver',
      'positive_feedback',
      '回饋良好',
      'smoke:public:local',
    ]) {
      expect(source).toContain(rule);
    }

    for (const nonGoal of [
      'no runtime change',
      'no API change',
      'no frontend behavior change',
      'no migration',
      'localStorage',
      'sessionStorage',
      'design-drafts/',
    ]) {
      expect(source).toContain(nonGoal);
    }

    expect(source).toContain('Phase 297 blockers: none identified');
    expect(source).toContain(
      'phase-296-public-mvp-backlog-planning-checkpoint-doc.test.ts',
    );
    expect(source).toContain(
      'phase-296-public-mvp-backlog-planning-checkpoint.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 296');
    expect(readme).toContain(PHASE_296_DOC);
    expect(readme).toContain('Public MVP release documentation arcs (Phase 265–297)');
    expect(readme).toContain('Phase 297 blockers: none identified');
  });

  it('confirms Phase 291–295 doc paths exist with expected completion markers', async () => {
    const phase291 = await readFile(join(process.cwd(), PHASE_291_DOC), 'utf8');
    const phase292 = await readFile(join(process.cwd(), PHASE_292_DOC), 'utf8');
    const phase293 = await readFile(join(process.cwd(), PHASE_293_DOC), 'utf8');
    const phase294 = await readFile(join(process.cwd(), PHASE_294_DOC), 'utf8');
    const phase295 = await readFile(join(process.cwd(), PHASE_295_DOC), 'utf8');

    expect(phase291).toContain('backlog reprioritization checkpoint complete');
    expect(phase292).toContain('**Overall session result:** **PASS**');
    expect(phase293).toContain('monitoring notes draft');
    expect(phase294).toContain('documentation archive / phase index maintenance complete');
    expect(phase295).toContain('Vote-page error UX evaluation plan recorded');
    expect(phase295).toContain('plan-only');

    for (const relativePath of PHASE_291_295_DOC_PATHS) {
      const doc = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(doc.length, relativePath).toBeGreaterThan(0);
      expect(doc, relativePath).toContain('NOT EXECUTED');
    }
  });
});
