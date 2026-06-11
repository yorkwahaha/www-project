import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_134_DOC =
  'docs/www-project-phase-134-auth-profile-flow-milestone-review-checkpoint-v1.md';

describe('Phase 134 auth profile flow milestone review checkpoint doc', () => {
  it('documents the Phase 123-127 milestone and fixed boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_134_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 134');
    expect(source).toContain('Auth / Profile Flow Milestone Review Checkpoint');
    expect(source).toContain('No runtime, frontend behavior, API behavior');
    expect(source).toContain('Phase 123');
    expect(source).toContain('Phase 124');
    expect(source).toContain('Phase 125');
    expect(source).toContain('Phase 126');
    expect(source).toContain('Phase 127');

    expect(source).toContain('does not auto-login');
    expect(source).toContain('does not Set-Cookie');
    expect(source).toContain('does not call `/users/me`');
    expect(source).toContain('display_name`, `birth_year_month`, `residential_region`');
    expect(source).toContain('POST /login/session');
    expect(source).toContain('DELETE /login/session');

    expect(source).toContain('Header auth state reads `GET /users/me` only');
    expect(source).toContain('display_name` only');
    expect(source).toContain('does not show `user_id`');

    expect(source).toContain('no profile form mount');
    expect(source).toContain('no `GET /users/me/profile`');
    expect(source).toContain('PUT /users/me/profile` sends only');
    expect(source).toContain('allow null');

    expect(source).toContain('Homepage profile prompt mounts on homepage only');
    expect(source).toContain('isProfileIncomplete');
    expect(source).toContain('does not equal eligibility');
    expect(source).toContain('does not guarantee voting');

    expect(source).toContain('neutral fallback');
    expect(source).toContain('creator_session` boundary unchanged');
    expect(source).toContain('X-User-Id` remains explicit non-production compatibility only');
    expect(source).toContain('Reference Answer remains disconnected');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('demographic breakdown, ranking personalization, analytics linkage');

    expect(source).toContain(
      'phase-134-auth-profile-flow-milestone-review-checkpoint.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 134');
    expect(readme).toContain(PHASE_134_DOC);
    expect(readme).toContain('Auth / profile flow milestone review checkpoint');
  });
});
