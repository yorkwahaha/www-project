import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_282_DOC =
  'docs/www-project-phase-282-public-mvp-post-authorization-product-backlog-seed-plan-v1.md';
const PHASE_283_DOC =
  'docs/www-project-phase-283-public-mvp-documentation-cleanup-release-docs-cross-link-plan-v1.md';

describe('Phase 283 public MVP documentation cleanup release docs cross-link plan doc', () => {
  it('documents plan purpose, status, backlog linkage, cleanup targets, arcs, and archive rules', async () => {
    const source = await readFile(join(process.cwd(), PHASE_283_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 283');
    expect(source).toContain('Public MVP Documentation Cleanup / Release Docs Cross-Link Plan');
    expect(source).toContain('plan only');
    expect(source).toContain('67431c9');
    expect(source).toContain(PHASE_282_DOC.replace('docs/', './'));

    for (const statusField of [
      'Current Release Status',
      'Launch approved for manual release preparation',
      'Operator release execution authorized',
      'Actual deployment NOT EXECUTED',
      'No deploy scripts added',
      'No production configuration changed',
    ]) {
      expect(source).toContain(statusField);
    }

    for (const backlog of ['BL-282-03', 'BL-282-08', 'Phase 282 Backlog Linkage']) {
      expect(source).toContain(backlog);
    }

    for (const target of [
      'Proposed Documentation Cleanup Targets',
      'Phase 265–267 readiness docs',
      'Phase 268–271 manual QA docs',
      'Phase 272–273 launch decision docs',
      'Phase 274–280 release/operator/NOT EXECUTED docs',
      'Phase 281–282 next workstream/backlog docs',
      'www-project-phase-265-public-mvp-launch-readiness-checklist-plan-v1.md',
      'www-project-phase-268-public-mvp-manual-qa-runbook-execution-plan-v1.md',
      'www-project-phase-272-public-mvp-launch-decision-packet-go-no-go-review-plan-v1.md',
      'www-project-phase-274-public-mvp-manual-release-handoff-operator-checklist-plan-v1.md',
      'www-project-phase-281-public-mvp-post-authorization-maintenance-next-workstream-plan-v1.md',
    ]) {
      expect(source).toContain(target);
    }

    for (const arc of [
      'Proposed Cross-Link Structure',
      'readiness arc',
      'manual QA arc',
      'launch decision arc',
      'operator release arc',
      'post-authorization backlog arc',
    ]) {
      expect(source).toContain(arc);
    }

    for (const archiveRule of [
      'Archive Planning Rules',
      'Do not delete historical docs in this phase',
      'Do not rename docs in this phase unless tests are updated',
      'Do not imply actual deployment happened',
      'Do not imply production configuration changed',
    ]) {
      expect(source).toContain(archiveRule);
    }

    for (const rule of [
      'Any actual documentation rename/delete/archive implementation requires a separate numbered phase if not done here',
      'Any runtime bug must be fixed in a separate numbered phase',
      'Any actual release execution must be separately executed and recorded',
      'does not perform deployment',
      'does not add deploy scripts',
      'does not modify production configuration',
      'no deployment performed',
      'no historical doc delete or rename',
    ]) {
      expect(source).toContain(rule);
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

    expect(source).toContain('Phase 284 blockers: none identified');
    expect(source).toContain(
      'phase-283-public-mvp-documentation-cleanup-release-docs-cross-link-plan-doc.test.ts',
    );
    expect(source).toContain(
      'phase-283-public-mvp-documentation-cleanup-release-docs-cross-link-plan.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 283');
    expect(readme).toContain(PHASE_283_DOC);
    expect(readme).toContain('documentation cleanup');
    expect(readme).toContain('cross-link plan');
    expect(readme).toContain('Phase 284 blockers: none identified');
  });

  it('confirms Phase 282 prerequisite backlog seed plan exists with BL-282-03 and BL-282-08', async () => {
    const seedPlan = await readFile(join(process.cwd(), PHASE_282_DOC), 'utf8');

    expect(seedPlan).toContain('BL-282-03');
    expect(seedPlan).toContain('BL-282-08');
    expect(seedPlan).toContain('documentation cleanup');
    expect(seedPlan).toContain('candidates only');
  });
});
