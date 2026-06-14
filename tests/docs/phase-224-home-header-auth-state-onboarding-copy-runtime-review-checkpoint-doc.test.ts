import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_224_DOC =
  'docs/www-project-phase-224-home-header-auth-state-onboarding-copy-runtime-review-checkpoint-v1.md';
const PHASE_223_DOC =
  'docs/www-project-phase-223-home-header-auth-state-onboarding-copy-runtime-v1.md';

describe('Phase 224 home header auth state onboarding copy runtime review checkpoint doc', () => {
  it('documents review scope, Phase 223 delivery, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_224_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 224');
    expect(source).toContain('Onboarding Copy Runtime Review Checkpoint');
    expect(source).toContain('d7f0ba9');
    expect(source).toContain('Phase 223');

    for (const token of [
      'copy-only',
      'PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES',
      'auth-state-copy.js',
      'public-mvp-home.js',
      'public/index.html',
      'home-account-flow-note',
      'home-sample-polls-section-note',
      'home-static-examples-footer-note',
      'PUBLIC_PROFILE_COMPLETION_PROMPT_HINT',
      'PUBLIC_HOME_ACCOUNT_FLOW_REGISTRATION_NOTE',
      '不會自動登入',
      '會拒絕存取',
      '出生年月',
      '居住地區',
      'birth_year_month',
      'residential_region',
      'POST /registration',
      'auto-login',
      'Set-Cookie',
      'GET /users/me',
      'user_id',
      'display_name',
      'UserAuthResolver',
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
      'debug details',
      'request id',
      'trace id',
      'internal code',
      'option id',
      'APPROVED',
      PHASE_223_DOC,
    ]) {
      expect(source).toContain(token);
    }

    expect(source).toContain(
      'APPROVED — Phase 223 Home + Header/Auth-State onboarding copy runtime patch is copy-only; no runtime/API/DB/backend/auth/registration/profile/vote/result/creator/privacy drift identified.',
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
      'phase-224-home-header-auth-state-onboarding-copy-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 224');
    expect(readme).toContain(PHASE_224_DOC);
    expect(readme).toContain('onboarding copy runtime review checkpoint');
  });
});
