import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_229_DOC =
  'docs/www-project-phase-229-poll-creation-my-polls-onboarding-navigation-copy-runtime-v1.md';

describe('Phase 229 poll creation my polls onboarding navigation copy runtime doc', () => {
  it('documents runtime scope, copy changes, boundaries, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_229_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 229');
    expect(source).toContain('Onboarding Navigation Copy Minimal Runtime Patch');
    expect(source).toContain('f80e315');
    expect(source).toContain('Phase 228-R');
    expect(source).toContain('copy-only');
    expect(source).toContain('PUBLIC_CREATOR_ONBOARDING_MESSAGES');
    expect(source).toContain('PUBLIC_CREATE_POLL_PAGE_LEAD');
    expect(source).toContain('PUBLIC_MY_POLLS_PAGE_LEAD');
    expect(source).toContain('syncCreatePollPageOnboardingCopy');
    expect(source).toContain('syncMyPollsPageOnboardingCopy');
    expect(source).toContain('create-poll-page.js');
    expect(source).toContain('my-polls-page.js');
    expect(source).toContain('create-poll.html');
    expect(source).toContain('my-polls.html');
    expect(source).toContain('?live=1');
    expect(source).toContain('POST /creator/polls');
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
      'phase-229-poll-creation-my-polls-onboarding-navigation-copy-runtime.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 229');
    expect(readme).toContain(PHASE_229_DOC);
    expect(readme).toContain('onboarding navigation copy');
  });
});
