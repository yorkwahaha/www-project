import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_214R_DOC =
  'docs/www-project-phase-214r-public-mvp-state-copy-consistency-plan-review-checkpoint-v1.md';

const PHASE_214_DOC =
  'docs/www-project-phase-214-public-mvp-state-copy-consistency-plan-v1.md';

describe('Phase 214-R public MVP state copy consistency plan review checkpoint doc', () => {
  it('documents review scope, Phase 214 plan, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_214R_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 214-R');
    expect(source).toContain('State Copy Consistency Plan Review Checkpoint');
    expect(source).toContain('1eba2bb');
    expect(source).toContain('Phase 214');

    for (const surface of [
      '/',
      '/explore',
      '/vote/:pollId',
      '/results/:pollId',
      '/login',
      '/registration',
      '/profile',
      '/polls/new',
      '/my-polls',
    ]) {
      expect(source).toContain(surface);
    }

    for (const token of [
      'plan only',
      'copy-only',
      'PUBLIC_PENDING_USER_MESSAGES',
      'PUBLIC_LOAD_FAILURE_USER_MESSAGES',
      'resolvePublicErrorUserMessage',
      'renderPublicInlineErrorNote',
      'official-vote-pre-vote-hints.js',
      'profile-completion-prompt.js',
      'backend/internal error payloads',
      'eligibility result',
      'result visibility',
      'demo/live',
      'debug details',
      'request id',
      'option id',
      'internal codes',
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
      'Phase 215',
      'No runtime',
      'www-project-phase-214-public-mvp-state-copy-consistency-plan-v1.md',
    ]) {
      expect(source).toContain(token);
    }

    expect(source).toContain(
      'APPROVED — Phase 214 plan is safe for a constrained copy-only implementation; no runtime/API/DB/backend/auth/vote/result/privacy drift identified.',
    );

    expect(source).toContain(
      'No option choice + user/session/device/request/log/trace/metric/error linkage',
    );

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
      'phase-214r-public-mvp-state-copy-consistency-plan-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 214-R');
    expect(readme).toContain(PHASE_214R_DOC);
    expect(readme).toContain('state copy consistency plan review checkpoint');
  });
});
