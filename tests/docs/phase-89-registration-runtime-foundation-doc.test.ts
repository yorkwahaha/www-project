import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_89_DOC =
  'docs/www-project-phase-89-registration-runtime-foundation-v1.md';

describe('Phase 89 registration runtime foundation doc', () => {
  it('documents the registration endpoint and preserved privacy boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_89_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 89');
    expect(source).toContain('Registration Runtime Foundation');
    expect(source).toContain('POST /registration');
    expect(source).toContain('Authorization: Bearer <proof>');
    expect(source).toContain('display_name');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('"registered": true');
    expect(source).toContain('"login_required": true');
    expect(source).toContain('does not create a login session automatically');
    expect(source).toContain('does not set `Set-Cookie`');

    expect(source).toContain('REGISTRATION_VALIDATION');
    expect(source).toContain('REGISTRATION_CONFLICT');
    expect(source).toContain('accepts only normalized `YYYY-MM`');
    expect(source).toContain('month must be `01` through `12`');
    expect(source).toContain('free-form addresses');
    expect(source).toContain('precise location');
    expect(source).toContain('`gender`');
    expect(source).toContain('`credential_proof`');

    expect(source).toContain('uses only the verifier-resolved `user_id`');
    expect(source).toContain('raw `X-User-Id`');
    expect(source).toContain('`creator_session`');
    expect(source).toContain('GET /users/me` continues to expose only `user_id` and `display_name`');
    expect(source).toContain('Vote token schema: `user_id + poll_id`');
    expect(source).toContain('Counter schema: `poll_id + option_id + shard_id`');
    expect(source).toContain('Reference Answer auth boundary');
    expect(source).toContain('Reference Answer profile eligibility exclusion');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 89');
    expect(readme).toContain(PHASE_89_DOC);
    expect(readme).toContain('Registration runtime foundation');
    expect(readme).toContain('`POST` | `/registration`');
  });
});
