import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_253_DOC =
  'docs/www-project-phase-253-public-page-reduced-motion-css-only-polish-v1.md';

describe('Phase 253 public page reduced motion CSS-only polish doc', () => {
  it('documents CSS delivery, guard tests, boundaries, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_253_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 253');
    expect(source).toContain('Reduced Motion CSS-only Polish');
    expect(source).toContain('1a0a653');
    expect(source).toContain('Phase 252');

    expect(source).toContain('@media (prefers-reduced-motion: reduce)');
    expect(source).toContain('transition: none');
    expect(source).toContain('animation: none');
    expect(source).toContain('scroll-behavior: auto');
    expect(source).toContain('.mvp-help-tip');
    expect(source).toContain('.mvp-faq-question::before');
    expect(source).toContain('public/frontend/public-mvp.css');
    expect(source).toContain('CSS-only');
    expect(source).toContain('option_index');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('quality_badge');
    expect(source).toContain('smoke:public:local');

    expect(source).toContain(
      'tests/frontend/phase-253-public-page-reduced-motion-css-only-polish.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 253');
    expect(readme).toContain(PHASE_253_DOC);
    expect(readme).toContain('reduced motion');
  });
});
