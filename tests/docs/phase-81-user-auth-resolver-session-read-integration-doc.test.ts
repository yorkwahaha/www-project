import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_81_DOC =
  'docs/www-project-phase-81-user-auth-resolver-session-read-integration-v1.md';

describe('Phase 81 UserAuthResolver session read integration doc', () => {
  it('documents production session read behavior and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_81_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('UserAuthResolver Session Read Integration');
    expect(source).toContain('www_session');
    expect(source).toContain('user_sessions.token_sha256');
    expect(source).toContain('SHA-256');
    expect(source).toContain('missing, malformed, duplicate, unknown, expired, revoked');
    expect(source).toContain('updates `last_used_at` only after successful session verification');
    expect(source).toContain('production never accepts raw `X-User-Id`');
    expect(source).toContain('non-production modes do not treat `www_session` as identity');
    expect(source).toContain('creator_session` remains separate local/demo/test creator flow only');

    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('vote-by-index` eligibility before option resolve');
    expect(source).toContain('Vote token schema: `user_id + poll_id`');
    expect(source).toContain('Counter schema: `poll_id + option_id + shard_id`');
    expect(source).toContain('Official Vote eligibility behavior');
    expect(source).toContain('Reference Answer behavior');
    expect(source).toContain('protected profile API surface');
    expect(source).toContain('frontend login UI');
    expect(source).toContain('I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.');

    expect(readme).toContain('Phase 81');
    expect(readme).toContain(PHASE_81_DOC);
    expect(readme).toContain('`UserAuthResolver` can resolve production identity from `www_session`');
  });
});
