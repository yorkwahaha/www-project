import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_221_DOC =
  'docs/www-project-phase-221-public-mvp-state-copy-consistency-milestone-checkpoint-v1.md';

const PHASE_DOCS = [
  'docs/www-project-phase-214-public-mvp-state-copy-consistency-plan-v1.md',
  'docs/www-project-phase-214r-public-mvp-state-copy-consistency-plan-review-checkpoint-v1.md',
  'docs/www-project-phase-215-explore-vote-results-state-copy-runtime-v1.md',
  'docs/www-project-phase-216-explore-vote-results-state-copy-runtime-review-checkpoint-v1.md',
  'docs/www-project-phase-217-login-registration-profile-state-copy-runtime-v1.md',
  'docs/www-project-phase-218-login-registration-profile-state-copy-runtime-review-checkpoint-v1.md',
  'docs/www-project-phase-219-poll-creation-my-polls-state-copy-runtime-v1.md',
  'docs/www-project-phase-220-poll-creation-my-polls-state-copy-runtime-review-checkpoint-v1.md',
] as const;

describe('Phase 221 public MVP state copy consistency milestone checkpoint doc', () => {
  it('documents Phase 214-220 summary, fixed boundaries, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_221_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 221');
    expect(source).toContain('Public MVP State Copy Consistency Milestone Checkpoint');
    expect(source).toContain('Phase 214–220 Milestone Summary');
    expect(source).toContain('d31143f');
    expect(source).toContain(
      'Phase 214–220 state copy work is complete for this milestone.',
    );

    for (const phase of [
      'Phase 214',
      'Phase 214-R',
      'Phase 215',
      'Phase 216',
      'Phase 217',
      'Phase 218',
      'Phase 219',
      'Phase 220',
    ]) {
      expect(source).toContain(phase);
    }

    for (const docPath of PHASE_DOCS) {
      expect(source).toContain(docPath.replace('docs/', './'));
    }

    for (const copyCategory of [
      'PUBLIC_PENDING_USER_MESSAGES',
      'PUBLIC_LOAD_FAILURE_USER_MESSAGES',
      'PUBLIC_AUTH_STATE_USER_MESSAGES',
      'PUBLIC_CREATOR_STATE_USER_MESSAGES',
      'resolvePublicErrorUserMessage',
      'frontend-owned state copy constants',
    ]) {
      expect(source).toContain(copyCategory);
    }

    expect(source).toContain('GET /polls/feed');
    expect(source).toContain('POST /login/session');
    expect(source).toContain('POST /registration');
    expect(source).toContain('auto-login');
    expect(source).toContain('Set-Cookie');
    expect(source).toContain('does not call `GET /users/me` after success');
    expect(source).toContain('/users/me');
    expect(source).toContain('user_id');
    expect(source).toContain('display_name');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('/users/me/profile');
    expect(source).toContain('POST /creator/polls');
    expect(source).toContain('GET /creator/session');
    expect(source).toContain('GET /creator/polls');
    expect(source).toContain('CREATOR_OWNED_POLL_ALLOWED_KEYS');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('eligibility-before-option-resolve');
    expect(source).toContain('result visibility');
    expect(source).toContain('option_index');
    expect(source).toContain('positive_feedback');
    expect(source).toContain('回饋良好');
    expect(source).toContain('Backend/internal/foreign error messages');
    expect(source).toContain('request id');
    expect(source).toContain('trace id');
    expect(source).toContain('internal code');
    expect(source).toContain('option id');

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

    for (const nonGoal of [
      'no runtime change',
      'no API change',
      'no frontend change',
      'no migration',
      'no schema change',
      'no CSS/HTML/JS copy changes',
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
      'APPROVED — Public MVP state copy consistency milestone complete; no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift identified.',
    );

    expect(source).toContain(
      'phase-221-public-mvp-state-copy-consistency-milestone-checkpoint-doc.test.ts',
    );
    expect(source).toContain(
      'phase-221-public-mvp-state-copy-consistency-milestone-checkpoint.test.ts',
    );
    expect(source).toContain('design-drafts/');
    expect(source).toContain('migrate:check');

    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 221');
    expect(readme).toContain(PHASE_221_DOC);
    expect(readme).toContain('state copy consistency milestone checkpoint');
  });
});
