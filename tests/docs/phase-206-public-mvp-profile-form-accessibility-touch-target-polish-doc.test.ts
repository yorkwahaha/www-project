import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_206_DOC =
  'docs/www-project-phase-206-public-mvp-profile-form-accessibility-touch-target-polish-v1.md';

describe('Phase 206 public MVP profile form accessibility / touch target polish doc', () => {
  it('documents polish scope, surfaces, rules, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_206_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 206');
    expect(source).toContain('Profile Form Accessibility');
    expect(source).toContain('Phase 205');
    expect(source).toContain('/profile');
    expect(source).toContain('profile-page');
    expect(source).toContain('public-mvp.css');
    expect(source).toContain('GET /users/me/profile');
    expect(source).toContain('PUT /users/me/profile');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('null');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'phase-206-public-mvp-profile-form-accessibility-touch-target-polish.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 206');
    expect(readme).toContain(PHASE_206_DOC);
    expect(readme).toContain('profile');
  });
});
