import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_204_DOC =
  'docs/www-project-phase-204-public-mvp-login-registration-form-accessibility-touch-target-polish-v1.md';

describe('Phase 204 public MVP login / registration form accessibility / touch target polish doc', () => {
  it('documents polish scope, surfaces, rules, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_204_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 204');
    expect(source).toContain('Login / Registration Form Accessibility');
    expect(source).toContain('Phase 203-R');

    for (const surface of ['/login', '/registration']) {
      expect(source).toContain(surface);
    }

    expect(source).toContain('login-page');
    expect(source).toContain('registration-page');
    expect(source).toContain('public-mvp.css');
    expect(source).toContain('POST /login/session');
    expect(source).toContain('POST /registration');
    expect(source).toContain('No auto-login');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'phase-204-public-mvp-login-registration-form-accessibility-touch-target-polish.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 204');
    expect(readme).toContain(PHASE_204_DOC);
    expect(readme).toContain('login');
    expect(readme).toContain('registration');
  });
});
