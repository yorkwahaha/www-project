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

describe('Phase 277 public MVP manual release pre-execution gate review doc', () => {
  it('documents gate review, prerequisite confirmations, separation rules, and conclusion', async () => {
    const source = await readFile(join(process.cwd(), PHASE_277_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 277');
    expect(source).toContain('Public MVP Manual Release Pre-Execution Gate Review');
    expect(source).toContain('pre-execution gate review');
    expect(source).toContain('e84b643');
    expect(source).toContain('Phase 273');
    expect(source).toContain('Phase 274');
    expect(source).toContain('Phase 275');
    expect(source).toContain('Phase 276');
    expect(source).toContain(PHASE_273_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_274_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_275_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_276_DOC.replace('docs/', './'));

    for (const gateArea of [
      'Phase 273 Launch Approval — Gate Check',
      'Phase 274 Operator Handoff — Gate Check',
      'Phase 275 Execution Template — Gate Check',
      'Phase 276 Execution Record — Gate Check',
      'Deployment & Configuration Separation — Gate Check',
      'Later Release Record Requirements',
      'APPROVED — Public MVP launch approved for manual release preparation',
      'operator handoff checklist',
      'release execution record template',
      'NOT EXECUTED',
      'pre-execution gate review',
      'pre-release gates',
      'separately executed and recorded',
      'no deploy scripts',
      'no production configuration',
      'separate numbered phase',
      'PG-1',
      'PG-35',
      'OR-1',
      'RE-1',
      'PS-1',
      'PR-1',
      'ER-1',
      'AB-1',
    ]) {
      expect(source).toContain(gateArea);
    }

    for (const confirmation of [
      'No deployment has been performed',
      'No deploy scripts were added',
      'No production configuration was changed',
      'Operator must run pre-release gates',
      'released commit',
      'release timestamp',
      'operator note',
      'post-release smoke result',
      'abort / rollback status',
      'incident / follow-up status',
    ]) {
      expect(source).toContain(confirmation);
    }

    expect(source).toContain(
      'APPROVED — manual release pre-execution gate review complete',
    );

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
      'no deployment performed',
    ]) {
      expect(source).toContain(nonGoal);
    }

    expect(source).toContain('Phase 278 blockers: none identified');
    expect(source).toContain(
      'phase-277-public-mvp-manual-release-pre-execution-gate-review-doc.test.ts',
    );
    expect(source).toContain(
      'phase-277-public-mvp-manual-release-pre-execution-gate-review.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 277');
    expect(readme).toContain(PHASE_277_DOC);
    expect(readme).toContain('pre-execution gate review');
    expect(readme).toContain('Phase 278 blockers: none identified');
  });

  it('confirms Phase 273-276 prerequisite docs exist with expected release arc state', async () => {
    const approval = await readFile(join(process.cwd(), PHASE_273_DOC), 'utf8');
    const handoff = await readFile(join(process.cwd(), PHASE_274_DOC), 'utf8');
    const checkpoint = await readFile(join(process.cwd(), PHASE_275_DOC), 'utf8');
    const record = await readFile(join(process.cwd(), PHASE_276_DOC), 'utf8');

    expect(approval).toContain(
      'APPROVED — Public MVP launch approved for manual release preparation',
    );
    expect(handoff).toContain('operator pre-release checklist');
    expect(checkpoint).toContain('Release Execution Record Template');
    expect(record).toContain('**Manual release execution status** | **NOT EXECUTED**');
    expect(record).toContain('does not perform deployment');
  });
});
