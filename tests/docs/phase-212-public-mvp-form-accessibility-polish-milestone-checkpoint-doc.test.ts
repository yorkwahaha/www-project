import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_212_DOC =
  'docs/www-project-phase-212-public-mvp-form-accessibility-polish-milestone-checkpoint-v1.md';

describe('Phase 212 public MVP form accessibility polish milestone checkpoint doc', () => {
  it('documents Phase 203-211 summary, fixed boundaries, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_212_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 212');
    expect(source).toContain('Public MVP Form Accessibility Polish Milestone Checkpoint');
    expect(source).toContain('Phase 203–211 Milestone Summary');
    expect(source).toContain('Docs/checkpoint only');
    expect(source).toContain('ee37eb9');

    for (const phase of [
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
    ]) {
      expect(source).toContain(phase);
    }

    for (const polishCategory of [
      'accessibility',
      'readability',
      'form labeling',
      'helper copy',
      'focus/touch target',
      'presentation polish',
    ]) {
      expect(source).toContain(polishCategory);
    }

    for (const pageClass of [
      'login-page',
      'registration-page',
      'profile-page',
      'create-poll-page',
      'my-polls-page',
    ]) {
      expect(source).toContain(pageClass);
    }

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
      'APPROVED — Public MVP form accessibility polish milestone complete; no runtime/API/DB/backend/auth/vote/result/privacy drift identified.',
    );

    expect(source).toContain(
      'phase-212-public-mvp-form-accessibility-polish-milestone-checkpoint-doc.test.ts',
    );
    expect(source).toContain(
      'phase-212-public-mvp-form-accessibility-polish-milestone-checkpoint.test.ts',
    );
    expect(source).toContain('design-drafts/');
    expect(source).toContain('migrate:check');
    expect(source).toContain('smoke:public:local');

    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 212');
    expect(readme).toContain(PHASE_212_DOC);
    expect(readme).toContain('Public MVP form accessibility polish milestone checkpoint');
  });
});
