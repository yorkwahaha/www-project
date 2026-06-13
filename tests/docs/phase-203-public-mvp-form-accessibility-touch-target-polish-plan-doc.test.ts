import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_203_DOC =
  'docs/www-project-phase-203-public-mvp-form-accessibility-touch-target-polish-plan-v1.md';

describe('Phase 203 public MVP form accessibility / touch target polish plan doc', () => {
  it('documents plan-only form polish scope, surfaces, checklist, and explicit non-goals', async () => {
    const source = await readFile(join(process.cwd(), PHASE_203_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 203');
    expect(source).toContain('Form Accessibility / Touch Target Polish Plan');
    expect(source).toContain('plan only');
    expect(source).toContain('96a0c26');
    expect(source).toContain('Phase 202');

    for (const surface of [
      '/login',
      '/registration',
      '/profile',
      '/polls/new',
      '/my-polls?live=1',
    ]) {
      expect(source).toContain(surface);
    }

    for (const category of [
      'Mobile input readability',
      'Label / help / error text spacing',
      'Button / touch target size',
      'Form section spacing',
      'Loading / success / failure state readability',
      'Keyboard / mobile-friendly layout',
    ]) {
      expect(source).toContain(category);
    }

    expect(source).toContain('Allowed Files for Future Implementation Phase');
    expect(source).toContain('public/frontend/public-mvp.css');
    expect(source).toContain('login-page.js');
    expect(source).toContain('registration-page.js');
    expect(source).toContain('profile-page.js');
    expect(source).toContain('create-poll-page.js');
    expect(source).toContain('my-polls-page.js');
    expect(source).toContain('--mvp-tap-min');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('POST /registration');
    expect(source).toContain('no auto-login');
    expect(source).toContain('Set-Cookie');
    expect(source).toContain('/users/me/profile');
    expect(source).toContain('display_name');
    expect(source).toContain('option_index');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('Suggested Guard Tests for Future Implementation Phase');
    expect(source).toContain('Validation Checklist');
    expect(source).toContain('Phase 203-R');
    expect(source).toContain('review checkpoint');

    for (const nonGoal of [
      'DB / schema / migration',
      'API contract / payload changes',
      'Auth / session / `UserAuthResolver` changes',
      'Registration auto-login or cookie issuance',
      'New profile fields beyond `birth_year_month` / `residential_region`',
      'Vote transaction / eligibility evaluator changes',
      'Result visibility / result evaluator changes',
      'Reference Answer integration changes',
      'Option/user/session/device/request/log/trace/metric/error linkage',
      'design-drafts/',
    ]) {
      expect(source).toContain(nonGoal);
    }

    expect(source).toContain(
      'phase-203-public-mvp-form-accessibility-touch-target-polish-plan-doc.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 203');
    expect(readme).toContain(PHASE_203_DOC);
    expect(readme).toContain('form accessibility');
  });
});
