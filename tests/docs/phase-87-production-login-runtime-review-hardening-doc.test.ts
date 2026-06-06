import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_87_DOC =
  'docs/www-project-phase-87-production-login-runtime-review-hardening-v1.md';

describe('Phase 87 production login runtime review hardening doc', () => {
  it('documents reviewed login/session surfaces and preserved auth privacy boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_87_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 87');
    expect(source).toContain('Production Login Runtime Review / Hardening');
    expect(source).toContain('user_sessions');
    expect(source).toContain('POST /login/session');
    expect(source).toContain('DELETE /login/session');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('www_session');
    expect(source).toContain('GET /users/me');
    expect(source).toContain('/login');

    expect(source).toContain('raw session tokens are generated only for cookie issuance');
    expect(source).toContain('token_sha256');
    expect(source).toContain('HttpOnly');
    expect(source).toContain('Secure');
    expect(source).toContain('SameSite=Lax');
    expect(source).toContain('Path=/');
    expect(source).toContain('Max-Age');
    expect(source).toContain('no `Domain`');
    expect(source).toContain('allowed mutation `Origin`');

    expect(source).toContain('production rejects raw `X-User-Id`');
    expect(source).toContain('development/test `X-User-Id` compatibility remains explicit');
    expect(source).toContain('development/test do not treat `www_session` as identity');
    expect(source).toContain('creator_session');
    expect(source).toContain('returns only `user_id` and `display_name`');
    expect(source).toContain('frontend login-state UI displays only `display_name`');

    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('vote-by-index` eligibility before option resolve');
    expect(source).toContain('vote token schema');
    expect(source).toContain('counter schema');
    expect(source).toContain('Reference Answer auth boundary');
    expect(source).toContain('profile eligibility behavior');

    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 87');
    expect(readme).toContain(PHASE_87_DOC);
    expect(readme).toContain('Production login runtime review / hardening');
  });
});
