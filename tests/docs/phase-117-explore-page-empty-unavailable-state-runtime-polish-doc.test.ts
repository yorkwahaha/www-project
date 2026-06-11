import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_117_DOC =
  'docs/www-project-phase-117-explore-page-empty-unavailable-state-runtime-polish-v1.md';

describe('Phase 117 explore page empty unavailable state runtime polish doc', () => {
  it('documents runtime polish and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_117_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 117');
    expect(source).toContain(
      'Explore Page Empty / Unavailable State Runtime Polish',
    );
    expect(source).toContain('Phase 116');
    expect(source).toContain('frontend runtime');

    expect(source).toContain('EXPLORE_FEED_LIST_MESSAGE');
    expect(source).toContain('顯示公開問卷列表');
    expect(source).toContain('EXPLORE_FEED_EMPTY_MESSAGE');
    expect(source).toContain('目前沒有正在收集中的公開問卷');
    expect(source).toContain('EXPLORE_LOAD_FAILURE_MESSAGE');
    expect(source).toContain('目前無法載入探索列表，請稍後再試');
    expect(source).toContain('EXPLORE_LOAD_MORE_FAILURE_MESSAGE');
    expect(source).toContain('無法載入更多問卷，請稍後再試。');

    expect(source).toContain('data-static-examples="true"');
    expect(source).toContain('raw backend payloads are not echoed');
    expect(source).toContain('No voter-personal-state, eligibility, or profile-completion copy');
    expect(source).toContain('status === \'active\'');

    expect(source).toContain('No backend/API/schema/auth/vote evaluator/result evaluator changes');
    expect(source).toContain('GET /polls/feed` behavior unchanged');
    expect(source).toContain('Raw Option Linkage Ban preserved');
    expect(source).toContain(
      'phase-117-explore-page-empty-unavailable-state-runtime-polish.test.ts',
    );

    expect(readme).toContain('Phase 117');
    expect(readme).toContain(PHASE_117_DOC);
    expect(readme).toContain('Explore page empty / unavailable state runtime polish');
  });
});
