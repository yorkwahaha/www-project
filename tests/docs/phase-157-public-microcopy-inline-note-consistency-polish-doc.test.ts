import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_157_DOC =
  'docs/www-project-phase-157-public-microcopy-inline-note-consistency-polish-v1.md';

describe('Phase 157 public microcopy inline note consistency polish doc', () => {
  it('documents polish scope, microcopy rules, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_157_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 157');
    expect(source).toContain('Public Microcopy / Inline Note Consistency');
    expect(source).toContain('PUBLIC_INLINE_NOTES');
    expect(source).toContain('PUBLIC_MICROCOPY_MESSAGES');
    expect(source).toContain('PUBLIC_SUPPORTING_NOTES');
    expect(source).toContain('syncHomePageSupportingNotes');
    expect(source).toContain('syncHomePageMicrocopy');
    expect(source).toContain('syncExplorePageMicrocopy');
    expect(source).toContain('No runtime API behavior');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('phase-157-public-microcopy-inline-note-consistency-polish.test.ts');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 157');
    expect(readme).toContain(PHASE_157_DOC);
    expect(readme).toContain('Public microcopy / inline note consistency polish');
  });
});
