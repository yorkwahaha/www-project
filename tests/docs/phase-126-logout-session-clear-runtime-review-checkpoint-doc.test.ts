import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_126_DOC =
  'docs/www-project-phase-126-logout-session-clear-runtime-review-checkpoint-v1.md';

describe('Phase 126 logout session clear runtime review checkpoint doc', () => {
  it('documents the review checkpoint and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_126_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 126');
    expect(source).toContain('Logout / Session Clear Runtime Review Checkpoint');
    expect(source).toContain('Phase 84');
    expect(source).toContain('Phase 125');
    expect(source).toContain('No runtime, frontend behavior, API behavior');

    expect(source).toContain('formal login session boundary only');
    expect(source).toContain('DELETE /login/session');
    expect(source).toContain('wireLoginStateLogout()');
    expect(source).toContain('requestLogoutSession()');

    expect(source).toContain('does not use or clear `creator_session`');
    expect(source).toContain('returns to anonymous / guest state');
    expect(source).toContain('does not expose internal identifiers');
    expect(source).toContain('display_name');
    expect(source).toContain('user_id');

    expect(source).toContain('neutral fallback');
    expect(source).toContain('does not echo backend `error`');
    expect(source).toContain('LOGIN_LOGOUT_FAILURE_MESSAGE');
    expect(source).toContain('目前無法登出，請稍後再試。');

    expect(source).toContain('`user_id` and `display_name`');
    expect(source).toContain('data-login-state-read="disabled"');
    expect(source).toContain('does not call `GET /users/me/profile`');

    expect(source).toContain('creator_session` remains local/demo/test creator flow only');
    expect(source).toContain('X-User-Id` remains explicit non-production compatibility');
    expect(source).toContain('No eligibility, vote-personal-state, or analytics linkage');
    expect(source).toContain('Reference Answer remains disconnected');

    expect(source).toContain('no new logs, metrics, analytics');
    expect(source).toContain('option_id');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain(
      'phase-126-logout-session-clear-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 126');
    expect(readme).toContain(PHASE_126_DOC);
    expect(readme).toContain('Logout session clear runtime review checkpoint');
  });
});
