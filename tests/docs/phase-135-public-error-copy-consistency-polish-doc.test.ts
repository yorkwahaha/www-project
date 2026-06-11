import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_135_DOC =
  'docs/www-project-phase-135-public-error-copy-consistency-polish-v1.md';

describe('Phase 135 public error copy consistency polish doc', () => {
  it('documents polish scope, copy rules, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_135_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 135');
    expect(source).toContain('Public Error Copy Consistency Polish');
    expect(source).toContain('resolvePublicErrorUserMessage');
    expect(source).toContain('/explore');
    expect(source).toContain('/vote/:id');
    expect(source).toContain('/results/:id');
    expect(source).toContain('/my-polls?live=1');
    expect(source).toContain('/registration');
    expect(source).toContain('/login');
    expect(source).toContain('/profile');
    expect(source).toContain('creator lifecycle controls');
    expect(source).toContain('must not echo raw backend payloads');
    expect(source).toContain('must not echo foreign `error.message`');
    expect(source).toContain('No runtime, API, DB, backend');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain(
      'phase-135-public-error-copy-consistency-polish.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 135');
    expect(readme).toContain(PHASE_135_DOC);
    expect(readme).toContain('Public error copy consistency polish');
  });
});
