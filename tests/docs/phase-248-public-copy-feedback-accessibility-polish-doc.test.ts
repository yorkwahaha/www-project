import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_248_DOC =
  'docs/www-project-phase-248-public-copy-feedback-accessibility-polish-v1.md';

describe('Phase 248 public copy feedback accessibility polish doc', () => {
  it('documents layout contract, a11y behavior, and guard tests', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_248_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 248');
    expect(doc).toContain('Public Copy Feedback Accessibility Polish');
    expect(doc).toContain('PUBLIC_SHARE_LINK_COPY_FEEDBACK_A11Y_ORDER');
    expect(doc).toContain('applyShareLinkCopyFeedback');
    expect(doc).toContain('aria-describedby');
    expect(doc).toContain('aria-atomic');
    expect(doc).toContain('data-copy-state');
    expect(doc).toContain('public-share-link-layout.js');
    expect(doc).toContain(
      'tests/frontend/phase-248-public-copy-feedback-accessibility-polish.test.ts',
    );
    expect(doc).toContain('public-mvp-a11y.test.ts');

    expect(readme).toContain('Phase 248');
    expect(readme).toContain(PHASE_248_DOC);
  });
});
