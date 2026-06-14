import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_249_DOC =
  'docs/www-project-phase-249-public-share-link-accessibility-runtime-review-checkpoint-v1.md';

describe('Phase 249 public share link accessibility runtime review checkpoint doc', () => {
  it('documents review scope, Phase 248 delivery, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_249_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 249');
    expect(source).toContain('Public Share Link Accessibility Runtime Review Checkpoint');
    expect(source).toContain('cd43f82');
    expect(source).toContain('Phase 248');

    expect(source).toContain('applyShareLinkCopyFeedback');
    expect(source).toContain('PUBLIC_SHARE_LINK_COPY_FEEDBACK_A11Y_ORDER');
    expect(source).toContain('aria-atomic');
    expect(source).toContain('aria-live');
    expect(source).toContain('data-copy-state');
    expect(source).toContain('public-share-link-layout.js');
    expect(source).toContain('public-mvp-ui.js');
    expect(source).toContain('public-mvp-demo.js');
    expect(source).toContain('public-mvp.css');
    expect(source).toContain('public-mvp-a11y.test.ts');
    expect(source).toContain('phase-248-public-copy-feedback-accessibility-polish.test.ts');

    expect(source).toContain('localStorage');
    expect(source).toContain('sessionStorage');
    expect(source).toContain('option_index');
    expect(source).toContain('APPROVED');
    expect(source).toContain('No runtime change');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('smoke:public:local');

    expect(source).toContain(
      'phase-249-public-share-link-accessibility-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 249');
    expect(readme).toContain(PHASE_249_DOC);
    expect(readme).toContain('Public share link accessibility runtime review checkpoint');
  });
});
