import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_110_DOC =
  'docs/www-project-phase-110-vote-ux-error-handling-polish-plan-v1.md';

describe('Phase 110 vote UX error handling polish plan doc', () => {
  it('documents vote UX error handling plan and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_110_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 110');
    expect(source).toContain('docs/spec only');
    expect(source).toContain('Vote UX Error Handling Polish Plan');
    expect(source).toContain('Phase 109');

    expect(source).toContain('## 1. Purpose');
    expect(source).toContain('## 2. Non-Goals');
    expect(source).toContain('vote-time evaluator');
    expect(source).toContain('implement runtime, frontend JS/CSS, backend, API, schema, or migration changes');

    expect(source).toContain('### 3.1 Vote success');
    expect(source).toContain('投票已送出，感謝參與');
    expect(source).toContain('### 3.2 Vote failure');
    expect(source).toContain('目前無法完成這次投票');

    expect(source).toContain('### 3.3 Not signed in');
    expect(source).toContain('/login');
    expect(source).toContain('Must not call');
    expect(source).toContain('GET /users/me/profile');

    expect(source).toContain('### 3.4 Profile incomplete');
    expect(source).toContain('/profile');
    expect(source).toContain('出生年月與粗粒度居住地區');

    expect(source).toContain('### 3.5 Possibly ineligible');
    expect(source).toContain('Must not guarantee');

    expect(source).toContain('### 3.6 Duplicate vote or already voted');
    expect(source).toContain('generic submit denial');

    expect(source).toContain('### 3.7 Poll not collecting');
    expect(source).toContain('cancelled');
    expect(source).toContain('unpublished');
    expect(source).toContain('此問卷目前不接受投票');

    expect(source).toContain('### 3.8 Network or server error');
    expect(source).toContain('目前無法載入問卷');
    expect(source).toContain('目前無法送出投票');

    expect(source).toContain('## 4. UX Boundaries Summary');
    expect(source).toContain('Must not display');

    expect(source).toContain('## 5. Privacy Guard and Raw Option Linkage Ban');
    expect(source).toContain('option choice + user/session/device/request/log/trace/metric/error payload linkage');
    expect(source).toContain('option-identity-free');

    expect(source).toContain('## 6. Compatibility');
    expect(source).toContain('POST /registration');
    expect(source).toContain('POST /login/session');
    expect(source).toContain('official-vote-pre-vote-hints.js');
    expect(source).toContain('Reference Answer');

    expect(source).toContain('## 7. Future Runtime Implementation Notes');
    expect(source).toContain('Not This Phase');

    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('vote-by-index` eligibility before option resolve');
    expect(source).toContain('user_id + poll_id');
    expect(source).toContain('poll_id + option_id + shard_id');
    expect(source).toContain('creator_session');
    expect(source).toContain('X-User-Id');
    expect(source).toContain('demographic breakdown');
    expect(source).toContain('do not resolve `option_index` → `option_id`');

    expect(readme).toContain('Phase 110');
    expect(readme).toContain(PHASE_110_DOC);
    expect(readme).toContain('Vote UX error handling polish plan');
  });
});
