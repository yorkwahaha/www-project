import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_268_DOC =
  'docs/www-project-phase-268-public-mvp-manual-qa-runbook-execution-plan-v1.md';
const PHASE_270_DOC =
  'docs/www-project-phase-270-public-mvp-manual-qa-execution-record-v1.md';
const PHASE_271_DOC =
  'docs/www-project-phase-271-public-mvp-manual-qa-pass-review-freeze-candidate-checkpoint-v1.md';
const PHASE_290_DOC =
  'docs/www-project-phase-290-public-mvp-post-copy-polish-checkpoint-v1.md';
const PHASE_291_DOC =
  'docs/www-project-phase-291-public-mvp-backlog-reprioritization-checkpoint-v1.md';
const PHASE_292_DOC =
  'docs/www-project-phase-292-public-mvp-manual-qa-follow-up-execution-record-v1.md';

describe('Phase 292 public MVP manual QA follow-up execution record doc', () => {
  it('documents QA session, post-copy-polish checks, runbook results, and conclusion', async () => {
    const source = await readFile(join(process.cwd(), PHASE_292_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 292');
    expect(source).toContain('Manual QA Follow-up Execution Record');
    expect(source).toContain('QA follow-up execution record only');
    expect(source).toContain('ccfea78');
    expect(source).toContain(PHASE_268_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_270_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_290_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_291_DOC.replace('docs/', './'));

    for (const route of [
      '/',
      '/explore',
      '/faq',
      '/login',
      '/registration',
      '/profile',
      '/polls/new',
      '/my-polls',
      '/vote/demo',
      '/results/demo',
    ]) {
      expect(source).toContain(route);
    }

    for (const polishCheck of [
      'Phase 285',
      'Phase 287',
      'Phase 288',
      'Phase 289',
      '目前沒有可瀏覽的公開問卷。',
      '也不會建立瀏覽器工作階段',
      '目前還沒有你建立的問卷。',
      '本產品尚未正式對外上線',
      '不代表一定可以完成投票',
      'BL-282-04',
    ]) {
      expect(source).toContain(polishCheck);
    }

    for (const section of [
      'Home / navigation',
      'Registration → login',
      'Profile setup / edit',
      'Explore / poll detail / vote demo',
      'Official Vote pre-vote UX',
      'My-polls demo / live',
      'Results visibility',
      'FAQ / help / static',
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

    expect(source).toContain('not release execution');
    expect(source).toContain('not deployment');
    expect(source).toContain('not formal launch');
    expect(source).toContain('not launch approval');
    expect(source).toContain('NOT EXECUTED');
    expect(source).toContain('Manual QA follow-up pass recorded');
    expect(source).toContain('**Overall session result:** **PASS**');
    expect(source).toContain('FU-292-01');
    expect(source).toContain('FU-292-02');
    expect(source).toContain('No runtime bug fixes in this phase');
    expect(source).toContain('separate numbered phase');

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
      'localStorage',
      'sessionStorage',
      'design-drafts/',
    ]) {
      expect(source).toContain(nonGoal);
    }

    expect(source).toContain('Phase 293 blockers: none identified');
    expect(source).toContain('phase-292-public-mvp-manual-qa-follow-up-execution-record.test.ts');
    expect(source).toContain('phase-292-public-mvp-manual-qa-follow-up-execution-record-doc.test.ts');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 292');
    expect(readme).toContain(PHASE_292_DOC);
    expect(readme).toContain('manual QA follow-up');
    expect(readme).toContain('Phase 293 blockers: none identified');
  });
});
