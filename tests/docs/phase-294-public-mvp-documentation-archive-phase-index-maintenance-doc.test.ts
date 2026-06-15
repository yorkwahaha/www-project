import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_283_DOC =
  'docs/www-project-phase-283-public-mvp-documentation-cleanup-release-docs-cross-link-plan-v1.md';
const PHASE_284_DOC =
  'docs/www-project-phase-284-public-mvp-documentation-cleanup-release-docs-cross-link-implementation-v1.md';
const PHASE_291_DOC =
  'docs/www-project-phase-291-public-mvp-backlog-reprioritization-checkpoint-v1.md';
const PHASE_293_DOC =
  'docs/www-project-phase-293-public-mvp-post-release-monitoring-notes-draft-v1.md';
const PHASE_294_DOC =
  'docs/www-project-phase-294-public-mvp-documentation-archive-phase-index-maintenance-v1.md';

const ARC_NAV_MARKER = 'Release docs arc navigation (Phase 284)';

const PHASE_265_293_DOC_PATHS = [
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
  'docs/www-project-phase-284-public-mvp-documentation-cleanup-release-docs-cross-link-implementation-v1.md',
  'docs/www-project-phase-285-public-explore-feed-empty-state-copy-polish-v1.md',
  'docs/www-project-phase-286-public-mvp-copy-consistency-review-checkpoint-v1.md',
  'docs/www-project-phase-287-login-account-flow-card-copy-polish-v1.md',
  'docs/www-project-phase-288-my-polls-empty-state-copy-polish-v1.md',
  'docs/www-project-phase-289-public-faq-copy-alignment-polish-v1.md',
  'docs/www-project-phase-290-public-mvp-post-copy-polish-checkpoint-v1.md',
  'docs/www-project-phase-291-public-mvp-backlog-reprioritization-checkpoint-v1.md',
  'docs/www-project-phase-292-public-mvp-manual-qa-follow-up-execution-record-v1.md',
  'docs/www-project-phase-293-public-mvp-post-release-monitoring-notes-draft-v1.md',
] as const;

describe('Phase 294 public MVP documentation archive phase index maintenance doc', () => {
  it('documents archive purpose, status, README changes, and Phase 265–293 index', async () => {
    const source = await readFile(join(process.cwd(), PHASE_294_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 294');
    expect(source).toContain('Documentation Archive / Phase Index Maintenance');
    expect(source).toContain('docs/tests/README only');
    expect(source).toContain('1913ee0');
    expect(source).toContain('BL-282-08');
    expect(source).toContain(PHASE_283_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_284_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_291_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_293_DOC.replace('docs/', './'));

    for (const statusField of [
      'Launch approved for manual release preparation',
      'Operator release execution authorized',
      'Actual deployment NOT EXECUTED',
      'Formal launch NOT COMPLETED',
      'No deploy scripts added',
      'No production configuration changed',
    ]) {
      expect(source).toContain(statusField);
    }

    for (const section of [
      'Topic Quick Lookup',
      'Phase 265–293 Complete Archive Index',
      'readiness arc',
      'manual QA arc',
      'launch decision arc',
      'operator release arc',
      'post-authorization backlog/docs arc',
      'Post-copy polish arc',
      'sealed',
      'backlog reprioritization',
      'manual QA follow-up',
      'post-release monitoring',
      'Post-authorization extension arcs',
    ]) {
      expect(source).toContain(section);
    }

    for (const rule of [
      'historical doc delete',
      'historical doc rename',
      'does not execute release',
      'does not deploy',
      'does not add deploy scripts',
      'does not change production configuration',
      'no deployment performed',
      'separate numbered phase',
    ]) {
      expect(source).toContain(rule);
    }

    for (const arc of [
      '265–267',
      '268–271',
      '272–273',
      '274–280',
      '281–284',
      '285–290',
      '291',
      '292',
      '293',
    ]) {
      expect(source).toContain(arc);
    }

    expect(source).toContain('option_index');
    expect(source).toContain('eligibility-before-option-resolve');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('positive_feedback');
    expect(source).toContain('回饋良好');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('hidden aggregate');
    expect(source).toContain('smoke:public:local');

    for (const nonGoal of [
      'no runtime change',
      'no API change',
      'no frontend behavior change',
      'no migration',
      'localStorage',
      'sessionStorage',
      'design-drafts/',
    ]) {
      expect(source).toContain(nonGoal);
    }

    expect(source).toContain('Phase 295 blockers: none identified');
    expect(source).toContain(
      'phase-294-public-mvp-documentation-archive-phase-index-maintenance-doc.test.ts',
    );
    expect(source).toContain(
      'phase-294-public-mvp-documentation-archive-phase-index-maintenance.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 294');
    expect(readme).toContain(PHASE_294_DOC);
    expect(readme).toContain('Public MVP release documentation arcs (Phase 265–294)');
    expect(readme).toContain('Post-authorization extension arcs (Phase 285–293)');
    expect(readme).toContain('Topic quick lookup (Phase 265–293)');
    expect(readme).toContain('post-copy polish arc');
    expect(readme).toContain('backlog reprioritization arc');
    expect(readme).toContain('manual QA follow-up arc');
    expect(readme).toContain('post-release monitoring arc');
    expect(readme).toContain('Phase 295 blockers: none identified');
  });

  it('confirms Phase 265–293 doc paths exist and Phase 265–283 retain Phase 284 arc navigation', async () => {
    for (const relativePath of PHASE_265_293_DOC_PATHS) {
      const doc = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(doc.length, relativePath).toBeGreaterThan(0);
    }

    const phase265to283 = PHASE_265_293_DOC_PATHS.slice(0, 19);
    for (const relativePath of phase265to283) {
      const doc = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(doc, relativePath).toContain(ARC_NAV_MARKER);
      expect(doc, relativePath).toContain('Actual deployment NOT EXECUTED');
    }
  });
});
