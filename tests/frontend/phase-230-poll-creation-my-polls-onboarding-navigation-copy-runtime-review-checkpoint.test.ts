import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_229_DOC =
  'docs/www-project-phase-229-poll-creation-my-polls-onboarding-navigation-copy-runtime-v1.md';
const PHASE_230_DOC =
  'docs/www-project-phase-230-poll-creation-my-polls-onboarding-navigation-copy-runtime-review-checkpoint-v1.md';

const PHASE_229_TOUCHED_MODULES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/creator-flow-copy.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/my-polls-page.js',
] as const;

const FORBIDDEN_DEBUG_LEAKAGE =
  /request_id|requestId|trace_id|traceId|stack trace|internal code|error_code/i;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

const FORBIDDEN_ENGINEER_COPY =
  /fail closed|AUTH_REQUIRED|creator_session|X-User-Id|ownership resolver/i;

const FORBIDDEN_OUTSIDE_CREATOR_FLOW =
  /外部問卷|任意問卷|所有問卷|全部問卷|其他平台|匯入問卷/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 230 poll creation my polls onboarding navigation copy runtime review checkpoint', () => {
  it('documents Phase 230 review checkpoint in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 230');
    expect(readme).toContain(PHASE_230_DOC);
    expect(readme).toContain('onboarding navigation copy runtime review checkpoint');
  });

  it('keeps Phase 229 delivery documented and runtime modules free of phase markers', async () => {
    const delivery = await readFile(join(process.cwd(), PHASE_229_DOC), 'utf8');
    const review = await readFile(join(process.cwd(), PHASE_230_DOC), 'utf8');

    expect(delivery).toContain('copy-only');
    expect(review).toContain('APPROVED');
    expect(review).toContain(
      'APPROVED — Phase 229 poll creation / my-polls onboarding navigation copy runtime patch is copy-only; no runtime/API/DB/backend/auth/registration/profile/vote/result/creator/privacy drift identified.',
    );

    for (const relativePath of PHASE_229_TOUCHED_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 229');
      expect(source, relativePath).not.toContain('Phase 230');
    }
  });

  it('keeps PUBLIC_CREATOR_ONBOARDING_MESSAGES allowlisted and creator-flow-copy re-export only', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const creator = await loadModule('public/frontend/creator-flow-copy.js');
    const creatorSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/creator-flow-copy.js'), 'utf8'),
    );

    expect(ui.PUBLIC_CREATOR_ONBOARDING_MESSAGES).toContain(ui.PUBLIC_CREATE_POLL_PAGE_LEAD);
    expect(ui.PUBLIC_CREATOR_ONBOARDING_MESSAGES).toContain(ui.PUBLIC_MY_POLLS_PAGE_BANNER_BODY);
    expect(ui.PUBLIC_HINT_TEXT_MESSAGES).toEqual(
      expect.arrayContaining(ui.PUBLIC_CREATOR_ONBOARDING_MESSAGES),
    );
    expect(creator.CREATOR_ONBOARDING_MESSAGES).toEqual(ui.PUBLIC_CREATOR_ONBOARDING_MESSAGES);
    expect(creator.CREATOR_FLOW_COPY.myPollsLead).toBe(ui.PUBLIC_CREATOR_MY_POLLS_LEAD_HINT);
    expect(creatorSource).toContain('PUBLIC_CREATOR_ONBOARDING_MESSAGES');
    expect(creatorSource).not.toMatch(/fetch\s*\(|fetchImpl|localStorage|sessionStorage/i);

    for (const message of ui.PUBLIC_CREATOR_ONBOARDING_MESSAGES) {
      expect(message).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
      expect(message).not.toMatch(FORBIDDEN_ENGINEER_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTSIDE_CREATOR_FLOW);
    }
  });

  it('keeps create-poll onboarding sync copy-only without changing POST /creator/polls', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const createPollSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/create-poll-page.js'), 'utf8'),
    );
    const { parseLiveApiMode } = await loadModule('public/frontend/public-mvp-demo.js');
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        poll_id: '22222222-2222-4222-8222-222222222222',
        status: 'active',
      }),
    }));

    expect(createPollSource).toContain('syncCreatePollPageOnboardingCopy');
    expect(createPollSource).toContain('parseLiveApiMode(search)');
    expect(createPollSource).toContain("fetchImpl('/creator/polls'");
    expect(createPollSource).toContain('submitCreatePollDemo');
    expect(createPollSource).not.toMatch(FORBIDDEN_STORAGE);

    expect(parseLiveApiMode('?live=1')).toBe(true);
    expect(parseLiveApiMode('')).toBe(false);

    await createPoll.submitCreatePoll({
      formValues: { title: '測試', description: '', options: ['A', 'B'] },
      fetchImpl,
      now: () => new Date('2026-05-31T12:00:00.000Z'),
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      '/creator/polls',
      expect.objectContaining({ method: 'POST', credentials: 'same-origin' }),
    );

    const banner = { textContent: '' };
    const pageLead = { textContent: '' };
    createPoll.syncCreatePollPageOnboardingCopy({
      getElementById(id: string) {
        if (id === 'create-poll-page-banner') {
          return banner;
        }
        if (id === 'create-poll-page-lead') {
          return pageLead;
        }
        return null;
      },
      querySelector: () => null,
    });
    expect(banner.textContent).toBe(ui.PUBLIC_CREATE_POLL_PAGE_BANNER_BODY);
    expect(pageLead.textContent).toBe(ui.PUBLIC_CREATE_POLL_PAGE_LEAD);
  });

  it('keeps my-polls onboarding sync copy-only without changing creator session APIs', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const myPollsSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/my-polls-page.js'), 'utf8',
      ),
    );

    expect(myPollsSource).toContain('syncMyPollsPageOnboardingCopy');
    expect(myPollsSource).toContain("fetchImpl('/creator/session'");
    expect(myPollsSource).toContain("fetchImpl('/creator/polls'");
    expect(myPollsSource).toContain('CREATOR_OWNED_POLL_ALLOWED_KEYS');
    expect(myPollsSource).not.toMatch(FORBIDDEN_STORAGE);

    const sessionFetch = vi.fn(async (url: string) => {
      if (url === '/creator/session') {
        return { ok: true, status: 200, json: async () => ({}) };
      }
      throw new Error('unexpected');
    });
    await myPolls.prepareMyPollsLiveSession({
      fetchImpl: sessionFetch,
      locationObject: { hostname: '127.0.0.1' },
    });
    expect(sessionFetch).toHaveBeenCalledWith('/creator/session', {
      method: 'GET',
      credentials: 'same-origin',
    });

    const banner = { textContent: '' };
    const pageLead = { textContent: '' };
    myPolls.syncMyPollsPageOnboardingCopy({
      getElementById(id: string) {
        if (id === 'my-polls-page-banner') {
          return banner;
        }
        if (id === 'my-polls-page-lead') {
          return pageLead;
        }
        if (id === 'my-polls-creator-side-note') {
          return { textContent: '' };
        }
        return null;
      },
      querySelector: () => null,
    });
    expect(banner.textContent).toBe(ui.PUBLIC_MY_POLLS_PAGE_BANNER_BODY);
    expect(pageLead.textContent).toBe(ui.PUBLIC_MY_POLLS_PAGE_LEAD);
    expect(ui.PUBLIC_MY_POLLS_PAGE_LEAD).toMatch(/建立流程/);
  });

  it('aligns static HTML fallback with shared onboarding constants', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const createPollHtml = await readFile(join(process.cwd(), 'public/create-poll.html'), 'utf8');
    const myPollsHtml = await readFile(join(process.cwd(), 'public/my-polls.html'), 'utf8');

    expect(createPollHtml).toContain('id="create-poll-page-lead"');
    expect(ui.PUBLIC_CREATE_POLL_PAGE_LEAD).toContain('期中票數或百分比');
    expect(ui.PUBLIC_CREATE_POLL_PAGE_BANNER_BODY).toContain('?live=1');
    expect(ui.PUBLIC_CREATE_POLL_LIVE_MODE_HINT).toContain('即時模式');
    expect(myPollsHtml).toContain('id="my-polls-page-lead"');
    expect(ui.PUBLIC_MY_POLLS_PAGE_LEAD).toContain('收集中看不到票數');
    expect(ui.PUBLIC_MY_POLLS_PAGE_BANNER_BODY).toContain('?live=1');
    expect(myPollsHtml).not.toContain('creator_session');
    expect(myPollsHtml).not.toContain('X-User-Id');
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
        display_name: 'Review User',
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
    expect(repository).not.toContain('Phase 230');
  });

  it('keeps creator onboarding modules free of forbidden debug and storage patterns', async () => {
    for (const relativePath of PHASE_229_TOUCHED_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
      expect(source, relativePath).not.toMatch(FORBIDDEN_STORAGE);
    }
  });
});
