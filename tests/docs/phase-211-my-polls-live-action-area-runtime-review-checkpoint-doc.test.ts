import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_211_DOC =
  'docs/www-project-phase-211-my-polls-live-action-area-runtime-review-checkpoint-v1.md';

describe('Phase 211 my-polls live action area runtime review checkpoint doc', () => {
  it('documents review scope, Phase 210 delivery, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_211_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 211');
    expect(source).toContain('My Polls Live Action Area Runtime Review Checkpoint');
    expect(source).toContain('cb562ac');
    expect(source).toContain('Phase 210');

    expect(source).toContain('/my-polls?live=1');
    expect(source).toContain('my-polls-page');
    expect(source).toContain('public-mvp.css');
    expect(source).toContain('my-polls-page.js');
    expect(source).toContain('prepareMyPollsLiveSession');
    expect(source).toContain('fetchCreatorOwnedPolls');
    expect(source).toContain('GET /creator/session');
    expect(source).toContain('GET /creator/polls');
    expect(source).toContain('CREATOR_OWNED_POLL_ALLOWED_KEYS');
    expect(source).toContain('cancel');
    expect(source).toContain('unpublish');
    expect(source).toContain('positive_feedback');
    expect(source).toContain('回饋良好');
    expect(source).toContain('option_index');
    expect(source).toContain('localStorage');
    expect(source).toContain('sessionStorage');
    expect(source).toContain('APPROVED');
    expect(source).toContain('No runtime');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('smoke:public:local');

    expect(source).toContain(
      'phase-211-my-polls-live-action-area-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 211');
    expect(readme).toContain(PHASE_211_DOC);
    expect(readme).toContain('My polls live action area runtime review checkpoint');
  });
});
