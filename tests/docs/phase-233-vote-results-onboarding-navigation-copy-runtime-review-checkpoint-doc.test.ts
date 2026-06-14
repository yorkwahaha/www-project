import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_233_DOC =
  'docs/www-project-phase-233-vote-results-onboarding-navigation-copy-runtime-review-checkpoint-v1.md';
const PHASE_232_DOC =
  'docs/www-project-phase-232-vote-results-onboarding-navigation-copy-runtime-v1.md';

describe('Phase 233 vote results onboarding navigation copy runtime review checkpoint doc', () => {
  it('documents review scope, Phase 232 delivery, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_233_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 233');
    expect(source).toContain('Onboarding Navigation Copy Runtime Review Checkpoint');
    expect(source).toContain('49675bd');
    expect(source).toContain('Phase 232');

    for (const surface of ['/vote/:pollId', '/results/:pollId']) {
      expect(source).toContain(surface);
    }

    for (const token of [
      'copy-only',
      'PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES',
      'syncVotePageOnboardingCopy',
      'syncResultsPageOnboardingCopy',
      'syncResultsPageLeadParagraphs',
      'vote-page.js',
      'result-page.js',
      'vote.html',
      'results.html',
      'buildPublicResultPath',
      'buildPublicVotePath',
      '不代表一定可以完成投票',
      'eligibility result',
      'result visibility',
      'demo/live',
      'demoOnly',
      'debug details',
      'request id',
      'trace id',
      'option id',
      'internal code',
      'POST /registration',
      'POST /login/session',
      'auto-login',
      'option_index',
      'quality_badge',
      '回饋良好',
      'positive_feedback',
      'Raw Option Linkage Ban',
      'Official Vote transaction order',
      'vote-by-index',
      'eligibility-before-option-resolve',
      'APPROVED',
      PHASE_232_DOC,
    ]) {
      expect(source).toContain(token);
    }

    expect(source).toContain(
      'APPROVED — Phase 232 vote / results onboarding navigation copy runtime patch is copy-only; no runtime/API/DB/backend/auth/vote/result/creator/privacy drift identified.',
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
      'phase-233-vote-results-onboarding-navigation-copy-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 233');
    expect(readme).toContain(PHASE_233_DOC);
    expect(readme).toContain('onboarding navigation copy runtime review checkpoint');
  });
});
