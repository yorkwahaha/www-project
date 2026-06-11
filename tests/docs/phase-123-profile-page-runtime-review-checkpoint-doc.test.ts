import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_123_DOC =
  'docs/www-project-phase-123-profile-page-runtime-review-checkpoint-v1.md';

describe('Phase 123 profile page runtime review checkpoint doc', () => {
  it('documents the review checkpoint and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_123_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 123');
    expect(source).toContain('Profile Page Runtime Review Checkpoint');
    expect(source).toContain('Phase 99');
    expect(source).toContain('Phase 103');
    expect(source).toContain('No runtime, frontend behavior, API behavior');

    expect(source).toContain('does not call `GET /users/me/profile`');
    expect(source).toContain('wireProfileForm()');
    expect(source).toContain('PROFILE_UNAUTHENTICATED_MESSAGE');
    expect(source).toContain('編輯個人資料前請先登入');

    expect(source).toContain('loadUserProfile()');
    expect(source).toContain('saveUserProfile()');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('allows empty fields to become `null`');
    expect(source).toContain('No gender, exact birthday');

    expect(source).toContain('does not say the visitor is eligible or ineligible');
    expect(source).toContain('age_passed');
    expect(source).toContain('messageForProfileFailure');
    expect(source).toContain('PROFILE_LOAD_FAILURE_MESSAGE');
    expect(source).toContain('PROFILE_SAVE_FAILURE_MESSAGE');
    expect(source).toContain('does not echo malformed backend payloads');

    expect(source).toContain('`user_id` and `display_name`');
    expect(source).toContain('display_name` for UI');
    expect(source).toContain('does not issue session cookies');
    expect(source).toContain('POST /login/session` remains the formal production login-session creation boundary');
    expect(source).toContain('creator_session` remains local/demo/test creator flow only');
    expect(source).toContain('Reference Answer remains disconnected');

    expect(source).toContain('no new logs, metrics, analytics');
    expect(source).toContain('option_id');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain(
      'phase-123-profile-page-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 123');
    expect(readme).toContain(PHASE_123_DOC);
    expect(readme).toContain('Profile page runtime review checkpoint');
  });
});
