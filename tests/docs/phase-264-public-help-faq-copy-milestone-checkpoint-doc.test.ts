import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_264_DOC =
  'docs/www-project-phase-264-public-help-faq-copy-milestone-checkpoint-v1.md';

const PHASE_DOCS = [
  'docs/www-project-phase-256-public-help-faq-copy-refinement-plan-v1.md',
  'docs/www-project-phase-257-public-help-faq-copy-refinement-v1.md',
  'docs/www-project-phase-258-public-help-faq-copy-runtime-review-checkpoint-v1.md',
  'docs/www-project-phase-259-public-static-html-shell-copy-alignment-plan-v1.md',
  'docs/www-project-phase-260-public-static-html-shell-copy-alignment-v1.md',
  'docs/www-project-phase-261-public-static-html-shell-copy-runtime-review-checkpoint-v1.md',
  'docs/www-project-phase-262-home-account-flow-runtime-copy-token-cleanup-v1.md',
  'docs/www-project-phase-263-home-account-flow-runtime-copy-review-checkpoint-v1.md',
] as const;

describe('Phase 264 public help FAQ copy milestone checkpoint doc', () => {
  it('documents Phase 256-263 summary, fixed boundaries, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_264_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 264');
    expect(source).toContain('Public Help / FAQ Copy Milestone Checkpoint');
    expect(source).toContain('Phase 256–263 Milestone Summary');
    expect(source).toContain('fe5427c');
    expect(source).toContain(
      'Phase 256–263 public help / FAQ / static HTML shell / runtime copy cleanup work is complete for this milestone.',
    );

    for (const phase of [
      'Phase 256',
      'Phase 257',
      'Phase 258',
      'Phase 259',
      'Phase 260',
      'Phase 261',
      'Phase 262',
      'Phase 263',
    ]) {
      expect(source).toContain(phase);
    }

    for (const docPath of PHASE_DOCS) {
      expect(source).toContain(docPath.replace('docs/', './'));
    }

    for (const copyArtifact of [
      'public-page-copy.js',
      'public-mvp-ui.js',
      'creator-flow-copy.js',
      'syncHomePageAccountFlowNote',
      'sync*OnboardingCopy',
      'faq.html',
      'index.html',
      'login.html',
      'vote.html',
      'results.html',
      'create-poll.html',
      'my-polls.html',
      'constants-only',
      'side-effect-free',
      'PAGE_COPY.',
      'PUBLIC_HOME_ACCOUNT_FLOW_REGISTRATION_NOTE',
      '不會自動登入',
      'creator_session',
      'X-User-Id',
      '優質題目',
      '多種訊號',
      'presentation-only',
      'No behavior change hidden behind copy changes',
    ]) {
      expect(source).toContain(copyArtifact);
    }

    expect(source).toContain('POST /registration');
    expect(source).toContain('auto-login');
    expect(source).toContain('Set-Cookie');
    expect(source).toContain('does not call `GET /users/me` after success');
    expect(source).toContain('/users/me');
    expect(source).toContain('user_id');
    expect(source).toContain('display_name');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('eligibility-before-option-resolve');
    expect(source).toContain('result visibility');
    expect(source).toContain('option_index');
    expect(source).toContain('positive_feedback');
    expect(source).toContain('回饋良好');
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
      'hidden aggregate',
      'analytics',
      'metrics',
      'APM',
    ]) {
      expect(source).toContain(forbiddenDetail);
    }

    for (const nonGoal of [
      'no runtime change',
      'no API change',
      'no frontend behavior change',
      'no migration',
      'no schema change',
      'no CSS/HTML/JS presentation changes',
    ]) {
      expect(source).toContain(nonGoal);
    }

    for (const protectedBoundary of [
      'Raw Option Linkage Ban',
      'Official Vote transaction order',
      'vote-by-index',
      'eligibility-before-option-resolve',
      'result visibility',
    ]) {
      expect(source).toContain(protectedBoundary);
    }

    expect(source).toContain(
      'No option choice + user/session/device/request/log/trace/metric/error linkage',
    );

    expect(source).toContain(
      'APPROVED — Public help / FAQ / static HTML shell / runtime copy cleanup milestone complete (Phase 256–263); no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift identified.',
    );

    expect(source).toContain('Phase 265 blockers: none identified');

    expect(source).toContain(
      'phase-264-public-help-faq-copy-milestone-checkpoint-doc.test.ts',
    );
    expect(source).toContain('phase-264-public-help-faq-copy-milestone-checkpoint.test.ts');
    expect(source).toContain('design-drafts/');
    expect(source).toContain('migrate:check');
    expect(source).toContain('smoke:public:local');

    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 264');
    expect(readme).toContain(PHASE_264_DOC);
    expect(readme).toContain('Public help / FAQ copy milestone checkpoint');
    expect(readme).toContain('APPROVED');
    expect(readme).toContain('Phase 265 blockers: none identified');
  });
});
