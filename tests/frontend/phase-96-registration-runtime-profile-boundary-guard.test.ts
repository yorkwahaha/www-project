import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Phase 96 registration runtime/profile boundary guard', () => {
  it('keeps /registration out of login-state reads and session issuance paths', async () => {
    const registrationHtml = await readFile(
      join(process.cwd(), 'public/registration.html'),
      'utf8',
    );
    const registrationSource = await readFile(
      join(process.cwd(), 'public/frontend/registration-page.js'),
      'utf8',
    );
    const layoutSource = await readFile(
      join(process.cwd(), 'public/frontend/public-mvp-layout.js'),
      'utf8',
    );

    expect(registrationHtml).toContain('data-login-state-read="disabled"');
    expect(layoutSource).toContain('shouldReadLoginState(header)');
    expect(registrationSource).toContain("Authorization: `Bearer ${credential}`");
    expect(registrationSource).toContain('body: JSON.stringify(profile)');
    expect(registrationSource).toContain('display_name');
    expect(registrationSource).toContain('birth_year_month');
    expect(registrationSource).toContain('residential_region');
    expect(registrationSource).not.toMatch(
      /\/users\/me|\/login\/session|mountLoginStateRead|Set-Cookie|document\.cookie|localStorage|sessionStorage|IndexedDB|credential_proof|token_sha256|session_id|www_session|option_id|option_text|selected_option_index/i,
    );
  });

  it('keeps login and users/me UI boundaries separate from profile and option data', async () => {
    const loginSource = await readFile(
      join(process.cwd(), 'public/frontend/login-page.js'),
      'utf8',
    );
    const loginStateSource = await readFile(
      join(process.cwd(), 'public/frontend/login-state-read.js'),
      'utf8',
    );
    const logoutSource = await readFile(
      join(process.cwd(), 'public/frontend/login-state-logout.js'),
      'utf8',
    );

    expect(loginSource).toContain('/login/session');
    expect(loginSource).toContain('mountLoginStateRead');
    expect(loginStateSource).toContain('/users/me');
    expect(loginStateSource).toContain('display_name');
    expect(logoutSource).toContain('/login/session');
    expect(logoutSource).toContain("method: 'DELETE'");

    const combined = `${loginSource}\n${loginStateSource}\n${logoutSource}`;
    expect(combined).not.toMatch(
      /birth_year_month|residential_region|credential_proof|token_sha256|session_id|www_session|option_id|option_text|selected_option_index|poll_id|shard_id|eligibility|demographic|analytics|precise_location|latitude|longitude|address|gender/i,
    );
  });
});
