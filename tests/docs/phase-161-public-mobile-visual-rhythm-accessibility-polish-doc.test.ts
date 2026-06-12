import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_161_DOC =
  'docs/www-project-phase-161-public-mobile-visual-rhythm-accessibility-polish-v1.md';

describe('Phase 161 public mobile visual rhythm accessibility polish doc', () => {
  it('documents polish scope and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_161_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 161');
    expect(source).toContain('Public Mobile Visual Rhythm & Accessibility Polish');
    expect(source).toContain('Phase 160');
    expect(source).toContain('public-mvp.css');
    expect(source).toContain('--mvp-tap-min');
    expect(source).toContain('focus-visible');
    expect(source).toContain('prefers-reduced-motion');
    expect(source).toContain('No runtime API behavior');
    expect(source).toContain('policy-ui-placeholders.js');
    expect(source).toContain('HELP_COPY');
    expect(source).toContain('does not auto-login');
    expect(source).toContain('does not Set-Cookie');
    expect(source).toContain('does not read `/users/me`');
    expect(source).toContain('Vote-by-index body remains `{ option_index }` only');
    expect(source).toContain('Raw Option Linkage Ban preserved');
    expect(source).toContain(
      'phase-161-public-mobile-visual-rhythm-accessibility-polish.test.ts',
    );

    expect(readme).toContain('Phase 161');
    expect(readme).toContain(PHASE_161_DOC);
    expect(readme).toContain('Public mobile visual rhythm & accessibility polish');
  });
});
