import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_232_DOC =
  'docs/www-project-phase-232-vote-results-onboarding-navigation-copy-runtime-v1.md';
const PHASE_233_DOC =
  'docs/www-project-phase-233-vote-results-onboarding-navigation-copy-runtime-review-checkpoint-v1.md';

const PHASE_232_TOUCHED_MODULES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
] as const;

const FORBIDDEN_ELIGIBILITY_OUTCOME =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_DEBUG_LEAKAGE =
  /request_id|requestId|trace_id|traceId|stack trace|internal code|error_code/i;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

const FORBIDDEN_BACKEND_ECHO =
  /error\.message|body\.message|apiError\.message|response\.text\(\)|JSON\.stringify\(error/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 233 vote results onboarding navigation copy runtime review checkpoint', () => {
  it('documents Phase 233 review checkpoint in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 233');
    expect(readme).toContain(PHASE_233_DOC);
    expect(readme).toContain('onboarding navigation copy runtime review checkpoint');
  });

  it('keeps Phase 232 delivery documented and runtime modules free of phase markers', async () => {
    const delivery = await readFile(join(process.cwd(), PHASE_232_DOC), 'utf8');
    const review = await readFile(join(process.cwd(), PHASE_233_DOC), 'utf8');

    expect(delivery).toContain('copy-only');
    expect(review).toContain('APPROVED');
    expect(review).toContain(
      'APPROVED — Phase 232 vote / results onboarding navigation copy runtime patch is copy-only; no runtime/API/DB/backend/auth/vote/result/creator/privacy drift identified.',
    );

    for (const relativePath of PHASE_232_TOUCHED_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 232');
      expect(source, relativePath).not.toContain('Phase 233');
    }
  });

  it('keeps PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES as frontend-owned copy allowlist', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');

    expect(ui.PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES).toContain(ui.PUBLIC_VOTE_PAGE_REMINDER_LEAD);
    expect(ui.PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES).toContain(ui.PUBLIC_VOTE_POLICY_LOGIN_TEXT);
    expect(ui.PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES).toContain(
      ui.PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD,
    );
    expect(ui.PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES).toContain(
      ui.PUBLIC_RESULTS_PAGE_LIVE_INTRO_LEAD,
    );
    expect(ui.PUBLIC_VOTE_POLICY_LOGIN_TEXT).toContain('不代表一定可以完成投票');
    expect(ui.PUBLIC_HINT_TEXT_MESSAGES).toEqual(
      expect.arrayContaining(ui.PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES),
    );

    for (const message of ui.PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES) {
      expect(message).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
    }
  });

  it('keeps syncVotePageOnboardingCopy limited to existing mount points', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const votePage = await loadModule('public/frontend/vote-page.js');
    const pollId = '11111111-1111-4111-8111-111111111111';
    const reminder = { textContent: '' };
    const policyList = { replaceChildren: vi.fn(), append: vi.fn() };
    const followBody = { textContent: '' };
    const followMockNote = { textContent: '' };
    const navHint = { replaceChildren: vi.fn(), append: vi.fn(), hidden: true };
    const createdLinks: Array<{ href: string; textContent: string }> = [];
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
      createElement: (tagName: string) => {
        const element = {
          tagName,
          href: '',
          textContent: '',
          append: vi.fn(),
        };
        if (tagName === 'a') {
          createdLinks.push(element);
        }
        return element;
      },
      createTextNode: (value: string) => ({ nodeType: 3, textContent: value }),
    };

    votePage.syncVotePageOnboardingCopy(documentObject, { pollId });
    expect(reminder.textContent).toBe(ui.PUBLIC_VOTE_PAGE_REMINDER_LEAD);
    expect(policyList.replaceChildren).toHaveBeenCalled();
    expect(followBody.textContent).toBe(ui.PUBLIC_VOTE_FOLLOW_RESULTS_PANEL_BODY);
    expect(followMockNote.textContent).toBe(ui.PUBLIC_VOTE_FOLLOW_RESULTS_MOCK_NOTE);
    expect(navHint.replaceChildren).toHaveBeenCalled();
    expect(navHint.hidden).toBe(false);
    expect(createdLinks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          href: `/results/${pollId}`,
          textContent: ui.PUBLIC_CTA_VIEW_PUBLIC_RESULTS_LABEL,
        }),
      ]),
    );
  });

  it('keeps syncResultsPageOnboardingCopy limited to existing mount points', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const resultPage = await loadModule('public/frontend/result-page.js');
    const pollId = '11111111-1111-4111-8111-111111111111';
    const demoIntro = { textContent: '' };
    const navHint = { replaceChildren: vi.fn(), append: vi.fn(), hidden: true };
    const createdLinks: Array<{ href: string; textContent: string }> = [];
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
      createElement: (tagName: string) => {
        const element = {
          tagName,
          href: '',
          textContent: '',
        };
        if (tagName === 'a') {
          createdLinks.push(element);
        }
        return element;
      },
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
    expect(createdLinks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          href: `/vote/${pollId}`,
          textContent: ui.PUBLIC_CTA_GO_TO_VOTE_PAGE_LABEL,
        }),
      ]),
    );
  });

  it('keeps syncResultsPageLeadParagraphs demoOnly selection unchanged', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const resultPage = await loadModule('public/frontend/result-page.js');
    const resultSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/result-page.js'), 'utf8'),
    );
    const demoIntro = { textContent: '' };
    const documentObject = {
      getElementById: (id: string) => (id === 'results-page-demo-intro' ? demoIntro : null),
    };

    resultPage.syncResultsPageLeadParagraphs(documentObject, { demoOnly: true });
    expect(demoIntro.textContent).toBe(publicUi.PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD);

    resultPage.syncResultsPageLeadParagraphs(documentObject, { demoOnly: false });
    expect(demoIntro.textContent).toBe(publicUi.PUBLIC_RESULTS_PAGE_LIVE_INTRO_LEAD);

    expect(resultSource).toContain('renderResultDisplay');
    expect(resultSource).toContain('resolveResultRenderMode');
    expect(resultSource).toContain('syncResultsPageLeadParagraphs(documentObject, { demoOnly })');
    expect(publicUi.PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD).toContain('展示用，不儲存');
    expect(publicUi.PUBLIC_RESULTS_PAGE_LIVE_INTRO_LEAD).not.toContain('展示用，不儲存');
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

  it('keeps quality_badge presentation boundaries', async () => {
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const badgeSource = await readFile(
      join(process.cwd(), 'public/frontend/quality-feedback-badge.js'),
      'utf8',
    );

    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badgeSource).not.toMatch(/tooltip|title\s*=|aria-describedby|debug|score|rank/i);
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
  });

  it('keeps Phase 232 touched modules free of storage, backend echo, and forbidden copy', async () => {
    for (const relativePath of PHASE_232_TOUCHED_MODULES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      if (relativePath !== 'public/frontend/public-mvp-ui.js') {
        expect(source, relativePath).not.toMatch(FORBIDDEN_BACKEND_ECHO);
      }
      expect(source, relativePath).not.toMatch(FORBIDDEN_STORAGE);
      expect(source, relativePath).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
    }
  });

  it('keeps Official Vote transaction order unchanged in backend source', async () => {
    const repository = await readFile(join(process.cwd(), 'src/polls/repository.ts'), 'utf8');
    const transactionStart = repository.indexOf('async function castOfficialVote(');
    const transactionEnd = repository.indexOf('async function resolveOfficialVoteOptionIdWithClient');
    const transactionBody = repository.slice(transactionStart, transactionEnd);
    const eligibilityCheck = transactionBody.indexOf('isProfileEligibleForOfficialVote');
    const optionResolution = transactionBody.indexOf('resolveOfficialVoteOptionIdWithClient');
    const tokenWrite = transactionBody.indexOf('insertVoteToken');
    const counterIncrement = transactionBody.indexOf('incrementVoteCounter');

    expect(eligibilityCheck).toBeGreaterThan(-1);
    expect(optionResolution).toBeGreaterThan(eligibilityCheck);
    expect(tokenWrite).toBeGreaterThan(optionResolution);
    expect(counterIncrement).toBeGreaterThan(tokenWrite);
    expect(repository).not.toContain('Phase 232');
    expect(repository).not.toContain('Phase 233');
  });
});
