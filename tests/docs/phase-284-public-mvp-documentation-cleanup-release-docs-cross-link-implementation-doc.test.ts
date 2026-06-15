import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_283_DOC =
  'docs/www-project-phase-283-public-mvp-documentation-cleanup-release-docs-cross-link-plan-v1.md';
const PHASE_284_DOC =
  'docs/www-project-phase-284-public-mvp-documentation-cleanup-release-docs-cross-link-implementation-v1.md';

const ARC_NAV_MARKER = 'Release docs arc navigation (Phase 284)';

const UPDATED_PHASE_DOCS = [
  'docs/www-project-phase-265-public-mvp-launch-readiness-checklist-plan-v1.md',
  'docs/www-project-phase-266-public-mvp-launch-readiness-checklist-checkpoint-v1.md',
  'docs/www-project-phase-267-public-mvp-launch-readiness-runtime-review-final-checkpoint-v1.md',
  'docs/www-project-phase-268-public-mvp-manual-qa-runbook-execution-plan-v1.md',
  'docs/www-project-phase-269-public-mvp-manual-qa-dry-run-checklist-review-recording-template-checkpoint-v1.md',
  'docs/www-project-phase-270-public-mvp-manual-qa-execution-record-v1.md',
  'docs/www-project-phase-271-public-mvp-manual-qa-pass-review-freeze-candidate-checkpoint-v1.md',
  'docs/www-project-phase-272-public-mvp-launch-decision-packet-go-no-go-review-plan-v1.md',
  'docs/www-project-phase-273-public-mvp-launch-approval-decision-record-v1.md',
  'docs/www-project-phase-274-public-mvp-manual-release-handoff-operator-checklist-plan-v1.md',
  'docs/www-project-phase-275-public-mvp-release-execution-record-template-final-operator-readiness-checkpoint-v1.md',
  'docs/www-project-phase-276-public-mvp-manual-release-execution-record-v1.md',
  'docs/www-project-phase-277-public-mvp-manual-release-pre-execution-gate-review-v1.md',
  'docs/www-project-phase-278-public-mvp-manual-release-execution-authorization-record-v1.md',
  'docs/www-project-phase-279-public-mvp-manual-release-execution-record-operator-result-v1.md',
  'docs/www-project-phase-280-public-mvp-release-authorization-not-executed-status-final-checkpoint-v1.md',
  'docs/www-project-phase-281-public-mvp-post-authorization-maintenance-next-workstream-plan-v1.md',
  'docs/www-project-phase-282-public-mvp-post-authorization-product-backlog-seed-plan-v1.md',
  'docs/www-project-phase-283-public-mvp-documentation-cleanup-release-docs-cross-link-plan-v1.md',
] as const;

describe('Phase 284 public MVP documentation cleanup release docs cross-link implementation doc', () => {
  it('documents implementation purpose, status, README changes, and updated doc list', async () => {
    const source = await readFile(join(process.cwd(), PHASE_284_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 284');
    expect(source).toContain(
      'Public MVP Documentation Cleanup / Release Docs Cross-Link Implementation',
    );
    expect(source).toContain('docs/tests/README only');
    expect(source).toContain('6c35cac');
    expect(source).toContain(PHASE_283_DOC.replace('docs/', './'));

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

    for (const section of [
      'README Changes',
      'Inter-Doc Cross-Link Blocks Added',
      'What Was Not Changed',
      'readiness arc',
      'manual QA arc',
      'launch decision arc',
      'operator release arc',
      'post-authorization backlog/docs arc',
      ARC_NAV_MARKER,
    ]) {
      expect(source).toContain(section);
    }

    for (const rule of [
      'Any future archive/rename/delete requires a separate numbered phase',
      'Any runtime bug must be fixed in a separate numbered phase',
      'Any actual release execution must be separately executed and recorded',
      'does not perform deployment',
      'does not add deploy scripts',
      'does not modify production configuration',
      'no deployment performed',
      'historical doc delete',
      'historical doc rename',
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

    expect(source).toContain('Phase 285 blockers: none identified');
    expect(source).toContain(
      'phase-284-public-mvp-documentation-cleanup-release-docs-cross-link-implementation-doc.test.ts',
    );
    expect(source).toContain(
      'phase-284-public-mvp-documentation-cleanup-release-docs-cross-link-implementation.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 284');
    expect(readme).toContain(PHASE_284_DOC);
    expect(readme).toContain('Public MVP release documentation arcs (Phase 265–296)');
    expect(readme).toContain('readiness arc');
    expect(readme).toContain('manual QA arc');
    expect(readme).toContain('launch decision arc');
    expect(readme).toContain('operator release arc');
    expect(readme).toContain('post-authorization backlog/docs arc');
    expect(readme).toContain(ARC_NAV_MARKER);
    expect(readme).toContain('Phase 285 blockers: none identified');
  });

  it('confirms Phase 283 plan exists and Phase 265–283 docs have arc navigation blocks', async () => {
    const plan = await readFile(join(process.cwd(), PHASE_283_DOC), 'utf8');

    expect(plan).toContain('Phase 284 blockers: none identified');

    for (const relativePath of UPDATED_PHASE_DOCS) {
      const doc = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(doc, relativePath).toContain(ARC_NAV_MARKER);
      expect(doc, relativePath).toContain('Authoritative current release status (Phase 284)');
      expect(doc, relativePath).toContain('Actual deployment NOT EXECUTED');
      expect(doc, relativePath).toContain(
        'www-project-phase-284-public-mvp-documentation-cleanup-release-docs-cross-link-implementation-v1.md',
      );
    }
  });
});
