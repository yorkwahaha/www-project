import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_222_DOC =
  'docs/www-project-phase-222-public-mvp-onboarding-navigation-copy-consistency-plan-v1.md';

describe('Phase 222 public MVP onboarding navigation copy consistency plan doc', () => {
  it('documents plan-only onboarding/navigation scope, surfaces, checklist, boundaries, and explicit non-goals', async () => {
    const source = await readFile(join(process.cwd(), PHASE_222_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 222');
    expect(source).toContain('Onboarding / Navigation Copy Consistency Plan');
    expect(source).toContain('plan only');
    expect(source).toContain('57c7265');
    expect(source).toContain('Phase 221');

    for (const surface of [
      '/',
      '/registration',
      '/login',
      '/profile',
      '/polls/new',
      '/my-polls',
      '/vote/:pollId',
      '/results/:pollId',
      '/faq',
      '/trust-levels',
    ]) {
      expect(source).toContain(surface);
    }

    for (const area of [
      'Homepage onboarding',
      'Header / navigation',
      'auth-state',
      'Registration-to-login',
      'Login-to-profile',
      'Profile completion',
      'Poll creation demo/live',
      'My Polls creator flow',
      'Vote unauthenticated',
      'profile-incomplete',
      'Results demo/live/readonly',
      'FAQ / trust-levels',
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
      'Neutral',
      'User-facing',
      'Non-debug',
      'No backend/internal error echo',
      'No eligibility-result guarantee',
      'No unavailable production behavior promise',
      'No hidden counters or internal lifecycle details',
    ]) {
      expect(source).toContain(principle);
    }

    expect(source).toContain('auth-state-copy.js');
    expect(source).toContain('profile-completion-prompt.js');
    expect(source).toContain('official-vote-pre-vote-hints.js');
    expect(source).toContain('resolvePublicErrorUserMessage');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('POST /registration');
    expect(source).toContain('no auto-login');
    expect(source).toContain('Set-Cookie');
    expect(source).toContain('does not call `GET /users/me` after success');
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
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('GET /creator/session');
    expect(source).toContain('GET /creator/polls');
    expect(source).toContain('Phase 222-R');
    expect(source).toContain('review checkpoint');
    expect(source).toContain('migrate:check');

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

    expect(source).toContain(
      'phase-222-public-mvp-onboarding-navigation-copy-consistency-plan-doc.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 222');
    expect(readme).toContain(PHASE_222_DOC);
    expect(readme).toContain('onboarding navigation copy consistency plan');
  });
});
