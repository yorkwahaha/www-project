import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_121_DOC =
  'docs/www-project-phase-121-my-polls-runtime-review-checkpoint-v1.md';

describe('Phase 121 my polls runtime review checkpoint doc', () => {
  it('documents the review checkpoint and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_121_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 121');
    expect(source).toContain('My Polls Runtime Review Checkpoint');
    expect(source).toContain('Phase 120');
    expect(source).toContain('Phase 119');
    expect(source).toContain('No runtime, frontend behavior, API behavior');

    expect(source).toContain('MY_POLLS_SIGN_IN_REQUIRED_MESSAGE');
    expect(source).toContain('請先登入後查看你建立的問卷');
    expect(source).toContain('MY_POLLS_LOAD_FAILURE_MESSAGE');
    expect(source).toContain('目前無法載入你建立的問卷，請稍後再試');
    expect(source).toContain('MY_POLLS_EMPTY_MESSAGE');
    expect(source).toContain('你目前還沒有建立問卷');

    expect(source).toContain('formatMyPollsLifecycleLabel');
    expect(source).toContain('草稿');
    expect(source).toContain('收集中');
    expect(source).toContain('已公開');
    expect(source).toContain('公開鎖定期');
    expect(source).toContain('鎖定期已結束');
    expect(source).toContain('已取消');
    expect(source).toContain('已下架');

    expect(source).toContain('isCreatorOwnedPollSafe');
    expect(source).toContain('creator-safe poll summary');
    expect(source).toContain('data-mock-dashboard="true"');
    expect(source).toContain('data-live-owned-list="true"');
    expect(source).toContain('isMyPollsSignInRequiredError');
    expect(source).toContain('does not read `error.message`');
    expect(source).toContain('instead of echoing API `error` codes or `message` fields');

    expect(source).toContain('whether the current visitor voted');
    expect(source).toContain('whether profile setup is complete');
    expect(source).toContain('option_id');
    expect(source).toContain('vote token');

    expect(source).toContain('no new logs, metrics, analytics');
    expect(source).toContain('vote-by-index');
    expect(source).toContain('GET /users/me/profile');
    expect(source).toContain('Reference Answer');

    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('GET /creator/polls` behavior unchanged');
    expect(source).toContain('creator_session` remains local/demo/test creator flow only');
    expect(source).toContain(
      'phase-121-my-polls-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 121');
    expect(readme).toContain(PHASE_121_DOC);
    expect(readme).toContain('My polls runtime review checkpoint');
  });
});
