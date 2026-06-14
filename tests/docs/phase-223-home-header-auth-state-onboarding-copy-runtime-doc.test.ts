import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_223_DOC =
  'docs/www-project-phase-223-home-header-auth-state-onboarding-copy-runtime-v1.md';

describe('Phase 223 home header auth state onboarding copy runtime doc', () => {
  it('documents runtime scope, copy changes, boundaries, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_223_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 223');
    expect(source).toContain('Home + Header/Auth-State Onboarding Copy Minimal Runtime Patch');
    expect(source).toContain('fb3713e');
    expect(source).toContain('Phase 222-R');
    expect(source).toContain('copy-only');
    expect(source).toContain('PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES');
    expect(source).toContain('auth-state-copy.js');
    expect(source).toContain('public-mvp-home.js');
    expect(source).toContain('PUBLIC_PROFILE_COMPLETION_PROMPT_HINT');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('POST /registration');
    expect(source).toContain('auto-login');
    expect(source).toContain('Set-Cookie');
    expect(source).toContain('/users/me');
    expect(source).toContain('display_name');
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
      'phase-223-home-header-auth-state-onboarding-copy-runtime.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 223');
    expect(readme).toContain(PHASE_223_DOC);
    expect(readme).toContain('header/auth-state onboarding copy');
  });
});
