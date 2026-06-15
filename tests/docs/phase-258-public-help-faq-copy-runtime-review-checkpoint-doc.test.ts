import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_258_DOC =
  'docs/www-project-phase-258-public-help-faq-copy-runtime-review-checkpoint-v1.md';
const PHASE_257_DOC =
  'docs/www-project-phase-257-public-help-faq-copy-refinement-v1.md';

describe('Phase 258 public help / FAQ copy runtime review checkpoint doc', () => {
  it('documents review scope, Phase 257 delivery, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_258_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 258');
    expect(source).toContain('Public Help / FAQ Copy Runtime Review Checkpoint');
    expect(source).toContain('8828d74');
    expect(source).toContain('Phase 257');
    expect(source).toContain(PHASE_257_DOC);

    for (const surface of [
      'public-page-copy.js',
      'public-mvp-ui.js',
      'creator-flow-copy.js',
      'public/faq.html',
      'PAGE_COPY',
      'PUBLIC_FAQ_ONBOARDING_MESSAGES',
    ]) {
      expect(source).toContain(surface);
    }

    for (const token of [
      'copy-only',
      'constants-only',
      'side-effect-free',
      'presentation/copy-only',
      'static fallback',
      'fetch',
      'addEventListener',
      'localStorage',
      'sessionStorage',
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
      '優質題目',
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
      'APPROVED',
      'No runtime change',
      'Phase 259 blockers: none identified',
      'migrate:check',
      'smoke:public:local',
    ]) {
      expect(source).toContain(token);
    }

    expect(source).toContain(
      'APPROVED — Phase 257 public help / FAQ copy refinement is presentation/copy-only; no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift identified.',
    );

    expect(source).toContain(
      'No option choice + user/session/device/request/log/trace/metric/error linkage',
    );

    expect(source).toContain(
      'phase-258-public-help-faq-copy-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'phase-257-public-help-faq-copy-refinement.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 258');
    expect(readme).toContain(PHASE_258_DOC);
    expect(readme).toContain('Public help / FAQ copy runtime review checkpoint');
  });
});
