import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_268_DOC =
  'docs/www-project-phase-268-public-mvp-manual-qa-runbook-execution-plan-v1.md';
const PHASE_270_DOC =
  'docs/www-project-phase-270-public-mvp-manual-qa-execution-record-v1.md';
const PHASE_271_DOC =
  'docs/www-project-phase-271-public-mvp-manual-qa-pass-review-freeze-candidate-checkpoint-v1.md';
const PHASE_291_DOC =
  'docs/www-project-phase-291-public-mvp-backlog-reprioritization-checkpoint-v1.md';
const PHASE_292_DOC =
  'docs/www-project-phase-292-public-mvp-manual-qa-follow-up-execution-record-v1.md';
const PHASE_293_DOC =
  'docs/www-project-phase-293-public-mvp-post-release-monitoring-notes-draft-v1.md';

describe('Phase 293 public MVP post-release monitoring notes draft doc', () => {
  it('documents monitoring draft, smoke checklist, boundaries, and non-execution status', async () => {
    const source = await readFile(join(process.cwd(), PHASE_293_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 293');
    expect(source).toContain('Post-Release Monitoring Notes Draft');
    expect(source).toContain('post-release monitoring notes draft only');
    expect(source).toContain('74914b4');
    expect(source).toContain(PHASE_268_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_270_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_271_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_291_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_292_DOC.replace('docs/', './'));

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

    for (const section of [
      'First 24 Hours',
      'Post-Release Smoke Check',
      'Login / Registration / Profile',
      'Explore / My-Polls / Vote Demo / Results Demo / FAQ',
      'Result Hidden Aggregate Boundary',
      'quality_badge` Presentation-Only Boundary',
      'Privacy / Integrity Observation Checklist',
      'Rollback / Escalation Notes',
    ]) {
      expect(source).toContain(section);
    }

    for (const boundary of [
      'not execute release',
      'does not deploy',
      'does not add deploy scripts',
      'does not change production configuration',
      'NOT EXECUTED',
      'not formal launch',
      'BL-282-01',
      'FU-292-01',
      'FU-292-02',
      'BL-286-02',
      'operator optional spot-check',
      'no ad hoc constant merge',
      'no ad hoc merge',
      '375px',
    ]) {
      expect(source).toContain(boundary);
    }

    for (const status of ['PASS', 'FAIL', 'BLOCKED', 'NEEDS FOLLOW-UP']) {
      expect(source).toContain(status);
    }

    expect(source).toContain('option_index');
    expect(source).toContain('eligibility-before-option-resolve');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('positive_feedback');
    expect(source).toContain('回饋良好');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('hidden aggregate');
    expect(source).toContain('collecting');

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

    expect(source).toContain('Phase 294 blockers: none identified');
    expect(source).toContain('phase-293-public-mvp-post-release-monitoring-notes-draft.test.ts');
    expect(source).toContain('phase-293-public-mvp-post-release-monitoring-notes-draft-doc.test.ts');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 293');
    expect(readme).toContain(PHASE_293_DOC);
    expect(readme).toContain('post-release monitoring notes draft');
    expect(readme).toContain('Phase 294 blockers: none identified');
  });
});
