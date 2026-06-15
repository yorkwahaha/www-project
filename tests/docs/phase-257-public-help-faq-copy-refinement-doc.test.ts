import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_257_DOC =
  'docs/www-project-phase-257-public-help-faq-copy-refinement-v1.md';

describe('Phase 257 public help / FAQ copy refinement doc', () => {
  it('documents delivery scope, boundaries, and README index', async () => {
    const source = await readFile(join(process.cwd(), PHASE_257_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 257');
    expect(source).toContain('Public Help / FAQ Copy Refinement');
    expect(source).toContain('faa5c20');
    expect(source).toContain('Phase 256');
    expect(source).toContain('public-page-copy.js');
    expect(source).toContain('public/faq.html');
    expect(source).toContain('option_index');
    expect(source).toContain('quality_badge');
    expect(source).toContain('回饋良好');
    expect(source).toContain('優質題目');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('does **not**');

    expect(readme).toContain('Phase 257');
    expect(readme).toContain(PHASE_257_DOC);
  });
});
