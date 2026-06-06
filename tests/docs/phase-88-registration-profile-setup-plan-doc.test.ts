import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_88_DOC =
  'docs/www-project-phase-88-registration-profile-setup-plan-v1.md';

describe('Phase 88 registration profile setup plan doc', () => {
  it('documents docs-only registration/profile setup boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_88_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 88');
    expect(source).toContain('Registration / Profile Setup Plan');
    expect(source).toContain('docs/spec only');
    expect(source).toContain('No runtime behavior');
    expect(source).toContain('No registration UI or profile setup UI is implemented');

    expect(source).toContain('display_name');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('Gender remains excluded');
    expect(source).toContain('Accept only normalized `YYYY-MM`');
    expect(source).toContain('Month must be `01` through `12`');
    expect(source).toContain('coarse region code from an approved allowlist');
    expect(source).toContain('Reject free-form addresses');
    expect(source).toContain('precise location');

    expect(source).toContain('POST /login/session');
    expect(source).toContain('DELETE /login/session');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('GET /users/me');
    expect(source).toContain('return only `user_id` and `display_name`');
    expect(source).toContain("credentials: 'same-origin'");
    expect(source).toContain('HttpOnly');
    expect(source).toContain('Secure');
    expect(source).toContain('SameSite=Lax');
    expect(source).toContain('Path=/');
    expect(source).toContain('no `Domain`');

    expect(source).toContain('Production registration/profile setup should make the account vote-ready');
    expect(source).toContain('Official Vote and `vote-by-index` transaction order must not change');
    expect(source).toContain('Eligibility must remain before option resolve');
    expect(source).toContain('Vote token schema remains `user_id + poll_id`');
    expect(source).toContain('Counter schema remains `poll_id + option_id + shard_id`');
    expect(source).toContain('Reference Answer remains separate');
    expect(source).toContain('must not connect Reference Answer to `UserAuthResolver`');
    expect(source).toContain('must not connect Reference Answer to profile eligibility');

    expect(source).toContain('Rejects raw `X-User-Id` as account identity');
    expect(source).toContain('creator_session');
    expect(source).toContain('Must not treat local/demo/test shortcuts as production registration');
    expect(source).toContain('Must not echo submitted profile values');
    expect(source).toContain(
      'I verified that this docs-only plan adds no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records that capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 88');
    expect(readme).toContain(PHASE_88_DOC);
    expect(readme).toContain('Registration / profile setup plan');
  });
});
