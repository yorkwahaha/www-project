import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_311_DOC =
  'docs/www-project-phase-311-results-reveal-animation-browser-visual-review-checkpoint-v1.md';
const RESULT_PAGE_JS = 'public/frontend/result-page.js';
const PUBLIC_MVP_CSS = 'public/frontend/public-mvp.css';
const POLICY_UI_JS = 'public/frontend/policy-ui-placeholders.js';
const RESULTS_HTML = 'public/results.html';

describe('Phase 311 results reveal animation browser visual review checkpoint (static guards)', () => {
  it('documents FU-304-02 approval and OBS-311-01 demo preview follow-up', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_311_DOC), 'utf8');

    expect(doc).toContain('FU-304-02');
    expect(doc).toContain('APPROVED');
    expect(doc).toContain('OBS-311-01');
    expect(doc).toContain('toRevealedPreviewPayload');
    expect(doc).toContain('Phase 311 blockers: none identified');
  });

  it('keeps Phase 309 reveal presentation helpers and aggregate-only CSS', async () => {
    const resultPage = await readFile(join(process.cwd(), RESULT_PAGE_JS), 'utf8');
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');

    expect(resultPage).toContain('syncResultsAggregateRevealPresentation');
    expect(resultPage).toContain('shouldApplyResultsAggregateReveal');
    expect(resultPage).toContain("return mode === 'aggregate'");
    expect(resultPage).toContain('RESULTS_AGGREGATE_REVEAL_CLASS');
    expect(resultPage).toContain('RESULTS_AGGREGATE_REVEAL_READY_ATTR');

    expect(css).toContain('@keyframes results-aggregate-reveal-in');
    expect(css).toContain('.results-page #result-display.results-aggregate-reveal');
    expect(css).toContain('translateY(6px)');
    expect(css).toContain('prefers-reduced-motion: reduce');
  });

  it('records demo mock lifecycle gap that affects browser aggregate preview', async () => {
    const policyUi = await readFile(join(process.cwd(), POLICY_UI_JS), 'utf8');
    const doc = await readFile(join(process.cwd(), PHASE_311_DOC), 'utf8');

    expect(policyUi).toContain('toRevealedPreviewPayload');
    expect(policyUi).toContain("mockState === 'revealed'");
    expect(doc).toContain('public_lifecycle_state');
    expect(doc).toContain('resolveResultRenderMode');
  });

  it('keeps static HTML fallback and indexes Phase 311 in README', async () => {
    const resultsHtml = await readFile(join(process.cwd(), RESULTS_HTML), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(resultsHtml).toContain('載入結果中，請稍候。');
    expect(resultsHtml).toContain('/frontend/result-page.js');
    expect(readme).toContain(PHASE_311_DOC);
    expect(readme).toContain('Phase 311');
  });
});
