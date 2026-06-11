import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_113_DOC =
  'docs/www-project-phase-113-results-page-empty-unavailable-state-ux-plan-v1.md';

describe('Phase 113 results page empty unavailable state UX plan doc', () => {
  it('documents results page UX plan and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_113_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 113');
    expect(source).toContain('docs/spec only');
    expect(source).toContain('Results Page Empty / Unavailable State UX Plan');
    expect(source).toContain('Phase 112');

    expect(source).toContain('## 1. Purpose');
    expect(source).toContain('## 2. Non-Goals');
    expect(source).toContain('display-safe aggregate');
    expect(source).toContain(
      'implement runtime, frontend JS/CSS, backend, API, schema, or migration changes',
    );
    expect(source).toContain('collecting/cancelled/unpublished counter-free boundaries');

    expect(source).toContain('### 3.1 Aggregate available');
    expect(source).toContain('revealed');
    expect(source).toContain('locked');
    expect(source).toContain('post_lock');

    expect(source).toContain('### 3.2 Collecting');
    expect(source).toContain('結果尚未公開');

    expect(source).toContain('### 3.3 Cancelled');
    expect(source).toContain('問卷已取消');

    expect(source).toContain('### 3.4 Unpublished');
    expect(source).toContain('問卷目前無法查看');

    expect(source).toContain('### 3.5 Poll not found / unavailable');
    expect(source).toContain('問卷目前無法使用');

    expect(source).toContain('### 3.6 Empty aggregate');
    expect(source).toContain('目前沒有可顯示的聚合結果');

    expect(source).toContain('### 3.7 Load / network / server failure');
    expect(source).toContain('目前無法載入結果，請稍後再試');

    expect(source).toContain('## 4. UX Boundaries Summary');
    expect(source).toContain('collecting`, `cancelled`, and `unpublished` must not display counters');
    expect(source).toContain('whether the current visitor voted');
    expect(source).toContain('which option the current visitor chose');
    expect(source).toContain('option_id');

    expect(source).toContain('## 5. Privacy Guard and Raw Option Linkage Ban');
    expect(source).toContain('allowed public aggregate');
    expect(source).toContain(
      'must not link an option result to a user, session, device, request, log, trace, metric, error payload, or analytics record',
    );
    expect(source).toContain('must not echo raw backend payloads');

    expect(source).toContain('## 6. Compatibility');
    expect(source).toContain('vote-by-index');
    expect(source).toContain('POST /registration');
    expect(source).toContain('POST /login/session');
    expect(source).toContain('GET /users/me/profile');
    expect(source).toContain('Reference Answer');
    expect(source).toContain('GET /polls/:id/results');

    expect(source).toContain('## 7. Future Runtime Implementation Notes');
    expect(source).toContain('Not this phase');
    expect(source).toContain('result-page.js');

    expect(source).toContain('demographic breakdown');
    expect(source).toContain('ranking personalization');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('result evaluator');
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 113');
    expect(readme).toContain(PHASE_113_DOC);
    expect(readme).toContain('Results page empty / unavailable state UX plan');
  });
});
