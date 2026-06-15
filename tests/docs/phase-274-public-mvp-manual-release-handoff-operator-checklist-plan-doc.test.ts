import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_268_DOC =
  'docs/www-project-phase-268-public-mvp-manual-qa-runbook-execution-plan-v1.md';
const PHASE_273_DOC =
  'docs/www-project-phase-273-public-mvp-launch-approval-decision-record-v1.md';
const PHASE_274_DOC =
  'docs/www-project-phase-274-public-mvp-manual-release-handoff-operator-checklist-plan-v1.md';

describe('Phase 274 public MVP manual release handoff operator checklist plan doc', () => {
  it('documents handoff plan, operator checklists, placeholders, and separation rules', async () => {
    const source = await readFile(join(process.cwd(), PHASE_274_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 274');
    expect(source).toContain('Public MVP Manual Release Handoff / Operator Checklist Plan');
    expect(source).toContain('plan only');
    expect(source).toContain('0fee2f0');
    expect(source).toContain('Phase 273');
    expect(source).toContain(PHASE_273_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_268_DOC.replace('docs/', './'));

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

    for (const handoffArea of [
      'Phase 273 Approval Summary',
      'APPROVED — Public MVP launch approved for manual release preparation',
      'does not perform deployment',
      'operator pre-release checklist',
      'environment readiness checklist',
      'required pre-release validation commands',
      'manual release execution checklist placeholder',
      'post-release smoke checklist placeholder',
      'abort / rollback trigger checklist',
      'Incident / Follow-Up Recording Template',
      'separately executed and recorded',
      'separate numbered phase',
      'no deploy scripts',
      'does not change production configuration',
      'does not modify runtime',
      'PR-1',
      'ER-1',
      'RE-1',
      'PS-1',
      'AB-1',
      'smoke:public:local',
      'migrate:check',
      'test:integration:local',
    ]) {
      expect(source).toContain(handoffArea);
    }

    expect(source).toContain('Phase 274 is plan-only');
    expect(source).toContain('no deployment performed');

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

    expect(source).toContain('Phase 275 blockers: none identified');
    expect(source).toContain(
      'phase-274-public-mvp-manual-release-handoff-operator-checklist-plan-doc.test.ts',
    );
    expect(source).toContain(
      'phase-274-public-mvp-manual-release-handoff-operator-checklist-plan.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 274');
    expect(readme).toContain(PHASE_274_DOC);
    expect(readme).toContain('manual release handoff');
    expect(readme).toContain('operator checklist');
    expect(readme).toContain('Phase 275 blockers: none identified');
  });

  it('confirms Phase 273 approval record exists as prerequisite', async () => {
    const approval = await readFile(join(process.cwd(), PHASE_273_DOC), 'utf8');
    expect(approval).toContain(
      'APPROVED — Public MVP launch approved for manual release preparation',
    );
    expect(approval).toContain('Deployment / handoff / operator steps require a separate numbered phase');
  });
});
