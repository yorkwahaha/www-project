import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_80_DOC =
  'docs/www-project-phase-80-production-login-submit-runtime-foundation-v1.md';

describe('Phase 80 production login submit runtime foundation doc', () => {
  it('documents the minimal trusted-verifier-backed session cookie runtime boundary', async () => {
    const source = await readFile(join(process.cwd(), PHASE_80_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Production Login Submit Runtime Foundation');
    expect(source).toContain('POST /login/session');
    expect(source).toContain('DELETE /login/session');
    expect(source).toContain('TrustedCredentialVerifier');
    expect(source).toContain('UserSessionRepository');
    expect(source).toContain('trustedCredentialVerifier');
    expect(source).toContain('www_session');
    expect(source).toContain('HttpOnly');
    expect(source).toContain('Secure');
    expect(source).toContain('SameSite=Lax');
    expect(source).toContain('Path=/');
    expect(source).toContain('Max-Age');
    expect(source).toContain('token_sha256');
    expect(source).toContain('The raw token is never persisted');
    expect(source).toContain('204 No Content');

    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('vote-by-index` eligibility before option resolve');
    expect(source).toContain('Vote token schema: `user_id + poll_id`');
    expect(source).toContain('Counter schema: `poll_id + option_id + shard_id`');
    expect(source).toContain('Reference Answer behavior');
    expect(source).toContain('creator_session` local/demo/test-only role');
    expect(source).toContain('X-User-Id` explicit non-production compatibility role');
    expect(source).toContain('No protected user APIs');
    expect(source).toContain('No protected user APIs, profile APIs, vote auth changes');
    expect(source).toContain('I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.');

    expect(readme).toContain('Phase 80');
    expect(readme).toContain(PHASE_80_DOC);
    expect(readme).toContain('POST /login/session');
    expect(readme).toContain('DELETE /login/session');
  });
});
