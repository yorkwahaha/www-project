import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_232_DOC =
  'docs/www-project-phase-232-vote-results-onboarding-navigation-copy-runtime-v1.md';

describe('Phase 232 vote results onboarding navigation copy runtime doc', () => {
  it('documents runtime scope, copy changes, boundaries, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_232_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 232');
    expect(source).toContain('Onboarding Navigation Copy Minimal Runtime Patch');
    expect(source).toContain('2b16bbb');
    expect(source).toContain('Phase 231-R');
    expect(source).toContain('copy-only');
    expect(source).toContain('PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES');
    expect(source).toContain('PUBLIC_VOTE_PAGE_REMINDER_LEAD');
    expect(source).toContain('PUBLIC_VOTE_POLICY_LOGIN_TEXT');
    expect(source).toContain('PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD');
    expect(source).toContain('PUBLIC_RESULTS_PAGE_LIVE_INTRO_LEAD');
    expect(source).toContain('syncVotePageOnboardingCopy');
    expect(source).toContain('syncResultsPageOnboardingCopy');
    expect(source).toContain('vote-page.js');
    expect(source).toContain('result-page.js');
    expect(source).toContain('vote.html');
    expect(source).toContain('results.html');
    expect(source).toContain('submitVoteByIndex');
    expect(source).toContain('option_index');
    expect(source).toContain('positive_feedback');
    expect(source).toContain('回饋良好');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('vote-by-index');
    expect(source).toContain('eligibility-before-option-resolve');
    expect(source).toContain('result visibility');
    expect(source).toContain('migrate:check');
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'phase-232-vote-results-onboarding-navigation-copy-runtime.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 232');
    expect(readme).toContain(PHASE_232_DOC);
    expect(readme).toContain('Vote / results onboarding navigation copy');
  });
});
