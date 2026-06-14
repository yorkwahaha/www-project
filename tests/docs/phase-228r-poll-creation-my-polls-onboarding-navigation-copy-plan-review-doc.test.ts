import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_228R_DOC =
  'docs/www-project-phase-228r-poll-creation-my-polls-onboarding-navigation-copy-plan-review-v1.md';

const PHASE_228_DOC =
  'docs/www-project-phase-228-poll-creation-my-polls-onboarding-navigation-copy-plan-v1.md';

describe('Phase 228-R poll creation my polls onboarding navigation copy plan review doc', () => {
  it('documents review scope, Phase 228 plan, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_228R_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 228-R');
    expect(source).toContain('Poll Creation / My Polls Onboarding Navigation Copy Plan Review');
    expect(source).toContain('8118f0e');
    expect(source).toContain('Phase 228');

    for (const surface of ['/polls/new', '/my-polls', 'create-poll.html', 'my-polls.html']) {
      expect(source).toContain(surface);
    }

    for (const token of [
      'plan only',
      'copy-only',
      'creator-flow onboarding copy',
      'creator-flow-copy.js',
      'create-poll-page.js',
      'my-polls-page.js',
      'PUBLIC_CREATE_POLL_PAGE_LEAD',
      'PUBLIC_CREATOR_MY_POLLS_LEAD_HINT',
      'PUBLIC_CREATOR_ONBOARDING_MESSAGES',
      'submitCreatePollDemo',
      'submitCreatePoll',
      'demo vs',
      '?live=1',
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
      'POST /creator/polls',
      'GET /creator/session',
      'GET /creator/polls',
      'prepareMyPollsLiveSession',
      'fetchCreatorOwnedPolls',
      'CREATOR_OWNED_POLL_ALLOWED_KEYS',
      'cancel',
      'close',
      'unpublish',
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
      'Phase 229',
      'No runtime',
      PHASE_228_DOC,
    ]) {
      expect(source).toContain(token);
    }

    expect(source).toContain(
      'APPROVED — Phase 228 poll creation / my-polls onboarding navigation copy plan is safe for constrained copy-only implementation; no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift identified.',
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
      'phase-228r-poll-creation-my-polls-onboarding-navigation-copy-plan-review.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 228-R');
    expect(readme).toContain(PHASE_228R_DOC);
    expect(readme).toContain(
      'Poll creation / my-polls onboarding navigation copy plan review',
    );
  });
});
