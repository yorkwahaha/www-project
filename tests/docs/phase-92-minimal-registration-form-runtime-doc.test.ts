import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_92_DOC =
  'docs/www-project-phase-92-minimal-registration-form-runtime-v1.md';

describe('Phase 92 minimal registration form runtime doc', () => {
  it('documents runtime behavior and preserved auth/privacy boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_92_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 92');
    expect(source).toContain('Minimal Registration Form Runtime');
    expect(source).toContain('GET /registration');
    expect(source).toContain('POST /registration');
    expect(source).toContain('Authorization: Bearer <proof>');
    expect(source).toContain('credentials: \'same-origin\'');
    expect(source).toContain('display_name');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('credential proof input');
    expect(source).toContain('does not call `GET /users/me`');
    expect(source).toContain('does not call `POST /login/session`');
    expect(source).toContain('does not read or expect `Set-Cookie`');
    expect(source).toContain('does not treat the user as logged in');

    expect(source).toContain('gender');
    expect(source).toContain('exact birthday');
    expect(source).toContain('address');
    expect(source).toContain('precise location');
    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('vote-by-index` eligibility before option resolve');
    expect(source).toContain('Vote token schema: `user_id + poll_id`');
    expect(source).toContain('Counter schema: `poll_id + option_id + shard_id`');
    expect(source).toContain('Reference Answer connection');
    expect(source).toContain('creator_session');
    expect(source).toContain('Raw Option Linkage Ban remains preserved');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 92');
    expect(readme).toContain(PHASE_92_DOC);
    expect(readme).toContain('Minimal registration form runtime');
  });
});
