import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_267_DOC =
  'docs/www-project-phase-267-public-mvp-launch-readiness-runtime-review-final-checkpoint-v1.md';
const PHASE_268_DOC =
  'docs/www-project-phase-268-public-mvp-manual-qa-runbook-execution-plan-v1.md';

describe('Phase 268 public MVP manual QA runbook execution plan doc', () => {
  it('documents runbook scope, checklist areas, QA recording format, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_268_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 268');
    expect(source).toContain('Public MVP Manual QA Runbook / Execution Plan');
    expect(source).toContain('plan only');
    expect(source).toContain('0087eee');
    expect(source).toContain('Phase 267');
    expect(source).toContain(PHASE_267_DOC.replace('docs/', './'));

    for (const runbookArea of [
      'Home / navigation',
      'Registration → login → `/users/me` → logout',
      'Profile setup / edit',
      'Explore / poll detail / vote demo',
      'Official Vote pre-vote UX',
      'My-polls demo / live shell',
      'Results visibility',
      'FAQ / help / trust / static pages',
      'Accessibility smoke checks',
      'keyboard focus',
      'Reduced motion',
      'copy/share feedback',
      'Privacy / integrity regression checklist',
      'QA Result Recording Format',
      'PASS',
      'FAIL',
      'BLOCKED',
      'NEEDS FOLLOW-UP',
      'smoke:public:local',
      'separate numbered phase',
      'Ready for manual QA / freeze candidate',
      'not launch approval',
      'not production approval',
    ]) {
      expect(source).toContain(runbookArea);
    }

    expect(source).toContain('vote-by-index');
    expect(source).toContain('option_index');
    expect(source).toContain('eligibility-before-option-resolve');
    expect(source).toContain('hidden aggregate');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('positive_feedback');
    expect(source).toContain('回饋良好');
    expect(source).toContain('does not call `GET /users/me` after success');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('UserAuthResolver');

    expect(source).not.toContain('launch approved');
    expect(source).not.toContain('production approved');

    for (const nonGoal of [
      'no runtime change',
      'no API change',
      'no frontend behavior change',
      'no migration',
      'no schema change',
      'localStorage',
      'sessionStorage',
      'analytics / metrics / APM / debug tracking',
      'option choice + user/session/device/request/log/trace/metric/error linkage',
      'design-drafts/',
    ]) {
      expect(source).toContain(nonGoal);
    }

    expect(source).toContain('Phase 269 blockers: none identified');
    expect(source).toContain(
      'phase-268-public-mvp-manual-qa-runbook-execution-plan-doc.test.ts',
    );
    expect(source).toContain('phase-268-public-mvp-manual-qa-runbook-execution-plan.test.ts');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 268');
    expect(readme).toContain(PHASE_268_DOC);
    expect(readme).toContain('manual QA runbook');
    expect(readme).toContain('ready for manual QA / freeze candidate');
    expect(readme).toContain('Phase 269 blockers: none identified');
  });

  it('confirms Phase 267 final checkpoint doc exists as prerequisite', async () => {
    const review = await readFile(join(process.cwd(), PHASE_267_DOC), 'utf8');
    expect(review).toContain('launch readiness final checkpoint complete');
    expect(review).toContain('ready for manual QA / freeze candidate');
  });
});
