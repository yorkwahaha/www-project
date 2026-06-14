import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_231R_DOC =
  'docs/www-project-phase-231r-vote-results-onboarding-navigation-copy-plan-review-v1.md';

const PHASE_231_DOC =
  'docs/www-project-phase-231-vote-results-onboarding-navigation-copy-plan-v1.md';

describe('Phase 231-R vote results onboarding navigation copy plan review doc', () => {
  it('documents review scope, Phase 231 plan, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_231R_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 231-R');
    expect(source).toContain('Vote / Results Onboarding Navigation Copy Plan Review');
    expect(source).toContain('8de0c01');
    expect(source).toContain('Phase 231');

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

    for (const token of [
      'plan only',
      'copy-only',
      'participant-flow onboarding copy',
      'official-vote-pre-vote-hints.js',
      'vote-page.js',
      'result-page.js',
      'PUBLIC_VOTE_PAGE_REMINDER_LEAD',
      'PUBLIC_VOTE_PRE_VOTE_ANONYMOUS_HINT',
      'PUBLIC_VOTE_PRE_VOTE_INCOMPLETE_PROFILE_HINT',
      'PUBLIC_VOTE_SUCCESS_RESULT_HINT',
      'PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD',
      'PUBLIC_RESULTS_PAGE_LIVE_INTRO_LEAD',
      'PUBLIC_RESULTS_INTRO_LEAD_HINT',
      'PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES',
      'syncResultsPageLeadParagraphs',
      'renderResultsReadOnlyIntro',
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
      '/users/me/profile',
      'user_id',
      'GET /polls/:id/results',
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
      'Phase 232',
      'No runtime',
      PHASE_231_DOC,
    ]) {
      expect(source).toContain(token);
    }

    expect(source).toContain(
      'APPROVED — Phase 231 vote / results onboarding navigation copy plan is safe for constrained copy-only implementation; no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift identified.',
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
      'phase-231r-vote-results-onboarding-navigation-copy-plan-review.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 231-R');
    expect(readme).toContain(PHASE_231R_DOC);
    expect(readme).toContain(
      'Vote / results onboarding navigation copy plan review',
    );
  });
});
