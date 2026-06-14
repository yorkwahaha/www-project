import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_225_DOC =
  'docs/www-project-phase-225-registration-login-profile-onboarding-navigation-copy-runtime-v1.md';

describe('Phase 225 registration login profile onboarding navigation copy runtime doc', () => {
  it('documents runtime scope, copy changes, boundaries, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_225_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 225');
    expect(source).toContain('Onboarding Navigation Copy Minimal Runtime Patch');
    expect(source).toContain('85fe017');
    expect(source).toContain('Phase 224');
    expect(source).toContain('copy-only');
    expect(source).toContain('PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES');
    expect(source).toContain('PUBLIC_REGISTRATION_SUCCESS_MESSAGE');
    expect(source).toContain('PUBLIC_LOGIN_PROFILE_NEXT_STEP_HINT');
    expect(source).toContain('PUBLIC_PROFILE_SIGNED_IN_GUIDANCE_NOTE');
    expect(source).toContain('registration-page.js');
    expect(source).toContain('login-page.js');
    expect(source).toContain('profile-page.js');
    expect(source).toContain('registration.html');
    expect(source).toContain('login.html');
    expect(source).toContain('profile.html');
    expect(source).toContain('不會自動登入');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('POST /registration');
    expect(source).toContain('auto-login');
    expect(source).toContain('Set-Cookie');
    expect(source).toContain('/users/me');
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
      'phase-225-registration-login-profile-onboarding-navigation-copy-runtime.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 225');
    expect(readme).toContain(PHASE_225_DOC);
    expect(readme).toContain('onboarding navigation copy');
  });
});
