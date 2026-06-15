import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const REVIEWED_MICROCOPY_SURFACES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/public-mvp-home.js',
  'public/frontend/explore-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/creator-flow-copy.js',
  'public/frontend/poll-lifecycle-controls.js',
  'public/frontend/result-page.js',
];

const STATIC_MICROCOPY_HTML = ['public/index.html', 'public/explore.html'];

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters|creator_token/i;

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_BACKEND_ECHO =
  /error\.message|body\.message|apiError\.message|response\.text\(\)|JSON\.stringify\(error/i;

const FORBIDDEN_OBSERVABILITY =
  /console\.(log|info|warn|error|debug)|analytics|datadog|sentry|apm|trackEvent|gtag\(/i;

const FORBIDDEN_ARIA_INTERNAL =
  /setAttribute\(\s*['"]aria-label['"]\s*,\s*[`'"][^`'"]*(?:pollId|userId|vote_token|creator_token|shard_id|option_id)/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 158 public microcopy / inline note runtime review checkpoint', () => {
  it('keeps PUBLIC_* microcopy allowlists on fixed frontend safe copy only', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(publicUi.PUBLIC_INLINE_NOTES.length).toBeGreaterThanOrEqual(3);
    expect(publicUi.PUBLIC_MICROCOPY_MESSAGES.length).toBeGreaterThanOrEqual(15);
    expect(publicUi.PUBLIC_SUPPORTING_NOTES.length).toBeGreaterThanOrEqual(5);
    expect(publicUi.PUBLIC_MY_POLLS_LOCKED_ROW_INLINE_NOTE).toContain('鎖定期內無法下架');
    expect(publicUi.PUBLIC_LIFECYCLE_CLOSE_CONFIRM_MESSAGE).toContain('收集中不會顯示票數');
    expect(publicUi.PUBLIC_HOME_VALUE_COLLECTING_HIDDEN_BODY).toContain('不顯示票數');
    expect(publicUi.PUBLIC_RESULTS_PUBLIC_NOTICE_LABEL).toBe('修正公告');

    for (const note of publicUi.PUBLIC_INLINE_NOTES) {
      expect(note).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(note).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(note).not.toMatch(/\d+%|raw_count/i);
    }
    for (const message of publicUi.PUBLIC_MICROCOPY_MESSAGES) {
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(message).not.toMatch(/\d+%|raw_count/i);
    }
    for (const note of publicUi.PUBLIC_SUPPORTING_NOTES) {
      expect(note).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(note).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(note).not.toMatch(/\d+%|raw_count/i);
    }
  });

  it('keeps syncHomePageSupportingNotes and syncHomePageMicrocopy on shared constants only', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const home = await loadModule('public/frontend/public-mvp-home.js');
    const homeSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/public-mvp-home.js'), 'utf8'),
    );

    expect(homeSource).toContain('syncHomePageSupportingNotes');
    expect(homeSource).toContain('syncHomePageMicrocopy');
    expect(homeSource).not.toMatch(/\bfetch\b|\/users\/me|\/polls\/|\/vote|mountLoginStateRead/i);
    expect(homeSource).not.toMatch(FORBIDDEN_OBSERVABILITY);

    const valueBodies = [{ textContent: '' }, { textContent: '' }, { textContent: '' }];
    const trustItems = [{ textContent: '' }, { textContent: '' }, { textContent: '' }];
    const collectingTip = { textContent: '' };

    home.syncHomePageSupportingNotes({
      querySelectorAll(selector: string) {
        if (selector === '.mvp-value-grid .mvp-value-card p') {
          return valueBodies;
        }
        return [];
      },
      querySelector() {
        return null;
      },
    });
    expect(valueBodies[0].textContent).toBe(publicUi.PUBLIC_HOME_VALUE_COLLECTING_HIDDEN_BODY);
    expect(valueBodies[1].textContent).toBe(publicUi.PUBLIC_HOME_VALUE_LOCK_PERIOD_BODY);
    expect(valueBodies[2].textContent).toBe(publicUi.PUBLIC_HOME_VALUE_QUALITY_FEEDBACK_BODY);

    home.syncHomePageMicrocopy({
      querySelectorAll(selector: string) {
        if (selector === '.mvp-trust-row li') {
          return trustItems;
        }
        return [];
      },
      querySelector(selector: string) {
        if (selector === '.mvp-help-tip') {
          return collectingTip;
        }
        return null;
      },
    });
    expect(trustItems[0].textContent).toBe(publicUi.PUBLIC_HOME_TRUST_COLLECTING_HIDDEN_ITEM);
    expect(trustItems[1].textContent).toBe(publicUi.PUBLIC_HOME_TRUST_DEADLINE_REVEAL_ITEM);
    expect(trustItems[2].textContent).toBe(publicUi.PUBLIC_HOME_TRUST_LOCK_PERIOD_ITEM);
    expect(collectingTip.textContent).toBe(publicUi.PUBLIC_HOME_COLLECTING_CARD_TOOLTIP);
  });

  it('keeps syncExplorePageMicrocopy on shared load-more label', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const explore = await loadModule('public/frontend/explore-page.js');

    expect(explore.EXPLORE_LOAD_MORE_LABEL).toBe(publicUi.PUBLIC_EXPLORE_LOAD_MORE_LABEL);
    expect(publicUi.PUBLIC_MICROCOPY_MESSAGES).toContain(publicUi.PUBLIC_EXPLORE_LOAD_MORE_LABEL);

    const loadMore = { textContent: '' };
    explore.syncExplorePageMicrocopy({
      getElementById: (id: string) => (id === 'explore-load-more' ? loadMore : null),
    });
    expect(loadMore.textContent).toBe(publicUi.PUBLIC_EXPLORE_LOAD_MORE_LABEL);
  });

  it('keeps my-polls demo inline notes, share feedback, and aria labels on shared constants', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/my-polls-page.js'), 'utf8'),
    );

    expect(myPolls.MY_POLLS_DEMO_SHARE_SUCCESS_MESSAGE).toBe(
      publicUi.PUBLIC_MY_POLLS_DEMO_SHARE_SUCCESS_MESSAGE,
    );
    expect(myPolls.MY_POLLS_VOTE_LINK_COPIED_MESSAGE).toBe(
      publicUi.PUBLIC_MY_POLLS_VOTE_LINK_COPIED_MESSAGE,
    );
    expect(source).toContain('PUBLIC_MY_POLLS_LOCKED_ROW_INLINE_NOTE');
    expect(source).toContain('PUBLIC_MY_POLLS_CANCELLED_ROW_INLINE_NOTE');
    expect(source).toContain('PUBLIC_MY_POLLS_UNPUBLISHED_ROW_INLINE_NOTE');
    expect(source).toContain('PUBLIC_MY_POLLS_LIVE_MANAGE_ARIA_LABEL');
    expect(source).toContain('PUBLIC_MY_POLLS_LIVE_MANAGE_HELP_ARIA_LABEL');
    expect(source).not.toMatch(FORBIDDEN_ARIA_INTERNAL);
    expect(publicUi.PUBLIC_INLINE_NOTES).toContain(publicUi.PUBLIC_MY_POLLS_LOCKED_ROW_INLINE_NOTE);
    expect(publicUi.PUBLIC_MICROCOPY_MESSAGES).toContain(
      publicUi.PUBLIC_MY_POLLS_DEMO_ROW_USE_LIVE_BLOCK_MESSAGE,
    );
    expect(publicUi.PUBLIC_MICROCOPY_MESSAGES).toContain(
      publicUi.PUBLIC_MY_POLLS_LIVE_MANAGE_ARIA_LABEL,
    );
  });

  it('keeps creator flow microcopy and lifecycle confirm copy on shared constants', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const creatorCopy = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/creator-flow-copy.js'), 'utf8'),
    );
    const lifecycle = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/poll-lifecycle-controls.js'), 'utf8'),
    );

    expect(creatorCopy).toContain('PUBLIC_CREATOR_ACTION_GUIDE_ARIA_LABEL');
    expect(creatorCopy).toContain('PUBLIC_CREATOR_NEXT_STEPS_ARIA_LABEL');
    expect(creatorCopy).not.toMatch(FORBIDDEN_ARIA_INTERNAL);
    expect(lifecycle).toContain('PUBLIC_LIFECYCLE_CANCEL_CONFIRM_MESSAGE');
    expect(lifecycle).toContain('PUBLIC_LIFECYCLE_CLOSE_CONFIRM_MESSAGE');
    expect(lifecycle).toContain('PUBLIC_LIFECYCLE_UNPUBLISH_CONFIRM_MESSAGE');
    expect(lifecycle).toContain('PUBLIC_LIFECYCLE_ACTION_PANEL_ARIA_LABEL');
    expect(lifecycle).toContain('confirm(copy.confirm)');
    expect(lifecycle).not.toMatch(/confirm\([^)]*(?:pollId|creator_token|vote_token|shard_id)/i);
    expect(publicUi.PUBLIC_MICROCOPY_MESSAGES).toContain(
      publicUi.PUBLIC_LIFECYCLE_UNPUBLISH_CONFIRM_MESSAGE,
    );
    for (const confirmMessage of [
      publicUi.PUBLIC_LIFECYCLE_CANCEL_CONFIRM_MESSAGE,
      publicUi.PUBLIC_LIFECYCLE_CLOSE_CONFIRM_MESSAGE,
      publicUi.PUBLIC_LIFECYCLE_UNPUBLISH_CONFIRM_MESSAGE,
    ]) {
      expect(confirmMessage).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(confirmMessage).not.toMatch(/collecting|unpublished|correction_pending/i);
    }
  });

  it('keeps results public notice label on shared fixed constant', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const resultSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/result-page.js'), 'utf8'),
    );

    expect(resultSource).toContain('PUBLIC_RESULTS_PUBLIC_NOTICE_LABEL');
    expect(resultSource).toMatch(
      /appendText\([^,]+,\s*['"]p['"],\s*PUBLIC_RESULTS_PUBLIC_NOTICE_LABEL/,
    );
    expect(publicUi.PUBLIC_MICROCOPY_MESSAGES).toContain(publicUi.PUBLIC_RESULTS_PUBLIC_NOTICE_LABEL);
  });

  it('keeps policy-ui-placeholders.js and HELP_COPY as a separate layer from microcopy allowlists', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const layout = await loadModule('public/frontend/public-mvp-layout.js');
    const policySource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/policy-ui-placeholders.js'), 'utf8'),
    );
    const creatorSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/creator-flow-copy.js'), 'utf8'),
    );

    expect(layout.HELP_COPY.collectingHidden).toContain('收集中不顯示票數');
    expect(policySource).toContain('HELP_COPY');
    expect(policySource).toContain("from './public-mvp-layout.js'");
    expect(creatorSource).toContain("from './policy-ui-placeholders.js'");
    expect(creatorSource).toContain('PUBLIC_CREATOR_ACTION_GUIDE_ARIA_LABEL');
    expect(publicUi.PUBLIC_MICROCOPY_MESSAGES).not.toContain(layout.HELP_COPY.collectingHidden);
    expect(publicUi.PUBLIC_MICROCOPY_MESSAGES).not.toContain(layout.HELP_COPY.lockPeriod);
    expect(publicUi.PUBLIC_SUPPORTING_NOTES).not.toContain(layout.HELP_COPY.eligibility);
  });

  it('keeps homepage supporting notes on shared PUBLIC_* constants (Phase 257 copy refinement)', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const home = await loadModule('public/frontend/public-mvp-home.js');

    expect(publicUi.PUBLIC_HOME_VALUE_COLLECTING_HIDDEN_BODY).toContain('收集中不顯示');
    expect(publicUi.PUBLIC_HOME_TRUST_COLLECTING_HIDDEN_ITEM).toBe('收集中不顯示結果');
    expect(publicUi.PUBLIC_HOME_COLLECTING_CARD_TOOLTIP).toBe(
      publicUi.PUBLIC_VOTE_POLICY_COLLECTING_HIDDEN_TEXT,
    );
    expect(publicUi.PUBLIC_EXPLORE_LOAD_MORE_LABEL).toBeTruthy();

    const collectingBody = { textContent: '' };
    home.syncHomePageSupportingNotes({
      querySelector: () => null,
      querySelectorAll: () => [collectingBody],
    });
    expect(collectingBody.textContent).toBe(publicUi.PUBLIC_HOME_VALUE_COLLECTING_HIDDEN_BODY);
  });

  it('keeps registration boundary off auto-login, Set-Cookie, and GET /users/me', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'Microcopy Checkpoint User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl,
    });

    expect(fetchCalls).toEqual(['/registration']);

    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(Object.keys(body).sort()).toEqual([
      'birth_year_month',
      'display_name',
      'residential_region',
    ]);

    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/registration-page.js'), 'utf8'),
    );
    expect(source).not.toMatch(/mountLoginStateRead|\/users\/me|Set-Cookie|document\.cookie/i);
  });

  it('keeps vote-by-index body unchanged and does not pre-resolve option index to option_id', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => ({
      ok: true,
      status: 201,
      json: async () => ({
        vote_token: 'secret-token',
        option_id: 'secret-option',
        shard_id: 7,
        message: 'backend INTERNAL stack trace',
      }),
    }));

    await votePage.submitVoteByIndex({
      pollId: '11111111-1111-4111-8111-111111111111',
      optionIndex: 2,
      userId: '44444444-4444-4444-8444-444444444444',
      fetchImpl,
    });

    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ option_index: 2 });
    expect(body).not.toHaveProperty('option_id');
  });

  it('keeps Official Vote transaction order unchanged in backend source', async () => {
    const repository = await readFile(
      join(process.cwd(), 'src/polls/repository.ts'),
      'utf8',
    );
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
  });

  it('does not add observability hooks to reviewed microcopy surfaces', async () => {
    for (const relativePath of REVIEWED_MICROCOPY_SURFACES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_OBSERVABILITY);
    }
  });

  for (const relativePath of [...REVIEWED_MICROCOPY_SURFACES, ...STATIC_MICROCOPY_HTML]) {
    it(`keeps reviewed microcopy neutral in ${relativePath}`, async () => {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      if (
        relativePath.endsWith('.js') &&
        relativePath !== 'public/frontend/public-mvp-ui.js'
      ) {
        expect(source, relativePath).not.toMatch(FORBIDDEN_BACKEND_ECHO);
      }
      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    });
  }
});
