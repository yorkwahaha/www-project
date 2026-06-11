import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_151_DOC =
  'docs/www-project-phase-151-public-form-field-label-placeholder-consistency-polish-v1.md';

describe('Phase 151 public form field label placeholder consistency polish doc', () => {
  it('documents polish scope, form field rules, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_151_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 151');
    expect(source).toContain('Public Form Field Label / Placeholder Consistency');
    expect(source).toContain('PUBLIC_FORM_FIELD_LABELS');
    expect(source).toContain('PUBLIC_FORM_PLACEHOLDERS');
    expect(source).toContain('PUBLIC_FORM_FIELD_HINTS');
    expect(source).toContain('syncLoginFormFieldCopy');
    expect(source).toContain('syncRegistrationFormFieldCopy');
    expect(source).toContain('syncProfileFormFieldCopy');
    expect(source).toContain('syncCreatePollFormFieldCopy');
    expect(source).toContain('syncVoteFormFieldCopy');
    expect(source).toContain('/login');
    expect(source).toContain('/registration');
    expect(source).toContain('/profile');
    expect(source).toContain('/polls/new');
    expect(source).toContain('/vote/:id');
    expect(source).toContain('No runtime API behavior');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain(
      'phase-151-public-form-field-label-placeholder-consistency-polish.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 151');
    expect(readme).toContain(PHASE_151_DOC);
    expect(readme).toContain('Public form field label / placeholder');
  });
});
