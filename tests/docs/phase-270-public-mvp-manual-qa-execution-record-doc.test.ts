import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_268_DOC =
  'docs/www-project-phase-268-public-mvp-manual-qa-runbook-execution-plan-v1.md';
const PHASE_269_DOC =
  'docs/www-project-phase-269-public-mvp-manual-qa-dry-run-checklist-review-recording-template-checkpoint-v1.md';
const PHASE_270_DOC = 'docs/www-project-phase-270-public-mvp-manual-qa-execution-record-v1.md';

describe('Phase 270 public MVP manual QA execution record doc', () => {
  it('documents QA session, runbook results, recording rules, and conclusion', async () => {
    const source = await readFile(join(process.cwd(), PHASE_270_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 270');
    expect(source).toContain('Public MVP Manual QA Execution Record');
    expect(source).toContain('QA execution record only');
    expect(source).toContain('b81926b');
    expect(source).toContain(PHASE_268_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_269_DOC.replace('docs/', './'));

    for (const section of [
      'Home / navigation',
      'Registration → login → `/users/me` → logout',
      'Profile setup / edit',
      'Explore / poll detail / vote demo',
      'Official Vote pre-vote UX',
      'My-polls demo / live shell',
      'Results visibility',
      'FAQ / help / trust / static pages',
      'Accessibility smoke',
      'Privacy / integrity regression',
    ]) {
      expect(source).toContain(section);
    }

    for (const column of ['Route/Flow', 'Action', 'Expected outcome', 'Result', 'Notes']) {
      expect(source).toContain(column);
    }

    for (const status of ['PASS', 'FAIL', 'BLOCKED', 'NEEDS FOLLOW-UP']) {
      expect(source).toContain(status);
    }

    expect(source).toContain('Keyboard focus');
    expect(source).toContain('Reduced motion');
    expect(source).toContain('copy/share feedback');
    expect(source).toContain('not launch approval');
    expect(source).toContain('not production approval');
    expect(source).toContain('Manual QA pass recorded');
    expect(source).toContain('ready for manual QA / freeze candidate');
    expect(source).toContain('separate numbered phase');
    expect(source).toContain('no runtime bug fixes in this phase');
    expect(source).not.toContain('launch approved');
    expect(source).not.toContain('production approved');

    expect(source).toContain('**FAIL items:** none');
    expect(source).toContain('**Overall session result:** **PASS**');

    expect(source).toContain('option_index');
    expect(source).toContain('eligibility-before-option-resolve');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('positive_feedback');
    expect(source).toContain('回饋良好');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('smoke:public:local');

    for (const nonGoal of [
      'no runtime change',
      'no API change',
      'no frontend behavior change',
      'no migration',
      'no schema change',
      'localStorage',
      'sessionStorage',
      'design-drafts/',
    ]) {
      expect(source).toContain(nonGoal);
    }

    expect(source).toContain('Phase 271 blockers: none identified');
    expect(source).toContain('phase-270-public-mvp-manual-qa-execution-record-doc.test.ts');
    expect(source).toContain('phase-270-public-mvp-manual-qa-execution-record.test.ts');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 270');
    expect(readme).toContain(PHASE_270_DOC);
    expect(readme).toContain('manual QA execution record');
    expect(readme).toContain('Manual QA pass recorded');
    expect(readme).toContain('Phase 271 blockers: none identified');
  });
});
