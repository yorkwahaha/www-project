import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_286_DOC =
  'docs/www-project-phase-286-public-mvp-copy-consistency-review-checkpoint-v1.md';

const PUBLIC_COPY_RUNTIME_MODULES = [
  'public/frontend/public-page-copy.js',
  'public/frontend/public-mvp-ui.js',
  'public/frontend/public-mvp-home.js',
  'public/frontend/explore-page.js',
  'public/frontend/registration-page.js',
  'public/frontend/login-page.js',
  'public/frontend/profile-page.js',
  'public/frontend/vote-page.js',
  'public/frontend/official-vote-pre-vote-hints.js',
  'public/frontend/result-page.js',
  'public/frontend/quality-feedback-badge.js',
  'public/frontend/faq-page.js',
  'public/frontend/my-polls-page.js',
] as const;

const PUBLIC_ROUTE_HTML = [
  'public/index.html',
  'public/explore.html',
  'public/login.html',
  'public/registration.html',
  'public/profile.html',
  'public/vote.html',
  'public/results.html',
  'public/my-polls.html',
  'public/faq.html',
] as const;

const PHASE_285_EMPTY_MESSAGE = '目前沒有可瀏覽的公開問卷。';
const PHASE_285_EMPTY_SUMMARY = '請稍後再回來看看，或建立一則新問卷。';

