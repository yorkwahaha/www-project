import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_261_DOC =
  'docs/www-project-phase-261-public-static-html-shell-copy-runtime-review-checkpoint-v1.md';
const PHASE_260_DOC =
  'docs/www-project-phase-260-public-static-html-shell-copy-alignment-v1.md';

describe('Phase 261 public static HTML shell copy runtime review checkpoint doc', () => {
  it('documents review scope, Phase 260 delivery, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_261_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 261');
    expect(source).toContain('Public Static HTML Shell Copy Runtime Review Checkpoint');
    expect(source).toContain('7a99bc3');
    expect(source).toContain('Phase 260');
    expect(source).toContain(PHASE_260_DOC);

    for (const shell of [
      'index.html',
      'login.html',
      'vote.html',
      'results.html',
      'create-poll.html',
      'my-polls.html',
      'faq.html',
      'registration.html',
      'profile.html',
      'explore.html',
      'trust-levels.html',
    ]) {
      expect(source).toContain(shell);
    }

    for (const token of [
      'static fallback',
      'presentation/static-fallback-copy-only',
      'public-page-copy.js',
      'syncHomePageOnboardingCopy',
      'syncLoginPageOnboardingCopy',
      'syncVotePageOnboardingCopy',
      'syncResultsPageOnboardingCopy',
      'syncCreatePollPageOnboardingCopy',
      'syncMyPollsPageOnboardingCopy',
      'syncHomePageAccountFlowNote',
      'Phase 262 candidate',
      'public/frontend/*.js',
      'public-mvp.css',
      '優質題目',
      'X-User-Id',
      'creator_session',
      'option_index',
      'eligibility-before-option-resolve',
      'UserAuthResolver',
      'POST /registration',
      'Set-Cookie',
      'auto-login',
      'user_id',
      'display_name',
      'birth_year_month',
      'residential_region',
      'quality_badge',
      'positive_feedback',
      '回饋良好',
      'Raw Option Linkage Ban',
      'Official Vote transaction order',
      'vote-by-index',
      'ranking',
      'recommendation',
      'personalization',
      'trust',
      'creator score',
      'governance',
      'tooltip',
      'debug',
      'explanation',
      'counts',
      'score',
      'rank',
      'hidden aggregate',
      'localStorage',
      'sessionStorage',
      'analytics',
      'APPROVED',
      'No runtime change',
      'Phase 262 blockers: none identified',
      'migrate:check',
      'smoke:public:local',
    ]) {
      expect(source).toContain(token);
    }

    expect(source).toContain(
      'APPROVED — Phase 260 public static HTML shell fallback copy alignment is presentation/static-fallback-copy-only; no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift identified.',
    );

    expect(source).toContain(
      'No option choice + user/session/device/request/log/trace/metric/error linkage',
    );

    expect(source).toContain(
      'phase-261-public-static-html-shell-copy-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'phase-260-public-static-html-shell-copy-alignment.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 261');
    expect(readme).toContain(PHASE_261_DOC);
    expect(readme).toContain('Public static HTML shell copy runtime review checkpoint');
  });
});
