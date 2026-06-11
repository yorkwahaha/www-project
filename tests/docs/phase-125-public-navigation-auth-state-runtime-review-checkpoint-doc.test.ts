import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_125_DOC =
  'docs/www-project-phase-125-public-navigation-auth-state-runtime-review-checkpoint-v1.md';

describe('Phase 125 public navigation auth state runtime review checkpoint doc', () => {
  it('documents the review checkpoint and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_125_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 125');
    expect(source).toContain('Public Navigation / Header Auth State Runtime Review Checkpoint');
    expect(source).toContain('Phase 75');
    expect(source).toContain('Phase 124');
    expect(source).toContain('No runtime, frontend behavior, API behavior');

    expect(source).toContain('Guest header shows visitor state');
    expect(source).toContain('未登入');
    expect(source).toContain('login / registration CTAs only');
    expect(source).toContain('Signed-in header shows `display_name` only');
    expect(source).toContain('does not expose internal identifiers');
    expect(source).toContain('user_id');
    expect(source).toContain('creator_session');

    expect(source).toContain('Auth state reader uses `GET /users/me` only');
    expect(source).toContain('parseAuthenticatedMeBody()');
    expect(source).toContain('`user_id` and `display_name`');

    expect(source).toContain('neutral fallback');
    expect(source).toContain('does not echo backend `error`');
    expect(source).toContain('data-login-state-read="disabled"');
    expect(source).toContain('does not call `GET /users/me/profile`');

    expect(source).toContain('creator_session` remains local/demo/test creator flow only');
    expect(source).toContain('X-User-Id` remains explicit non-production compatibility');
    expect(source).toContain('No eligibility, vote-personal-state, or result preview in header');
    expect(source).toContain('Reference Answer remains disconnected');

    expect(source).toContain('no new logs, metrics, analytics');
    expect(source).toContain('option_id');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain(
      'phase-125-public-navigation-auth-state-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 125');
    expect(readme).toContain(PHASE_125_DOC);
    expect(readme).toContain('Public navigation auth state runtime review checkpoint');
  });
});
