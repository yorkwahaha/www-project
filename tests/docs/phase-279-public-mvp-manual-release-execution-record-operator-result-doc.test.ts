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

describe('Phase 279 public MVP manual release execution record operator result doc', () => {
  it('documents operator result, summaries, separation rules, and NOT EXECUTED default', async () => {
    const source = await readFile(join(process.cwd(), PHASE_279_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 279');
    expect(source).toContain('Public MVP Manual Release Execution Record / Operator Result');
    expect(source).toContain('operator execution result record');
    expect(source).toContain('97ba87f');
    expect(source).toContain('Phase 273');
    expect(source).toContain('Phase 274');
    expect(source).toContain('Phase 275');
    expect(source).toContain('Phase 276');
    expect(source).toContain('Phase 277');
    expect(source).toContain('Phase 278');
    expect(source).toContain(PHASE_273_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_274_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_275_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_276_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_277_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_278_DOC.replace('docs/', './'));

    for (const summaryArea of [
      'Phase 273 Launch Approval Summary',
      'Phase 274 Operator Handoff Summary',
      'Phase 275 Execution Template Summary',
      'Phase 276 Release Execution Status',
      'Phase 277 Pre-Execution Gate Review',
      'Phase 278 Authorization Decision',
      'Manual Release Execution Result (Operator)',
      'APPROVED — Public MVP launch approved for manual release preparation',
      'APPROVED — manual release pre-execution gate review complete',
      'AUTHORIZED — operator may execute Public MVP manual release using the approved handoff/checklist',
      'operator handoff checklist',
      'release execution record template',
      'pre-execution gate review',
    ]) {
      expect(source).toContain(summaryArea);
    }

    for (const resultField of [
      'Manual release execution result',
      'NOT EXECUTED',
      'EXECUTED',
      'released commit',
      'release timestamp',
      'operator note',
      'post-release smoke result',
      'abort / rollback status',
      'incident / follow-up status',
      'reason',
      'next required step',
    ]) {
      expect(source).toContain(resultField);
    }

    expect(source).toContain('**Manual release execution result** | **NOT EXECUTED**');
    expect(source).toContain('Manual release execution result: NOT EXECUTED');
    expect(source).toContain('AUTHORIZED');

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

    expect(source).toContain('Phase 280 blockers: none identified');
    expect(source).toContain(
      'phase-279-public-mvp-manual-release-execution-record-operator-result-doc.test.ts',
    );
    expect(source).toContain(
      'phase-279-public-mvp-manual-release-execution-record-operator-result.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 279');
    expect(readme).toContain(PHASE_279_DOC);
    expect(readme).toContain('operator result');
    expect(readme).toContain('NOT EXECUTED');
    expect(readme).toContain('Phase 280 blockers: none identified');
  });

  it('confirms Phase 273-278 prerequisite docs exist with expected release arc state', async () => {
    const approval = await readFile(join(process.cwd(), PHASE_273_DOC), 'utf8');
    const handoff = await readFile(join(process.cwd(), PHASE_274_DOC), 'utf8');
    const checkpoint = await readFile(join(process.cwd(), PHASE_275_DOC), 'utf8');
    const record276 = await readFile(join(process.cwd(), PHASE_276_DOC), 'utf8');
    const review = await readFile(join(process.cwd(), PHASE_277_DOC), 'utf8');
    const authorization = await readFile(join(process.cwd(), PHASE_278_DOC), 'utf8');

    expect(approval).toContain(
      'APPROVED — Public MVP launch approved for manual release preparation',
    );
    expect(handoff).toContain('operator pre-release checklist');
    expect(checkpoint).toContain('Release Execution Record Template');
    expect(record276).toContain('**Manual release execution status** | **NOT EXECUTED**');
    expect(review).toContain(
      'APPROVED — manual release pre-execution gate review complete',
    );
    expect(authorization).toContain(
      'AUTHORIZED — operator may execute Public MVP manual release using the approved handoff/checklist',
    );
  });
});
