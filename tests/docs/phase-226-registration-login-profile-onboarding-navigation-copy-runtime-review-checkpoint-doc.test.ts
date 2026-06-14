import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_226_DOC =
  'docs/www-project-phase-226-registration-login-profile-onboarding-navigation-copy-runtime-review-checkpoint-v1.md';
const PHASE_225_DOC =
  'docs/www-project-phase-225-registration-login-profile-onboarding-navigation-copy-runtime-v1.md';

describe('Phase 226 registration login profile onboarding navigation copy runtime review checkpoint doc', () => {
  it('documents review scope, Phase 225 delivery, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_226_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 226');
    expect(source).toContain('Onboarding Navigation Copy Runtime Review Checkpoint');
    expect(source).toContain('13b76b5');
    expect(source).toContain('Phase 225');

    for (const token of [
      'copy-only',
      'PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES',
      'registration-page.js',
      'login-page.js',
      'profile-page.js',
      'registration.html',
      'login.html',
      'profile.html',
      'registration-page-banner',
      'login-profile-next-step-hint',
      'profile-signed-in-guidance',
      'PUBLIC_REGISTRATION_SUCCESS_MESSAGE',
      'PUBLIC_LOGIN_PROFILE_NEXT_STEP_HINT',
      'PUBLIC_PROFILE_SIGNED_IN_GUIDANCE_NOTE',
      '不會自動登入',
      '會拒絕存取',
      '出生年月',
      '居住地區',
      'birth_year_month',
      'residential_region',
      'POST /registration',
      'POST /login/session',
      'auto-login',
      'Set-Cookie',
      'GET /users/me',
      'user_id',
      'display_name',
      'UserAuthResolver',
      'data-login-state-read',
      'creator_session',
      'X-User-Id',
      'option_index',
      'quality_badge',
      '回饋良好',
      'positive_feedback',
      'Raw Option Linkage Ban',
      'Official Vote transaction order',
      'vote-by-index',
      'eligibility-before-option-resolve',
      'result visibility',
      'eligibility checks',
      'qualification disclosure',
      'debug details',
      'request id',
      'trace id',
      'internal code',
      'option id',
      'APPROVED',
      PHASE_225_DOC,
    ]) {
      expect(source).toContain(token);
    }

    expect(source).toContain(
      'APPROVED — Phase 225 Registration / Login / Profile onboarding navigation copy runtime patch is copy-only; no runtime/API/DB/backend/auth/registration/profile/vote/result/creator/privacy drift identified.',
    );

    expect(source).toContain(
      'No option choice + user/session/device/request/log/trace/metric/error linkage',
    );

    for (const governanceDetail of [
      'tooltip',
      'debug',
      'explanation',
      'counts',
      'score',
      'rank',
      'ranking',
      'recommendation',
      'personalization',
      'trust',
      'creator score',
      'governance',
    ]) {
      expect(source).toContain(governanceDetail);
    }

    expect(source).toContain('migrate:check');
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'phase-226-registration-login-profile-onboarding-navigation-copy-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 226');
    expect(readme).toContain(PHASE_226_DOC);
    expect(readme).toContain('onboarding navigation copy runtime review checkpoint');
  });
});
