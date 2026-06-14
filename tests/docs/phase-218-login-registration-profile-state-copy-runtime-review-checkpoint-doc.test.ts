import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_218_DOC =
  'docs/www-project-phase-218-login-registration-profile-state-copy-runtime-review-checkpoint-v1.md';
const PHASE_217_DOC =
  'docs/www-project-phase-217-login-registration-profile-state-copy-runtime-v1.md';

describe('Phase 218 login registration profile state copy runtime review checkpoint doc', () => {
  it('documents review scope, Phase 217 delivery, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_218_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 218');
    expect(source).toContain('State Copy Runtime Review Checkpoint');
    expect(source).toContain('b20f205');
    expect(source).toContain('Phase 217');

    for (const surface of ['/login', '/registration', '/profile']) {
      expect(source).toContain(surface);
    }

    for (const token of [
      'copy-only',
      'PUBLIC_AUTH_STATE_USER_MESSAGES',
      'PUBLIC_LOGIN_FORM_LOADING_MESSAGE',
      'PUBLIC_REGISTRATION_FORM_LOADING_MESSAGE',
      'PUBLIC_PROFILE_FORM_SAVING_MESSAGE',
      'PUBLIC_PROFILE_VALIDATION_MESSAGE',
      'login-page.js',
      'registration-page.js',
      'profile-page.js',
      'resolvePublicErrorUserMessage',
      'backend/internal error',
      '出生年月',
      '居住地區',
      'birth_year_month',
      'residential_region',
      'POST /login/session',
      'POST /registration',
      'GET /users/me',
      'auto-login',
      'Set-Cookie',
      '不會自動登入',
      '/users/me/profile',
      'user_id',
      'display_name',
      'UserAuthResolver',
      'option_index',
      'quality_badge',
      '回饋良好',
      'positive_feedback',
      'Raw Option Linkage Ban',
      'Official Vote transaction order',
      'vote-by-index',
      'eligibility-before-option-resolve',
      'result visibility',
      'debug details',
      'request id',
      'trace id',
      'internal code',
      'APPROVED',
      PHASE_217_DOC,
    ]) {
      expect(source).toContain(token);
    }

    expect(source).toContain(
      'APPROVED — Phase 217 Login / Registration / Profile state copy runtime patch is copy-only; no runtime/API/DB/backend/auth/registration/profile/privacy drift identified.',
    );

    expect(source).toContain(
      'No option choice + user/session/device/request/log/trace/metric/error linkage',
    );

    for (const forbiddenDetail of [
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
      expect(source).toContain(forbiddenDetail);
    }

    expect(source).toContain('migrate:check');
    expect(source).toContain(
      'phase-218-login-registration-profile-state-copy-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 218');
    expect(readme).toContain(PHASE_218_DOC);
    expect(readme).toContain('state copy runtime review checkpoint');
  });
});
