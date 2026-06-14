import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_219_DOC =
  'docs/www-project-phase-219-poll-creation-my-polls-state-copy-runtime-v1.md';

describe('Phase 219 poll creation my polls state copy runtime doc', () => {
  it('documents copy-only runtime scope, changes, boundaries, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_219_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 219');
    expect(source).toContain('Poll Creation / My Polls State Copy');
    expect(source).toContain('fda9a92');
    expect(source).toContain('Phase 218');
    expect(source).toContain('PUBLIC_CREATOR_STATE_USER_MESSAGES');
    expect(source).toContain('PUBLIC_CREATE_POLL_SUBMIT_PENDING_MESSAGE');
    expect(source).toContain('PUBLIC_CREATE_POLL_FAILURE_MESSAGE');
    expect(source).toContain('PUBLIC_CREATOR_SESSION_FAILURE_MESSAGE');
    expect(source).toContain('create-poll-page.js');
    expect(source).toContain('my-polls-page.js');
    expect(source).toContain('POST /creator/polls');
    expect(source).toContain('GET /creator/polls');
    expect(source).toContain('GET /creator/session');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('quality_badge');
    expect(source).toContain('positive_feedback');
    expect(source).toContain('回饋良好');
    expect(source).toContain('migrate:check');
    expect(source).toContain(
      'phase-219-poll-creation-my-polls-state-copy-runtime.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 219');
    expect(readme).toContain(PHASE_219_DOC);
  });
});
