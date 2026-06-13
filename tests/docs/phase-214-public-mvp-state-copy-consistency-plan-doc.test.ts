import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_214_DOC =
  'docs/www-project-phase-214-public-mvp-state-copy-consistency-plan-v1.md';

describe('Phase 214 public MVP state copy consistency plan doc', () => {
  it('documents plan-only state copy scope, surfaces, checklist, boundaries, and explicit non-goals', async () => {
    const source = await readFile(join(process.cwd(), PHASE_214_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 214');
    expect(source).toContain('Empty / Loading / Error State Copy Consistency Plan');
    expect(source).toContain('plan only');
    expect(source).toContain('5036ff8');
    expect(source).toContain('Phase 213');

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

    for (const area of [
      'profile completion prompt',
      'empty',
      'loading',
      'error',
      'unauthenticated',
      'profile-incomplete',
      'pre-vote hints',
      'demo',
      'live',
      'success-to-login',
    ]) {
      expect(source).toContain(area);
    }

    for (const category of [
      'Allowed Copy-Only Future Changes',
      'Page-by-Page Review Checklist',
      'Risk Classification',
      'Suggested Future Phase Sequence',
    ]) {
      expect(source).toContain(category);
    }

    expect(source).toContain('PUBLIC_PENDING_USER_MESSAGES');
    expect(source).toContain('PUBLIC_LOAD_FAILURE_USER_MESSAGES');
    expect(source).toContain('resolvePublicErrorUserMessage');
    expect(source).toContain('renderPublicInlineErrorNote');
    expect(source).toContain('profile-completion-prompt.js');
    expect(source).toContain('official-vote-pre-vote-hints.js');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('POST /registration');
    expect(source).toContain('no auto-login');
    expect(source).toContain('Set-Cookie');
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
    expect(source).toContain('Phase 214-R');
    expect(source).toContain('review checkpoint');
    expect(source).toContain('migrate:check');

    for (const nonGoal of [
      'DB / schema / migration',
      'API contract / payload changes',
      'Auth / session / `UserAuthResolver` changes',
      'Registration auto-login or cookie issuance',
      'New profile fields beyond `birth_year_month` / `residential_region`',
      'Vote transaction / eligibility evaluator changes',
      'Result visibility / result evaluator changes',
      'Reference Answer integration changes',
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
      'phase-214-public-mvp-state-copy-consistency-plan-doc.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 214');
    expect(readme).toContain(PHASE_214_DOC);
    expect(readme).toContain('state copy consistency plan');
  });
});
