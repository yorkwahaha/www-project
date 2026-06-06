import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_93_DOC =
  'docs/www-project-phase-93-registration-ui-runtime-review-hardening-v1.md';

describe('Phase 93 registration UI runtime review hardening doc', () => {
  it('documents the registration UI review, hardening, and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_93_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 93');
    expect(source).toContain('GET /registration');
    expect(source).toContain('public/frontend/registration-page.js');
    expect(source).toContain('Authorization: Bearer <proof>');
    expect(source).toContain('display_name');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('data-login-state-read="disabled"');
    expect(source).toContain('does not call `GET /users/me`');
    expect(source).toContain('does not call `POST /login/session`');
    expect(source).toContain('does not treat the user as logged in');
    expect(source).toContain('does not read or imply `Set-Cookie`');
    expect(source).toContain('/users/me` remains limited to `user_id` and `display_name`');
    expect(source).toContain('Raw Option Linkage Ban remains preserved');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 93');
    expect(readme).toContain(PHASE_93_DOC);
    expect(readme).toContain('Registration UI runtime review / hardening');
  });
});
