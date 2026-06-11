import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_114_DOC =
  'docs/www-project-phase-114-results-page-empty-unavailable-state-runtime-polish-v1.md';

describe('Phase 114 results page empty unavailable state runtime polish doc', () => {
  it('documents runtime polish and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_114_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 114');
    expect(source).toContain('Results Page Empty / Unavailable State Runtime Polish');
    expect(source).toContain('Phase 113');
    expect(source).toContain('frontend runtime');

    expect(source).toContain('RESULTS_COLLECTING_TITLE');
    expect(source).toContain('結果尚未公開');
    expect(source).toContain('RESULTS_COLLECTING_SUMMARY');
    expect(source).toContain('問卷已取消');
    expect(source).toContain('此問卷已取消，不會產生可公開顯示的聚合結果。');
    expect(source).toContain('問卷目前無法查看');
    expect(source).toContain('此問卷目前無法查看，頁面不顯示聚合結果。');
    expect(source).toContain('RESULTS_POLL_UNAVAILABLE_MESSAGE');
    expect(source).toContain('問卷目前無法使用');
    expect(source).toContain('RESULTS_EMPTY_AGGREGATE_MESSAGE');
    expect(source).toContain('目前沒有可顯示的聚合結果');
    expect(source).toContain('RESULTS_LOAD_FAILURE_MESSAGE');
    expect(source).toContain('目前無法載入結果，請稍後再試');

    expect(source).toContain('messageForResultLoadFailure');
    expect(source).toContain('backend `user_message` is not echoed');
    expect(source).toContain('Collecting / cancelled / unpublished remain counter-free');
    expect(source).toContain('No voter-personal-state copy');

    expect(source).toContain('No backend/API/schema/auth/vote evaluator/result evaluator changes');
    expect(source).toContain('GET /polls/:id/results` behavior unchanged');
    expect(source).toContain('Raw Option Linkage Ban preserved');
    expect(source).toContain(
      'phase-114-results-page-empty-unavailable-state-runtime-polish.test.ts',
    );

    expect(readme).toContain('Phase 114');
    expect(readme).toContain(PHASE_114_DOC);
    expect(readme).toContain('Results page empty / unavailable state runtime polish');
  });
});
