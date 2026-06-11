import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_116_DOC =
  'docs/www-project-phase-116-explore-page-empty-unavailable-state-ux-plan-v1.md';

describe('Phase 116 explore page empty unavailable state UX plan doc', () => {
  it('documents explore page UX plan and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_116_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 116');
    expect(source).toContain('docs/spec only');
    expect(source).toContain('Explore Page Empty / Unavailable State UX Plan');
    expect(source).toContain('Phase 115');

    expect(source).toContain('## 1. Purpose');
    expect(source).toContain('## 2. Non-Goals');
    expect(source).toContain('display-safe poll summary');
    expect(source).toContain(
      'implement runtime, frontend JS/CSS, backend, API, schema, or migration changes',
    );
    expect(source).toContain('GET /polls/feed');

    expect(source).toContain('### 3.1 Live feed has collecting polls');
    expect(source).toContain('顯示公開問卷列表');

    expect(source).toContain('### 3.2 Live feed empty');
    expect(source).toContain('目前沒有正在收集中的公開問卷');

    expect(source).toContain('### 3.3 Load / network / server failure');
    expect(source).toContain('目前無法載入探索列表，請稍後再試');

    expect(source).toContain('### 3.4 Static examples');
    expect(source).toContain('靜態範例');
    expect(source).toContain('不混入 live feed');

    expect(source).toContain('### 3.5 Non-collecting polls');
    expect(source).toContain('不在 live explore feed 顯示');

    expect(source).toContain('## 4. UX Boundaries Summary');
    expect(source).toContain('must not display vote counts, result previews');
    expect(source).toContain('whether the current visitor voted');
    expect(source).toContain('whether profile setup is complete');
    expect(source).toContain('option_id');

    expect(source).toContain('## 5. Privacy Guard and Raw Option Linkage Ban');
    expect(source).toContain('display-safe poll summary');
    expect(source).toContain(
      'must not link poll exposure, card clicks, option curiosity, or vote intent to a user, session, device, request, log, trace, metric, error payload, or analytics record',
    );
    expect(source).toContain('must not echo raw backend payloads');

    expect(source).toContain('## 6. Compatibility');
    expect(source).toContain('vote-by-index');
    expect(source).toContain('GET /polls/:id/results');
    expect(source).toContain('POST /registration');
    expect(source).toContain('POST /login/session');
    expect(source).toContain('GET /users/me/profile');
    expect(source).toContain('Reference Answer');

    expect(source).toContain('## 7. Future Runtime Implementation Notes');
    expect(source).toContain('Not this phase');
    expect(source).toContain('explore-page.js');

    expect(source).toContain('ranking personalization');
    expect(source).toContain('demographic breakdown');
    expect(source).toContain('analytics linkage');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 116');
    expect(readme).toContain(PHASE_116_DOC);
    expect(readme).toContain('Explore page empty / unavailable state UX plan');
  });
});
