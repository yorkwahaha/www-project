import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_311R_DOC =
  'docs/www-project-phase-311r-results-reveal-browser-review-final-checkpoint-v1.md';
const PHASE_311_DOC =
  'docs/www-project-phase-311-results-reveal-animation-browser-visual-review-checkpoint-v1.md';
const RESULT_PAGE_JS = 'public/frontend/result-page.js';
const PUBLIC_MVP_CSS = 'public/frontend/public-mvp.css';

describe('Phase 311-R results reveal browser review final checkpoint (static guards)', () => {
  it('closes the reveal animation line with FU-304-02 approval carry-forward', async () => {
    const reviewDoc = await readFile(join(process.cwd(), PHASE_311R_DOC), 'utf8');
    const phase311Doc = await readFile(join(process.cwd(), PHASE_311_DOC), 'utf8');

    expect(reviewDoc).toContain('results reveal animation line closed');
    expect(reviewDoc).toContain('FU-304-02 remains APPROVED');
    expect(reviewDoc).toContain('OBS-311-01');
    expect(reviewDoc).toContain('NON-BLOCKING');
    expect(phase311Doc).toContain('APPROVED');
    expect(phase311Doc).toContain('Phase 311 blockers: none identified');
  });

  it('keeps Phase 309 aggregate-only reveal helpers without runtime drift', async () => {
    const resultPage = await readFile(join(process.cwd(), RESULT_PAGE_JS), 'utf8');
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');
    const reviewDoc = await readFile(join(process.cwd(), PHASE_311R_DOC), 'utf8');

    expect(resultPage).toContain('syncResultsAggregateRevealPresentation');
    expect(resultPage).toContain('shouldApplyResultsAggregateReveal');
    expect(resultPage).toContain("return mode === 'aggregate'");
    expect(css).toContain('@keyframes results-aggregate-reveal-in');
    expect(css).toContain('prefers-reduced-motion: reduce');
    expect(reviewDoc).toContain('Raw Option Linkage Ban');
  });

  it('indexes Phase 311-R in README and records reviewed commit', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    const reviewDoc = await readFile(join(process.cwd(), PHASE_311R_DOC), 'utf8');

    expect(readme).toContain(PHASE_311R_DOC);
    expect(readme).toContain('Phase 311-R');
    expect(reviewDoc).toContain('cfee183');
    expect(reviewDoc).toContain('3012');
    expect(reviewDoc).toContain('3011');
  });
});
