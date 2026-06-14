import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_244_DOC =
  'docs/www-project-phase-244-create-poll-form-information-hierarchy-polish-v1.md';

describe('Phase 244 create poll form information hierarchy polish doc', () => {
  it('documents Phase 244 layout contract and guard tests', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_244_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 244');
    expect(doc).toContain('Create Poll Form Information Hierarchy Polish');
    expect(doc).toContain('PUBLIC_CREATE_POLL_FORM_LAYOUT_ORDER');
    expect(doc).toContain('public-create-poll-form-layout.js');
    expect(doc).toContain('create-poll-creator-guidance');
    expect(doc).toContain('create-poll-preview-help');
    expect(doc).toContain(
      'tests/frontend/phase-244-create-poll-form-information-hierarchy-polish.test.ts',
    );
    expect(readme).toContain('Phase 244');
    expect(readme).toContain(PHASE_244_DOC);
  });
});
