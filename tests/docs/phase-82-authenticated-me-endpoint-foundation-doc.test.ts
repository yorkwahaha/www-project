import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_82_DOC =
  'docs/www-project-phase-82-authenticated-me-endpoint-foundation-v1.md';

describe('Phase 82 authenticated me endpoint foundation doc', () => {
  it('documents the minimal identity endpoint and preserved privacy boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_82_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Authenticated Me Endpoint Foundation');
    expect(source).toContain('GET /users/me');
    expect(source).toContain('`user_id` and `display_name`');
    expect(source).toContain('Route auth must call `UserAuthResolver`');
    expect(source).toContain('www_session');
    expect(source).toContain('user_sessions');
    expect(source).toContain('Production does not accept raw `X-User-Id`');
    expect(source).toContain('Development/test preserve explicit non-production `X-User-Id` compatibility');
    expect(source).toContain('creator_session` remains separate local/demo/test creator flow only');

    expect(source).toContain('session_id');
    expect(source).toContain('token_sha256');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('option IDs');
    expect(source).toContain('vote history');

    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('vote-by-index` eligibility before option resolve');
    expect(source).toContain('Vote token schema: `user_id + poll_id`');
    expect(source).toContain('Counter schema: `poll_id + option_id + shard_id`');
    expect(source).toContain('Reference Answer behavior or auth boundary');
    expect(source).toContain('I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.');

    expect(readme).toContain('Phase 82');
    expect(readme).toContain(PHASE_82_DOC);
    expect(readme).toContain('`GET /users/me`');
  });
});
