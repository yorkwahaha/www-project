import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_250_DOC =
  'docs/www-project-phase-250-public-page-keyboard-focus-polish-v1.md';

describe('Phase 250 public page keyboard focus polish doc', () => {
  it('documents focus groups, CSS delivery, guard tests, and non-changes', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_250_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 250');
    expect(doc).toContain('Public Page Keyboard Focus Polish');
    expect(doc).toContain('PUBLIC_KEYBOARD_FOCUS_INTERACTIVE_ORDER');
    expect(doc).toContain('PUBLIC_KEYBOARD_FOCUS_SELECTOR_MAP');
    expect(doc).toContain('public-keyboard-focus-a11y.js');
    expect(doc).toContain('--mvp-focus-shadow');
    expect(doc).toContain('focus-within');
    expect(doc).toContain('no keyboard shortcuts');
    expect(doc).toContain('no roving tabindex');
    expect(doc).toContain('no focus trap');
    expect(doc).toContain(
      'tests/frontend/phase-250-public-page-keyboard-focus-polish.test.ts',
    );
    expect(doc).toContain('public-mvp-a11y.test.ts');
    expect(doc).toContain('smoke:public:local');

    expect(readme).toContain('Phase 250');
    expect(readme).toContain(PHASE_250_DOC);
  });
});
