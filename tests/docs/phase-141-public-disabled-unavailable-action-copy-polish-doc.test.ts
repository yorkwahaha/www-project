import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_141_DOC =
  'docs/www-project-phase-141-public-disabled-unavailable-action-copy-polish-v1.md';

describe('Phase 141 public disabled unavailable action copy polish doc', () => {
  it('documents polish scope, unavailable rules, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_141_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 141');
    expect(source).toContain('Public Disabled / Unavailable Action Copy');
    expect(source).toContain('PUBLIC_UNAVAILABLE_USER_MESSAGES');
    expect(source).toContain('/vote/:id');
    expect(source).toContain('/results/:id');
    expect(source).toContain('/explore');
    expect(source).toContain('/my-polls?live=1');
    expect(source).toContain('/polls/new');
    expect(source).toMatch(/\/login|PRE_VOTE_HINT_COPY/);
    expect(source).toContain('/profile');
    expect(source).toContain('poll-lifecycle-controls');
    expect(source).toContain('must not echo raw backend payloads');
    expect(source).toContain('No runtime, API, DB, backend');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain(
      'phase-141-public-disabled-unavailable-action-copy-polish.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 141');
    expect(readme).toContain(PHASE_141_DOC);
    expect(readme).toContain('Public disabled / unavailable action');
  });
});
