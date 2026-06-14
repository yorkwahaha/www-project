import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_245_DOC =
  'docs/www-project-phase-245-public-presentation-hierarchy-milestone-checkpoint-v1.md';

const PHASE_DOCS = [
  'docs/www-project-phase-239-public-poll-card-metadata-layout-polish-v1.md',
  'docs/www-project-phase-240-public-poll-unavailable-state-presentation-polish-v1.md',
  'docs/www-project-phase-241-public-poll-detail-information-hierarchy-polish-v1.md',
  'docs/www-project-phase-242-public-results-detail-information-hierarchy-polish-v1.md',
  'docs/www-project-phase-243-creator-my-polls-action-hierarchy-polish-v1.md',
  'docs/www-project-phase-244-create-poll-form-information-hierarchy-polish-v1.md',
] as const;

describe('Phase 245 public presentation hierarchy milestone checkpoint doc', () => {
  it('documents Phase 239-244 summary, fixed boundaries, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_245_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 245');
    expect(source).toContain('Public Presentation Hierarchy Milestone Checkpoint');
    expect(source).toContain('Phase 239–244 Milestone Summary');
    expect(source).toContain('677a56d');
    expect(source).toContain(
      'Phase 239–244 public presentation hierarchy work is complete for this milestone.',
    );

    for (const phase of ['Phase 239', 'Phase 240', 'Phase 241', 'Phase 242', 'Phase 243', 'Phase 244']) {
      expect(source).toContain(phase);
    }

    for (const docPath of PHASE_DOCS) {
      expect(source).toContain(docPath.replace('docs/', './'));
    }

    for (const layoutConstant of [
      'PUBLIC_POLL_CARD_METADATA_LAYOUT_ORDER',
      'PUBLIC_UNAVAILABLE_STATE_LAYOUT_ORDER',
      'PUBLIC_VOTE_DETAIL_LAYOUT_ORDER',
      'PUBLIC_RESULTS_DETAIL_LAYOUT_ORDER',
      'PUBLIC_CREATOR_OWNED_POLL_ACTION_LAYOUT_ORDER',
      'PUBLIC_CREATE_POLL_FORM_LAYOUT_ORDER',
    ]) {
      expect(source).toContain(layoutConstant);
    }

    for (const helperModule of [
      'public-poll-card.js',
      'public-unavailable-state.js',
      'public-vote-detail-layout.js',
      'public-results-detail-layout.js',
      'public-creator-owned-poll-layout.js',
      'public-create-poll-form-layout.js',
    ]) {
      expect(source).toContain(helperModule);
    }

    for (const copyCategory of [
      'presentation-only',
      'Static HTML and JS mount alignment',
      'syncVoteDetailStatusMeta',
      'syncResultsDetailStatusMeta',
      'confirmLifecycleTransition',
      'postPollLifecycleTransition',
      'actionLayoutHosts',
      'normalizeCreatePollForm',
      'submitCreatePoll',
      'POST /creator/polls',
      'No behavior change hidden behind presentation changes',
    ]) {
      expect(source).toContain(copyCategory);
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
    expect(source).toContain('Backend/internal/foreign error messages');

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
      'APPROVED — Public presentation hierarchy milestone complete (Phase 239–244); no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift identified.',
    );

    expect(source).toContain(
      'phase-245-public-presentation-hierarchy-milestone-checkpoint-doc.test.ts',
    );
    expect(source).toContain(
      'phase-245-public-presentation-hierarchy-milestone-checkpoint.test.ts',
    );
    expect(source).toContain('design-drafts/');
    expect(source).toContain('migrate:check');
    expect(source).toContain('smoke:public:local');

    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 245');
    expect(readme).toContain(PHASE_245_DOC);
    expect(readme).toContain('Public presentation hierarchy milestone checkpoint');
  });
});
