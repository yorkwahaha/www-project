import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_130_DOC =
  'docs/www-project-phase-130-creator-lifecycle-controls-runtime-review-checkpoint-v1.md';

describe('Phase 130 creator lifecycle controls runtime review checkpoint doc', () => {
  it('documents the review checkpoint and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_130_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 130');
    expect(source).toContain('Creator Lifecycle Controls Runtime Review Checkpoint');
    expect(source).toContain('Phase 58B');
    expect(source).toContain('Phase 129');
    expect(source).toContain('No runtime, frontend behavior, API behavior');

    expect(source).toContain('postPollLifecycleTransition');
    expect(source).toContain('/creator/polls/:id/cancel');
    expect(source).toContain('/creator/polls/:id/close');
    expect(source).toContain('/creator/polls/:id/unpublish');
    expect(source).toContain("credentials: 'same-origin'");

    expect(source).toContain('No new or changed creator ownership judgment');
    expect(source).toContain('No new or changed auth resolver usage');
    expect(source).toContain('creator_session` boundary unchanged');
    expect(source).toContain('does not replace formal login/session');
    expect(source).toContain('X-User-Id` remains explicit non-production compatibility only');

    expect(source).toContain('lifecycleActionsForState');
    expect(source).toContain('collecting` → `cancel`, `close`');
    expect(source).toContain('post_lock` → `unpublish`');

    expect(source).toContain('no counters, result previews, voter status, eligibility');
    expect(source).toContain('revealed / locked / post_lock aggregate result visibility');
    expect(source).toContain('vote token, counter shard');
    expect(source).toContain('目前無法更新問卷狀態，請稍後再試。');
    expect(source).toContain('messageForLifecycleTransitionFailure');

    expect(source).toContain('Official Vote transaction order unchanged');
    expect(source).toContain('Vote-by-index eligibility before option resolve unchanged');
    expect(source).toContain('Reference Answer remains disconnected');
    expect(source).toContain('demographic breakdown, ranking personalization, or analytics linkage');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain(
      'phase-130-creator-lifecycle-controls-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 130');
    expect(readme).toContain(PHASE_130_DOC);
    expect(readme).toContain('Creator lifecycle controls runtime review checkpoint');
  });
});
