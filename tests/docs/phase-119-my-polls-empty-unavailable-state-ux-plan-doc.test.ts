import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_119_DOC =
  'docs/www-project-phase-119-my-polls-empty-unavailable-state-ux-plan-v1.md';

describe('Phase 119 my polls empty unavailable state UX plan doc', () => {
  it('documents my polls UX plan and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_119_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 119');
    expect(source).toContain('docs/spec only');
    expect(source).toContain('My Polls Empty / Unavailable State UX Plan');
    expect(source).toContain('Phase 118');

    expect(source).toContain('## 1. Purpose');
    expect(source).toContain('## 2. Non-Goals');
    expect(source).toContain('creator-safe poll summary');
    expect(source).toContain(
      'implement runtime, frontend JS/CSS, backend, API, schema, or migration changes',
    );
    expect(source).toContain('GET /creator/polls');
    expect(source).toContain('creator_session');
    expect(source).toContain('not production identity');

    expect(source).toContain('### 3.1 Not signed in');
    expect(source).toContain('請先登入後查看你建立的問卷');

    expect(source).toContain('### 3.2 Local/demo creator session unavailable');
    expect(source).toContain('目前無法載入你建立的問卷，請稍後再試');

    expect(source).toContain('### 3.3 Owned list empty');
    expect(source).toContain('你目前還沒有建立問卷');

    expect(source).toContain('### 3.4 Load / network / server failure');
    expect(source).toContain('目前無法載入你建立的問卷，請稍後再試');

    expect(source).toContain('### 3.5 Lifecycle states on owned poll summary');
    expect(source).toContain('draft');
    expect(source).toContain('collecting');
    expect(source).toContain('revealed');
    expect(source).toContain('locked');
    expect(source).toContain('cancelled');
    expect(source).toContain('unpublished');
    expect(source).toContain('草稿');
    expect(source).toContain('收集中');
    expect(source).toContain('已公開');
    expect(source).toContain('公開鎖定期');
    expect(source).toContain('已取消');
    expect(source).toContain('已下架');

    expect(source).toContain('### 3.6 Mock dashboard without `?live=1`');

    expect(source).toContain('## 4. UX Boundaries Summary');
    expect(source).toContain('must not display vote counts, result previews');
    expect(source).toContain('whether the current visitor voted');
    expect(source).toContain('whether profile setup is complete');
    expect(source).toContain('option_id');

    expect(source).toContain('## 5. Privacy Guard and Raw Option Linkage Ban');
    expect(source).toContain('creator-safe poll summary');
    expect(source).toContain(
      'must not link poll-owner list views, management clicks, or lifecycle actions to a visitor',
    );
    expect(source).toContain('must not echo raw backend payloads');

    expect(source).toContain('## 6. Compatibility');
    expect(source).toContain('vote-by-index');
    expect(source).toContain('GET /explore');
    expect(source).toContain('POST /registration');
    expect(source).toContain('POST /login/session');
    expect(source).toContain('GET /users/me/profile');
    expect(source).toContain('Reference Answer');

    expect(source).toContain('## 7. Future Runtime Implementation Notes');
    expect(source).toContain('Not this phase');
    expect(source).toContain('my-polls-page.js');

    expect(source).toContain('demographic breakdown');
    expect(source).toContain('analytics linkage');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 119');
    expect(readme).toContain(PHASE_119_DOC);
    expect(readme).toContain('My polls empty / unavailable state UX plan');
  });
});
