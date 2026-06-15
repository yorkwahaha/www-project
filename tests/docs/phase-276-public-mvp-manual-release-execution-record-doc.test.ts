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

describe('Phase 276 public MVP manual release execution record doc', () => {
  it('documents execution status, summaries, separation rules, and NOT EXECUTED default', async () => {
    const source = await readFile(join(process.cwd(), PHASE_276_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 276');
    expect(source).toContain('Public MVP Manual Release Execution Record');
    expect(source).toContain('manual release execution record');
    expect(source).toContain('fd4adf7');
    expect(source).toContain('Phase 273');
    expect(source).toContain('Phase 274');
    expect(source).toContain('Phase 275');
    expect(source).toContain(PHASE_273_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_274_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_275_DOC.replace('docs/', './'));

    for (const summaryArea of [
      'Phase 273 Approval Summary',
      'Phase 274 Operator Handoff Summary',
      'Phase 275 Execution Template / Final Operator Readiness Summary',
      'APPROVED — Public MVP launch approved for manual release preparation',
      'APPROVED — templates ready; deployment not executed in Phase 275',
      'final operator readiness checklist',
      'release execution record template',
      'post-release smoke result template',
      'abort / rollback decision record template',
      'incident / follow-up phase template',
    ]) {
      expect(source).toContain(summaryArea);
    }

    for (const statusField of [
      'Manual Release Execution Status',
      'NOT EXECUTED',
      'EXECUTED',
      'release timestamp',
      'released commit',
      'operator note',
      'post-release smoke result',
      'abort / rollback status',
      'incident / follow-up status',
      'reason',
      'next required step',
    ]) {
      expect(source).toContain(statusField);
    }

    expect(source).toContain('**Manual release execution status** | **NOT EXECUTED**');
    expect(source).toContain('Manual release execution status: NOT EXECUTED');

    for (const separationRule of [
      'does not add deploy scripts',
      'does not modify production configuration',
      'does not perform deployment',
      'separate numbered phase',
      'separately recorded',
      'no deploy scripts',
      'no deployment performed',
    ]) {
      expect(source).toContain(separationRule);
    }

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

    expect(source).toContain('Phase 277 blockers: none identified');
    expect(source).toContain('phase-276-public-mvp-manual-release-execution-record-doc.test.ts');
    expect(source).toContain('phase-276-public-mvp-manual-release-execution-record.test.ts');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 276');
    expect(readme).toContain(PHASE_276_DOC);
    expect(readme).toContain('manual release execution record');
    expect(readme).toContain('NOT EXECUTED');
    expect(readme).toContain('Phase 277 blockers: none identified');
  });

  it('confirms Phase 273-275 prerequisite docs exist', async () => {
    const approval = await readFile(join(process.cwd(), PHASE_273_DOC), 'utf8');
    const handoff = await readFile(join(process.cwd(), PHASE_274_DOC), 'utf8');
    const checkpoint = await readFile(join(process.cwd(), PHASE_275_DOC), 'utf8');

    expect(approval).toContain(
      'APPROVED — Public MVP launch approved for manual release preparation',
    );
    expect(handoff).toContain('does not perform deployment');
    expect(checkpoint).toContain(
      'APPROVED — release execution record template / final operator readiness checkpoint complete',
    );
    expect(checkpoint).toContain('separately executed and recorded');
  });
});
