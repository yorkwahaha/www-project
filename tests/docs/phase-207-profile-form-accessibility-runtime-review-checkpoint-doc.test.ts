import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_207_DOC =
  'docs/www-project-phase-207-profile-form-accessibility-runtime-review-checkpoint-v1.md';

describe('Phase 207 profile form accessibility runtime review checkpoint doc', () => {
  it('documents review scope, Phase 206 delivery, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_207_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 207');
    expect(source).toContain('Profile Form Accessibility Runtime Review Checkpoint');
    expect(source).toContain('b578f3a');
    expect(source).toContain('Phase 206');

    expect(source).toContain('/profile');
    expect(source).toContain('profile-page');
    expect(source).toContain('public-mvp.css');
    expect(source).toContain('profile-page.js');
    expect(source).toContain('GET /users/me/profile');
    expect(source).toContain('PUT /users/me/profile');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('null');
    expect(source).toContain('user_id');
    expect(source).toContain('positive_feedback');
    expect(source).toContain('回饋良好');
    expect(source).toContain('option_index');
    expect(source).toContain('localStorage');
    expect(source).toContain('sessionStorage');
    expect(source).toContain('APPROVED');
    expect(source).toContain('No runtime');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('smoke:public:local');

    expect(source).toContain(
      'phase-207-profile-form-accessibility-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 207');
    expect(readme).toContain(PHASE_207_DOC);
    expect(readme).toContain('Profile form accessibility runtime review checkpoint');
  });
});
