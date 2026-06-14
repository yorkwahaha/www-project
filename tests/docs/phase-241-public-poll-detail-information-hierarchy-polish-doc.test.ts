import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_241_DOC =
  'docs/www-project-phase-241-public-poll-detail-information-hierarchy-polish-v1.md';

describe('Phase 241 public poll detail information hierarchy polish doc', () => {
  it('documents Phase 241 layout contract and guard tests', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_241_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 241');
    expect(doc).toContain('Public Poll Detail Information Hierarchy Polish');
    expect(doc).toContain('PUBLIC_VOTE_DETAIL_LAYOUT_ORDER');
    expect(doc).toContain('public-vote-detail-layout.js');
    expect(doc).toContain('vote-detail-status-meta');
    expect(doc).toContain('vote-detail-pre-vote-hints');
    expect(doc).toContain('vote-detail-action-area');
    expect(doc).toContain('mvp-vote-detail-unavailable');
    expect(doc).toContain(
      'tests/frontend/phase-241-public-poll-detail-information-hierarchy-polish.test.ts',
    );
    expect(readme).toContain('Phase 241');
    expect(readme).toContain(PHASE_241_DOC);
  });
});
