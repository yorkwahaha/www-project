import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_152_DOC =
  'docs/www-project-phase-152-public-form-field-label-placeholder-runtime-review-checkpoint-v1.md';

describe('Phase 152 public form field label placeholder runtime review checkpoint doc', () => {
  it('documents Phase 151 runtime review conclusions and fixed boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_152_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 152');
    expect(source).toContain('Public Form Field Label / Placeholder Runtime Review Checkpoint');
    expect(source).toContain('No runtime, frontend behavior, API behavior');
    expect(source).toContain('Phase 151');

    expect(source).toContain('PUBLIC_FORM_FIELD_LABELS');
    expect(source).toContain('PUBLIC_FORM_PLACEHOLDERS');
    expect(source).toContain('PUBLIC_FORM_FIELD_HINTS');
    expect(source).toContain('Form field copy is frontend-owned only');
    expect(source).toContain('Placeholders and field hints do not imply eligibility outcomes');
    expect(source).toContain('Static HTML shells align with shared constants');

    expect(source).toContain('syncLoginFormFieldCopy');
    expect(source).toContain('syncRegistrationFormFieldCopy');
    expect(source).toContain('syncProfileFormFieldCopy');
    expect(source).toContain('syncCreatePollFormFieldCopy');
    expect(source).toContain('syncVoteFormFieldCopy');
    expect(source).toContain('login-page.js');
    expect(source).toContain('registration-page.js');
    expect(source).toContain('profile-page.js');
    expect(source).toContain('public/login.html');
    expect(source).toContain('public/registration.html');
    expect(source).toContain('public/profile.html');
    expect(source).toContain('/login');
    expect(source).toContain('/registration');
    expect(source).toContain('/profile');
    expect(source).toContain('/polls/new');
    expect(source).toContain('/vote/:id');

    expect(source).toContain('does not auto-login');
    expect(source).toContain('does not Set-Cookie');
    expect(source).toContain('does not read `/users/me`');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('No new profile fields added');
    expect(source).toContain('creator_session` remains non-production identity');
    expect(source).toContain('Official Vote transaction order unchanged');
    expect(source).toContain('eligibility-before-option-resolve unchanged');
    expect(source).toContain('Reference Answer remains disconnected');
    expect(source).toContain('Raw Option Linkage Ban preserved');
    expect(source).toContain('X-User-Id` remains explicit non-production compatibility only');
    expect(source).toContain('No new observability or analytics linkage');

    expect(source).toContain(
      'phase-152-public-form-field-label-placeholder-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 152');
    expect(readme).toContain(PHASE_152_DOC);
    expect(readme).toContain('Public form field label / placeholder runtime review checkpoint');
  });
});
