import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_90_DOC =
  'docs/www-project-phase-90-registration-runtime-review-hardening-v1.md';

describe('Phase 90 registration runtime review hardening doc', () => {
  it('documents reviewed registration runtime surfaces and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_90_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 90');
    expect(source).toContain('Registration Runtime Review / Hardening');
    expect(source).toContain('POST /registration');
    expect(source).toContain('Authorization: Bearer <proof>');
    expect(source).toContain('display_name');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('does not issue `www_session`');
    expect(source).toContain('does not set `Set-Cookie`');

    expect(source).toContain('credential proof is transported through');
    expect(source).toContain('not accepted from the JSON body');
    expect(source).toContain('exact birthday');
    expect(source).toContain('precise location');
    expect(source).toContain('session IDs');
    expect(source).toContain('token fields');
    expect(source).toContain('cookie fields');
    expect(source).toContain('option_id');
    expect(source).toContain('selected_option_index');

    expect(source).toContain('duplicate verifier-resolved users');
    expect(source).toContain('REGISTRATION_CONFLICT');
    expect(source).toContain('createRegisteredUser');
    expect(source).toContain('no schema drift');
    expect(source).toContain('GET /users/me');
    expect(source).toContain('limited to `user_id` and `display_name`');

    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('vote-by-index` eligibility before option resolve');
    expect(source).toContain('vote token schema `user_id + poll_id`');
    expect(source).toContain('counter schema `poll_id + option_id + shard_id`');
    expect(source).toContain('Reference Answer remains disconnected');
    expect(source).toContain('Raw Option Linkage Ban remains preserved');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 90');
    expect(readme).toContain(PHASE_90_DOC);
    expect(readme).toContain('Registration runtime review / hardening');
  });
});
