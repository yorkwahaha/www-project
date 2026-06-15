import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_110_DOC =
  'docs/www-project-phase-110-vote-ux-error-handling-polish-plan-v1.md';
const PHASE_111_DOC =
  'docs/www-project-phase-111-vote-ux-error-handling-runtime-polish-v1.md';
const PHASE_112_DOC =
  'docs/www-project-phase-112-vote-ux-error-handling-runtime-review-checkpoint-v1.md';
const PHASE_291_DOC =
  'docs/www-project-phase-291-public-mvp-backlog-reprioritization-checkpoint-v1.md';
const PHASE_295_DOC =
  'docs/www-project-phase-295-vote-page-error-ux-evaluation-plan-v1.md';

describe('Phase 295 vote-page error UX evaluation plan doc', () => {
  it('documents evaluation purpose, scenarios, boundaries, and non-goals', async () => {
    const source = await readFile(join(process.cwd(), PHASE_295_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 295');
    expect(source).toContain('Vote-page Error UX Evaluation Plan');
    expect(source).toContain('plan-only / evaluation-only');
    expect(source).toContain('62959e9');
    expect(source).toContain('BL-282-06');
    expect(source).toContain(PHASE_110_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_111_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_112_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_291_DOC.replace('docs/', './'));

    for (const section of [
      'Current State Inventory',
      'Scenario Evaluation Matrix',
      'Must-Not-Leak Checklist',
      'vote-by-index Boundary Confirmation',
      'Safe Copy Classification',
      'Risk Classification Summary',
      'Future Tests / Guards',
      'Future Implementable vs Not Implementable',
      'Explicit Non-Goals',
    ]) {
      expect(source).toContain(section);
    }

    for (const scenario of [
      'Not signed in',
      'Profile incomplete',
      'Profile ineligible',
      'Poll collecting',
      'cancelled',
      'unpublished',
      'locked',
      'revealed',
      'Invalid poll id',
      'Invalid `option_index`',
      'Network / transport',
      'Duplicate vote',
    ]) {
      expect(source).toContain(scenario);
    }

    for (const bucket of [
      'public-safe generic failure',
      'login required',
      'profile required / profile incomplete',
      'poll unavailable',
      'vote unavailable',
      'retry later',
    ]) {
      expect(source).toContain(bucket);
    }

    for (const boundary of [
      'eligibility-before-option-resolve',
      'option_index',
      'option_id',
      'hidden aggregate',
      'Raw Option Linkage Ban',
      'does not implement',
      'NOT EXECUTED',
      'NOT COMPLETED',
      'separate numbered phase',
      'GENERIC_VOTE_SUBMIT_FAILURE',
      'official-vote-pre-vote-hints.js',
      'vote-page.js',
    ]) {
      expect(source).toContain(boundary);
    }

    for (const nonGoal of [
      'no runtime change',
      'no API change',
      'no migration',
      'localStorage',
      'sessionStorage',
      'analytics',
      'vote transaction order',
      'eligibility evaluator',
      'result visibility',
      'design-drafts/',
    ]) {
      expect(source).toContain(nonGoal);
    }

    expect(source).toContain('Phase 296 blockers: none identified');
    expect(source).toContain('phase-295-vote-page-error-ux-evaluation-plan-doc.test.ts');
    expect(source).toContain('phase-295-vote-page-error-ux-evaluation-plan.test.ts');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 295');
    expect(readme).toContain(PHASE_295_DOC);
    expect(readme).toContain('Vote-page error UX evaluation plan');
    expect(readme).toContain('Phase 296 blockers: none identified');
  });
});
