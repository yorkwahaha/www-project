import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_309_DOC = 'docs/www-project-phase-309-results-reveal-animation-v1.md';

describe('Phase 309 results reveal animation doc', () => {
  it('documents FU-304-02 scope, files, and boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_309_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 309');
    expect(source).toContain('Results Reveal Animation');
    expect(source).toContain('FU-304-02');
    expect(source).toContain('c7b1783');
    expect(source).toContain('result-page.js');
    expect(source).toContain('public-mvp.css');
    expect(source).toContain('presentation-only');
    expect(source).toContain('prefers-reduced-motion');
    expect(source).toContain('Raw Option Linkage Ban');

    expect(readme).toContain('Phase 309');
    expect(readme).toContain(PHASE_309_DOC);
  });

  it('records validation gates and guard tests', async () => {
    const source = await readFile(join(process.cwd(), PHASE_309_DOC), 'utf8');

    for (const gate of [
      'git diff --check',
      'npm test',
      'npm run typecheck',
      'npm run build',
      'npm run smoke:public:local',
    ]) {
      expect(source, `Phase 309 doc should record ${gate}`).toContain(gate);
    }

    expect(source).toContain(
      'phase-309-results-reveal-animation-doc.test.ts',
    );
    expect(source).toContain('phase-309-results-reveal-animation.test.ts');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );
  });
});
