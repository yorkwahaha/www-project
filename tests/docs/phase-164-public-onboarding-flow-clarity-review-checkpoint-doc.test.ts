import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_164_DOC =
  'docs/www-project-phase-164-public-onboarding-flow-clarity-review-checkpoint-v1.md';

describe('Phase 164 public onboarding flow clarity review checkpoint doc', () => {
  it('documents checkpoint scope and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_164_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 164');
    expect(source).toContain('Public Onboarding Flow Clarity Review');
    expect(source).toContain('Phase 163');
    expect(source).toContain('POST /registration');
    expect(source).toContain('POST /login/session');
    expect(source).toContain('GET /users/me');
    expect(source).toContain('GET /users/me/profile');
    expect(source).toContain('PUT /users/me/profile');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('mountProfileCompletionPrompt');
    expect(source).toContain('mountOfficialVotePreVoteHint');
    expect(source).toContain('does not auto-login');
    expect(source).toContain('does not Set-Cookie');
    expect(source).toContain('does not read `/users/me`');
    expect(source).toContain('Vote-by-index body remains `{ option_index }` only');
    expect(source).toContain('Raw Option Linkage Ban preserved');
    expect(source).toContain('policy-ui-placeholders.js');
    expect(source).toContain('HELP_COPY');
    expect(source).toContain(
      'phase-164-public-onboarding-flow-clarity-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'phase-134-auth-profile-flow-milestone-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'phase-107-official-vote-pre-vote-ux-runtime-guard.test.ts',
    );

    expect(readme).toContain('Phase 164');
    expect(readme).toContain(PHASE_164_DOC);
    expect(readme).toContain('Public onboarding flow clarity review checkpoint');
  });
});
