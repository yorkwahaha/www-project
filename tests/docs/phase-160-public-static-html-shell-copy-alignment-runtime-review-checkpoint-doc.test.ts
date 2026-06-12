import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_160_DOC =
  'docs/www-project-phase-160-public-static-html-shell-copy-alignment-runtime-review-checkpoint-v1.md';

describe('Phase 160 public static HTML shell copy alignment runtime review checkpoint doc', () => {
  it('documents Phase 159 runtime review conclusions and fixed boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_160_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 160');
    expect(source).toContain('Public Static HTML Shell Copy Alignment Runtime Review Checkpoint');
    expect(source).toContain('No runtime, frontend behavior, API behavior');
    expect(source).toContain('Phase 159');

    expect(source).toContain('PUBLIC_LOGIN_FORM_READY_HINT');
    expect(source).toContain('PUBLIC_REGISTRATION_SUCCESS_MESSAGE');
    expect(source).toContain('PUBLIC_PROFILE_VIEW_SIGN_IN_REQUIRED_MESSAGE');
    expect(source).toContain('PUBLIC_HOME_VALUE_COLLECTING_HIDDEN_BODY');
    expect(source).toContain('PUBLIC_RESULTS_DEMO_READONLY_TITLE');
    expect(source).toContain('Shell / sync copy is frontend-owned only');
    expect(source).toContain('`/results/demo` brand / h1 uses `PUBLIC_RESULTS_DEMO_READONLY_TITLE` safely');
    expect(source).toContain('Homepage sample section / footer embedded links are intentionally not synced');
    expect(source).toContain('Embedded-link blocks are not overwritten by textContent sync');
    expect(source).toContain('`policy-ui-placeholders.js` / `HELP_COPY` remain a separate layer');

    expect(source).toContain('syncLoginFormFieldCopy');
    expect(source).toContain('syncRegistrationSuccessCopy');
    expect(source).toContain('syncProfilePageLeadParagraphs');
    expect(source).toContain('syncMyPollsPageSectionHeadings');
    expect(source).toContain('syncVotePageSectionHeadings');
    expect(source).toContain('syncResultsPageSectionHeadings');
    expect(source).toContain('resolveResultsReadonlyTitle');
    expect(source).toContain('login.html');
    expect(source).toContain('registration.html');
    expect(source).toContain('profile.html');
    expect(source).toContain('my-polls.html');
    expect(source).toContain('create-poll.html');
    expect(source).toContain('vote.html');
    expect(source).toContain('faq.html');
    expect(source).toContain('trust-levels.html');

    expect(source).toContain('does not auto-login');
    expect(source).toContain('does not Set-Cookie');
    expect(source).toContain('does not read `/users/me`');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('Official Vote transaction order unchanged');
    expect(source).toContain('eligibility-before-option-resolve unchanged');
    expect(source).toContain('Vote-by-index body remains `{ option_index }` only');
    expect(source).toContain('Reference Answer remains disconnected');
    expect(source).toContain('Raw Option Linkage Ban preserved');
    expect(source).toContain('X-User-Id` remains explicit non-production compatibility only');
    expect(source).toContain('No new observability or analytics linkage');

    expect(source).toContain(
      'phase-160-public-static-html-shell-copy-alignment-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 160');
    expect(readme).toContain(PHASE_160_DOC);
    expect(readme).toContain(
      'Public static HTML shell copy alignment runtime review checkpoint',
    );
  });
});
