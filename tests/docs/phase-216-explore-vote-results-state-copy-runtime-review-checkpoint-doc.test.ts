import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_216_DOC =
  'docs/www-project-phase-216-explore-vote-results-state-copy-runtime-review-checkpoint-v1.md';
const PHASE_215_DOC =
  'docs/www-project-phase-215-explore-vote-results-state-copy-runtime-v1.md';

describe('Phase 216 explore vote results state copy runtime review checkpoint doc', () => {
  it('documents review scope, Phase 215 delivery, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_216_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 216');
    expect(source).toContain('State Copy Runtime Review Checkpoint');
    expect(source).toContain('1ce4731');
    expect(source).toContain('Phase 215');

    for (const surface of ['/explore', '/vote/:pollId', '/results/:pollId']) {
      expect(source).toContain(surface);
    }

    for (const token of [
      'copy-only',
      'PUBLIC_EXPLORE_LOAD_MORE_UNAVAILABLE_MESSAGE',
      'PUBLIC_VOTE_PRE_VOTE_PROFILE_LOAD_FAILED_HINT',
      'PUBLIC_RESULTS_PAGE_LIVE_INTRO_LEAD',
      'syncResultsPageLeadParagraphs',
      'official-vote-pre-vote-hints.js',
      'resolvePublicErrorUserMessage',
      'backend/internal error',
      'eligibility result',
      'result visibility',
      'demo/live',
      'debug details',
      'request id',
      'trace id',
      'option id',
      'internal code',
      'POST /login/session',
      'POST /registration',
      'auto-login',
      'Set-Cookie',
      'birth_year_month',
      'residential_region',
      'display_name',
      '/users/me/profile',
      'user_id',
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
      'www-project-phase-215-explore-vote-results-state-copy-runtime-v1.md',
    ]) {
      expect(source).toContain(token);
    }

    expect(source).toContain(
      'APPROVED — Phase 215 Explore / Vote / Results state copy runtime patch is copy-only; no runtime/API/DB/backend/auth/vote/result/privacy drift identified.',
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
      'phase-216-explore-vote-results-state-copy-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 216');
    expect(readme).toContain(PHASE_216_DOC);
    expect(readme).toContain('state copy runtime review checkpoint');
  });
});
