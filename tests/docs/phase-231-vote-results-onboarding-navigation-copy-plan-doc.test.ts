import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_231_DOC =
  'docs/www-project-phase-231-vote-results-onboarding-navigation-copy-plan-v1.md';

describe('Phase 231 vote results onboarding navigation copy plan doc', () => {
  it('documents plan-only vote results onboarding scope, surfaces, checklist, boundaries, and explicit non-goals', async () => {
    const source = await readFile(join(process.cwd(), PHASE_231_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 231');
    expect(source).toContain('Vote / Results Onboarding Navigation Copy Plan');
    expect(source).toContain('plan only');
    expect(source).toContain('d09ae42');
    expect(source).toContain('Phase 230');

    for (const surface of [
      '/vote/:pollId',
      '/results/:pollId',
      'vote.html',
      'results.html',
      'vote-page.js',
      'result-page.js',
    ]) {
      expect(source).toContain(surface);
    }

    for (const area of [
      'Vote page participant guidance',
      'Pre-vote login/profile guidance',
      'Demo vs live vote wording',
      'Results visibility guidance',
      'Vote ↔ Results navigation',
      'Signed-in / signed-out / profile guidance',
      'result visibility',
      'demo / preview / read-only',
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
      'No new vote/auth behavior implication',
      'No eligibility disclosure',
      'No result visibility drift',
      'Demo vs live clarity',
      'Read-only results clarity',
    ]) {
      expect(source).toContain(principle);
    }

    expect(source).toContain('official-vote-pre-vote-hints.js');
    expect(source).toContain('syncVotePageLeadParagraphs');
    expect(source).toContain('syncResultsPageLeadParagraphs');
    expect(source).toContain('renderResultsReadOnlyIntro');
    expect(source).toContain('PUBLIC_VOTE_PAGE_REMINDER_LEAD');
    expect(source).toContain('PUBLIC_VOTE_PRE_VOTE_ANONYMOUS_HINT');
    expect(source).toContain('PUBLIC_VOTE_PRE_VOTE_INCOMPLETE_PROFILE_HINT');
    expect(source).toContain('PUBLIC_VOTE_SUCCESS_RESULT_HINT');
    expect(source).toContain('PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD');
    expect(source).toContain('PUBLIC_RESULTS_PAGE_LIVE_INTRO_LEAD');
    expect(source).toContain('PUBLIC_RESULTS_INTRO_LEAD_HINT');
    expect(source).toContain('PUBLIC_CTA_GO_TO_VOTE_PAGE_LABEL');
    expect(source).toContain('PUBLIC_CTA_VIEW_PUBLIC_RESULTS_LABEL');
    expect(source).toContain('resolvePublicErrorUserMessage');
    expect(source).toContain('submitVoteByIndex');
    expect(source).toContain('option_index');
    expect(source).toContain('eligibility-before-option-resolve');
    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('GET /polls/:id/results');
    expect(source).toContain('GET /users/me/profile');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('POST /registration');
    expect(source).toContain('POST /login/session');
    expect(source).toContain('no auto-login');
    expect(source).toContain('Set-Cookie');
    expect(source).toContain('does not call `GET /users/me` after success');
    expect(source).toContain('/users/me');
    expect(source).toContain('display_name');
    expect(source).toContain('positive_feedback');
    expect(source).toContain('回饋良好');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('Phase 231-R');
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
      'Poll creation / my-polls behavior changes',
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
      'phase-231-vote-results-onboarding-navigation-copy-plan-doc.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 231');
    expect(readme).toContain(PHASE_231_DOC);
    expect(readme).toContain('Vote / results onboarding navigation copy plan');
  });
});
