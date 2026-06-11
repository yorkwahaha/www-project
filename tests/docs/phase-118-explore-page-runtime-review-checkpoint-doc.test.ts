import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_118_DOC =
  'docs/www-project-phase-118-explore-page-runtime-review-checkpoint-v1.md';

describe('Phase 118 explore page runtime review checkpoint doc', () => {
  it('documents the review checkpoint and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_118_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 118');
    expect(source).toContain('Explore Page Runtime Review Checkpoint');
    expect(source).toContain('Phase 117');
    expect(source).toContain('Phase 116');
    expect(source).toContain('No runtime, frontend behavior, API behavior');

    expect(source).toContain('display-safe poll summary');
    expect(source).toContain('EXPLORE_FEED_LIST_MESSAGE');
    expect(source).toContain('顯示公開問卷列表');
    expect(source).toContain('EXPLORE_FEED_EMPTY_MESSAGE');
    expect(source).toContain('目前沒有正在收集中的公開問卷');
    expect(source).toContain('EXPLORE_LOAD_FAILURE_MESSAGE');
    expect(source).toContain('目前無法載入探索列表，請稍後再試');
    expect(source).toContain('EXPLORE_LOAD_MORE_FAILURE_MESSAGE');
    expect(source).toContain('無法載入更多問卷，請稍後再試。');

    expect(source).toContain('data-static-examples="true"');
    expect(source).toContain('does not include `/vote/demo`');
    expect(source).toContain('status === \'active\'');
    expect(source).toContain('isExploreFeedPayloadSafe');

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
    expect(source).toContain('GET /polls/feed` behavior unchanged');
    expect(source).toContain(
      'phase-118-explore-page-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 118');
    expect(readme).toContain(PHASE_118_DOC);
    expect(readme).toContain('Explore page runtime review checkpoint');
  });
});