const FORBIDDEN_ELIGIBILITY_OUTCOME =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_PRE_VOTE_LEAKAGE =
  /你投過|你尚未投票|選擇了|投給哪個/i;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 286 public MVP copy consistency review checkpoint', () => {
  it('documents Phase 286 review checkpoint in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 286');
    expect(readme).toContain(PHASE_286_DOC);
    expect(readme).toContain('BL-282-02');
    expect(readme).toContain('copy consistency review checkpoint');
  });

  it('keeps public copy runtime modules free of Phase 286 markers', async () => {
    for (const relativePath of PUBLIC_COPY_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 286');
      expect(source, relativePath).not.toContain('Phase 287');
    }
  });

  it('keeps registration copy and flow clear about no auto-login', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const registration = await loadModule('public/frontend/registration-page.js');
    const registrationHtml = await readFile(
      join(process.cwd(), 'public/registration.html'),
      'utf8',
    );
    const registrationSource = await readFile(
      join(process.cwd(), 'public/frontend/registration-page.js'),
      'utf8',
    );
    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });

    expect(publicUi.PUBLIC_REGISTRATION_SUCCESS_MESSAGE).toContain('不會自動登入');
    expect(publicUi.PUBLIC_REGISTRATION_SUCCESS_MESSAGE).toContain('瀏覽器工作階段');
    expect(registrationHtml).toContain('不會自動登入');
    expect(registrationHtml).toContain('href="/login"');

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'Copy Review User',
        birth_year_month: '1994-04',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl,
    });

    expect(fetchCalls).toEqual(['/registration']);
    expect(registrationSource).not.toContain("fetchImpl('/users/me'");
    expect(registrationSource).not.toMatch(FORBIDDEN_STORAGE);
  });

  it('keeps login and profile prompts from promising eligibility', async () => {
    const pageCopy = await loadModule('public/frontend/public-page-copy.js');
    const loginHtml = await readFile(join(process.cwd(), 'public/login.html'), 'utf8');
    const profileHtml = await readFile(join(process.cwd(), 'public/profile.html'), 'utf8');

    expect(pageCopy.PUBLIC_LOGIN_PROFILE_NEXT_STEP_HINT).toContain('不表示可保證');
    expect(pageCopy.PUBLIC_PROFILE_PAGE_LEAD).toContain('不表示可保證');
    expect(pageCopy.PUBLIC_PROFILE_SIGNED_IN_GUIDANCE_NOTE).toContain('不表示可保證');
    expect(loginHtml).toContain('不表示可保證符合任何問卷資格');
    expect(profileHtml).toContain('不表示可保證符合或不符合任何問卷資格');
    expect(loginHtml).toContain('註冊不會自動登入');
  });

  it('keeps vote pre-vote hints neutral without eligibility disclosure', async () => {
    const hints = await loadModule('public/frontend/official-vote-pre-vote-hints.js');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const voteHtml = await readFile(join(process.cwd(), 'public/vote.html'), 'utf8');
    const hintsSource = await readFile(
      join(process.cwd(), 'public/frontend/official-vote-pre-vote-hints.js'),
      'utf8',
    );

    expect(hints.PRE_VOTE_HINT_COPY.anonymous).toBe(
      publicUi.PUBLIC_VOTE_PRE_VOTE_ANONYMOUS_HINT,
    );
    expect(hints.PRE_VOTE_HINT_COPY.incompleteProfile).toBe(
      publicUi.PUBLIC_VOTE_PRE_VOTE_INCOMPLETE_PROFILE_HINT,
    );
    expect(hints.PRE_VOTE_HINT_COPY.completeProfile).toBe(
      publicUi.PUBLIC_VOTE_PRE_VOTE_NEUTRAL_SUBMIT_HINT,
    );
    expect(hints.PRE_VOTE_HINT_COPY.anonymous).toContain('不代表一定可以完成投票');
    expect(hints.PRE_VOTE_HINT_COPY.incompleteProfile).toContain('不代表你一定符合或不符合');
    expect(voteHtml).toContain('送出當下由系統判定是否可計票');
    expect(hintsSource).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
    expect(hintsSource).not.toMatch(FORBIDDEN_PRE_VOTE_LEAKAGE);
  });

  it('keeps collecting results from rendering hidden aggregates', async () => {
    const resultPage = await loadModule('public/frontend/result-page.js');
    const resultsHtml = await readFile(join(process.cwd(), 'public/results.html'), 'utf8');

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
      const node = {
        tagName,
        className: '',
        textContent: '',
        setAttribute() {},
        append() {},
        replaceChildren() {},
        ownerDocument: documentStub,
      };
      return node;
    };

    const root = documentStub.createElement('div');
    resultPage.renderResultDisplay(root, collecting, { attachPolicyExtras: false });

    const walkText = (node: {
      textContent: string;
      append: (child: unknown) => void;
    }): string => node.textContent;

    expect(walkText(root)).not.toContain('999');
    expect(walkText(root)).not.toContain('總計');
    expect(resultsHtml).toContain('收集中不顯示票數');
  });

  it('aligns explore empty state with Phase 285 constants and static fallback', async () => {
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

  it('keeps quality_badge limited to positive_feedback with label 回饋良好', async () => {
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const pageCopy = await loadModule('public/frontend/public-page-copy.js');
    const indexHtml = await readFile(join(process.cwd(), 'public/index.html'), 'utf8');
    const faqHtml = await readFile(join(process.cwd(), 'public/faq.html'), 'utf8');

    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'negative_feedback' })).toBe(
      false,
    );
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
    expect(pageCopy.PUBLIC_HOME_VALUE_QUALITY_FEEDBACK_BODY).toContain('回饋良好');
    // Phase 301: the homepage no longer renders quality-feedback copy (it is a
    // collecting-only swipe shell); the 回饋良好 label remains explained on FAQ and
    // in the shared constant above.
    expect(faqHtml).toContain('回饋良好');
  });

  it('keeps primary route HTML shells aligned with collecting-hidden and no-auto-login themes', async () => {
    for (const relativePath of PUBLIC_ROUTE_HTML) {
      const html = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(html, relativePath).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
      expect(html, relativePath).not.toMatch(FORBIDDEN_PRE_VOTE_LEAKAGE);
    }

    // Phase 301: the FORBIDDEN_* negative guards above still apply to the home
    // shell. Its long-form collecting-hidden / no-auto-login copy moved to the
    // FAQ / login / registration pages; being collecting-only, the home shows no
    // aggregate result signals.
    const indexHtml = await readFile(join(process.cwd(), 'public/index.html'), 'utf8');
    expect(indexHtml).toContain('data-home-swipe-feed="collecting-only"');
    expect(indexHtml).not.toMatch(/%|票數|百分比|排名|趨勢|進度/);
  });

  it('keeps vote-by-index body unchanged during copy review', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 201, json: async () => ({}) }));

    await votePage.submitVoteByIndex({
      pollId: '11111111-1111-4111-8111-111111111111',
      optionIndex: 0,
      userId: '44444444-4444-4444-8444-444444444444',
      fetchImpl,
    });

    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ option_index: 0 });
  });

  it('documents Phase 286 implementation record exists', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_286_DOC), 'utf8');
    expect(doc).toContain('BL-282-02');
    expect(doc).toContain('review checkpoint');
    expect(doc).toContain('no runtime');
  });
});
