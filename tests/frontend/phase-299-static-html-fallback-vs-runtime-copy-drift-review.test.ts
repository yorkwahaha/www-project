import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const PHASE_296_DOC =
  'docs/www-project-phase-296-public-mvp-backlog-planning-checkpoint-v1.md';
const PHASE_298_DOC =
  'docs/www-project-phase-298-public-mvp-share-keyboard-reduced-motion-regression-review-v1.md';
const PHASE_299_DOC =
  'docs/www-project-phase-299-static-html-fallback-vs-runtime-copy-drift-review-v1.md';

const PHASE_285_EMPTY_MESSAGE = '目前沒有可瀏覽的公開問卷。';
const PHASE_285_EMPTY_SUMMARY = '請稍後再回來看看，或建立一則新問卷。';
const PHASE_287_ACCOUNT_FLOW_CARD_BODY =
  '註冊只建立帳號與個人資料欄位，不會自動登入，也不會建立瀏覽器工作階段。請用相同憑證登入後，頁首才會顯示帳號名稱。';
const PHASE_288_EMPTY_MESSAGE = '目前還沒有你建立的問卷。';
const PHASE_288_EMPTY_SUMMARY = '可前往建立一則新問卷，完成後回到此頁管理。';
const PHASE_289_BANNER_SNIPPET = '本產品尚未正式對外上線';
const PHASE_289_VOTE_NEUTRAL_SNIPPET = '不代表一定可以完成投票';

const PUBLIC_HTML_SHELLS = [
  'public/index.html',
  'public/explore.html',
  'public/faq.html',
  'public/login.html',
  'public/registration.html',
  'public/profile.html',
  'public/create-poll.html',
  'public/my-polls.html',
  'public/vote.html',
  'public/results.html',
] as const;

const COPY_RUNTIME_MODULES = [
  'public/frontend/public-page-copy.js',
  'public/frontend/public-mvp-ui.js',
] as const;

