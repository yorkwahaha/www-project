import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_273_DOC =
  'docs/www-project-phase-273-public-mvp-launch-approval-decision-record-v1.md';
const PHASE_274_DOC =
  'docs/www-project-phase-274-public-mvp-manual-release-handoff-operator-checklist-plan-v1.md';
const PHASE_275_DOC =
  'docs/www-project-phase-275-public-mvp-release-execution-record-template-final-operator-readiness-checkpoint-v1.md';
const PHASE_276_DOC =
  'docs/www-project-phase-276-public-mvp-manual-release-execution-record-v1.md';
const PHASE_277_DOC =
  'docs/www-project-phase-277-public-mvp-manual-release-pre-execution-gate-review-v1.md';
const PHASE_278_DOC =
  'docs/www-project-phase-278-public-mvp-manual-release-execution-authorization-record-v1.md';
const PHASE_279_DOC =
  'docs/www-project-phase-279-public-mvp-manual-release-execution-record-operator-result-v1.md';
const PHASE_280_DOC =
  'docs/www-project-phase-280-public-mvp-release-authorization-not-executed-status-final-checkpoint-v1.md';

describe('Phase 280 public MVP release authorization not-executed status final checkpoint doc', () => {
  it('documents final checkpoint, arc summary, status, separation rules, and non-claims', async () => {
    const source = await readFile(join(process.cwd(), PHASE_280_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 280');
    expect(source).toContain(
      'Public MVP Release Authorization / Not-Executed Status Final Checkpoint',
    );
    expect(source).toContain('release authorization / not-executed status final checkpoint');
    expect(source).toContain('274369f');
    expect(source).toContain('Phase 273');
    expect(source).toContain('Phase 274');
    expect(source).toContain('Phase 275');
    expect(source).toContain('Phase 276');
    expect(source).toContain('Phase 277');
    expect(source).toContain('Phase 278');
    expect(source).toContain('Phase 279');
    expect(source).toContain(PHASE_273_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_274_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_275_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_276_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_277_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_278_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_279_DOC.replace('docs/', './'));

    for (const arcItem of [
      'Phase 273–279 Arc Summary',
      'Final Release Status',
      'APPROVED — Public MVP launch approved for manual release preparation',
      'manual release handoff / operator checklist prepared',
      'release execution templates and final operator readiness checkpoint completed',
      'release execution status recorded as NOT EXECUTED',
      'manual release pre-execution gate review APPROVED',
      'operator manual release execution AUTHORIZED',
      'operator release execution result recorded as NOT EXECUTED',
      'Launch approved for manual release preparation',
      'Operator release execution authorized',
      'Actual deployment NOT EXECUTED',
      'operator handoff checklist',
      'release execution record template',
      'pre-execution gate review',
    ]) {
      expect(source).toContain(arcItem);
    }

    for (const requiredStatement of [
      'do not state that the project has launched',
      'do not state that production deployment has happened',
      'do not state that production configuration was changed',
      'separately executed and recorded',
      'post-release smoke must be recorded',
      'abort / rollback / incident / follow-up must be recorded if triggered',
      'separate numbered phase',
      'no deploy scripts',
      'no production configuration changed',
      'no deployment performed',
    ]) {
      expect(source).toContain(requiredStatement);
    }

    expect(source).toContain(
      'APPROVED — release authorization / not-executed status final checkpoint complete',
    );
    expect(source).toContain('The project has not launched');
    expect(source).toContain('Production deployment has not happened');
    expect(source).toContain('Production configuration was not changed');

    for (const route of [
      '/',
      '/explore',
      '/registration',
      '/login',
      '/profile',
      '/vote',
      '/results',
      '/my-polls',
    ]) {
      expect(source).toContain(route);
    }

    expect(source).toContain('option_index');
    expect(source).toContain('eligibility-before-option-resolve');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('positive_feedback');
    expect(source).toContain('回饋良好');
    expect(source).toContain('does not call `GET /users/me` after success');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('migrate:check');

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

    expect(source).toContain('Phase 281 blockers: none identified');
    expect(source).toContain(
      'phase-280-public-mvp-release-authorization-not-executed-status-final-checkpoint-doc.test.ts',
    );
    expect(source).toContain(
      'phase-280-public-mvp-release-authorization-not-executed-status-final-checkpoint.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 280');
    expect(readme).toContain(PHASE_280_DOC);
    expect(readme).toContain('final checkpoint');
    expect(readme).toContain('NOT EXECUTED');
    expect(readme).toContain('Phase 281 blockers: none identified');
  });

  it('confirms Phase 273-279 prerequisite docs exist with expected release arc state', async () => {
    const approval = await readFile(join(process.cwd(), PHASE_273_DOC), 'utf8');
    const handoff = await readFile(join(process.cwd(), PHASE_274_DOC), 'utf8');
    const checkpoint275 = await readFile(join(process.cwd(), PHASE_275_DOC), 'utf8');
    const record276 = await readFile(join(process.cwd(), PHASE_276_DOC), 'utf8');
    const review277 = await readFile(join(process.cwd(), PHASE_277_DOC), 'utf8');
    const authorization278 = await readFile(join(process.cwd(), PHASE_278_DOC), 'utf8');
    const result279 = await readFile(join(process.cwd(), PHASE_279_DOC), 'utf8');

    expect(approval).toContain(
      'APPROVED — Public MVP launch approved for manual release preparation',
    );
    expect(handoff).toContain('operator pre-release checklist');
    expect(checkpoint275).toContain('Release Execution Record Template');
    expect(record276).toContain('**Manual release execution status** | **NOT EXECUTED**');
    expect(review277).toContain(
      'APPROVED — manual release pre-execution gate review complete',
    );
    expect(authorization278).toContain('AUTHORIZED');
    expect(result279).toContain('**Manual release execution result** | **NOT EXECUTED**');
  });
});
