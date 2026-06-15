import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_273_DOC =
  'docs/www-project-phase-273-public-mvp-launch-approval-decision-record-v1.md';
const PHASE_274_DOC =
  'docs/www-project-phase-274-public-mvp-manual-release-handoff-operator-checklist-plan-v1.md';
const PHASE_275_DOC =
  'docs/www-project-phase-275-public-mvp-release-execution-record-template-final-operator-readiness-checkpoint-v1.md';

describe('Phase 275 public MVP release execution record template final operator readiness checkpoint doc', () => {
  it('documents templates, final readiness checklist, summaries, and separation rules', async () => {
    const source = await readFile(join(process.cwd(), PHASE_275_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 275');
    expect(source).toContain(
      'Public MVP Release Execution Record Template / Final Operator Readiness Checkpoint',
    );
    expect(source).toContain('final operator readiness checkpoint');
    expect(source).toContain('9755810');
    expect(source).toContain('Phase 273');
    expect(source).toContain('Phase 274');
    expect(source).toContain(PHASE_273_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_274_DOC.replace('docs/', './'));

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

    for (const templateArea of [
      'Phase 273 Approval Summary',
      'Phase 274 Operator Handoff Summary',
      'APPROVED — Public MVP launch approved for manual release preparation',
      'final operator readiness checklist',
      'release execution record template',
      'post-release smoke result template',
      'abort / rollback decision record template',
      'incident / follow-up phase template',
      'separately executed and recorded',
      'does not perform deployment',
      'does not modify production configuration',
      'separate numbered phase',
      'no deploy scripts',
      'no deployment performed',
      'Final Operator Readiness Checklist',
      'Release Execution Record Template',
      'Post-Release Smoke Result Template',
      'Abort / Rollback Decision Record Template',
      'Incident / Follow-Up Phase Template',
      'OR-1',
      'RE-1',
      'PS-1',
      'smoke:public:local',
      'migrate:check',
    ]) {
      expect(source).toContain(templateArea);
    }

    expect(source).toContain(
      'APPROVED — release execution record template / final operator readiness checkpoint complete',
    );
    expect(source).toContain('Any actual deployment must be separately executed and recorded');

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

    expect(source).toContain('Phase 276 blockers: none identified');
    expect(source).toContain(
      'phase-275-public-mvp-release-execution-record-template-final-operator-readiness-checkpoint-doc.test.ts',
    );
    expect(source).toContain(
      'phase-275-public-mvp-release-execution-record-template-final-operator-readiness-checkpoint.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 275');
    expect(readme).toContain(PHASE_275_DOC);
    expect(readme).toContain('release execution record template');
    expect(readme).toContain('final operator readiness checkpoint');
    expect(readme).toContain('Phase 276 blockers: none identified');
  });

  it('confirms Phase 273-274 prerequisite docs exist', async () => {
    const approval = await readFile(join(process.cwd(), PHASE_273_DOC), 'utf8');
    const handoff = await readFile(join(process.cwd(), PHASE_274_DOC), 'utf8');

    expect(approval).toContain(
      'APPROVED — Public MVP launch approved for manual release preparation',
    );
    expect(handoff).toContain('does not perform deployment');
    expect(handoff).toContain('separately executed and recorded');
  });
});
