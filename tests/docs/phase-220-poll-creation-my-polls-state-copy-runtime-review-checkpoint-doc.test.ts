import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_220_DOC =
  'docs/www-project-phase-220-poll-creation-my-polls-state-copy-runtime-review-checkpoint-v1.md';
const PHASE_219_DOC =
  'docs/www-project-phase-219-poll-creation-my-polls-state-copy-runtime-v1.md';

describe('Phase 220 poll creation my polls state copy runtime review checkpoint doc', () => {
  it('documents review scope, Phase 219 delivery, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_220_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 220');
    expect(source).toContain('State Copy Runtime Review Checkpoint');
    expect(source).toContain('b7bebbc');
    expect(source).toContain('Phase 219');

    for (const surface of ['/polls/new', '/my-polls', 'my-polls?live=1']) {
      expect(source).toContain(surface);
    }

    for (const token of [
      'copy-only',
      'PUBLIC_CREATOR_STATE_USER_MESSAGES',
      'PUBLIC_CREATE_POLL_SUBMIT_PENDING_MESSAGE',
      'PUBLIC_CREATE_POLL_FAILURE_MESSAGE',
      'PUBLIC_CREATOR_SESSION_FAILURE_MESSAGE',
      'PUBLIC_CREATE_POLL_USER_ERROR_MESSAGES',
      'create-poll-page.js',
      'my-polls-page.js',
      'poll-lifecycle-controls.js',
      'resolvePublicErrorUserMessage',
      'backend/internal error',
      'POST /creator/polls',
      'GET /creator/session',
      'GET /creator/polls',
      'prepareMyPollsLiveSession',
      'fetchCreatorOwnedPolls',
      'owned-list',
      'Demo/live',
      '展示用',
      '不儲存',
      'birth_year_month',
      'residential_region',
      'auto-login',
      'Set-Cookie',
      '/users/me',
      'user_id',
      'display_name',
      'option_index',
      'quality_badge',
      '回饋良好',
      'positive_feedback',
      'Raw Option Linkage Ban',
      'Official Vote transaction order',
      'vote-by-index',
      'eligibility-before-option-resolve',
      'result visibility',
      'debug details',
      'request id',
      'trace id',
      'internal code',
      'APPROVED',
      PHASE_219_DOC,
    ]) {
      expect(source).toContain(token);
    }

    expect(source).toContain(
      'APPROVED — Phase 219 Poll Creation / My Polls state copy runtime patch is copy-only; no runtime/API/DB/backend/auth/creator/lifecycle/result/privacy drift identified.',
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
      'phase-220-poll-creation-my-polls-state-copy-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 220');
    expect(readme).toContain(PHASE_220_DOC);
    expect(readme).toContain('state copy runtime review checkpoint');
  });
});
