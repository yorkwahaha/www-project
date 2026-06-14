import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_235R_DOC =
  'docs/www-project-phase-235r-faq-onboarding-help-copy-plan-review-v1.md';

const PHASE_235_DOC =
  'docs/www-project-phase-235-faq-onboarding-help-copy-plan-v1.md';

describe('Phase 235-R faq onboarding help copy plan review doc', () => {
  it('documents review scope, Phase 235 plan, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_235R_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 235-R');
    expect(source).toContain('FAQ Onboarding / Help Copy Plan Review');
    expect(source).toContain('a7f3e09');
    expect(source).toContain('Phase 235');

    for (const surface of [
      '/faq',
      '/trust-levels',
      'faq.html',
      'trust-levels.html',
      '/registration',
      '/login',
      '/profile',
      '/polls/new',
      '/my-polls',
      '/vote/demo',
      '/results/demo',
    ]) {
      expect(source).toContain(surface);
    }

    for (const token of [
      'plan only',
      'copy-only',
      'FAQ/help onboarding copy',
      'registration → login → profile',
      'create poll → my-polls',
      'vote → results',
      'PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES',
      'PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES',
      'PUBLIC_CREATOR_ONBOARDING_MESSAGES',
      'PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES',
      'PUBLIC_FAQ_ONBOARDING_MESSAGES',
      'PUBLIC_VOTE_POLICY_FAQ_LINK_LABEL',
      'PUBLIC_PROFILE_COMPLETION_PROMPT_HINT',
      'PUBLIC_VOTE_POLICY_COLLECTING_HIDDEN_TEXT',
      'X-User-Id',
      'creator_session',
      'production user-auth wiring later',
      'Engineer residue',
      'demo / preview / read-only',
      'profile completion guarantees voting eligibility',
      'backend/internal error payloads',
      'result visibility',
      'lifecycle meaning',
      'debug details',
      'request id',
      'option id',
      'internal codes',
      'hidden counters',
      'POST /login/session',
      'POST /registration',
      'auto-login',
      'Set-Cookie',
      'birth_year_month',
      'residential_region',
      'display_name',
      '/users/me',
      'user_id',
      'submitVoteByIndex',
      'option_index',
      'quality_badge',
      '回饋良好',
      'positive_feedback',
      'Raw Option Linkage Ban',
      'Official Vote transaction order',
      'vote-by-index',
      'eligibility-before-option-resolve',
      'UserAuthResolver',
      'APPROVED',
      'Phase 236',
      'No runtime',
      PHASE_235_DOC,
    ]) {
      expect(source).toContain(token);
    }

    expect(source).toContain(
      'APPROVED — Phase 235 FAQ onboarding / help copy plan is safe for constrained copy-only implementation; no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift identified.',
    );

    expect(source).toContain(
      'No option choice + user/session/device/request/log/trace/metric/error linkage',
    );

    expect(source).toContain('does not call `GET /users/me` after success');

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
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'phase-235r-faq-onboarding-help-copy-plan-review.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 235-R');
    expect(readme).toContain(PHASE_235R_DOC);
    expect(readme).toContain('FAQ onboarding / help copy plan review');
  });
});
