import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_91_DOC =
  'docs/www-project-phase-91-minimal-registration-ui-plan-v1.md';

describe('Phase 91 minimal registration UI plan doc', () => {
  it('documents the future registration UI plan and preserved auth/privacy invariants', async () => {
    const source = await readFile(join(process.cwd(), PHASE_91_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 91');
    expect(source).toContain('docs/spec only');
    expect(source).toContain('POST /registration');
    expect(source).toContain('Authorization: Bearer <proof>');
    expect(source).toContain('credentials: \'same-origin\'');
    expect(source).toContain('display_name');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('credential proof is transported through');
    expect(source).toContain('not accepted from the JSON body');

    expect(source).toContain('Registration success does **not** mean logged in');
    expect(source).toContain('do not call `POST /login/session`');
    expect(source).toContain('do not read, expect, or display `Set-Cookie`');
    expect(source).toContain('existing `/login`');
    expect(source).toContain('"login_required": true');

    expect(source).toContain('Why `birth_year_month` and `residential_region` Are Required');
    expect(source).toContain('僅到月份');
    expect(source).toContain('粗粒度');
    expect(source).toContain('Accessibility and Mobile Requirements');
    expect(source).toContain('REGISTRATION_VALIDATION');
    expect(source).toContain('REGISTRATION_CONFLICT');

    expect(source).toContain('must not display, log, or send to analytics');
    expect(source).toContain('exposure of `birth_year_month` or `residential_region` through `GET /users/me`');
    expect(source).toContain('`gender`');
    expect(source).toContain('exact birthday');
    expect(source).toContain('precise location');
    expect(source).toContain('creator_session');
    expect(source).toContain('token_sha256');
    expect(source).toContain('option ID');

    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('vote-by-index` eligibility before option resolve');
    expect(source).toContain('Vote token schema: `user_id + poll_id`');
    expect(source).toContain('Counter schema: `poll_id + option_id + shard_id`');
    expect(source).toContain('Reference Answer auth boundary');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 91');
    expect(readme).toContain(PHASE_91_DOC);
    expect(readme).toContain('Minimal registration UI plan');
  });
});
