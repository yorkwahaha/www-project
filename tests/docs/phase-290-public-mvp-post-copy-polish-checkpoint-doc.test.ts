import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_290_DOC =
  'docs/www-project-phase-290-public-mvp-post-copy-polish-checkpoint-v1.md';

describe('Phase 290 public MVP post-copy polish checkpoint doc', () => {
  it('documents purpose, review findings, scope, and boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_290_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 290');
    expect(source).toContain('Public MVP Post-Copy Polish Checkpoint');
    expect(source).toContain('31bd156');
    expect(source).toContain('review checkpoint');

    for (const priorPhase of [
      'Phase 285',
      'Phase 286',
      'Phase 287',
      'Phase 288',
      'Phase 289',
    ]) {
      expect(source).toContain(priorPhase);
    }

    for (const surface of ['/explore', '/login', '/my-polls', '/faq']) {
      expect(source).toContain(surface);
    }

    for (const token of [
      'PUBLIC_EXPLORE_EMPTY_MESSAGE',
      '目前沒有可瀏覽的公開問卷。',
      '請稍後再回來看看，或建立一則新問卷。',
      'PUBLIC_LOGIN_ACCOUNT_FLOW_CARD_BODY',
      '不會自動登入',
      '也不會建立瀏覽器工作階段',
      '頁首才會顯示帳號名稱',
      'PUBLIC_MY_POLLS_EMPTY_MESSAGE',
      '目前還沒有你建立的問卷。',
      '前往建立問卷（即時模式）',
      'PUBLIC_FAQ_PAGE_BANNER_BODY',
      '本產品尚未正式對外上線',
      '不代表一定可以完成投票',
      '不表示可保證',
      '不顯示票數',
      '百分比',
      'NOT EXECUTED',
      'no deploy scripts',
      'no production configuration',
      'positive_feedback',
      '回饋良好',
      'ranking',
      'recommendation',
      'hidden aggregate',
      'POST /registration',
      'option_index',
      'eligibility-before-option-resolve',
      'Raw Option Linkage Ban',
      'Official Vote transaction order',
      'UserAuthResolver',
      'localStorage',
      'sessionStorage',
      'analytics',
      'no runtime',
      'APPROVED',
      'Phases 285–289 may be archived',
      'Phase 291 blockers: none identified',
      'phase-290-public-mvp-post-copy-polish-checkpoint.test.ts',
      'phase-290-public-mvp-post-copy-polish-checkpoint-doc.test.ts',
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    ]) {
      expect(source).toContain(token);
    }

    expect(readme).toContain('Phase 290');
    expect(readme).toContain(PHASE_290_DOC);
    expect(readme).toContain('post-copy polish checkpoint');
    expect(readme).toContain('Phase 291 blockers: none identified');
  });
});
