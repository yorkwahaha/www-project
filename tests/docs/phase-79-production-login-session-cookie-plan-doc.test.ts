import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_79_DOC =
  'docs/www-project-phase-79-production-login-session-cookie-plan-v1.md';

describe('Phase 79 production login session cookie plan doc', () => {
  it('locks docs-only login submit and session cookie issuance boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_79_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Production Login Submit / Session Cookie Issuance Plan');
    expect(source).toContain('docs/spec only');
    expect(source).toContain('No runtime behavior, route, migration, schema change');
    expect(source).toContain('production login submit boundary');
    expect(source).toContain('session token issuance boundary');
    expect(source).toContain('Set-Cookie');
    expect(source).toContain('HttpOnly');
    expect(source).toContain('Secure');
    expect(source).toContain('SameSite=Lax');
    expect(source).toContain('raw token is never stored');
    expect(source).toContain('token_sha256');
    expect(source).toContain('digest-only persistence');
    expect(source).toContain('expires_at');
    expect(source).toContain('revoked_at');
    expect(source).toContain('last_used_at');
    expect(source).toContain('DELETE /login/session');
    expect(source).toContain('CSRF');
    expect(source).toContain('trustedCredentialVerifier');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('raw `X-User-Id` is not production identity');
    expect(source).toContain('creator_session` must remain unrelated to production identity');

    expect(source).toContain('Official Vote transaction order unchanged');
    expect(source).toContain('vote-by-index` eligibility before option resolve unchanged');
    expect(source).toContain('Vote token schema unchanged: `user_id + poll_id`');
    expect(source).toContain('Counter schema unchanged: `poll_id + option_id + shard_id`');
    expect(source).toContain('Reference Answer remains unchanged');
    expect(source).toContain('Raw Option Linkage Ban unchanged');
    expect(source).toContain('No option-choice identity linkage');
    expect(source).toContain('No demographic breakdown');
    expect(source).toContain('No ranking personalization');
    expect(source).toContain('No analytics linkage');
    expect(source).toContain('No precise location');
    expect(source).toContain('No extra profile fields');
    expect(source).toContain('I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.');

    expect(source).toContain('git diff --check');
    expect(source).toContain('npm run typecheck');
    expect(source).toContain('npm test');
    expect(source).toContain('npm run build');
    expect(source).toContain('design-drafts/');

    expect(readme).toContain('Phase 79');
    expect(readme).toContain(PHASE_79_DOC);
    expect(readme).toContain('login submit');
    expect(readme).toContain('session cookie issuance');
  });
});
