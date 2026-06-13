import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_198_DOC =
  'docs/www-project-phase-198-public-mvp-copy-layout-runtime-review-checkpoint-v1.md';

describe('Phase 198 public MVP copy layout runtime review checkpoint doc', () => {
  it('documents review scope, Phase 197 bindings, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_198_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 198');
    expect(source).toContain('Public MVP Copy/Layout Runtime Review Checkpoint');
    expect(source).toContain('7873287');
    expect(source).toContain('Phase 197');

    for (const surface of [
      '/',
      '/explore',
      '/vote/:pollId',
      '/login',
      '/registration',
      '/profile',
      '/my-polls',
    ]) {
      expect(source).toContain(surface);
    }

    for (const binding of [
      'login-shell-submit',
      'login-register-cta',
      'registration-submit',
      'profile-login-cta',
      'home-explore-cta',
      'explore-home-cta',
      'my-polls-heading',
      'syncLoginPageCtas',
      'syncRegistrationPageCtas',
      'syncProfilePageCtas',
      'syncHomePageCtas',
      'syncExplorePageLeadLinks',
      'syncExplorePageStatusCopy',
    ]) {
      expect(source).toContain(binding);
    }

    expect(source).toContain('mvp-page-intro');
    expect(source).toContain('PUBLIC_VOTE_PAGE_BRAND_LABEL');
    expect(source).toContain('參與投票');
    expect(source).toContain('登入');
    expect(source).toContain('註冊');
    expect(source).toContain('回饋良好');
    expect(source).toContain('positive_feedback');
    expect(source).toContain('quality-feedback-badge.js');
    expect(source).toContain('localStorage');
    expect(source).toContain('sessionStorage');
    expect(source).toContain('APPROVED');
    expect(source).toContain('No runtime');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'phase-198-public-mvp-copy-layout-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 198');
    expect(readme).toContain(PHASE_198_DOC);
    expect(readme).toContain('Public MVP copy/layout runtime review checkpoint');
  });
});
