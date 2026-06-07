import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_96_DOC =
  'docs/www-project-phase-96-registration-runtime-profile-boundary-review-v1.md';

describe('Phase 96 registration runtime/profile boundary review doc', () => {
  it('documents the reviewed registration/login/profile boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_96_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 96');
    expect(source).toContain('No runtime/API/schema behavior changed');
    expect(source).toContain('POST /registration');
    expect(source).toContain('POST /login/session');
    expect(source).toContain('DELETE /login/session');
    expect(source).toContain('GET /users/me');
    expect(source).toContain('data-login-state-read="disabled"');
    expect(source).toContain('Authorization: Bearer <proof>');
    expect(source).toContain('display_name');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('`GET /users/me` remains limited to `user_id` and `display_name`');
    expect(source).toContain('Vote token schema: `user_id + poll_id`');
    expect(source).toContain('Counter schema: `poll_id + option_id + shard_id`');
    expect(source).toContain('Reference Answer isolation');
    expect(source).toContain('creator_session');
    expect(source).toContain('X-User-Id');
    expect(source).toContain('Raw Option Linkage Ban remains preserved');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 96');
    expect(readme).toContain(PHASE_96_DOC);
    expect(readme).toContain('Registration runtime/profile boundary review');
  });
});
