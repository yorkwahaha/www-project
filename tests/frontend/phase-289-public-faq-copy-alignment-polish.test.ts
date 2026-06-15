import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_289_DOC =
  'docs/www-project-phase-289-public-faq-copy-alignment-polish-v1.md';

const NEW_BANNER_BODY =
  '政策說明頁：展示用，不儲存。以下為公開 MVP 規則摘要；本產品尚未正式對外上線，部分功能尚未開放，上線後以系統狀態與公告為準。';

const NEW_PARTICIPANT_VOTE_STEP =
  '投票頁可閱讀問卷、選擇一個選項並送出。正式投票可能需要登入；送出當下由系統判定是否可計票。此說明不代表一定可以完成投票。';

const OLD_BANNER_SNIPPET = '公開展示版規則摘要';
const OLD_PARTICIPANT_VOTE_SNIPPET = '送出當下由系統處理，並判定是否可計票';

const FORBIDDEN_ELIGIBILITY_PROMISE =
  /你符合資格|你不符合資格|一定能投票|可以投票|已投過票/i;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 289 public FAQ copy alignment polish', () => {
  it('defines aligned FAQ banner and participant vote copy constants', async () => {
    const pageCopy = await loadModule('public/frontend/public-page-copy.js');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(pageCopy.PUBLIC_FAQ_PAGE_BANNER_BODY).toBe(NEW_BANNER_BODY);
    expect(pageCopy.PUBLIC_FAQ_PARTICIPANT_VOTE_STEP).toBe(NEW_PARTICIPANT_VOTE_STEP);
    expect(publicUi.PUBLIC_FAQ_PAGE_BANNER_BODY).toBe(NEW_BANNER_BODY);
    expect(publicUi.PUBLIC_FAQ_PARTICIPANT_VOTE_STEP).toBe(NEW_PARTICIPANT_VOTE_STEP);
    expect(publicUi.PUBLIC_FAQ_ONBOARDING_MESSAGES).toContain(NEW_BANNER_BODY);
    expect(publicUi.PUBLIC_FAQ_ONBOARDING_MESSAGES).toContain(NEW_PARTICIPANT_VOTE_STEP);
  });

  it('keeps account-flow FAQ copy aligned with registration and login boundaries', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const faqHtml = await readFile(join(process.cwd(), 'public/faq.html'), 'utf8');

    expect(publicUi.PUBLIC_FAQ_ACCOUNT_FLOW_INTRO).toContain('不會自動登入');
    expect(publicUi.PUBLIC_FAQ_ACCOUNT_FLOW_INTRO).toContain('瀏覽器工作階段');
    expect(publicUi.PUBLIC_FAQ_ACCOUNT_FLOW_LOGIN_STEP).toContain('登入才會在頁首顯示帳號名稱');
    expect(publicUi.PUBLIC_FAQ_ACCOUNT_FLOW_PROFILE_STEP).toContain('不表示可保證');
    expect(faqHtml).toContain(publicUi.PUBLIC_FAQ_ACCOUNT_FLOW_INTRO);
    expect(faqHtml).toContain(publicUi.PUBLIC_FAQ_ACCOUNT_FLOW_LOGIN_STEP);
  });

  it('aligns faq.html static fallback with runtime FAQ sync copy', async () => {
    const faqHtml = await readFile(join(process.cwd(), 'public/faq.html'), 'utf8');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const faqPage = await loadModule('public/frontend/faq-page.js');

    expect(faqHtml).toContain('id="faq-page-banner"');
    expect(faqHtml).toContain(NEW_BANNER_BODY);
    expect(faqHtml).toContain(NEW_PARTICIPANT_VOTE_STEP);
    expect(faqHtml).not.toContain(OLD_BANNER_SNIPPET);
    expect(faqHtml).not.toContain(OLD_PARTICIPANT_VOTE_SNIPPET);
    expect(faqHtml).toContain(publicUi.PUBLIC_FAQ_PARTICIPANT_COLLECTING_STEP);
    expect(faqHtml).toContain('回饋良好');

    const banner = { textContent: 'placeholder' };
    const voteStep = { textContent: 'placeholder' };
    faqPage.syncFaqPageOnboardingCopy({
      getElementById(id: string) {
        if (id === 'faq-page-banner') {
          return banner;
        }
        if (id === 'faq-participant-vote-step') {
          return voteStep;
        }
        return null;
      },
    });
    expect(banner.textContent).toBe(NEW_BANNER_BODY);
    expect(voteStep.textContent).toBe(NEW_PARTICIPANT_VOTE_STEP);
  });

  it('keeps FAQ copy from promising eligibility outcomes or leaking counters', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const faqSource = await readFile(join(process.cwd(), 'public/frontend/faq-page.js'), 'utf8');

    for (const message of publicUi.PUBLIC_FAQ_ONBOARDING_MESSAGES) {
      expect(message, String(message)).not.toMatch(FORBIDDEN_ELIGIBILITY_PROMISE);
    }
    expect(publicUi.PUBLIC_FAQ_PARTICIPANT_VOTE_STEP).toContain('不代表一定可以完成投票');
    expect(publicUi.PUBLIC_FAQ_PARTICIPANT_COLLECTING_STEP).toContain('不顯示票數');
    expect(publicUi.PUBLIC_FAQ_PARTICIPANT_COLLECTING_STEP).toContain('百分比');
    expect(faqSource).not.toMatch(FORBIDDEN_STORAGE);
    expect(faqSource).not.toContain('Phase 289');
  });

  it('keeps faq-page.js free of API fetch paths and vote boundary drift', async () => {
    const faqSource = await readFile(join(process.cwd(), 'public/frontend/faq-page.js'), 'utf8');
    const votePage = await loadModule('public/frontend/vote-page.js');
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 201, json: async () => ({}) }));

    expect(faqSource).not.toContain('fetch(');
    expect(faqSource).not.toContain("fetchImpl('/creator/");
    await votePage.submitVoteByIndex({
      pollId: '11111111-1111-4111-8111-111111111111',
      optionIndex: 0,
      userId: '44444444-4444-4444-8444-444444444444',
      fetchImpl,
    });
    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ option_index: 0 });
    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
  });

  it('documents Phase 289 implementation record exists', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_289_DOC), 'utf8');
    expect(doc).toContain('NOT EXECUTED');
    expect(doc).toContain('PUBLIC_FAQ_PAGE_BANNER_BODY');
  });
});
