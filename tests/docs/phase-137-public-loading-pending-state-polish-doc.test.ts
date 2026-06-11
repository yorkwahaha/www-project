import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_137_DOC =
  'docs/www-project-phase-137-public-loading-pending-state-polish-v1.md';

describe('Phase 137 public loading pending state polish doc', () => {
  it('documents polish scope, pending rules, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_137_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 137');
    expect(source).toContain('Public Loading / Pending State');
    expect(source).toContain('PUBLIC_PENDING_USER_MESSAGES');
    expect(source).toContain('setBusySubmitButton');
    expect(source).toContain('/explore');
    expect(source).toContain('/vote/:id');
    expect(source).toContain('/results/:id');
    expect(source).toContain('/my-polls?live=1');
    expect(source).toContain('/registration');
    expect(source).toContain('/login');
    expect(source).toContain('/profile');
    expect(source).toContain('poll-lifecycle-controls');
    expect(source).toContain('must not echo raw backend payloads');
    expect(source).toContain('No runtime, API, DB, backend');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain(
      'phase-137-public-loading-pending-state-polish.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 137');
    expect(readme).toContain(PHASE_137_DOC);
    expect(readme).toContain('Public loading / pending state');
  });
});