const PROTECTED_BACKEND_PATHS = [
  'src/polls/repository.ts',
  'src/http/official-vote-routes.ts',
  'src/auth/user-auth-resolver.ts',
] as const;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 299 static HTML fallback vs runtime copy drift review', () => {
  it('confirms Phase 299 record exists with FU-292-02/M-296-03 closure and README index', async () => {
    const checkpoint296 = await readFile(join(process.cwd(), PHASE_296_DOC), 'utf8');
    const review298 = await readFile(join(process.cwd(), PHASE_298_DOC), 'utf8');
    const review299 = await readFile(join(process.cwd(), PHASE_299_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(checkpoint296).toContain('M-296-03');
    expect(checkpoint296).toContain('FU-292-02');
    expect(review298).toContain('FU-292-02');
    expect(review299).toContain('Phase 299');
    expect(review299).toContain('d236362');
    expect(review299).toContain('CLOSED — drift audit PASS');
    expect(review299).toContain('Overall drift review result');
    expect(readme).toContain('Phase 299');
    expect(readme).toContain(PHASE_299_DOC);
  });

  it('keeps Phase 299 as review-only without runtime or HTML delivery markers', async () => {
    for (const relativePath of PUBLIC_HTML_SHELLS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 299');
      expect(source, relativePath).not.toContain('Phase 300');
    }

    for (const relativePath of COPY_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 299');
    }

    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 299');
    }
  });

  it('confirms Phase 285 explore empty static fallback matches runtime constants', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const explore = await loadModule('public/frontend/explore-page.js');
    const exploreHtml = await readFile(join(process.cwd(), 'public/explore.html'), 'utf8');

    expect(publicUi.PUBLIC_EXPLORE_EMPTY_MESSAGE).toBe(PHASE_285_EMPTY_MESSAGE);
    expect(publicUi.PUBLIC_EXPLORE_EMPTY_SUMMARY).toBe(PHASE_285_EMPTY_SUMMARY);
    expect(explore.EXPLORE_FEED_EMPTY_MESSAGE).toBe(PHASE_285_EMPTY_MESSAGE);
    expect(exploreHtml).toContain(PHASE_285_EMPTY_MESSAGE);
    expect(exploreHtml).toContain(PHASE_285_EMPTY_SUMMARY);
    expect(exploreHtml).toContain('href="/polls/new?live=1"');
  });

  it('confirms Phase 287 login account-flow card static fallback matches PAGE_COPY', async () => {
    const pageCopy = await loadModule('public/frontend/public-page-copy.js');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const loginHtml = await readFile(join(process.cwd(), 'public/login.html'), 'utf8');

    expect(pageCopy.PUBLIC_LOGIN_ACCOUNT_FLOW_CARD_BODY).toBe(PHASE_287_ACCOUNT_FLOW_CARD_BODY);
    expect(publicUi.PUBLIC_LOGIN_ACCOUNT_FLOW_CARD_BODY).toBe(PHASE_287_ACCOUNT_FLOW_CARD_BODY);
    expect(loginHtml).toContain('id="login-account-flow-card-body"');
    expect(loginHtml).toContain(PHASE_287_ACCOUNT_FLOW_CARD_BODY);
  });

  it('confirms Phase 288 my-polls empty runtime constants unchanged', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const myPolls = await loadModule('public/frontend/my-polls-page.js');

    expect(publicUi.PUBLIC_MY_POLLS_EMPTY_MESSAGE).toBe(PHASE_288_EMPTY_MESSAGE);
    expect(publicUi.PUBLIC_MY_POLLS_EMPTY_SUMMARY).toBe(PHASE_288_EMPTY_SUMMARY);
    expect(myPolls.MY_POLLS_EMPTY_MESSAGE).toBe(PHASE_288_EMPTY_MESSAGE);
    expect(myPolls.MY_POLLS_EMPTY_SUMMARY).toBe(PHASE_288_EMPTY_SUMMARY);
  });

  it('confirms Phase 289 FAQ static fallback matches PAGE_COPY', async () => {
    const pageCopy = await loadModule('public/frontend/public-page-copy.js');
    const faqHtml = await readFile(join(process.cwd(), 'public/faq.html'), 'utf8');

    expect(pageCopy.PUBLIC_FAQ_PAGE_BANNER_BODY).toContain(PHASE_289_BANNER_SNIPPET);
    expect(pageCopy.PUBLIC_FAQ_PARTICIPANT_VOTE_STEP).toContain(PHASE_289_VOTE_NEUTRAL_SNIPPET);
    expect(faqHtml).toContain('id="faq-page-banner"');
    expect(faqHtml).toContain(PHASE_289_BANNER_SNIPPET);
    expect(faqHtml).toContain(PHASE_289_VOTE_NEUTRAL_SNIPPET);
  });

  it('confirms registration and profile static shells align with no-auto-login and no-eligibility-promise copy', async () => {
    const pageCopy = await loadModule('public/frontend/public-page-copy.js');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const registrationHtml = await readFile(join(process.cwd(), 'public/registration.html'), 'utf8');
    const profileHtml = await readFile(join(process.cwd(), 'public/profile.html'), 'utf8');

    expect(registrationHtml).toContain(pageCopy.PUBLIC_REGISTRATION_PAGE_BANNER_BODY);
    expect(registrationHtml).toContain(pageCopy.PUBLIC_REGISTRATION_PAGE_LEAD_PRIMARY);
    expect(registrationHtml).toContain(publicUi.PUBLIC_REGISTRATION_SUCCESS_MESSAGE);
    expect(registrationHtml).toContain('不會自動登入');
    expect(registrationHtml).not.toContain('Set-Cookie');

    expect(profileHtml).toContain(pageCopy.PUBLIC_PROFILE_PAGE_LEAD);
    expect(profileHtml).toContain(pageCopy.PUBLIC_PROFILE_SIGNED_IN_GUIDANCE_NOTE);
    expect(profileHtml).toContain('不表示可保證符合或不符合');
  });

  it('confirms vote/results static shells preserve neutral pre-vote and hidden-aggregate copy', async () => {
    const pageCopy = await loadModule('public/frontend/public-page-copy.js');
    const voteHtml = await readFile(join(process.cwd(), 'public/vote.html'), 'utf8');
    const resultsHtml = await readFile(join(process.cwd(), 'public/results.html'), 'utf8');

    expect(voteHtml).toContain(pageCopy.PUBLIC_VOTE_PAGE_REMINDER_LEAD);
    expect(voteHtml).toContain('不顯示票數、百分比、總計、排名、趨勢或進度；發起者也看不到期中統計');
    expect(voteHtml).toContain(PHASE_289_VOTE_NEUTRAL_SNIPPET);
    expect(resultsHtml).toContain(pageCopy.PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD);
    expect(resultsHtml).toContain('不顯示票數、百分比');
  });

  it('reaffirms BL-286-02 dual copy modules without merge markers in Phase 299 doc', async () => {
    const review299 = await readFile(join(process.cwd(), PHASE_299_DOC), 'utf8');
    const pageCopySource = await readFile(
      join(process.cwd(), 'public/frontend/public-page-copy.js'),
      'utf8',
    );
    const publicUiSource = await readFile(
      join(process.cwd(), 'public/frontend/public-mvp-ui.js'),
      'utf8',
    );

    expect(review299).toContain('BL-286-02');
    expect(review299).toContain('no constant merge');
    expect(review299).toContain('public-page-copy.js');
    expect(review299).toContain('public-mvp-ui.js');
    expect(review299).not.toContain('ad hoc merge performed');
    expect(pageCopySource).toContain('export const PUBLIC_LOGIN_ACCOUNT_FLOW_CARD_BODY');
    expect(publicUiSource).toContain("export * from './public-page-copy.js'");
    expect(publicUiSource).toContain('PUBLIC_EXPLORE_EMPTY_MESSAGE');
  });

  it('keeps registration submit boundary and quality_badge gate unchanged', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const registrationSource = await readFile(
      join(process.cwd(), 'public/frontend/registration-page.js'),
      'utf8',
    );
    const fetchCalls: string[] = [];

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'Drift Review User',
        birth_year_month: '1994-04',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl: async (url: string) => {
        fetchCalls.push(String(url));
        return { status: 201 };
      },
    });

    expect(fetchCalls).toEqual(['/registration']);
    expect(registrationSource).not.toContain("fetchImpl('/users/me'");
    expect(registrationSource).not.toMatch(FORBIDDEN_STORAGE);
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
  });

  it('records PASS drift review and no copy merge in Phase 299 doc', async () => {
    const review299 = await readFile(join(process.cwd(), PHASE_299_DOC), 'utf8');

    expect(review299).toContain('no copy change');
    expect(review299).toContain('no constant merge');
    expect(review299).toContain('Overall drift review result');
    expect(review299).toContain('NOT EXECUTED');
    expect(review299).toContain('NOT COMPLETED');
    expect(review299).not.toContain('copy fix applied');
    expect(review299).not.toContain('constants merged');
  });

  it('indexes drift review in README without claiming deployment', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(readme).toContain('drift');
    expect(readme).toContain('FU-292-02');
    expect(readme).toContain('BL-286-02');
    expect(readme).toContain('NOT EXECUTED');
    expect(readme).toContain('NOT COMPLETED');
    expect(readme).not.toContain('launch completed');
    expect(readme).not.toContain('deployment executed');
  });
});
