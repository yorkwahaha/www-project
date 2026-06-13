import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_213_DOC =
  'docs/www-project-phase-213-public-mvp-mobile-form-accessibility-final-review-checkpoint-v1.md';

describe('Phase 213 public MVP mobile and form accessibility final review checkpoint doc', () => {
  it('documents Phase 201-212 summary, fixed boundaries, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_213_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 213');
    expect(source).toContain('Public MVP Mobile and Form Accessibility Polish Final Review Checkpoint');
    expect(source).toContain('Phase 201–212 Final Review Summary');
    expect(source).toContain('Docs/final checkpoint only');
    expect(source).toContain('3b7fddc');

    for (const phase of [
      'Phase 201',
      'Phase 202',
      'Phase 203',
      'Phase 203-R',
      'Phase 204',
      'Phase 205',
      'Phase 206',
      'Phase 207',
      'Phase 208',
      'Phase 209',
      'Phase 210',
      'Phase 211',
      'Phase 212',
    ]) {
      expect(source).toContain(phase);
    }

    for (const polishCategory of [
      'presentation',
      'readability',
      'mobile layout',
      'form labeling',
      'helper copy',
      'focus states',
      'touch targets',
      'accessibility polish',
    ]) {
      expect(source).toContain(polishCategory);
    }

    for (const pageClass of [
      'explore-page',
      'vote-page',
      'results-page',
      'login-page',
      'registration-page',
      'profile-page',
      'create-poll-page',
      'my-polls-page',
    ]) {
      expect(source).toContain(pageClass);
    }

    for (const surface of [
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

    expect(source).toContain('did not change API behavior');
    expect(source).toContain('POST /login/session');
    expect(source).toContain('POST /registration');
    expect(source).toContain('auto-login');
    expect(source).toContain('Set-Cookie');
    expect(source).toContain('/users/me');
    expect(source).toContain('user_id');
    expect(source).toContain('display_name');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('GET /users/me/profile');
    expect(source).toContain('PUT /users/me/profile');
    expect(source).toContain('POST /creator/polls');
    expect(source).toContain('GET /creator/session');
    expect(source).toContain('GET /creator/polls');
    expect(source).toContain('CREATOR_OWNED_POLL_ALLOWED_KEYS');

    expect(source).toContain('positive_feedback');
    expect(source).toContain('回饋良好');
    expect(source).toContain('option_index');
    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('vote-by-index');
    expect(source).toContain('eligibility-before-option-resolve');
    expect(source).toContain('result visibility');
    expect(source).toContain('UserAuthResolver');

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

    expect(source).toContain('localStorage');
    expect(source).toContain('sessionStorage');
    expect(source).toContain('cookie');

    for (const nonGoal of [
      'no runtime change',
      'no API change',
      'no frontend change',
      'no migration',
      'no schema change',
      'no CSS/HTML/JS changes',
    ]) {
      expect(source).toContain(nonGoal);
    }

    for (const protectedBoundary of [
      'Raw Option Linkage Ban',
      'Official Vote transaction order',
      'vote-by-index',
      'eligibility-before-option-resolve',
      'result visibility',
      'Profile fields',
    ]) {
      expect(source).toContain(protectedBoundary);
    }

    expect(source).toContain(
      'No option choice + user/session/device/request/log/trace/metric/error linkage',
    );

    expect(source).toContain(
      'APPROVED — Public MVP mobile readability and form accessibility polish complete; no runtime/API/DB/backend/auth/vote/result/privacy drift identified.',
    );

    expect(source).toContain(
      'phase-213-public-mvp-mobile-form-accessibility-final-review-checkpoint-doc.test.ts',
    );
    expect(source).toContain(
      'phase-213-public-mvp-mobile-form-accessibility-final-review-checkpoint.test.ts',
    );
    expect(source).toContain('design-drafts/');
    expect(source).toContain('migrate:check');
    expect(source).toContain('smoke:public:local');

    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 213');
    expect(readme).toContain(PHASE_213_DOC);
    expect(readme).toContain('Public MVP mobile and form accessibility polish final review checkpoint');
  });
});
