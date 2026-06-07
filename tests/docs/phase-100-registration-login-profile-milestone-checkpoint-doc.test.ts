import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_100_DOC =
  'docs/www-project-phase-100-registration-login-profile-milestone-checkpoint-v1.md';

describe('Phase 100 registration/login/profile milestone checkpoint doc', () => {
  it('documents the Phase 89-99 milestone and fixed boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_100_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 100');
    expect(source).toContain('Registration / Login / Profile Milestone Checkpoint');
    expect(source).toContain('No runtime, frontend JS, API');
    expect(source).toContain('Phase 89');
    expect(source).toContain('Phase 99');

    expect(source).toContain('POST /registration');
    expect(source).toContain('display_name');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('Authorization: Bearer <proof>');
    expect(source).toContain('does not issue a session');
    expect(source).toContain('does not set `Set-Cookie`');
    expect(source).toContain('does not auto-login');

    expect(source).toContain('Phase 90');
    expect(source).toContain('sensitive-field rejection tests');
    expect(source).toContain('Phase 91');
    expect(source).toContain('docs/spec only');
    expect(source).toContain('Phase 92');
    expect(source).toContain('GET /registration');
    expect(source).toContain('Phase 93');
    expect(source).toContain('data-login-state-read="disabled"');
    expect(source).toContain('Phase 94');
    expect(source).toContain('registration does not equal login');
    expect(source).toContain('Phase 95');
    expect(source).toContain('registration → login → `/users/me` → logout');
    expect(source).toContain('display_name`-only header');
    expect(source).toContain('Phase 96');
    expect(source).toContain('Raw Option Linkage Ban preserved');
    expect(source).toContain('Phase 97');
    expect(source).toContain('gender');
    expect(source).toContain('exact birthday');
    expect(source).toContain('precise location');
    expect(source).toContain('Phase 98');
    expect(source).toContain('GET /profile');
    expect(source).toContain('PUT /users/me/profile');
    expect(source).toContain('Phase 99');
    expect(source).toContain('display_name`-only');

    expect(source).toContain('`GET /users/me` returns only `user_id` and `display_name`');
    expect(source).toContain('`GET /users/me/profile` and `PUT /users/me/profile` are for profile setup/edit UI only');
    expect(source).toContain('`POST /login/session` is the only reviewed formal login session establishment boundary');
    expect(source).toContain('`DELETE /login/session` only revokes the current valid session and clears the session cookie');
    expect(source).toContain('does not auto-submit votes');
    expect(source).toContain('evaluated only at vote time');
    expect(source).toContain('Reference Answer remains disconnected from `UserAuthResolver`');
    expect(source).toContain('creator_session` remains local/demo/test creator flow only');
    expect(source).toContain('X-User-Id` compatibility');
    expect(source).toContain('Vote token schema: `user_id + poll_id`');
    expect(source).toContain('Counter schema: `poll_id + option_id + shard_id`');
    expect(source).toContain('vote-by-index` eligibility remains before option resolve');
    expect(source).toContain('Raw Option Linkage Ban remains preserved');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture `option_id`',
    );

    expect(readme).toContain('Phase 100');
    expect(readme).toContain(PHASE_100_DOC);
    expect(readme).toContain('Registration / login / profile milestone checkpoint');
  });
});
