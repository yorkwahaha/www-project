import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_243_DOC =
  'docs/www-project-phase-243-creator-my-polls-action-hierarchy-polish-v1.md';

describe('Phase 243 creator my polls action hierarchy polish doc', () => {
  it('documents Phase 243 layout contract and guard tests', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_243_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 243');
    expect(doc).toContain('Creator My Polls Action Hierarchy Polish');
    expect(doc).toContain('PUBLIC_CREATOR_OWNED_POLL_ACTION_LAYOUT_ORDER');
    expect(doc).toContain('public-creator-owned-poll-layout.js');
    expect(doc).toContain('actionLayoutHosts');
    expect(doc).toContain('mvp-creator-owned-poll-destructive-toolbar');
    expect(doc).toContain(
      'tests/frontend/phase-243-creator-my-polls-action-hierarchy-polish.test.ts',
    );
    expect(readme).toContain('Phase 243');
    expect(readme).toContain(PHASE_243_DOC);
  });
});
