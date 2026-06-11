import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_120_DOC =
  'docs/www-project-phase-120-my-polls-empty-unavailable-state-runtime-polish-v1.md';

describe('Phase 120 my polls empty unavailable state runtime polish doc', () => {
  it('documents runtime polish and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_120_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 120');
    expect(source).toContain('My Polls Empty / Unavailable State Runtime Polish');
    expect(source).toContain('Phase 119');
    expect(source).toContain('frontend runtime');

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
    expect(source).toContain('已取消');
    expect(source).toContain('已下架');

    expect(source).toContain('isCreatorOwnedPollSafe');
    expect(source).toContain('data-mock-dashboard="true"');
    expect(source).toContain('data-live-owned-list="true"');
    expect(source).toContain('isMyPollsSignInRequiredError');
    expect(source).toContain('backend payloads and foreign error text are not echoed');

    expect(source).toContain('No backend/API/schema/auth/creator ownership/lifecycle evaluator changes');
    expect(source).toContain('GET /creator/polls` behavior unchanged');
    expect(source).toContain('creator_session` remains local/demo/test creator flow only');
    expect(source).toContain('Raw Option Linkage Ban preserved');
    expect(source).toContain(
      'phase-120-my-polls-empty-unavailable-state-runtime-polish.test.ts',
    );

    expect(readme).toContain('Phase 120');
    expect(readme).toContain(PHASE_120_DOC);
    expect(readme).toContain('My polls empty / unavailable state runtime polish');
  });
});
