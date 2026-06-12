import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_162_DOC =
  'docs/www-project-phase-162-public-desktop-tablet-layout-consistency-polish-v1.md';

describe('Phase 162 public desktop/tablet layout consistency polish doc', () => {
  it('documents polish scope and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_162_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 162');
    expect(source).toContain('Public Desktop / Tablet Layout Consistency Polish');
    expect(source).toContain('Phase 161');
    expect(source).toContain('public-mvp.css');
    expect(source).toContain('--mvp-content-width');
    expect(source).toContain('min-width: 641px');
    expect(source).toContain('min-width: 1024px');
    expect(source).toContain('No runtime API behavior');
    expect(source).toContain('policy-ui-placeholders.js');
    expect(source).toContain('HELP_COPY');
    expect(source).toContain('does not auto-login');
    expect(source).toContain('does not Set-Cookie');
    expect(source).toContain('does not read `/users/me`');
    expect(source).toContain('Vote-by-index body remains `{ option_index }` only');
    expect(source).toContain('Raw Option Linkage Ban preserved');
    expect(source).toContain(
      'phase-162-public-desktop-tablet-layout-consistency-polish.test.ts',
    );

    expect(readme).toContain('Phase 162');
    expect(readme).toContain(PHASE_162_DOC);
    expect(readme).toContain('Public desktop / tablet layout consistency polish');
  });
});
