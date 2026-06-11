import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PUBLIC_STATUS_SURFACES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/auth-state-copy.js',
  'public/frontend/login-state-ui.js',
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
  'public/frontend/explore-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/profile-completion-prompt.js',
  'public/frontend/poll-lifecycle-controls.js',
  'public/frontend/public-mvp-demo.js',
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

describe('Phase 145 public status badge / state label consistency polish', () => {
  it('exports frontend-owned PUBLIC_STATUS_LABELS allowlist with safe fixed copy', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(publicUi.PUBLIC_STATUS_LABELS.length).toBeGreaterThan(25);
    expect(publicUi.PUBLIC_AUTH_GUEST_CHIP_STATUS_LABEL).toBe('未登入');
    expect(publicUi.PUBLIC_POLL_LIFECYCLE_COLLECTING_STATUS_LABEL).toBe('收集中');
    expect(publicUi.PUBLIC_INCOMPLETE_USER_DATA_STATUS_LABEL).toBe('資料未完成');

    for (const label of publicUi.PUBLIC_STATUS_LABELS) {
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
      expect(label).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(label).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(label).not.toMatch(/\d+%|第\s*\d+\s*名|raw_count/i);
    }
  });

  it('maps auth and header status labels into PUBLIC_STATUS_LABELS', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const authCopy = await loadModule('public/frontend/auth-state-copy.js');

    expect(authCopy.AUTH_STATE_COPY.guestChipLabel).toBe(
      publicUi.PUBLIC_AUTH_GUEST_CHIP_STATUS_LABEL,
    );
    expect(authCopy.AUTH_STATE_COPY.demoIdentityChipLabel).toBe(
      publicUi.PUBLIC_AUTH_DEMO_IDENTITY_CHIP_STATUS_LABEL,
    );
    expect(publicUi.PUBLIC_STATUS_LABELS).toContain(
      publicUi.PUBLIC_AUTH_SIGNED_IN_STATUS_ARIA_PREFIX,
    );
    expect(publicUi.PUBLIC_STATUS_LABELS).toContain(
      publicUi.PUBLIC_AUTH_LOGOUT_STATUS_LABEL,
    );
  });

  it('maps poll lifecycle status labels through formatPublicPollLifecycleStatusLabel', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const demo = await loadModule('public/frontend/public-mvp-demo.js');

    expect(publicUi.formatPublicPollLifecycleStatusLabel('collecting')).toBe('收集中');
    expect(publicUi.formatPublicPollLifecycleStatusLabel('revealed')).toBe('已公開');
    expect(myPolls.formatMyPollsLifecycleLabel('cancelled')).toBe('已取消');
    expect(demo.RESULT_UI_STATE_PREVIEW_LINKS.map((item: { label: string }) => item.label)).toEqual(
      [
        '收集中',
        '已公開',
        '公開鎖定期',
        '鎖定期已結束',
        '已取消',
        '已下架',
      ],
    );
  });

  it('keeps auth/profile status labels without user_id, session id, or raw profile values', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const profilePrompt = await loadModule('public/frontend/profile-completion-prompt.js');

    expect(publicUi.PUBLIC_AUTH_GUEST_CHIP_STATUS_LABEL).not.toMatch(
      FORBIDDEN_INTERNAL_COPY,
    );
    expect(profilePrompt.PROFILE_COMPLETION_INCOMPLETE_STATUS_LABEL).toBe(
      publicUi.PUBLIC_INCOMPLETE_USER_DATA_STATUS_LABEL,
    );
    expect(profilePrompt.PROFILE_COMPLETION_INCOMPLETE_STATUS_LABEL).not.toContain(
      'birth_year_month',
    );
    expect(profilePrompt.PROFILE_COMPLETION_INCOMPLETE_STATUS_LABEL).not.toContain(
      'residential_region',
    );
  });

  it('keeps vote status labels neutral without option, eligibility, result, token, or shard', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const votePage = await loadModule('public/frontend/vote-page.js');

    expect(votePage.VOTE_SUCCESS_STATUS_MESSAGE).toBe(
      publicUi.PUBLIC_VOTE_SUCCESS_STATUS_MESSAGE,
    );
    expect(votePage.VOTE_SUCCESS_STATUS_MESSAGE).not.toMatch(
      /option|eligibility|shard|token|票數|百分比/i,
    );

    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/vote-page.js'), 'utf8'),
    );
    expect(source).toContain('PUBLIC_VOTE_SUCCESS_PANEL_ARIA_LABEL');
    expect(source).toContain('vote-by-index');
    expect(source).not.toMatch(/option_id\s*:/);
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

  it('keeps results status labels free of aggregate preview outside display-safe states', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const resultPage = await loadModule('public/frontend/result-page.js');

    expect(resultPage.RESULTS_COLLECTING_TITLE).toBe(
      publicUi.PUBLIC_RESULTS_COLLECTING_TITLE,
    );
    expect(publicUi.PUBLIC_RESULTS_NOT_YET_VISIBLE_STATUS_LABEL).toBe('尚不可查看結果');
    expect(publicUi.PUBLIC_RESULTS_COLLECTING_TITLE).not.toMatch(/raw_count|\d+%|第\s*\d+\s*名/i);

    for (const state of ['revealed', 'locked', 'post_lock'] as const) {
      expect(
        resultPage.resolveResultRenderMode({ public_lifecycle_state: state }),
      ).toBe('aggregate');
    }
    expect(
      resultPage.resolveResultRenderMode({ public_lifecycle_state: 'collecting' }),
    ).toBe('collecting');
  });

  it('keeps explore, create-poll, and lifecycle status labels without creator token or internal id', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const explore = await loadModule('public/frontend/explore-page.js');
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const lifecycle = await loadModule('public/frontend/poll-lifecycle-controls.js');

    expect(explore.EXPLORE_COLLECTING_STATUS_LABEL).toBe(
      publicUi.PUBLIC_EXPLORE_COLLECTING_STATUS_LABEL,
    );
    expect(createPoll.CREATE_POLL_LIVE_SUBMIT_STATUS_LABEL).toBe(
      publicUi.PUBLIC_CREATE_POLL_LIVE_SUBMIT_STATUS_LABEL,
    );
    expect(lifecycle.lifecycleNoteForState('cancelled')).toBe(
      publicUi.PUBLIC_LIFECYCLE_CANCELLED_NOTE_MESSAGE,
    );
    expect(lifecycle.lifecycleNoteForState('cancelled')).not.toMatch(
      FORBIDDEN_INTERNAL_COPY,
    );
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
        display_name: 'Status Polish User',
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

  it('does not add observability hooks to reviewed status surfaces', async () => {
    for (const relativePath of PUBLIC_STATUS_SURFACES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_OBSERVABILITY);
    }
  });

  for (const relativePath of PUBLIC_STATUS_SURFACES) {
    it(`keeps reviewed status badge / state label copy neutral in ${relativePath}`, async () => {
      const raw = await readFile(join(process.cwd(), relativePath), 'utf8');
      const source = stripJsComments(raw);

      if (
        relativePath !== 'public/frontend/poll-lifecycle-controls.js' &&
        relativePath !== 'public/frontend/public-mvp-ui.js' &&
        relativePath !== 'public/frontend/auth-state-copy.js'
      ) {
        expect(source, relativePath).not.toMatch(FORBIDDEN_BACKEND_ECHO);
      }
      if (
        relativePath !== 'public/frontend/official-vote-pre-vote-hints.js' &&
        relativePath !== 'public/frontend/creator-flow-copy.js'
      ) {
        expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      }
    });
  }
});
