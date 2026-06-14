import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_235_DOC = 'docs/www-project-phase-235-faq-onboarding-help-copy-plan-v1.md';

describe('Phase 235 faq onboarding help copy plan doc', () => {
  it('documents plan-only FAQ help scope, surfaces, checklist, boundaries, and explicit non-goals', async () => {
    const source = await readFile(join(process.cwd(), PHASE_235_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 235');
    expect(source).toContain('FAQ Onboarding / Help Copy Plan');
    expect(source).toContain('plan only');
    expect(source).toContain('677252e');
    expect(source).toContain('Phase 234');

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

    for (const area of [
      'registration → login → profile',
      'create poll → my-polls',
      'vote → results',
      'Account flow FAQ',
      'Creator flow FAQ',
      'Participant flow FAQ',
      'demo / live / preview / read-only',
      'result visibility',
      'lifecycle meaning',
    ]) {
      expect(source).toContain(area);
    }

    for (const category of [
      'Copy Principles',
      'Allowed Copy-Only Future Changes',
      'Page-by-Page Review Checklist',
      'Risk Classification',
      'Suggested Future Phase Sequence',
    ]) {
      expect(source).toContain(category);
    }

    for (const principle of [
      'Simple',
      'User-facing',
      'Non-debug',
      'No backend/internal error echo',
      'No new behavior implication',
      'No eligibility disclosure expansion',
      'No profile completion guarantee',
      'No result visibility drift',
      'No policy/lifecycle meaning change',
      'Demo vs live clarity',
      'Read-only results clarity',
      'Onboarding slice alignment',
    ]) {
      expect(source).toContain(principle);
    }

    expect(source).toContain('PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES');
    expect(source).toContain('PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES');
    expect(source).toContain('PUBLIC_CREATOR_ONBOARDING_MESSAGES');
    expect(source).toContain('PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES');
    expect(source).toContain('PUBLIC_FAQ_ONBOARDING_MESSAGES');
    expect(source).toContain('PUBLIC_VOTE_POLICY_FAQ_LINK_LABEL');
    expect(source).toContain('PUBLIC_PROFILE_COMPLETION_PROMPT_HINT');
    expect(source).toContain('PUBLIC_VOTE_POLICY_COLLECTING_HIDDEN_TEXT');
    expect(source).toContain('www-project-public-faq-draft-v1.md');
    expect(source).toContain('X-User-Id');
    expect(source).toContain('creator_session');
    expect(source).toContain('submitVoteByIndex');
    expect(source).toContain('option_index');
    expect(source).toContain('eligibility-before-option-resolve');
    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('POST /registration');
    expect(source).toContain('POST /login/session');
    expect(source).toContain('no auto-login');
    expect(source).toContain('Set-Cookie');
    expect(source).toContain('does not call `GET /users/me` after success');
    expect(source).toContain('/users/me');
    expect(source).toContain('display_name');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('POST /creator/polls');
    expect(source).toContain('GET /creator/session');
    expect(source).toContain('GET /creator/polls');
    expect(source).toContain('positive_feedback');
    expect(source).toContain('回饋良好');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('Phase 235-R');
    expect(source).toContain('review checkpoint');
    expect(source).toContain('migrate:check');
    expect(source).toContain('smoke:public:local');

    for (const nonGoal of [
      'no runtime change',
      'no API change',
      'no frontend change',
      'no migration',
      'no schema change',
      'no CSS/HTML/JS copy changes',
      'DB / schema / migration',
      'API contract / payload changes',
      'Auth / session / `UserAuthResolver` changes',
      'Registration auto-login or cookie issuance',
      'New profile fields beyond `birth_year_month` / `residential_region`',
      'Vote transaction / eligibility evaluator changes',
      'Result visibility / result evaluator changes',
      'Lifecycle meaning changes',
      'Creator session / ownership / lifecycle behavior changes',
      'Poll creation / delete / close / cancel / unpublish behavior changes',
      'Option/user/session/device/request/log/trace/metric/error linkage',
      'design-drafts/',
    ]) {
      expect(source).toContain(nonGoal);
    }

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

    expect(source).toContain(
      'No option choice + user/session/device/request/log/trace/metric/error linkage',
    );

    expect(source).toContain('phase-235-faq-onboarding-help-copy-plan-doc.test.ts');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 235');
    expect(readme).toContain(PHASE_235_DOC);
    expect(readme).toContain('FAQ onboarding / help copy plan');
  });
});
