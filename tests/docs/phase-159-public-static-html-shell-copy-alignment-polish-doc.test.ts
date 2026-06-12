import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_159_DOC =
  'docs/www-project-phase-159-public-static-html-shell-copy-alignment-polish-v1.md';

describe('Phase 159 public static HTML shell copy alignment polish doc', () => {
  it('documents shell alignment scope and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_159_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 159');
    expect(source).toContain('Public Static HTML Shell Copy Alignment Polish');
    expect(source).toContain('Phase 158');
    expect(source).toContain('PUBLIC_LOGIN_FORM_READY_HINT');
    expect(source).toContain('PUBLIC_REGISTRATION_SUCCESS_MESSAGE');
    expect(source).toContain('PUBLIC_PROFILE_VIEW_SIGN_IN_REQUIRED_MESSAGE');
    expect(source).toContain('PUBLIC_HOME_VALUE_COLLECTING_HIDDEN_BODY');
    expect(source).toContain('PUBLIC_RESULTS_DEMO_READONLY_TITLE');
    expect(source).toContain('policy-ui-placeholders.js');
    expect(source).toContain('HELP_COPY');
    expect(source).toContain('No runtime API behavior');
    expect(source).toContain('phase-159-public-static-html-shell-copy-alignment-polish.test.ts');

    expect(readme).toContain('Phase 159');
    expect(readme).toContain(PHASE_159_DOC);
    expect(readme).toContain('Public static HTML shell copy alignment polish');
  });
});
