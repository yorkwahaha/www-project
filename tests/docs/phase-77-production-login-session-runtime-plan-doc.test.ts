import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_77_DOC =
  'docs/www-project-phase-77-production-login-session-runtime-plan-v1.md';

describe('Phase 77 production login session runtime plan doc', () => {
  it('locks docs-only production login/session runtime planning and auth/privacy boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_77_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Production Login Session Runtime Plan');
    expect(source).toContain('docs/spec only');
    expect(source).toContain(
      'No runtime change, frontend change, migration, DB schema change, API behavior change',
    );
    expect(source).toContain('HttpOnly Secure SameSite cookie session');
    expect(source).toContain('Authorization: Bearer opaque credential');
    expect(source).toContain(
      'Phase 77 recommends Option A: HttpOnly Secure SameSite cookie session',
    );
    expect(source).toContain('CSRF');
    expect(source).toContain('XSS');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('trustedCredentialVerifier');
    expect(source).toContain('www_session');
    expect(source).toContain('login submit');
    expect(source).toContain('DELETE /login/session');
    expect(source).toContain('Session Expiration');
    expect(source).toContain('Revoked Credential');
    expect(source).toContain('Migration/DB schema if future needs arise must be a separate implementation phase');

    expect(source).toContain('Local/demo/test `X-User-Id` compatibility remains explicit non-production only');
    expect(source).toContain('Must fail closed in production');
    expect(source).toContain('creator_session` as local/demo/test only');
    expect(source).toContain('creator_session` must not become production public identity');
    expect(source).toContain('Reference Answer whether to cut UserAuthResolver is independent and not part of Phase 77 runtime');
    expect(source).toContain('Any future Reference Answer `UserAuthResolver` cutover must be a separate approved phase');

    expect(source).toContain('Official Vote transaction order unchanged');
    expect(source).toContain('vote-by-index` eligibility before option resolve');
    expect(source).toContain('Vote token schema: `user_id + poll_id`');
    expect(source).toContain('Counter schema: `poll_id + option_id + shard_id`');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('No option choice + user/session/device/request/log/trace/metric/error payload linkage');
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

    expect(readme).toContain('Phase 77');
    expect(readme).toContain(PHASE_77_DOC);
    expect(readme).toContain('HttpOnly Secure SameSite cookie session');
    expect(readme).toContain('production browser login/session runtime');
  });
});
