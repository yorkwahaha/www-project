import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Phase 92 registration form copy guard', () => {
  it('keeps registration UI copy away from sensitive fields, storage, analytics, and auto-login', async () => {
    const html = await readFile(join(process.cwd(), 'public/registration.html'), 'utf8');
    const source = await readFile(
      join(process.cwd(), 'public/frontend/registration-page.js'),
      'utf8',
    );
    const combined = `${html}\n${source}`;

    expect(combined).toContain('/registration');
    expect(combined).toContain('/login');
    expect(combined).toContain('Authorization');
    expect(combined).toContain('credentials: \'same-origin\'');
    expect(combined).toContain('display_name');
    expect(combined).toContain('birth_year_month');
    expect(combined).toContain('residential_region');

    expect(combined).not.toMatch(
      /localStorage|sessionStorage|IndexedDB|indexedDB|document\.cookie|analytics|console\.|\/login\/session|\/users\/me|credential_proof|option_id|option_text|option_index|selected_option_index|token_sha256|session_id|www_session|Set-Cookie/i,
    );
    expect(combined).not.toMatch(
      /name="gender"|name="address"|name="precise_location"|name="latitude"|name="longitude"|name="date_of_birth"|name="exact_birthday"/i,
    );
  });
});
