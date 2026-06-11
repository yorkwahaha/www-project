import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_149_DOC =
  'docs/www-project-phase-149-public-help-hint-text-consistency-polish-v1.md';

describe('Phase 149 public help hint text consistency polish doc', () => {
  it('documents polish scope, hint rules, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_149_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 149');
    expect(source).toContain('Public Help / Hint Text Consistency');
    expect(source).toContain('PUBLIC_HINT_TEXT_MESSAGES');
    expect(source).toContain('login-page.js');
    expect(source).toContain('registration-page.js');
    expect(source).toContain('profile-completion-prompt.js');
    expect(source).toContain('official-vote-pre-vote-hints.js');
    expect(source).toContain('explore-page.js');
    expect(source).toContain('result-page.js');
    expect(source).toContain('creator-flow-copy.js');
    expect(source).toContain('/login');
    expect(source).toContain('/registration');
    expect(source).toContain('/vote/:id');
    expect(source).toContain('/explore');
    expect(source).toContain('/results/:id');
    expect(source).toContain('Must not echo raw backend payloads');
    expect(source).toContain('No runtime API behavior');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain(
      'phase-149-public-help-hint-text-consistency-polish.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 149');
    expect(readme).toContain(PHASE_149_DOC);
    expect(readme).toContain('Public help / hint text');
  });
});
