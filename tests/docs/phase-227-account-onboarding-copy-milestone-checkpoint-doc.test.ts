import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_227_DOC =
  'docs/www-project-phase-227-account-onboarding-copy-milestone-checkpoint-v1.md';

const PHASE_DOCS = [
  'docs/www-project-phase-222-public-mvp-onboarding-navigation-copy-consistency-plan-v1.md',
  'docs/www-project-phase-222r-public-mvp-onboarding-navigation-copy-consistency-plan-review-checkpoint-v1.md',
  'docs/www-project-phase-223-home-header-auth-state-onboarding-copy-runtime-v1.md',
  'docs/www-project-phase-224-home-header-auth-state-onboarding-copy-runtime-review-checkpoint-v1.md',
  'docs/www-project-phase-225-registration-login-profile-onboarding-navigation-copy-runtime-v1.md',
  'docs/www-project-phase-226-registration-login-profile-onboarding-navigation-copy-runtime-review-checkpoint-v1.md',
] as const;

describe('Phase 227 account onboarding copy milestone checkpoint doc', () => {
  it('documents Phase 222-226 summary, fixed boundaries, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_227_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 227');
    expect(source).toContain('Account Onboarding Copy Milestone Checkpoint');
    expect(source).toContain('Phase 222–226 Milestone Summary');
    expect(source).toContain('332425e');
    expect(source).toContain(
      'Phase 222–226 account onboarding copy work is complete for this milestone.',
    );

    for (const phase of [
      'Phase 222',
      'Phase 222-R',
      'Phase 223',
      'Phase 224',
      'Phase 225',
      'Phase 226',
    ]) {
      expect(source).toContain(phase);
    }

    for (const docPath of PHASE_DOCS) {
      expect(source).toContain(docPath.replace('docs/', './'));
    }

    for (const copyCategory of [
      'PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES',
      'PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES',
      'resolvePublicErrorUserMessage',
      'frontend-owned onboarding',
      'Registration → login guidance',
      'Login → profile guidance',
      'Profile completion guidance',
      'Static HTML and JS Mount Alignment',
      'fail closed',
      '會拒絕存取',
    ]) {
      expect(source).toContain(copyCategory);
    }

    expect(source).toContain('POST /login/session');
    expect(source).toContain('POST /registration');
    expect(source).toContain('auto-login');
    expect(source).toContain('Set-Cookie');
    expect(source).toContain('does not call `GET /users/me` after success');
    expect(source).toContain('/users/me');
    expect(source).toContain('user_id');
    expect(source).toContain('display_name');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('/users/me/profile');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('eligibility checks');
    expect(source).toContain('qualification disclosure');
    expect(source).toContain('eligibility-before-option-resolve');
    expect(source).toContain('result visibility');
    expect(source).toContain('option_index');
    expect(source).toContain('positive_feedback');
    expect(source).toContain('回饋良好');
    expect(source).toContain('Backend/internal/foreign error messages');
    expect(source).toContain('request id');
    expect(source).toContain('trace id');
    expect(source).toContain('internal code');
    expect(source).toContain('option id');

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

    for (const nonGoal of [
      'no runtime change',
      'no API change',
      'no frontend change',
      'no migration',
      'no schema change',
      'no CSS/HTML/JS copy changes',
    ]) {
      expect(source).toContain(nonGoal);
    }

    for (const protectedBoundary of [
      'Raw Option Linkage Ban',
      'Official Vote transaction order',
      'vote-by-index',
      'eligibility-before-option-resolve',
      'result visibility',
      'Profile API',
    ]) {
      expect(source).toContain(protectedBoundary);
    }

    expect(source).toContain(
      'No option choice + user/session/device/request/log/trace/metric/error linkage',
    );

    expect(source).toContain(
      'APPROVED — Account onboarding copy milestone complete; no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift identified.',
    );

    expect(source).toContain(
      'phase-227-account-onboarding-copy-milestone-checkpoint-doc.test.ts',
    );
    expect(source).toContain(
      'phase-227-account-onboarding-copy-milestone-checkpoint.test.ts',
    );
    expect(source).toContain('design-drafts/');
    expect(source).toContain('migrate:check');
    expect(source).toContain('smoke:public:local');

    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 227');
    expect(readme).toContain(PHASE_227_DOC);
    expect(readme).toContain('Account onboarding copy milestone checkpoint');
  });
});
