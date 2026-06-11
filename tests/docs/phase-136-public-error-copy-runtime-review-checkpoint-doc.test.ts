import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_136_DOC =
  'docs/www-project-phase-136-public-error-copy-runtime-review-checkpoint-v1.md';

describe('Phase 136 public error copy runtime review checkpoint doc', () => {
  it('documents Phase 135 runtime review conclusions and fixed boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_136_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 136');
    expect(source).toContain('Public Error Copy Runtime Review Checkpoint');
    expect(source).toContain('No runtime, frontend behavior, API behavior');
    expect(source).toContain('Phase 135');

    expect(source).toContain('resolvePublicErrorUserMessage');
    expect(source).toContain('only surfaces frontend-owned allowlist copy or the caller fallback');
    expect(source).toContain('Foreign `error.message` is not shown to users');
    expect(source).toContain('Backend raw payload, internal codes, and stack traces are not echoed');

    expect(source).toContain('/explore');
    expect(source).toContain('/vote/:id');
    expect(source).toContain('/results/:id');
    expect(source).toContain('/my-polls?live=1');
    expect(source).toContain('CREATOR_SESSION_FAILURE');
    expect(source).toContain('/registration');
    expect(source).toContain('/login');
    expect(source).toContain('/profile');
    expect(source).toContain('creator lifecycle controls');

    expect(source).toContain('does not auto-login');
    expect(source).toContain('does not Set-Cookie');
    expect(source).toContain('does not read `/users/me`');
    expect(source).toContain('birth_year_month` + `residential_region` only');
    expect(source).toContain('creator_session` remains non-production identity');
    expect(source).toContain('Official Vote transaction order unchanged');
    expect(source).toContain('eligibility-before-option-resolve unchanged');
    expect(source).toContain('Reference Answer remains disconnected');
    expect(source).toContain('Raw Option Linkage Ban preserved');
    expect(source).toContain('X-User-Id` remains explicit non-production compatibility only');

    expect(source).toContain(
      'phase-136-public-error-copy-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 136');
    expect(readme).toContain(PHASE_136_DOC);
    expect(readme).toContain('Public error copy runtime review checkpoint');
  });
});
