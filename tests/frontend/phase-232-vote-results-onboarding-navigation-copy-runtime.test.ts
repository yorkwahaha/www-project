import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_232_MODULES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
  'public/frontend/official-vote-pre-vote-hints.js',
] as const;

const FORBIDDEN_ELIGIBILITY_OUTCOME =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_DEBUG_LEAKAGE =
  /request_id|requestId|option_id|trace_id|traceId|stack trace|internal code|error_code/i;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 232 vote results onboarding navigation copy runtime', () => {
  it('documents Phase 232 in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 232');
    expect(readme).toContain(
      'docs/www-project-phase-232-vote-results-onboarding-navigation-copy-runtime-v1.md',
    );
  });

  it('centralizes vote results onboarding copy in PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');

    expect(ui.PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES).toContain(ui.PUBLIC_VOTE_PAGE_REMINDER_LEAD);
    expect(ui.PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES).toContain(ui.PUBLIC_VOTE_POLICY_LOGIN_TEXT);
    expect(ui.PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES).toContain(
      ui.PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD,
    );
    expect(ui.PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES).toContain(
      ui.PUBLIC_RESULTS_PAGE_LIVE_INTRO_LEAD,
    );
    expect(ui.PUBLIC_VOTE_PAGE_REMINDER_LEAD).toContain('選擇一個選項');
    expect(ui.PUBLIC_VOTE_PAGE_REMINDER_LEAD).toContain('/vote/demo');
    expect(ui.PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD).toContain('展示用，不儲存');
    expect(ui.PUBLIC_RESULTS_PAGE_LIVE_INTRO_LEAD).toContain('區間化摘要');
    expect(ui.PUBLIC_VOTE_POLICY_LOGIN_TEXT).toContain('不代表一定可以完成投票');
    expect(ui.PUBLIC_HINT_TEXT_MESSAGES).toEqual(
      expect.arrayContaining(ui.PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES),
    );
  });

  it('wires vote onboarding copy into reminder, policy, side panel, and nav mount points', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const votePage = await loadModule('public/frontend/vote-page.js');
    const pollId = '11111111-1111-4111-8111-111111111111';
    const reminder = { textContent: '' };
    const policyList = { replaceChildren: vi.fn(), append: vi.fn() };
    const followBody = { textContent: '' };
    const followMockNote = { textContent: '' };
    const navHint = { replaceChildren: vi.fn(), append: vi.fn(), hidden: true };
    const documentObject = {
      getElementById(id: string) {
        if (id === 'vote-page-reminder-lead') return reminder;
        if (id === 'vote-policy-hint-list') return policyList;
        if (id === 'vote-follow-results-body') return followBody;
        if (id === 'vote-follow-results-mock-note') return followMockNote;
        if (id === 'vote-view-results-nav-hint') return navHint;
        if (id === 'vote-collecting-notice-body') return { textContent: '' };
        return null;
      },
      querySelector: () => null,
      createElement: (tagName: string) => ({
        tagName,
        href: '',
        textContent: '',
        append: vi.fn(),
      }),
      createTextNode: (value: string) => ({ nodeType: 3, textContent: value }),
    };

    votePage.syncVotePageOnboardingCopy(documentObject, { pollId });
    expect(reminder.textContent).toBe(ui.PUBLIC_VOTE_PAGE_REMINDER_LEAD);
    expect(policyList.replaceChildren).toHaveBeenCalled();
    expect(followBody.textContent).toBe(ui.PUBLIC_VOTE_FOLLOW_RESULTS_PANEL_BODY);
    expect(followMockNote.textContent).toBe(ui.PUBLIC_VOTE_FOLLOW_RESULTS_MOCK_NOTE);
    expect(navHint.replaceChildren).toHaveBeenCalled();
    expect(navHint.hidden).toBe(false);
  });

  it('wires results onboarding copy into intro and vote nav mount points', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const resultPage = await loadModule('public/frontend/result-page.js');
    const pollId = '11111111-1111-4111-8111-111111111111';
    const demoIntro = { textContent: '' };
    const navHint = { replaceChildren: vi.fn(), append: vi.fn(), hidden: true };
    const documentObject = {
      getElementById(id: string) {
        if (id === 'results-page-demo-intro') return demoIntro;
        if (id === 'results-vote-nav-hint') return navHint;
        if (id === 'page-title') {
          return {
            textContent: '',
            getAttribute: () => null,
            removeAttribute: vi.fn(),
          };
        }
        return null;
      },
      querySelector: () => null,
      createElement: (tagName: string) => ({
        tagName,
        href: '',
        textContent: '',
      }),
      createTextNode: (value: string) => ({ nodeType: 3, textContent: value }),
    };

    resultPage.syncResultsPageOnboardingCopy(documentObject, {
      demoOnly: false,
      pollId,
      windowObject: { location: { pathname: `/results/${pollId}` } },
    });
    expect(demoIntro.textContent).toBe(ui.PUBLIC_RESULTS_PAGE_LIVE_INTRO_LEAD);
    expect(navHint.replaceChildren).toHaveBeenCalled();
    expect(navHint.hidden).toBe(false);
  });

  it('keeps demo vs live results intro selection unchanged', async () => {
    const resultPage = await loadModule('public/frontend/result-page.js');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const demoIntro = { textContent: '' };
    const documentObject = {
      getElementById: (id: string) => (id === 'results-page-demo-intro' ? demoIntro : null),
    };

    resultPage.syncResultsPageLeadParagraphs(documentObject, { demoOnly: true });
    expect(demoIntro.textContent).toBe(publicUi.PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD);

    resultPage.syncResultsPageLeadParagraphs(documentObject, { demoOnly: false });
    expect(demoIntro.textContent).toBe(publicUi.PUBLIC_RESULTS_PAGE_LIVE_INTRO_LEAD);
  });

  it('keeps vote-by-index body and pre-vote hint neutrality unchanged', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const hints = await loadModule('public/frontend/official-vote-pre-vote-hints.js');
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({
        vote_token: 'secret-token',
        option_id: 'secret-option',
        shard_id: 7,
      }),
    }));

    await votePage.submitVoteByIndex({
      pollId: '11111111-1111-4111-8111-111111111111',
      optionIndex: 1,
      userId: '44444444-4444-4444-8444-444444444444',
      fetchImpl,
    });

    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ option_index: 1 });
    expect(hints.PRE_VOTE_HINT_COPY.anonymous).toContain('不代表');
    expect(hints.PRE_VOTE_HINT_COPY.incompleteProfile).toContain('不代表');
  });

  it('aligns static HTML fallback with shared onboarding constants', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const voteHtml = await readFile(join(process.cwd(), 'public/vote.html'), 'utf8');
    const resultsHtml = await readFile(join(process.cwd(), 'public/results.html'), 'utf8');

    expect(voteHtml).toContain('id="vote-policy-hint-list"');
    expect(voteHtml).toContain('id="vote-view-results-nav-hint"');
    expect(voteHtml).toContain('id="vote-follow-results-body"');
    expect(ui.PUBLIC_VOTE_PAGE_REMINDER_LEAD).toContain('正式投票');
    expect(resultsHtml).toContain('id="results-vote-nav-hint"');
    expect(ui.PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD).toContain('示範頁');
  });

  it('keeps onboarding modules free of forbidden debug, storage, and eligibility disclosure', async () => {
    for (const relativePath of PHASE_232_MODULES) {
      const source = stripJsComments(await readFile(join(process.cwd(), relativePath), 'utf8'));
      expect(source, relativePath).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
      expect(source, relativePath).not.toMatch(FORBIDDEN_STORAGE);
      expect(source, relativePath).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
    }

    for (const message of (
      await loadModule('public/frontend/public-mvp-ui.js')
    ).PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES) {
      expect(message).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
    }
  });
});
