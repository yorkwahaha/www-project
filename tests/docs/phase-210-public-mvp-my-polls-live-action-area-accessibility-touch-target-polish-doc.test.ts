import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_210_DOC =
  'docs/www-project-phase-210-public-mvp-my-polls-live-action-area-accessibility-touch-target-polish-v1.md';

describe('Phase 210 public MVP my-polls live action area accessibility / touch target polish doc', () => {
  it('documents polish scope, surfaces, rules, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_210_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 210');
    expect(source).toContain('My Polls Live Action Area Accessibility');
    expect(source).toContain('Phase 209');
    expect(source).toContain('/my-polls?live=1');
    expect(source).toContain('my-polls-page');
    expect(source).toContain('public-mvp.css');
    expect(source).toContain('prepareMyPollsLiveSession');
    expect(source).toContain('fetchCreatorOwnedPolls');
    expect(source).toContain('GET /creator/session');
    expect(source).toContain('GET /creator/polls');
    expect(source).toContain('CREATOR_OWNED_POLL_ALLOWED_KEYS');
    expect(source).toContain('cancel');
    expect(source).toContain('unpublish');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'phase-210-public-mvp-my-polls-live-action-area-accessibility-touch-target-polish.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 210');
    expect(readme).toContain(PHASE_210_DOC);
    expect(readme).toContain('/my-polls');
  });
});
