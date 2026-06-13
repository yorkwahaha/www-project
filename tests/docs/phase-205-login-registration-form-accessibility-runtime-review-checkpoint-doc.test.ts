import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_205_DOC =
  'docs/www-project-phase-205-login-registration-form-accessibility-runtime-review-checkpoint-v1.md';

describe('Phase 205 login / registration form accessibility runtime review checkpoint doc', () => {
  it('documents review scope, Phase 204 delivery, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_205_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 205');
    expect(source).toContain('Login / Registration Form Accessibility Runtime Review Checkpoint');
    expect(source).toContain('3bcde8e');
    expect(source).toContain('Phase 204');

    for (const surface of ['/login', '/registration']) {
      expect(source).toContain(surface);
    }

    for (const token of [
      'login-page',
      'registration-page',
      'public-mvp.css',
      'login-page.js',
      'registration-page.js',
      'POST /login/session',
      'POST /registration',
      'display_name',
      'birth_year_month',
      'residential_region',
      'does not auto-login',
      'Set-Cookie',
      'GET /users/me',
      'user_id',
      'positive_feedback',
      '回饋良好',
      'option_index',
      'localStorage',
      'sessionStorage',
      'APPROVED',
      'No runtime',
      'Raw Option Linkage Ban',
      'smoke:public:local',
    ]) {
      expect(source).toContain(token);
    }

    expect(source).toContain(
      'phase-205-login-registration-form-accessibility-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 205');
    expect(readme).toContain(PHASE_205_DOC);
    expect(readme).toContain('Login / registration form accessibility runtime review checkpoint');
  });
});
