import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_242_DOC =
  'docs/www-project-phase-242-public-results-detail-information-hierarchy-polish-v1.md';

describe('Phase 242 public results detail information hierarchy polish doc', () => {
  it('documents Phase 242 layout contract and guard tests', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_242_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 242');
    expect(doc).toContain('Public Results Detail Information Hierarchy Polish');
    expect(doc).toContain('PUBLIC_RESULTS_DETAIL_LAYOUT_ORDER');
    expect(doc).toContain('public-results-detail-layout.js');
    expect(doc).toContain('results-detail-status-meta');
    expect(doc).toContain('results-detail-visibility-hints');
    expect(doc).toContain('results-detail-content');
    expect(doc).toContain('mvp-results-detail-unavailable');
    expect(doc).toContain(
      'tests/frontend/phase-242-public-results-detail-information-hierarchy-polish.test.ts',
    );
    expect(readme).toContain('Phase 242');
    expect(readme).toContain(PHASE_242_DOC);
  });
});
