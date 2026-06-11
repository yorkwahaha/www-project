import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_115_DOC =
  'docs/www-project-phase-115-results-page-runtime-review-checkpoint-v1.md';

describe('Phase 115 results page runtime review checkpoint doc', () => {
  it('documents the review checkpoint and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_115_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 115');
    expect(source).toContain('Results Page Runtime Review Checkpoint');
    expect(source).toContain('Phase 114');
    expect(source).toContain('Phase 113');
    expect(source).toContain('No runtime, frontend behavior, API behavior');

    expect(source).toContain('revealed');
    expect(source).toContain('locked');
    expect(source).toContain('post_lock');
    expect(source).toContain('display-safe aggregate');

    expect(source).toContain('RESULTS_COLLECTING_TITLE');
    expect(source).toContain('結果尚未公開');
    expect(source).toContain('RESULTS_CANCELLED_TITLE');
    expect(source).toContain('問卷已取消');
    expect(source).toContain('RESULTS_UNPUBLISHED_TITLE');
    expect(source).toContain('問卷目前無法查看');
    expect(source).toContain('RESULTS_POLL_UNAVAILABLE_MESSAGE');
    expect(source).toContain('問卷目前無法使用');
    expect(source).toContain('RESULTS_EMPTY_AGGREGATE_MESSAGE');
    expect(source).toContain('目前沒有可顯示的聚合結果');
    expect(source).toContain('RESULTS_LOAD_FAILURE_MESSAGE');
    expect(source).toContain('目前無法載入結果，請稍後再試');

    expect(source).toContain('resolveUnavailableUserMessage');
    expect(source).toContain('ignores backend `user_message`');
    expect(source).toContain('messageForResultLoadFailure');
    expect(source).toContain('do not echo raw API payloads');

    expect(source).toContain('whether the current visitor voted');
    expect(source).toContain('which option they chose');
    expect(source).toContain('option_id');
    expect(source).toContain('vote token');

    expect(source).toContain('no new logs, metrics, analytics');
    expect(source).toContain('vote-by-index');
    expect(source).toContain('GET /users/me/profile');
    expect(source).toContain('Reference Answer');

    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('Collecting/cancelled/unpublished counter-free boundaries unchanged');
    expect(source).toContain('GET /polls/:id/results` behavior unchanged');
    expect(source).toContain(
      'phase-115-results-page-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 115');
    expect(readme).toContain(PHASE_115_DOC);
    expect(readme).toContain('Results page runtime review checkpoint');
  });
});
