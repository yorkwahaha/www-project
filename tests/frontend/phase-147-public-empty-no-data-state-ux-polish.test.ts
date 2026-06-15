import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PUBLIC_EMPTY_SURFACES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/explore-page.js',
  'public/frontend/result-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/creator-flow-copy.js',
  'public/frontend/poll-lifecycle-controls.js',
];

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters|creator_token/i;

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_BACKEND_ECHO =
  /error\.message|body\.message|apiError\.message|response\.text\(\)|JSON\.stringify\(error/i;

const FORBIDDEN_OBSERVABILITY =
  /console\.(log|info|warn|error|debug)|analytics|datadog|sentry|apm|trackEvent|gtag\(/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 147 public empty / no data state UX polish', () => {
  it('exports frontend-owned PUBLIC_EMPTY_STATE_MESSAGES allowlist with safe fixed copy', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(publicUi.PUBLIC_EMPTY_STATE_MESSAGES.length).toBeGreaterThanOrEqual(6);
    expect(publicUi.PUBLIC_EXPLORE_EMPTY_MESSAGE).toBe(
      '目前沒有可瀏覽的公開問卷。',
    );
    expect(publicUi.PUBLIC_MY_POLLS_EMPTY_MESSAGE).toBe('你目前還沒有建立問卷。');
    expect(publicUi.PUBLIC_RESULTS_EMPTY_AGGREGATE_MESSAGE).toBe(
      '目前沒有可顯示的聚合結果。',
    );

    for (const message of publicUi.PUBLIC_EMPTY_STATE_MESSAGES) {
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(message).not.toMatch(/\d+%|第\s*\d+\s*名|raw_count/i);
    }
  });

  it('exports PUBLIC_EMPTY_STATE_LABELS with safe empty-state CTAs', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(publicUi.PUBLIC_EMPTY_STATE_LABELS).toContain(
      publicUi.PUBLIC_EXPLORE_EMPTY_CTA_LABEL,
    );
    expect(publicUi.PUBLIC_EMPTY_STATE_LABELS).toContain(
      publicUi.PUBLIC_CTA_GO_TO_CREATE_POLL_LIVE_LABEL,
    );
    expect(publicUi.PUBLIC_EXPLORE_EMPTY_CTA_LABEL).toBe('建立問卷');
  });

  it('maps explore empty constants into PUBLIC_EMPTY_STATE_MESSAGES', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const explore = await loadModule('public/frontend/explore-page.js');

    expect(explore.EXPLORE_FEED_EMPTY_MESSAGE).toBe(
      publicUi.PUBLIC_EXPLORE_EMPTY_MESSAGE,
    );
    expect(explore.EXPLORE_FEED_EMPTY_SUMMARY).toBe(
      publicUi.PUBLIC_EXPLORE_EMPTY_SUMMARY,
    );
    expect(explore.EXPLORE_FEED_EMPTY_CTA_LABEL).toBe(
      publicUi.PUBLIC_EXPLORE_EMPTY_CTA_LABEL,
    );
    expect(publicUi.PUBLIC_EMPTY_STATE_MESSAGES).toContain(
      publicUi.PUBLIC_EXPLORE_EMPTY_MESSAGE,
    );
    expect(publicUi.PUBLIC_EMPTY_STATE_MESSAGES).toContain(
      publicUi.PUBLIC_EXPLORE_EMPTY_SUMMARY,
    );
  });

  it('maps my-polls and creator flow empty copy into PUBLIC_EMPTY_STATE_MESSAGES', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const creatorFlow = await loadModule('public/frontend/creator-flow-copy.js');

    expect(myPolls.MY_POLLS_EMPTY_MESSAGE).toBe(
      publicUi.PUBLIC_MY_POLLS_EMPTY_MESSAGE,
    );
    expect(myPolls.MY_POLLS_EMPTY_SUMMARY).toBe(
      publicUi.PUBLIC_MY_POLLS_EMPTY_SUMMARY,
    );
    expect(creatorFlow.CREATOR_FLOW_COPY.myPollsEmpty).toBe(
      publicUi.PUBLIC_MY_POLLS_EMPTY_HEADLINE,
    );
    expect(publicUi.PUBLIC_EMPTY_STATE_MESSAGES).toContain(
      publicUi.PUBLIC_MY_POLLS_EMPTY_HEADLINE,
    );
  });

  it('maps results empty aggregate and lifecycle action-area empty into allowlist', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const resultPage = await loadModule('public/frontend/result-page.js');
    const lifecycle = await loadModule('public/frontend/poll-lifecycle-controls.js');

    expect(resultPage.RESULTS_EMPTY_AGGREGATE_MESSAGE).toBe(
      publicUi.PUBLIC_RESULTS_EMPTY_AGGREGATE_MESSAGE,
    );
    expect(lifecycle.LIFECYCLE_ACTION_AREA_EMPTY_MESSAGE).toBe(
      publicUi.PUBLIC_LIFECYCLE_NO_ACTION_AVAILABLE_MESSAGE,
    );
    expect(lifecycle.lifecycleNoteForState('draft')).toBe(
      publicUi.PUBLIC_LIFECYCLE_NO_ACTION_AVAILABLE_MESSAGE,
    );
    expect(publicUi.PUBLIC_EMPTY_STATE_MESSAGES).toContain(
      publicUi.PUBLIC_RESULTS_EMPTY_AGGREGATE_MESSAGE,
    );
    expect(publicUi.PUBLIC_EMPTY_STATE_MESSAGES).toContain(
      publicUi.PUBLIC_LIFECYCLE_NO_ACTION_AVAILABLE_MESSAGE,
    );
  });

  it('keeps empty-state messages out of PUBLIC_UNAVAILABLE_USER_MESSAGES', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(publicUi.PUBLIC_UNAVAILABLE_USER_MESSAGES).not.toContain(
      publicUi.PUBLIC_EXPLORE_EMPTY_MESSAGE,
    );
    expect(publicUi.PUBLIC_UNAVAILABLE_USER_MESSAGES).not.toContain(
      publicUi.PUBLIC_RESULTS_EMPTY_AGGREGATE_MESSAGE,
    );
  });

  it('syncs explore.html empty panel from shared constants', async () => {
    const explore = await loadModule('public/frontend/explore-page.js');
    const paragraphs = [{ textContent: '' }, { textContent: '' }];
    const createLink = { textContent: '' };
    const emptyPanel = {
      querySelectorAll(selector: string) {
        return selector === 'p' ? paragraphs : [];
      },
      querySelector(selector: string) {
        return selector === 'a[href="/polls/new?live=1"]' ? createLink : null;
      },
    };
    const documentObject = {
      getElementById(id: string) {
        return id === 'explore-empty' ? emptyPanel : null;
      },
    };

    explore.syncExploreEmptyStatePanel(documentObject);

    expect(paragraphs[0]?.textContent).toBe(explore.EXPLORE_FEED_EMPTY_MESSAGE);
    expect(paragraphs[1]?.textContent).toBe(explore.EXPLORE_FEED_EMPTY_SUMMARY);
    expect(createLink.textContent).toBe(explore.EXPLORE_FEED_EMPTY_CTA_LABEL);
  });

  it('keeps results empty aggregate in aggregate mode only', async () => {
    const resultPage = await loadModule('public/frontend/result-page.js');

    for (const state of ['revealed', 'locked', 'post_lock'] as const) {
      expect(
        resultPage.resolveResultRenderMode({ public_lifecycle_state: state }),
      ).toBe('aggregate');
    }
    expect(
      resultPage.resolveResultRenderMode({ public_lifecycle_state: 'collecting' }),
    ).toBe('collecting');
  });

  it('keeps vote-by-index body unchanged with only option_index', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => ({
      ok: true,
      status: 201,
      json: async () => ({ vote_token: 'secret', option_id: 'secret' }),
    }));

    await votePage.submitVoteByIndex({
      pollId: '11111111-1111-4111-8111-111111111111',
      optionIndex: 0,
      userId: '44444444-4444-4444-8444-444444444444',
      fetchImpl,
    });

    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ option_index: 0 });
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
        display_name: 'Empty Polish User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl,
    });

    expect(fetchCalls).toEqual(['/registration']);

    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/registration-page.js'), 'utf8'),
    );
    expect(source).not.toMatch(/mountLoginStateRead|\/users\/me|Set-Cookie|document\.cookie/i);
  });

  it('does not add observability hooks to reviewed empty surfaces', async () => {
    for (const relativePath of PUBLIC_EMPTY_SURFACES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_OBSERVABILITY);
    }
  });

  for (const relativePath of PUBLIC_EMPTY_SURFACES) {
    it(`keeps reviewed empty / no-data copy neutral in ${relativePath}`, async () => {
      const raw = await readFile(join(process.cwd(), relativePath), 'utf8');
      const source = stripJsComments(raw);

      if (
        relativePath !== 'public/frontend/poll-lifecycle-controls.js' &&
        relativePath !== 'public/frontend/public-mvp-ui.js'
      ) {
        expect(source, relativePath).not.toMatch(FORBIDDEN_BACKEND_ECHO);
      }
      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    });
  }
});
