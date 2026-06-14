import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_217_DOC =
  'docs/www-project-phase-217-login-registration-profile-state-copy-runtime-v1.md';

describe('Phase 217 login registration profile state copy runtime doc', () => {
  it('documents copy-only runtime scope, changes, boundaries, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_217_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 217');
    expect(source).toContain('Login / Registration / Profile State Copy');
    expect(source).toContain('dd73a1f');
    expect(source).toContain('Phase 216');
    expect(source).toContain('PUBLIC_AUTH_STATE_USER_MESSAGES');
    expect(source).toContain('PUBLIC_LOGIN_FORM_LOADING_MESSAGE');
    expect(source).toContain('PUBLIC_REGISTRATION_FORM_LOADING_MESSAGE');
    expect(source).toContain('PUBLIC_PROFILE_FORM_SAVING_MESSAGE');
    expect(source).toContain('PUBLIC_PROFILE_VALIDATION_MESSAGE');
    expect(source).toContain('login-page.js');
    expect(source).toContain('registration-page.js');
    expect(source).toContain('profile-page.js');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('不會自動登入');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('quality_badge');
    expect(source).toContain('positive_feedback');
    expect(source).toContain('回饋良好');
    expect(source).toContain('migrate:check');
    expect(source).toContain(
      'phase-217-login-registration-profile-state-copy-runtime.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 217');
    expect(readme).toContain(PHASE_217_DOC);
  });
});
