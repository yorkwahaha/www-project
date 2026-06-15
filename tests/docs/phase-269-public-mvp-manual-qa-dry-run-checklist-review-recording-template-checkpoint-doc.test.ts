import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_268_DOC =
  'docs/www-project-phase-268-public-mvp-manual-qa-runbook-execution-plan-v1.md';
const PHASE_269_DOC =
  'docs/www-project-phase-269-public-mvp-manual-qa-dry-run-checklist-review-recording-template-checkpoint-v1.md';

describe('Phase 269 public MVP manual QA dry run checklist review recording template checkpoint doc', () => {
  it('documents review scope, Phase 268 runbook confirmation, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_269_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 269');
    expect(source).toContain(
      'Public MVP Manual QA Dry Run Checklist Review / Recording Template Checkpoint',
    );
    expect(source).toContain('review checkpoint');
    expect(source).toContain('eb3f673');
    expect(source).toContain('Phase 268');
    expect(source).toContain(PHASE_268_DOC.replace('docs/', './'));

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

    for (const reviewArea of [
      'Home / navigation',
      'Registration → login → `/users/me` → logout',
      'Profile setup / edit',
      'Explore / poll detail / vote demo',
      'Official Vote pre-vote UX',
      'My-polls demo / live shell',
      'Results visibility',
      'FAQ / help / trust / static',
      'Accessibility smoke',
      'Privacy / integrity regression',
      'Expected outcome',
      'PASS',
      'FAIL',
      'BLOCKED',
      'NEEDS FOLLOW-UP',
      'does not execute manual QA',
      'does not execute QA',
      'does not approve launch',
      'not launch approval',
      'not production approval',
      'ready for manual QA / freeze candidate',
      'separate numbered phase',
      'Dry Run Recording Template',
      'smoke:public:local',
    ]) {
      expect(source).toContain(reviewArea);
    }

    expect(source).toContain(
      'APPROVED — manual QA dry-run checklist review / recording template checkpoint complete',
    );
    expect(source).not.toContain('launch approved');
    expect(source).not.toContain('production approved');

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

    expect(source).toContain('Phase 270 blockers: none identified');
    expect(source).toContain(
      'phase-269-public-mvp-manual-qa-dry-run-checklist-review-recording-template-checkpoint-doc.test.ts',
    );
    expect(source).toContain(
      'phase-269-public-mvp-manual-qa-dry-run-checklist-review-recording-template-checkpoint.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 269');
    expect(readme).toContain(PHASE_269_DOC);
    expect(readme).toContain('dry-run checklist review');
    expect(readme).toContain('ready for manual QA / freeze candidate');
    expect(readme).toContain('Phase 270 blockers: none identified');
  });

  it('confirms Phase 268 runbook doc exists as prerequisite', async () => {
    const runbook = await readFile(join(process.cwd(), PHASE_268_DOC), 'utf8');
    expect(runbook).toContain('Manual QA Runbook');
    expect(runbook).toContain('QA Result Recording Format');
    expect(runbook).toContain('PASS');
    expect(runbook).toContain('NEEDS FOLLOW-UP');
  });
});
