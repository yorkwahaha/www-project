import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Phase 73 production login session UX plan doc', () => {
  it('locks docs-only login/session UX planning and auth/privacy boundaries', async () => {
    const source = await readFile(
      join(
        process.cwd(),
        'docs/www-project-phase-73-production-login-session-ux-plan-v1.md',
      ),
      'utf8',
    );
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Production Login / Session UX Planning');
    expect(source).toContain('docs/spec only');
    expect(source).toContain('No runtime change, public frontend change, migration, DB schema change, API behavior change');
    expect(source).toContain('production login/session UX');
    expect(source).toContain('logout');
    expect(source).toContain('Session expired');
    expect(source).toContain('Credential revoked');
    expect(source).toContain('Frontend Credential Storage Boundary');
    expect(source).toContain('Production vs Local/Demo/Test Flow Split');
    expect(source).toContain('Authorization: Bearer <opaque-token>');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('USER_AUTH_CREDENTIALS_JSON');
    expect(source).toContain('creator_session` remains local/demo/test only');
    expect(source).toContain('It must not become production public identity');
    expect(source).toContain('Reference Answer is not cut over to `UserAuthResolver`');
    expect(source).toContain('Any future Reference Answer `UserAuthResolver` cutover must be a separate approved phase');
    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('profile eligibility fields or evaluator behavior');
    expect(source).toContain('Vote token schema: `user_id + poll_id`');
    expect(source).toContain('Counter schema: `poll_id + option_id + shard_id`');
    expect(source).toContain('No login/session UX may create durable or diagnostic option choice linkage');
    expect(source).toContain('demographic breakdown');
    expect(source).toContain('ranking personalization');
    expect(source).toContain('analytics linkage');
    expect(source).toContain('precise location');
    expect(source).toContain('extra profile fields');
    expect(source).toContain('fail closed for profile, Official Vote, `vote-by-index`, and production `/creator/*`');
    expect(source).toContain('do not fall back to raw `X-User-Id`');
    expect(source).toContain('do not fall back to `creator_session`');
    expect(source).toContain('I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.');
    expect(source).toContain('git diff --check');
    expect(source).toContain('npm run typecheck');
    expect(source).toContain('npm test');
    expect(source).toContain('npm run build');
    expect(readme).toContain('Phase 73');
    expect(readme).toContain(
      'docs/www-project-phase-73-production-login-session-ux-plan-v1.md',
    );
    expect(readme).toContain('production login/session UX planning');
    expect(readme).toContain('production-deploy-ready');
  });
});
