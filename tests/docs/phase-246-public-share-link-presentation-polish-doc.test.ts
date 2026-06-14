import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_246_DOC =
  'docs/www-project-phase-246-public-share-link-presentation-polish-v1.md';

describe('Phase 246 public share link presentation polish doc', () => {
  it('documents Phase 246 layout contract and guard tests', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_246_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 246');
    expect(doc).toContain('Public Share Link Presentation Polish');
    expect(doc).toContain('PUBLIC_SHARE_LINK_ROW_LAYOUT_ORDER');
    expect(doc).toContain('public-share-link-layout.js');
    expect(doc).toContain('syncVotePageShareLinks');
    expect(doc).toContain('syncResultsPageShareLinks');
    expect(doc).toContain('mountCreatorOwnedPollShareLinks');
    expect(doc).toContain('vote-detail-share-links');
    expect(doc).toContain('results-detail-share-links');
    expect(doc).toContain(
      'tests/frontend/phase-246-public-share-link-presentation-polish.test.ts',
    );
    expect(readme).toContain('Phase 246');
    expect(readme).toContain(PHASE_246_DOC);
  });
});
