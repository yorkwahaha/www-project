import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_237_DOC =
  'docs/www-project-phase-237-faq-onboarding-help-copy-runtime-review-checkpoint-v1.md';
const PHASE_236_DOC =
  'docs/www-project-phase-236-faq-onboarding-help-copy-runtime-v1.md';

describe('Phase 237 faq onboarding help copy runtime review checkpoint doc', () => {
  it('documents review scope, Phase 236 delivery, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_237_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 237');
    expect(source).toContain('FAQ Onboarding / Help Copy Runtime Review Checkpoint');
    expect(source).toContain('5f9c6cb');
    expect(source).toContain('Phase 236');

    for (const surface of ['/faq', 'faq.html', 'faq-page.js', 'public-mvp-ui.js']) {
      expect(source).toContain(surface);
    }

    for (const token of [
      'copy-only',
      'PUBLIC_FAQ_ONBOARDING_MESSAGES',
      'syncFaqPageOnboardingCopy',
      'bootstrapFaqPage',
      'registration → login → profile',
      'create poll → my-polls',
      'vote → results',
      'X-User-Id',
      'creator_session',
      'production user-auth wiring later',
      '正式投票',
      '試填作答',
      'Official Vote',
      'Reference Answer',
      '不會自動登入',
      'profile completion guarantees voting eligibility',
      'collecting / result visibility',
      'fetch',
      'storage',
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
      PHASE_236_DOC,
    ]) {
      expect(source).toContain(token);
    }

    expect(source).toContain(
      'APPROVED — Phase 236 FAQ onboarding / help copy runtime patch is copy-only; no runtime/API/DB/backend/auth/vote/result/creator/privacy drift identified.',
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
      'phase-237-faq-onboarding-help-copy-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 237');
    expect(readme).toContain(PHASE_237_DOC);
    expect(readme).toContain('FAQ onboarding / help copy runtime review checkpoint');
  });
});
