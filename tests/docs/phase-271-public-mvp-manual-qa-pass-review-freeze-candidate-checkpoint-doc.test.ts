import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_268_DOC =
  'docs/www-project-phase-268-public-mvp-manual-qa-runbook-execution-plan-v1.md';
const PHASE_269_DOC =
  'docs/www-project-phase-269-public-mvp-manual-qa-dry-run-checklist-review-recording-template-checkpoint-v1.md';
const PHASE_270_DOC = 'docs/www-project-phase-270-public-mvp-manual-qa-execution-record-v1.md';
const PHASE_271_DOC =
  'docs/www-project-phase-271-public-mvp-manual-qa-pass-review-freeze-candidate-checkpoint-v1.md';

describe('Phase 271 public MVP manual QA pass review freeze candidate checkpoint doc', () => {
  it('documents review scope, Phase 268-270 arc confirmation, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_271_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 271');
    expect(source).toContain(
      'Public MVP Manual QA Pass Review / Freeze Candidate Checkpoint',
    );
    expect(source).toContain('review checkpoint');
    expect(source).toContain('7b5e8c6');
    expect(source).toContain('Phase 268');
    expect(source).toContain('Phase 269');
    expect(source).toContain('Phase 270');
    expect(source).toContain(PHASE_268_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_269_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_270_DOC.replace('docs/', './'));

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
      'manual QA runbook / execution plan',
      'dry-run checklist review',
      'recording template',
      'one manual QA pass',
      'Manual QA pass recorded',
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
      'Route/Flow',
      'Expected outcome',
      'PASS',
      'FAIL',
      'BLOCKED',
      'NEEDS FOLLOW-UP',
      'no runtime bug fixes in Phase 270',
      'does not approve launch',
      'not launch approval',
      'not production approval',
      'ready for manual QA / freeze candidate',
      'separate numbered phase',
      'separate explicit phase',
      'freeze candidate checkpoint',
      'smoke:public:local',
    ]) {
      expect(source).toContain(reviewArea);
    }

    expect(source).toContain(
      'APPROVED — public MVP manual QA pass review / freeze candidate checkpoint complete',
    );
    expect(source).toContain('**FAIL items:** none');
    expect(source).toContain('**BLOCKED items:** none');
    expect(source).toContain('**NEEDS FOLLOW-UP items:** none');
    expect(source).toContain('**Overall session result:** **PASS**');
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

    expect(source).toContain('Phase 272 blockers: none identified');
    expect(source).toContain(
      'phase-271-public-mvp-manual-qa-pass-review-freeze-candidate-checkpoint-doc.test.ts',
    );
    expect(source).toContain(
      'phase-271-public-mvp-manual-qa-pass-review-freeze-candidate-checkpoint.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 271');
    expect(readme).toContain(PHASE_271_DOC);
    expect(readme).toContain('manual QA pass review');
    expect(readme).toContain('freeze candidate checkpoint');
    expect(readme).toContain('ready for manual QA / freeze candidate');
    expect(readme).toContain('Phase 272 blockers: none identified');
  });

  it('confirms Phase 268-270 prerequisite docs exist', async () => {
    const runbook = await readFile(join(process.cwd(), PHASE_268_DOC), 'utf8');
    const template = await readFile(join(process.cwd(), PHASE_269_DOC), 'utf8');
    const record = await readFile(join(process.cwd(), PHASE_270_DOC), 'utf8');

    expect(runbook).toContain('Manual QA Runbook');
    expect(template).toContain('Dry Run Recording Template');
    expect(record).toContain('Manual QA pass recorded');
    expect(record).toContain('**Overall session result:** **PASS**');
    expect(record).toContain('**FAIL items:** none');
  });
});
