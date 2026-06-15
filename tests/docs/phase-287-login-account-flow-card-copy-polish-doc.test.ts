import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_287_DOC =
  'docs/www-project-phase-287-login-account-flow-card-copy-polish-v1.md';

describe('Phase 287 login account flow card copy polish doc', () => {
  it('documents purpose, copy changes, scope, and boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_287_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 287');
    expect(source).toContain('Login Account Flow Card Copy Polish');
    expect(source).toContain('eb17a11');
    expect(source).toContain('BL-286-01');
    expect(source).toContain('presentation-only');

    expect(source).toContain('PUBLIC_LOGIN_ACCOUNT_FLOW_CARD_BODY');
    expect(source).toContain('login-account-flow-card-body');
    expect(source).toContain('也不會建立瀏覽器工作階段');
    expect(source).toContain('syncLoginAccountFlowCardCopy');

    for (const unchanged of [
      'POST /login/session',
      'POST /registration',
      'UserAuthResolver',
      'session issuance',
    ]) {
      expect(source).toContain(unchanged);
    }

    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('option_index');
    expect(source).toContain('eligibility-before-option-resolve');
    expect(source).toContain('positive_feedback');
    expect(source).toContain('回饋良好');
    expect(source).toContain('localStorage');
    expect(source).toContain('sessionStorage');
    expect(source).toContain('analytics');
    expect(source).toContain('no API');
    expect(source).toContain('migration');

    expect(source).toContain('phase-287-login-account-flow-card-copy-polish.test.ts');
    expect(source).toContain('phase-287-login-account-flow-card-copy-polish-doc.test.ts');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 287');
    expect(readme).toContain(PHASE_287_DOC);
    expect(readme).toContain('BL-286-01');
    expect(readme).toContain('Phase 288 blockers: none identified');
  });
});
