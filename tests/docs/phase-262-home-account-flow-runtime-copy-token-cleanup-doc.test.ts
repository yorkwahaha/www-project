import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_262_DOC =
  'docs/www-project-phase-262-home-account-flow-runtime-copy-token-cleanup-v1.md';

describe('Phase 262 home account flow runtime copy token cleanup doc', () => {
  it('documents delivery scope, checklist, and explicit non-goals', async () => {
    const source = await readFile(join(process.cwd(), PHASE_262_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 262');
    expect(source).toContain('Home Account Flow Runtime Copy Token Cleanup');
    expect(source).toContain('Phase 261');
    expect(source).toContain('Phase 260');
    expect(source).toContain('syncHomePageAccountFlowNote');
    expect(source).toContain('public-mvp-home.js');

    for (const item of [
      'creator_session',
      'X-User-Id',
      'PUBLIC_HOME_ACCOUNT_FLOW_REGISTRATION_NOTE',
      '不會自動登入',
      'option_index',
      'eligibility-before-option-resolve',
      'Raw Option Linkage Ban',
      'quality_badge',
      'positive_feedback',
      '回饋良好',
      'does not call `GET /users/me` after success',
      'birth_year_month',
      'residential_region',
      'Validation Checklist',
    ]) {
      expect(source).toContain(item);
    }

    for (const nonGoal of [
      'public/frontend/public-mvp.css',
      'API / DB / backend',
      'localStorage',
      'sessionStorage',
      'analytics / APM / debug tracking',
      'Option choice + user/session/device/request/log/trace/metric/error linkage',
      'design-drafts/',
    ]) {
      expect(source).toContain(nonGoal);
    }

    expect(source).toContain(
      'phase-262-home-account-flow-runtime-copy-token-cleanup-doc.test.ts',
    );
    expect(source).toContain('phase-262-home-account-flow-runtime-copy-token-cleanup.test.ts');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 262');
    expect(readme).toContain(PHASE_262_DOC);
  });
});
