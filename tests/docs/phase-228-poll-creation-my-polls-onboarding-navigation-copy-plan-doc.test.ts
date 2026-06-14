import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_228_DOC =
  'docs/www-project-phase-228-poll-creation-my-polls-onboarding-navigation-copy-plan-v1.md';

describe('Phase 228 poll creation my polls onboarding navigation copy plan doc', () => {
  it('documents plan-only creator onboarding scope, surfaces, checklist, boundaries, and explicit non-goals', async () => {
    const source = await readFile(join(process.cwd(), PHASE_228_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 228');
    expect(source).toContain('Poll Creation / My Polls Onboarding Navigation Copy Plan');
    expect(source).toContain('plan only');
    expect(source).toContain('878dfae');
    expect(source).toContain('Phase 227');

    for (const surface of ['/polls/new', '/my-polls', 'create-poll.html', 'my-polls.html']) {
      expect(source).toContain(surface);
    }

    for (const area of [
      'Poll creation page guidance',
      'Demo vs live creation wording',
      'My Polls management guidance',
      'Create ↔ My Polls navigation',
      'Signed-in / signed-out guidance',
      'creator/session flow',
      'post-create success',
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
      'No new creator/auth behavior implication',
      'No vote/result visibility drift',
      'Demo vs live clarity',
    ]) {
      expect(source).toContain(principle);
    }

    expect(source).toContain('creator-flow-copy.js');
    expect(source).toContain('create-poll-page.js');
    expect(source).toContain('my-polls-page.js');
    expect(source).toContain('PUBLIC_CREATE_POLL_PAGE_LEAD');
    expect(source).toContain('PUBLIC_MY_POLLS_PAGE_LEAD');
    expect(source).toContain('PUBLIC_CREATOR_CREATE_SUCCESS_LEAD_HINT');
    expect(source).toContain('PUBLIC_CREATOR_MY_POLLS_LEAD_HINT');
    expect(source).toContain('resolvePublicErrorUserMessage');
    expect(source).toContain('POST /creator/polls');
    expect(source).toContain('GET /creator/session');
    expect(source).toContain('GET /creator/polls');
    expect(source).toContain('prepareMyPollsLiveSession');
    expect(source).toContain('fetchCreatorOwnedPolls');
    expect(source).toContain('CREATOR_OWNED_POLL_ALLOWED_KEYS');
    expect(source).toContain('submitCreatePoll');
    expect(source).toContain('?live=1');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('POST /registration');
    expect(source).toContain('POST /login/session');
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
    expect(source).toContain('Phase 228-R');
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
      'Creator session / ownership / lifecycle behavior changes',
      'Poll creation delete / close / cancel / unpublish behavior changes',
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
      'phase-228-poll-creation-my-polls-onboarding-navigation-copy-plan-doc.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 228');
    expect(readme).toContain(PHASE_228_DOC);
    expect(readme).toContain('Poll creation / my-polls onboarding navigation copy plan');
  });
});
