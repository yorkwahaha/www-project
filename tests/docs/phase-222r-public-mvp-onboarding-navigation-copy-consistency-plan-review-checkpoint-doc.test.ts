import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_222R_DOC =
  'docs/www-project-phase-222r-public-mvp-onboarding-navigation-copy-consistency-plan-review-checkpoint-v1.md';

const PHASE_222_DOC =
  'docs/www-project-phase-222-public-mvp-onboarding-navigation-copy-consistency-plan-v1.md';

describe('Phase 222-R public MVP onboarding navigation copy consistency plan review checkpoint doc', () => {
  it('documents review scope, Phase 222 plan, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_222R_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 222-R');
    expect(source).toContain('Onboarding / Navigation Copy Consistency Plan Review Checkpoint');
    expect(source).toContain('69706af');
    expect(source).toContain('Phase 222');

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

    for (const token of [
      'plan only',
      'copy-only',
      'auth-state-copy.js',
      'profile-completion-prompt.js',
      'official-vote-pre-vote-hints.js',
      'backend/internal error payloads',
      'eligibility',
      'result visibility',
      'demo/live',
      'debug details',
      'request id',
      'option id',
      'internal codes',
      'hidden counters',
      'internal lifecycle',
      'POST /login/session',
      'POST /registration',
      'auto-login',
      'Set-Cookie',
      'birth_year_month',
      'residential_region',
      'display_name',
      '/users/me/profile',
      'user_id',
      'submitCreatePollDemo',
      'POST /creator/polls',
      'prepareMyPollsLiveSession',
      'fetchCreatorOwnedPolls',
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
      'Phase 223',
      'No runtime',
      'www-project-phase-222-public-mvp-onboarding-navigation-copy-consistency-plan-v1.md',
    ]) {
      expect(source).toContain(token);
    }

    expect(source).toContain(
      'APPROVED — Phase 222 onboarding/navigation copy consistency plan is safe for constrained copy-only implementation; no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift identified.',
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
    expect(source).toContain(
      'phase-222r-public-mvp-onboarding-navigation-copy-consistency-plan-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 222-R');
    expect(readme).toContain(PHASE_222R_DOC);
    expect(readme).toContain(
      'onboarding navigation copy consistency plan review checkpoint',
    );
  });
});
