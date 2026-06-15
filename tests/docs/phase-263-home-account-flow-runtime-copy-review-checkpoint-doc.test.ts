import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_263_DOC =
  'docs/www-project-phase-263-home-account-flow-runtime-copy-review-checkpoint-v1.md';
const PHASE_262_DOC =
  'docs/www-project-phase-262-home-account-flow-runtime-copy-token-cleanup-v1.md';

describe('Phase 263 home account flow runtime copy review checkpoint doc', () => {
  it('documents review scope, Phase 262 delivery, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_263_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 263');
    expect(source).toContain('Home Account Flow Runtime Copy Review Checkpoint');
    expect(source).toContain('b4c0a5e');
    expect(source).toContain('Phase 262');
    expect(source).toContain(PHASE_262_DOC);

    for (const token of [
      'syncHomePageAccountFlowNote',
      'public-mvp-home.js',
      'public-page-copy.js',
      'public/index.html',
      'creator_session',
      'X-User-Id',
      '不會自動登入',
      'presentation/copy-only',
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
      'Phase 264 blockers: none identified',
      'migrate:check',
      'smoke:public:local',
    ]) {
      expect(source).toContain(token);
    }

    expect(source).toContain(
      'phase-263-home-account-flow-runtime-copy-review-checkpoint-doc.test.ts',
    );
    expect(source).toContain('phase-263-home-account-flow-runtime-copy-review-checkpoint.test.ts');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 263');
    expect(readme).toContain(PHASE_263_DOC);
    expect(readme).toContain('APPROVED');
    expect(readme).toContain('Phase 264 blockers: none identified');
  });
});
