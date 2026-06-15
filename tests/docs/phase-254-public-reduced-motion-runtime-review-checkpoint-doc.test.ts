import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_254_DOC =
  'docs/www-project-phase-254-public-reduced-motion-runtime-review-checkpoint-v1.md';

describe('Phase 254 public reduced motion runtime review checkpoint doc', () => {
  it('documents review scope, Phase 253 delivery, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_254_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 254');
    expect(source).toContain('Public Reduced Motion Runtime Review Checkpoint');
    expect(source).toContain('751a0c7');
    expect(source).toContain('Phase 253');

    expect(source).toContain('@media (prefers-reduced-motion: reduce)');
    expect(source).toContain('transition: none');
    expect(source).toContain('animation: none');
    expect(source).toContain('scroll-behavior: auto');
    expect(source).toContain('public-mvp.css');
    expect(source).toContain('public/frontend/*.js');
    expect(source).toContain('phase-253-public-page-reduced-motion-css-only-polish.test.ts');

    expect(source).toContain('localStorage');
    expect(source).toContain('sessionStorage');
    expect(source).toContain('option_index');
    expect(source).toContain('eligibility-before-option-resolve');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('POST /registration');
    expect(source).toContain('Set-Cookie');
    expect(source).toContain('user_id');
    expect(source).toContain('display_name');
    expect(source).toContain('quality_badge');
    expect(source).toContain('positive_feedback');
    expect(source).toContain('回饋良好');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('focus trap');
    expect(source).toContain('roving tabindex');
    expect(source).toContain('APPROVED');
    expect(source).toContain('No runtime change');
    expect(source).toContain('smoke:public:local');

    expect(source).toContain(
      'phase-254-public-reduced-motion-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 254');
    expect(readme).toContain(PHASE_254_DOC);
    expect(readme).toContain('Public reduced motion runtime review checkpoint');
  });
});
