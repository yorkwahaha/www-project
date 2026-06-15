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

describe('Phase 272 public MVP launch decision packet go no-go review plan doc', () => {
  it('documents decision packet, Go/No-Go framework, readiness evidence, and non-approval rules', async () => {
    const source = await readFile(join(process.cwd(), PHASE_272_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 272');
    expect(source).toContain('Public MVP Launch Decision Packet / Go-No-Go Review Plan');
    expect(source).toContain('plan only');
    expect(source).toContain('5255b59');
    expect(source).toContain('Phase 265');
    expect(source).toContain('Phase 266');
    expect(source).toContain('Phase 267');
    expect(source).toContain('Phase 268');
    expect(source).toContain('Phase 269');
    expect(source).toContain('Phase 270');
    expect(source).toContain('Phase 271');
    expect(source).toContain(PHASE_265_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_266_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_267_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_268_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_269_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_270_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_271_DOC.replace('docs/', './'));

    for (const route of [
      '/',
      '/explore',
      '/faq',
      '/trust-levels',
      '/registration',
      '/login',
      '/profile',
      '/vote',
      '/results',
      '/my-polls',
      '/polls/new',
    ]) {
      expect(source).toContain(route);
    }

    for (const packetArea of [
      'Launch Decision Packet',
      'Go/No-Go Review Framework',
      'launch readiness checklist plan',
      'readiness checklist checkpoint',
      'final readiness checkpoint',
      'manual QA runbook / execution plan',
      'dry-run checklist review',
      'recording template checkpoint',
      'manual QA pass record',
      'freeze candidate checkpoint',
      'ready for manual QA / freeze candidate',
      'Go evidence checklist',
      'No-Go triggers',
      'Required launch approval fields',
      'Required rollback / follow-up note fields',
      'separate numbered phase',
      'separate explicit phase',
      'not launch approval',
      'not production approval',
      'The project is not launched',
      'Production is not approved',
      'privacy drift identified',
      'Manual QA pass recorded',
      'Overall session result:** **PASS',
      'FAIL items:** none',
      'BLOCKED items:** none',
      'NEEDS FOLLOW-UP items:** none',
      'smoke:public:local',
    ]) {
      expect(source).toContain(packetArea);
    }

    expect(source).toContain('G-1');
    expect(source).toContain('N-1');
    expect(source).toContain('Launch approval ID');
    expect(source).toContain('Rollback commit / tag');
    expect(source).not.toContain('launch approved');
    expect(source).not.toContain('production approved');
    expect(source).toContain('The project is not launched');
    expect(source).toContain('Project launched | **NO**');

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
    ]) {
      expect(source).toContain(nonGoal);
    }

    expect(source).toContain('Phase 273 blockers: none identified');
    expect(source).toContain(
      'phase-272-public-mvp-launch-decision-packet-go-no-go-review-plan-doc.test.ts',
    );
    expect(source).toContain(
      'phase-272-public-mvp-launch-decision-packet-go-no-go-review-plan.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(source).toContain('Phase 272 is plan-only');

    expect(readme).toContain('Phase 272');
    expect(readme).toContain(PHASE_272_DOC);
    expect(readme).toContain('launch decision packet');
    expect(readme).toContain('Go-No-Go');
    expect(readme).toContain('ready for manual QA / freeze candidate');
    expect(readme).toContain('Phase 273 blockers: none identified');
  });

  it('confirms Phase 265-271 prerequisite docs exist', async () => {
    const plan265 = await readFile(join(process.cwd(), PHASE_265_DOC), 'utf8');
    const checkpoint266 = await readFile(join(process.cwd(), PHASE_266_DOC), 'utf8');
    const final267 = await readFile(join(process.cwd(), PHASE_267_DOC), 'utf8');
    const runbook268 = await readFile(join(process.cwd(), PHASE_268_DOC), 'utf8');
    const template269 = await readFile(join(process.cwd(), PHASE_269_DOC), 'utf8');
    const record270 = await readFile(join(process.cwd(), PHASE_270_DOC), 'utf8');
    const review271 = await readFile(join(process.cwd(), PHASE_271_DOC), 'utf8');

    expect(plan265).toContain('Launch Readiness Checklist Plan');
    expect(checkpoint266).toContain('readiness checklist established');
    expect(final267).toContain('launch readiness final checkpoint complete');
    expect(runbook268).toContain('Manual QA Runbook');
    expect(template269).toContain('Dry Run Recording Template');
    expect(record270).toContain('**Overall session result:** **PASS**');
    expect(review271).toContain('freeze candidate checkpoint complete');
  });
});
