import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_236_MODULES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/faq-page.js',
  'public/faq.html',
] as const;

const FORBIDDEN_ELIGIBILITY_OUTCOME =
  /你符合資格|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_ENGINEER_COPY =
  /X-User-Id|creator_session|production user-auth wiring|fail closed|AUTH_REQUIRED|UserAuthResolver|evaluator|resolver/i;

const FORBIDDEN_DEBUG_LEAKAGE =
  /request_id|requestId|option_id|trace_id|traceId|stack trace|internal code|error_code/i;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 236 faq onboarding help copy runtime', () => {
  it('documents Phase 236 in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 236');
    expect(readme).toContain(
      'docs/www-project-phase-236-faq-onboarding-help-copy-runtime-v1.md',
    );
  });

  it('centralizes FAQ onboarding copy in PUBLIC_FAQ_ONBOARDING_MESSAGES', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');

    expect(ui.PUBLIC_FAQ_ONBOARDING_MESSAGES).toContain(ui.PUBLIC_FAQ_PAGE_HERO_LEAD);
    expect(ui.PUBLIC_FAQ_ONBOARDING_MESSAGES).toContain(ui.PUBLIC_FAQ_ACCOUNT_FLOW_INTRO);
    expect(ui.PUBLIC_FAQ_ONBOARDING_MESSAGES).toContain(ui.PUBLIC_FAQ_CREATOR_FLOW_DEMO_STEP);
    expect(ui.PUBLIC_FAQ_ONBOARDING_MESSAGES).toContain(ui.PUBLIC_FAQ_PARTICIPANT_VOTE_STEP);
    expect(ui.PUBLIC_FAQ_ONBOARDING_MESSAGES).toContain(ui.PUBLIC_FAQ_PROFILE_DEMO_BOUNDARY_NOTE);
    expect(ui.PUBLIC_FAQ_ACCOUNT_FLOW_INTRO).toContain('不會自動登入');
    expect(ui.PUBLIC_FAQ_CREATOR_FLOW_LIVE_STEP).toContain('?live=1');
    expect(ui.PUBLIC_FAQ_CREATOR_FLOW_MY_POLLS_STEP).toContain('建立流程');
    expect(ui.PUBLIC_FAQ_PARTICIPANT_COLLECTING_STEP).toBe(
      ui.PUBLIC_VOTE_POLICY_COLLECTING_HIDDEN_TEXT,
    );
    expect(ui.PUBLIC_FAQ_PROFILE_ELIGIBILITY_HINT).toContain('不表示可保證');
    expect(ui.PUBLIC_PROFILE_COMPLETION_PROMPT_HINT).toContain('不代表');
    expect(ui.PUBLIC_HINT_TEXT_MESSAGES).toEqual(
      expect.arrayContaining(ui.PUBLIC_FAQ_ONBOARDING_MESSAGES),
    );
  });

  it('wires FAQ onboarding copy into hero and answer mount points', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const faqPage = await loadModule('public/frontend/faq-page.js');
    const hero = { textContent: '' };
    const accountIntro = { textContent: '' };
    const creatorDemo = { textContent: '' };
    const participantVote = { textContent: '' };
    const profileNote = { textContent: '' };
    const documentObject = {
      getElementById(id: string) {
        if (id === 'faq-page-hero-lead') return hero;
        if (id === 'faq-account-flow-intro') return accountIntro;
        if (id === 'faq-creator-flow-demo-step') return creatorDemo;
        if (id === 'faq-participant-vote-step') return participantVote;
        if (id === 'faq-profile-demo-boundary-note') return profileNote;
        return null;
      },
    };

    faqPage.syncFaqPageOnboardingCopy(documentObject);
    expect(hero.textContent).toBe(ui.PUBLIC_FAQ_PAGE_HERO_LEAD);
    expect(accountIntro.textContent).toBe(ui.PUBLIC_FAQ_ACCOUNT_FLOW_INTRO);
    expect(creatorDemo.textContent).toBe(ui.PUBLIC_FAQ_CREATOR_FLOW_DEMO_STEP);
    expect(participantVote.textContent).toBe(ui.PUBLIC_FAQ_PARTICIPANT_VOTE_STEP);
    expect(profileNote.textContent).toBe(ui.PUBLIC_FAQ_PROFILE_DEMO_BOUNDARY_NOTE);
  });

  it('keeps faq.html free of engineer-facing user copy', async () => {
    const faqHtml = await readFile(join(process.cwd(), 'public/faq.html'), 'utf8');

    expect(faqHtml).toContain('id="faq-page-hero-lead"');
    expect(faqHtml).toContain('id="faq-account-flow"');
    expect(faqHtml).toContain('id="faq-creator-flow"');
    expect(faqHtml).toContain('id="faq-participant-flow"');
    expect(faqHtml).toContain('/registration');
    expect(faqHtml).toContain('/login');
    expect(faqHtml).toContain('/polls/new?live=1');
    expect(faqHtml).toContain('/vote/demo');
    expect(faqHtml).toContain('/results/demo');
    expect(faqHtml).toContain('不會自動登入');
    expect(faqHtml).toContain('試填作答');
    expect(faqHtml).not.toMatch(FORBIDDEN_ENGINEER_COPY);
    expect(faqHtml).not.toContain('Official Vote');
    expect(faqHtml).not.toContain('Reference Answer');
    expect(faqHtml).toContain('/frontend/faq-page.js');
  });

  it('keeps FAQ modules free of forbidden debug and storage patterns', async () => {
    for (const relativePath of PHASE_236_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
      expect(source, relativePath).not.toMatch(FORBIDDEN_STORAGE);
    }
  });

  it('keeps FAQ copy neutral without eligibility guarantee', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const faqHtml = await readFile(join(process.cwd(), 'public/faq.html'), 'utf8');

    expect(ui.PUBLIC_FAQ_ACCOUNT_FLOW_PROFILE_STEP).toContain('不表示可保證');
    expect(ui.PUBLIC_FAQ_PARTICIPANT_VOTE_STEP).toContain('判定是否可計票');
    expect(faqHtml).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
  });

  it('keeps registration boundary without auto-login or GET /users/me', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'FAQ Runtime User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl,
    });

    expect(fetchCalls).toEqual(['/registration']);
  });

  it('keeps vote-by-index and quality_badge presentation boundaries', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
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
    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
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
    expect(repository).not.toContain('Phase 236');
  });
});
