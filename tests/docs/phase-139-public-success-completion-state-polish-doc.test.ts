import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_139_DOC =
  'docs/www-project-phase-139-public-success-completion-state-polish-v1.md';

describe('Phase 139 public success completion state polish doc', () => {
  it('documents polish scope, success rules, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_139_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 139');
    expect(source).toContain('Public Success / Completion State');
    expect(source).toContain('PUBLIC_SUCCESS_USER_MESSAGES');
    expect(source).toContain('/login');
    expect(source).toContain('/registration');
    expect(source).toContain('/profile');
    expect(source).toContain('/polls/new');
    expect(source).toContain('/vote/:id');
    expect(source).toContain('/my-polls?live=1');
    expect(source).toContain('poll-lifecycle-controls');
    expect(source).toContain('logout');
    expect(source).toContain('must not echo raw backend payloads');
    expect(source).toContain('No runtime, API, DB, backend');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain(
      'phase-139-public-success-completion-state-polish.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 139');
    expect(readme).toContain(PHASE_139_DOC);
    expect(readme).toContain('Public success / completion state');
  });
});
