import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_150_DOC =
  'docs/www-project-phase-150-public-help-hint-text-runtime-review-checkpoint-v1.md';

describe('Phase 150 public help hint text runtime review checkpoint doc', () => {
  it('documents Phase 149 runtime review conclusions and fixed boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_150_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 150');
    expect(source).toContain('Public Help / Hint Text Runtime Review Checkpoint');
    expect(source).toContain('No runtime, frontend behavior, API behavior');
    expect(source).toContain('Phase 149');

    expect(source).toContain('PUBLIC_HINT_TEXT_MESSAGES');
    expect(source).toContain('PUBLIC_*_HINT');
    expect(source).toContain('Help / hint copy is frontend-owned only');
    expect(source).toContain('Pre-vote hints do not reveal eligibility outcomes');
    expect(source).toContain(
      'Results intro hints remain scope-only without counter preview',
    );
    expect(source).toContain('policy-ui-placeholders.js / HELP_COPY remain a separate policy layer');

    expect(source).toContain('login-page.js');
    expect(source).toContain('registration-page.js');
    expect(source).toContain('profile-completion-prompt.js');
    expect(source).toContain('official-vote-pre-vote-hints.js');
    expect(source).toContain('explore-page.js');
    expect(source).toContain('result-page.js');
    expect(source).toContain('creator-flow-copy.js');
    expect(source).toContain('/login');
    expect(source).toContain('/registration');
    expect(source).toContain('/vote/:id');
    expect(source).toContain('/explore');
    expect(source).toContain('/results/:id');

    expect(source).toContain('does not auto-login');
    expect(source).toContain('does not Set-Cookie');
    expect(source).toContain('does not read `/users/me`');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('creator_session` remains non-production identity');
    expect(source).toContain('Official Vote transaction order unchanged');
    expect(source).toContain('eligibility-before-option-resolve unchanged');
    expect(source).toContain('Reference Answer remains disconnected');
    expect(source).toContain('Raw Option Linkage Ban preserved');
    expect(source).toContain('X-User-Id` remains explicit non-production compatibility only');
    expect(source).toContain('No new observability or analytics linkage');
    expect(source).toContain('revealed` / `locked` / `post_lock');

    expect(source).toContain(
      'phase-150-public-help-hint-text-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 150');
    expect(readme).toContain(PHASE_150_DOC);
    expect(readme).toContain('Public help / hint text runtime review checkpoint');
  });
});
