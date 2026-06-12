import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_163_DOC =
  'docs/www-project-phase-163-public-frontend-visual-regression-guard-checkpoint-v1.md';

describe('Phase 163 public frontend visual regression guard checkpoint doc', () => {
  it('documents checkpoint scope and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_163_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 163');
    expect(source).toContain('Public Frontend Visual Regression Guard Checkpoint');
    expect(source).toContain('Phase 161');
    expect(source).toContain('Phase 162');
    expect(source).toContain('public-mvp.css');
    expect(source).toContain('--mvp-tap-min');
    expect(source).toContain('focus-visible');
    expect(source).toContain('safe-area-inset');
    expect(source).toContain('prefers-reduced-motion');
    expect(source).toContain('max-width: 640px');
    expect(source).toContain('--mvp-content-width');
    expect(source).toContain('min-width: 641px');
    expect(source).toContain('min-width: 1024px');
    expect(source).toContain('.mvp-page.mvp-shell');
    expect(source).toContain('No runtime, frontend behavior, API behavior');
    expect(source).toContain('policy-ui-placeholders.js');
    expect(source).toContain('HELP_COPY');
    expect(source).toContain('does not auto-login');
    expect(source).toContain('does not Set-Cookie');
    expect(source).toContain('does not read `/users/me`');
    expect(source).toContain('Vote-by-index body remains `{ option_index }` only');
    expect(source).toContain('Raw Option Linkage Ban preserved');
    expect(source).toContain(
      'phase-163-public-frontend-visual-regression-guard-checkpoint.test.ts',
    );
    expect(source).toContain(
      'phase-161-public-mobile-visual-rhythm-accessibility-polish.test.ts',
    );
    expect(source).toContain(
      'phase-162-public-desktop-tablet-layout-consistency-polish.test.ts',
    );

    expect(readme).toContain('Phase 163');
    expect(readme).toContain(PHASE_163_DOC);
    expect(readme).toContain('Public frontend visual regression guard checkpoint');
  });
});
