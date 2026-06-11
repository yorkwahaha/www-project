import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_131_DOC =
  'docs/www-project-phase-131-creator-results-panel-runtime-review-checkpoint-v1.md';

describe('Phase 131 creator results panel runtime review checkpoint doc', () => {
  it('documents the review checkpoint and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_131_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 131');
    expect(source).toContain('Creator Results Panel Runtime Review Checkpoint');
    expect(source).toContain('Phase 115');
    expect(source).toContain('Phase 130');
    expect(source).toContain('No runtime, frontend behavior, API behavior');

    expect(source).toContain('parseCreatorManageMode');
    expect(source).toContain('mountCreatorLifecyclePanel');
    expect(source).toContain('/results/:pollId?creator=1` gates creator results panel');
    expect(source).toContain('GET /polls/:pollId/results');

    expect(source).toContain('GET /creator/polls/:id/results` boundary');
    expect(source).toContain('route not used');
    expect(source).toContain('not** call `/creator/polls/:id/results`');

    expect(source).toContain('No new or changed creator ownership judgment');
    expect(source).toContain('does not self-adjudicate ownership');
    expect(source).toContain('creator_session` boundary unchanged');
    expect(source).toContain('does not replace formal login/session');
    expect(source).toContain('X-User-Id` remains explicit non-production compatibility only');

    expect(source).toContain('collecting / cancelled / unpublished');
    expect(source).toContain('revealed / locked / post_lock');
    expect(source).toContain('individual vote choices, voter lists');
    expect(source).toContain('RESULT_DISPLAY_REFRESH_FAILURE_MESSAGE');
    expect(source).toContain('messageForResultLoadFailure');

    expect(source).toContain('Official Vote transaction order unchanged');
    expect(source).toContain('Vote-by-index eligibility before option resolve unchanged');
    expect(source).toContain('Reference Answer remains disconnected');
    expect(source).toContain('demographic breakdown, ranking personalization, or analytics linkage');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain(
      'phase-131-creator-results-panel-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 131');
    expect(readme).toContain(PHASE_131_DOC);
    expect(readme).toContain('Creator results panel runtime review checkpoint');
  });
});
