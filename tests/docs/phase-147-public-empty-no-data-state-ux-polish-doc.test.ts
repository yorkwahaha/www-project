import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_147_DOC =
  'docs/www-project-phase-147-public-empty-no-data-state-ux-polish-v1.md';

describe('Phase 147 public empty no data state UX polish doc', () => {
  it('documents polish scope, empty-state rules, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_147_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 147');
    expect(source).toContain('Public Empty / No Data State');
    expect(source).toContain('PUBLIC_EMPTY_STATE_MESSAGES');
    expect(source).toContain('PUBLIC_EMPTY_STATE_LABELS');
    expect(source).toContain('explore-page.js');
    expect(source).toContain('result-page.js');
    expect(source).toContain('my-polls-page.js');
    expect(source).toContain('creator-flow-copy.js');
    expect(source).toContain('poll-lifecycle-controls.js');
    expect(source).toContain('/explore');
    expect(source).toContain('/results/:id');
    expect(source).toContain('/my-polls?live=1');
    expect(source).toContain('Must not echo raw backend payloads');
    expect(source).toContain('No runtime API behavior');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain(
      'phase-147-public-empty-no-data-state-ux-polish.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 147');
    expect(readme).toContain(PHASE_147_DOC);
    expect(readme).toContain('Public empty / no data state');
  });
});
