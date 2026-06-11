import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_124_DOC =
  'docs/www-project-phase-124-login-registration-runtime-review-checkpoint-v1.md';

describe('Phase 124 login registration runtime review checkpoint doc', () => {
  it('documents the review checkpoint and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_124_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 124');
    expect(source).toContain('Login / Registration Runtime Review Checkpoint');
    expect(source).toContain('Phase 95');
    expect(source).toContain('Phase 123');
    expect(source).toContain('No runtime, frontend behavior, API behavior');

    expect(source).toContain('does not auto-login');
    expect(source).toContain('does not Set-Cookie');
    expect(source).toContain('註冊不會自動登入');
    expect(source).toContain('data-login-state-read="disabled"');
    expect(source).toContain('does not call `GET /users/me`');

    expect(source).toContain('display_name');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('Authorization: Bearer');
    expect(source).toContain('No gender, exact birthday');

    expect(source).toContain('POST /login/session');
    expect(source).toContain('mountLoginStateRead()');
    expect(source).toContain('display_name` for UI');

    expect(source).toContain('messageForRegistrationFailure');
    expect(source).toContain('messageForLoginFailure');
    expect(source).toContain('does not echo API `error` or `message` fields');

    expect(source).toContain('`user_id` and `display_name`');
    expect(source).toContain('creator_session` remains local/demo/test creator flow only');
    expect(source).toContain('X-User-Id` remains explicit non-production compatibility');
    expect(source).toContain('Reference Answer remains disconnected');

    expect(source).toContain('no new logs, metrics, analytics');
    expect(source).toContain('option_id');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain(
      'phase-124-login-registration-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 124');
    expect(readme).toContain(PHASE_124_DOC);
    expect(readme).toContain('Login registration runtime review checkpoint');
  });
});
