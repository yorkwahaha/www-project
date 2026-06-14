import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_230_DOC =
  'docs/www-project-phase-230-poll-creation-my-polls-onboarding-navigation-copy-runtime-review-checkpoint-v1.md';
const PHASE_229_DOC =
  'docs/www-project-phase-229-poll-creation-my-polls-onboarding-navigation-copy-runtime-v1.md';

describe('Phase 230 poll creation my polls onboarding navigation copy runtime review checkpoint doc', () => {
  it('documents review scope, Phase 229 delivery, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_230_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 230');
    expect(source).toContain('Onboarding Navigation Copy Runtime Review Checkpoint');
    expect(source).toContain('2577e57');
    expect(source).toContain('Phase 229');

    for (const token of [
      'copy-only',
      'PUBLIC_CREATOR_ONBOARDING_MESSAGES',
      'creator-flow-copy.js',
      'create-poll-page.js',
      'my-polls-page.js',
      'create-poll.html',
      'my-polls.html',
      'syncCreatePollPageOnboardingCopy',
      'syncMyPollsPageOnboardingCopy',
      'create-poll-page-banner',
      'my-polls-quota-panel-body',
      'create-poll-my-polls-nav-hint',
      'my-polls-create-poll-nav-hint',
      'parseLiveApiMode',
      '?live=1',
      'POST /creator/polls',
      'GET /creator/session',
      'GET /creator/polls',
      'CREATOR_OWNED_POLL_ALLOWED_KEYS',
      'POST /registration',
      'POST /login/session',
      'registration',
      'login',
      'profile',
      'auth',
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
      'option id',
      'APPROVED',
      PHASE_229_DOC,
    ]) {
      expect(source).toContain(token);
    }

    expect(source).toContain(
      'APPROVED — Phase 229 poll creation / my-polls onboarding navigation copy runtime patch is copy-only; no runtime/API/DB/backend/auth/registration/profile/vote/result/creator/privacy drift identified.',
    );

    expect(source).toContain(
      'No option choice + user/session/device/request/log/trace/metric/error linkage',
    );

    for (const governanceDetail of [
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
      expect(source).toContain(governanceDetail);
    }

    expect(source).toContain('migrate:check');
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'phase-230-poll-creation-my-polls-onboarding-navigation-copy-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 230');
    expect(readme).toContain(PHASE_230_DOC);
    expect(readme).toContain('onboarding navigation copy runtime review checkpoint');
  });
});
