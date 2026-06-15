import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_251_DOC =
  'docs/www-project-phase-251-public-keyboard-focus-runtime-review-checkpoint-v1.md';

describe('Phase 251 public keyboard focus runtime review checkpoint doc', () => {
  it('documents review scope, Phase 250 delivery, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_251_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 251');
    expect(source).toContain('Public Keyboard Focus Runtime Review Checkpoint');
    expect(source).toContain('e998baf');
    expect(source).toContain('Phase 250');

    expect(source).toContain('PUBLIC_KEYBOARD_FOCUS_INTERACTIVE_ORDER');
    expect(source).toContain('PUBLIC_KEYBOARD_FOCUS_SELECTOR_MAP');
    expect(source).toContain('public-keyboard-focus-a11y.js');
    expect(source).toContain('public-mvp-ui.js');
    expect(source).toContain('public-mvp.css');
    expect(source).toContain('--mvp-focus-shadow');
    expect(source).toContain(':focus-visible');
    expect(source).toContain(':focus-within');
    expect(source).toContain('public-mvp-a11y.test.ts');
    expect(source).toContain('phase-250-public-page-keyboard-focus-polish.test.ts');

    expect(source).toContain('keyboard shortcuts');
    expect(source).toContain('focus trap');
    expect(source).toContain('roving tabindex');
    expect(source).toContain('localStorage');
    expect(source).toContain('sessionStorage');
    expect(source).toContain('option_index');
    expect(source).toContain('quality_badge');
    expect(source).toContain('positive_feedback');
    expect(source).toContain('回饋良好');
    expect(source).toContain('APPROVED');
    expect(source).toContain('No runtime change');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('smoke:public:local');

    expect(source).toContain(
      'phase-251-public-keyboard-focus-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 251');
    expect(readme).toContain(PHASE_251_DOC);
    expect(readme).toContain('Public keyboard focus runtime review checkpoint');
  });
});
