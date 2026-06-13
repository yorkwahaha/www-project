import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_203R_DOC =
  'docs/www-project-phase-203r-public-mvp-form-accessibility-touch-target-polish-plan-review-checkpoint-v1.md';

const PHASE_203_DOC =
  'docs/www-project-phase-203-public-mvp-form-accessibility-touch-target-polish-plan-v1.md';

describe('Phase 203-R public MVP form accessibility / touch target polish plan review checkpoint doc', () => {
  it('documents review scope, Phase 203 plan, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_203R_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 203-R');
    expect(source).toContain('Plan Review Checkpoint');
    expect(source).toContain('cc34317');
    expect(source).toContain('Phase 203');

    for (const surface of [
      '/login',
      '/registration',
      '/profile',
      '/polls/new',
      '/my-polls?live=1',
    ]) {
      expect(source).toContain(surface);
    }

    for (const token of [
      'plan only',
      'public/frontend/public-mvp.css',
      'login-page.js',
      'registration-page.js',
      'profile-page.js',
      'create-poll-page.js',
      'my-polls-page.js',
      'POST /login/session',
      'POST /registration',
      'forbids auto-login',
      'Set-Cookie',
      'birth_year_month',
      'residential_region',
      'display_name',
      '/users/me/profile',
      'user_id',
      'submitCreatePollDemo',
      'POST /creator/polls',
      'prepareMyPollsLiveSession',
      'fetchCreatorOwnedPolls',
      'option_index',
      'quality_badge',
      '回饋良好',
      'Reference Answer',
      'Raw Option Linkage Ban',
      'APPROVED',
      'Phase 204',
      'No runtime',
      'www-project-phase-203-public-mvp-form-accessibility-touch-target-polish-plan-v1.md',
    ]) {
      expect(source).toContain(token);
    }

    expect(source).toContain(
      'phase-203r-public-mvp-form-accessibility-touch-target-polish-plan-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 203-R');
    expect(readme).toContain(PHASE_203R_DOC);
    expect(readme).toContain('form accessibility');
  });
});
