import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_265_DOC =
  'docs/www-project-phase-265-public-mvp-launch-readiness-checklist-plan-v1.md';
const PHASE_266_DOC =
  'docs/www-project-phase-266-public-mvp-launch-readiness-checklist-checkpoint-v1.md';
const PHASE_267_DOC =
  'docs/www-project-phase-267-public-mvp-launch-readiness-runtime-review-final-checkpoint-v1.md';
const PHASE_268_DOC =
  'docs/www-project-phase-268-public-mvp-manual-qa-runbook-execution-plan-v1.md';
const PHASE_269_DOC =
  'docs/www-project-phase-269-public-mvp-manual-qa-dry-run-checklist-review-recording-template-checkpoint-v1.md';
const PHASE_270_DOC = 'docs/www-project-phase-270-public-mvp-manual-qa-execution-record-v1.md';
const PHASE_271_DOC =
  'docs/www-project-phase-271-public-mvp-manual-qa-pass-review-freeze-candidate-checkpoint-v1.md';
const PHASE_272_DOC =
  'docs/www-project-phase-272-public-mvp-launch-decision-packet-go-no-go-review-plan-v1.md';
const PHASE_273_DOC =
  'docs/www-project-phase-273-public-mvp-launch-approval-decision-record-v1.md';

describe('Phase 273 public MVP launch approval decision record doc', () => {
  it('documents launch approval decision, Go/No-Go results, limits, and conclusion', async () => {
    const source = await readFile(join(process.cwd(), PHASE_273_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 273');
    expect(source).toContain('Public MVP Launch Approval Decision Record');
    expect(source).toContain('launch approval decision record only');
    expect(source).toContain('dd76de4');
    expect(source).toContain('Phase 265');
    expect(source).toContain('Phase 266');
    expect(source).toContain('Phase 267');
    expect(source).toContain('Phase 268');
    expect(source).toContain('Phase 269');
    expect(source).toContain('Phase 270');
    expect(source).toContain('Phase 271');
    expect(source).toContain('Phase 272');
    expect(source).toContain(PHASE_272_DOC.replace('docs/', './'));

    for (const recordArea of [
      'Evidence Summary (Phase 265–272)',
      'Go evidence checklist result',
      'No-Go trigger review result',
      'Go Evidence Checklist Result',
      'No-Go Trigger Review Result',
      'freeze candidate checkpoint',
      'Go-No-Go framework',
      'completed',
      'manual release preparation',
      'APPROVED — Public MVP launch approved for manual release preparation',
      'not production deployment',
      'does not modify runtime',
      'does not change production configuration',
      'separate numbered phase',
      'no deploy scripts',
      'Deployment executed',
      'Production deployment authorization',
      '15 / 15 Confirmed',
      '12 / 12 Clear',
      'Raw Option Linkage Ban affirmation',
      'Rollback commit / tag',
      'smoke:public:local',
    ]) {
      expect(source).toContain(recordArea);
    }

    expect(source).toContain('**Overall session result: PASS**');
    expect(source).toContain('no **FAIL** / **BLOCKED** / **NEEDS FOLLOW-UP**');
    expect(source).toContain('freeze candidate checkpoint:** **ready**');

    expect(source).toContain('G-1');
    expect(source).toContain('G-15');
    expect(source).toContain('N-1');
    expect(source).toContain('N-12');

    expect(source).not.toContain('production approved');
    expect(source).not.toContain('production deployment authorized');
    expect(source).toContain('Production deployment authorization | **NO**');

    expect(source).toContain('option_index');
    expect(source).toContain('eligibility-before-option-resolve');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('positive_feedback');
    expect(source).toContain('回饋良好');
    expect(source).toContain('does not call `GET /users/me` after success');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('UserAuthResolver');

    for (const nonGoal of [
      'no runtime change',
      'no API change',
      'no frontend behavior change',
      'no migration',
      'no schema change',
      'localStorage',
      'sessionStorage',
      'analytics / metrics / APM / debug tracking',
      'design-drafts/',
      'no deployment performed',
    ]) {
      expect(source).toContain(nonGoal);
    }

    expect(source).toContain('Phase 274 blockers: none identified');
    expect(source).toContain('phase-273-public-mvp-launch-approval-decision-record-doc.test.ts');
    expect(source).toContain('phase-273-public-mvp-launch-approval-decision-record.test.ts');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 273');
    expect(readme).toContain(PHASE_273_DOC);
    expect(readme).toContain('launch approval decision record');
    expect(readme).toContain('manual release preparation');
    expect(readme).toContain('Phase 274 blockers: none identified');
  });

  it('confirms Phase 265-272 prerequisite docs exist', async () => {
    const plan272 = await readFile(join(process.cwd(), PHASE_272_DOC), 'utf8');
    const record270 = await readFile(join(process.cwd(), PHASE_270_DOC), 'utf8');
    const review271 = await readFile(join(process.cwd(), PHASE_271_DOC), 'utf8');

    expect(plan272).toContain('Go/No-Go Review Framework');
    expect(record270).toContain('**Overall session result:** **PASS**');
    expect(review271).toContain('freeze candidate checkpoint complete');

    for (const doc of [
      PHASE_265_DOC,
      PHASE_266_DOC,
      PHASE_267_DOC,
      PHASE_268_DOC,
      PHASE_269_DOC,
    ]) {
      const content = await readFile(join(process.cwd(), doc), 'utf8');
      expect(content.length).toBeGreaterThan(100);
    }
  });
});
