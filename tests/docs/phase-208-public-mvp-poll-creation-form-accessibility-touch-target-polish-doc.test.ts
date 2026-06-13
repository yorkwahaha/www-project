import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_208_DOC =
  'docs/www-project-phase-208-public-mvp-poll-creation-form-accessibility-touch-target-polish-v1.md';

describe('Phase 208 public MVP poll creation form accessibility / touch target polish doc', () => {
  it('documents polish scope, surfaces, rules, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_208_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 208');
    expect(source).toContain('Poll Creation Form Accessibility');
    expect(source).toContain('Phase 207');
    expect(source).toContain('/polls/new');
    expect(source).toContain('create-poll-page');
    expect(source).toContain('public-mvp.css');
    expect(source).toContain('submitCreatePollDemo');
    expect(source).toContain('POST /creator/polls');
    expect(source).toContain('?live=1');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'phase-208-public-mvp-poll-creation-form-accessibility-touch-target-polish.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 208');
    expect(readme).toContain(PHASE_208_DOC);
    expect(readme).toContain('/polls/new');
  });
});
