import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_290_DOC =
  'docs/www-project-phase-290-public-mvp-post-copy-polish-checkpoint-v1.md';

const PHASE_285_EMPTY_MESSAGE = '目前沒有可瀏覽的公開問卷。';
const PHASE_285_EMPTY_SUMMARY = '請稍後再回來看看，或建立一則新問卷。';

const PHASE_287_ACCOUNT_FLOW_CARD_BODY =
  '註冊只建立帳號與個人資料欄位，不會自動登入，也不會建立瀏覽器工作階段。請用相同憑證登入後，頁首才會顯示帳號名稱。';

const PHASE_288_EMPTY_MESSAGE = '目前還沒有你建立的問卷。';
const PHASE_288_EMPTY_SUMMARY = '可前往建立一則新問卷，完成後回到此頁管理。';

const PHASE_289_BANNER_SNIPPET = '本產品尚未正式對外上線';
const PHASE_289_VOTE_NEUTRAL_SNIPPET = '不代表一定可以完成投票';

const FORBIDDEN_ELIGIBILITY_OUTCOME =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

const POST_COPY_POLISH_RUNTIME_MODULES = [
  'public/frontend/public-page-copy.js',
  'public/frontend/public-mvp-ui.js',
  'public/frontend/explore-page.js',
  'public/frontend/login-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/faq-page.js',
  'public/frontend/quality-feedback-badge.js',
  'public/frontend/registration-page.js',
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
] as const;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 290 public MVP post-copy polish checkpoint', () => {
  it('documents Phase 290 checkpoint in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 290');
    expect(readme).toContain(PHASE_290_DOC);
    expect(readme).toContain('post-copy polish checkpoint');
    expect(readme).toContain('actual deployment **NOT EXECUTED**');
  });

  it('keeps post-copy-polish runtime modules free of Phase 290 markers', async () => {
    for (const relativePath of POST_COPY_POLISH_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 290');
      expect(source, relativePath).not.toContain('Phase 291');
    }
  });

  it('confirms Phase 285 explore empty state alignment', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const explore = await loadModule('public/frontend/explore-page.js');
    const exploreHtml = await readFile(join(process.cwd(), 'public/explore.html'), 'utf8');

    expect(publicUi.PUBLIC_EXPLORE_EMPTY_MESSAGE).toBe(PHASE_285_EMPTY_MESSAGE);
    expect(publicUi.PUBLIC_EXPLORE_EMPTY_SUMMARY).toBe(PHASE_285_EMPTY_SUMMARY);
    expect(explore.EXPLORE_FEED_EMPTY_MESSAGE).toBe(PHASE_285_EMPTY_MESSAGE);
    expect(explore.EXPLORE_FEED_EMPTY_SUMMARY).toBe(PHASE_285_EMPTY_SUMMARY);
    expect(exploreHtml).toContain(PHASE_285_EMPTY_MESSAGE);
    expect(exploreHtml).toContain(PHASE_285_EMPTY_SUMMARY);
    expect(exploreHtml).toContain('href="/polls/new?live=1"');
    expect(exploreHtml).not.toContain('目前沒有正在收集中的公開問卷');
  });

  it('confirms Phase 287 login account-flow card clarity', async () => {
    const pageCopy = await loadModule('public/frontend/public-page-copy.js');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const loginPage = await loadModule('public/frontend/login-page.js');
    const loginHtml = await readFile(join(process.cwd(), 'public/login.html'), 'utf8');

    expect(pageCopy.PUBLIC_LOGIN_ACCOUNT_FLOW_CARD_BODY).toBe(PHASE_287_ACCOUNT_FLOW_CARD_BODY);
    expect(publicUi.PUBLIC_LOGIN_ACCOUNT_FLOW_CARD_BODY).toBe(PHASE_287_ACCOUNT_FLOW_CARD_BODY);
    expect(loginPage.LOGIN_ACCOUNT_FLOW_CARD_BODY).toBe(PHASE_287_ACCOUNT_FLOW_CARD_BODY);
    expect(loginHtml).toContain('id="login-account-flow-card-body"');
    expect(loginHtml).toContain(PHASE_287_ACCOUNT_FLOW_CARD_BODY);
    expect(loginHtml).toContain('不會自動登入');
    expect(loginHtml).toContain('也不會建立瀏覽器工作階段');
    expect(loginHtml).toContain('頁首才會顯示帳號名稱');
  });

  it('confirms Phase 288 my-polls empty state scope and unchanged CTA', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const creatorCopy = await loadModule('public/frontend/creator-flow-copy.js');

    expect(publicUi.PUBLIC_MY_POLLS_EMPTY_MESSAGE).toBe(PHASE_288_EMPTY_MESSAGE);
    expect(publicUi.PUBLIC_MY_POLLS_EMPTY_SUMMARY).toBe(PHASE_288_EMPTY_SUMMARY);
    expect(myPolls.MY_POLLS_EMPTY_MESSAGE).toBe(PHASE_288_EMPTY_MESSAGE);
    expect(myPolls.MY_POLLS_EMPTY_SUMMARY).toBe(PHASE_288_EMPTY_SUMMARY);
    expect(creatorCopy.CREATOR_FLOW_COPY.myPollsEmpty).toBe('目前還沒有你建立的問卷');
    expect(publicUi.PUBLIC_CTA_GO_TO_CREATE_POLL_LIVE_LABEL).toBe('前往建立問卷（即時模式）');
    expect(myPolls.MY_POLLS_EMPTY_MESSAGE).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
  });

  it('confirms Phase 289 FAQ copy alignment', async () => {
    const pageCopy = await loadModule('public/frontend/public-page-copy.js');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const faqHtml = await readFile(join(process.cwd(), 'public/faq.html'), 'utf8');

    expect(pageCopy.PUBLIC_FAQ_PAGE_BANNER_BODY).toContain(PHASE_289_BANNER_SNIPPET);
    expect(pageCopy.PUBLIC_FAQ_PARTICIPANT_VOTE_STEP).toContain(PHASE_289_VOTE_NEUTRAL_SNIPPET);
    expect(publicUi.PUBLIC_FAQ_ACCOUNT_FLOW_PROFILE_STEP).toContain('不表示可保證');
    expect(publicUi.PUBLIC_FAQ_PARTICIPANT_COLLECTING_STEP).toContain('不顯示票數');
    expect(publicUi.PUBLIC_FAQ_PARTICIPANT_COLLECTING_STEP).toContain('百分比');
    expect(faqHtml).toContain('id="faq-page-banner"');
    expect(faqHtml).toContain(PHASE_289_BANNER_SNIPPET);
    expect(faqHtml).toContain(PHASE_289_VOTE_NEUTRAL_SNIPPET);
    expect(faqHtml).toContain('回饋良好');
  });

  it('confirms release/deployment status remains NOT EXECUTED', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    const phase280 = await readFile(
      join(
        process.cwd(),
        'docs/www-project-phase-280-public-mvp-release-authorization-not-executed-status-final-checkpoint-v1.md',
      ),
      'utf8',
    );
    const packageJson = await readFile(join(process.cwd(), 'package.json'), 'utf8');

    expect(readme).toContain('actual deployment **NOT EXECUTED**');
    expect(readme).toContain('no deploy scripts added');
    expect(readme).toContain('no production configuration changed');
    expect(phase280).toContain('Actual deployment NOT EXECUTED');
    expect(phase280).toContain('The project has not launched');
    expect(packageJson).not.toMatch(/"deploy/i);
  });

  it('keeps quality_badge limited to positive_feedback with label 回饋良好', async () => {
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const exploreSource = await readFile(
      join(process.cwd(), 'public/frontend/explore-page.js'),
      'utf8',
    );

    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'negative_feedback' })).toBe(
      false,
    );
    expect(badge.shouldRenderQualityFeedbackBadge({})).toBe(false);
    expect(exploreSource).toContain('quality_badge === null || item.quality_badge === \'positive_feedback\'');
    expect(exploreSource).not.toMatch(/quality_badge.*sort|sort.*quality_badge|rank.*quality_badge/i);
  });

  it('keeps registration and vote boundaries unchanged during checkpoint', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const votePage = await loadModule('public/frontend/vote-page.js');
    const registrationSource = await readFile(
      join(process.cwd(), 'public/frontend/registration-page.js'),
      'utf8',
    );
    const fetchCalls: string[] = [];
    const registrationFetch = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'Post Copy Checkpoint User',
        birth_year_month: '1994-04',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl: registrationFetch,
    });
    expect(fetchCalls).toEqual(['/registration']);
    expect(registrationSource).not.toContain("fetchImpl('/users/me'");
    expect(registrationSource).not.toMatch(FORBIDDEN_STORAGE);

    const voteFetch = vi.fn(async () => ({ ok: true, status: 201, json: async () => ({}) }));
    await votePage.submitVoteByIndex({
      pollId: '11111111-1111-4111-8111-111111111111',
      optionIndex: 0,
      userId: '44444444-4444-4444-8444-444444444444',
      fetchImpl: voteFetch,
    });
    const voteBody = JSON.parse(String(voteFetch.mock.calls[0]?.[1]?.body));
    expect(voteBody).toEqual({ option_index: 0 });
  });

  it('keeps collecting results from rendering hidden aggregates', async () => {
    const resultPage = await loadModule('public/frontend/result-page.js');

    const collecting = resultPage.normalizeDisplaySafeResult({
      public_lifecycle_state: 'collecting',
      options: [{ display_label: '選項 A' }],
      total_votes_display: '總計 999 票',
    });
    expect(collecting?.mode).toBe('collecting');

    const documentStub = {
      createElement(tagName: string) {
        return {
          tagName,
          className: '',
          textContent: '',
          setAttribute() {},
          append() {},
          replaceChildren() {},
          ownerDocument: null as unknown,
        };
      },
    };
    documentStub.createElement = function createElement(tagName: string) {
      return {
        tagName,
        className: '',
        textContent: '',
        setAttribute() {},
        append() {},
        replaceChildren() {},
        ownerDocument: documentStub,
      };
    };

    const root = documentStub.createElement('div');
    resultPage.renderResultDisplay(root, collecting, { attachPolicyExtras: false });
    expect(root.textContent).not.toContain('999');
    expect(root.textContent).not.toContain('總計');
  });

  it('documents Phase 290 implementation record exists', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_290_DOC), 'utf8');
    expect(doc).toContain('Phase 290');
    expect(doc).toContain('31bd156');
    expect(doc).toContain('review checkpoint');
    expect(doc).toContain('Phases 285–289 may be archived');
    expect(doc).toContain('APPROVED');
    expect(doc).toContain('Phase 291 blockers: none identified');
  });
});
