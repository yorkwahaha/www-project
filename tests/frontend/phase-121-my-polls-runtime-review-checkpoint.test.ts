import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const REVIEWED_MY_POLLS_FILES = [
  'public/frontend/my-polls-page.js',
  'public/my-polls.html',
  'public/frontend/creator-flow-copy.js',
];

const COUNTER_PREVIEW_COPY =
  /結果預覽|mvp-result-preview|vote_count|(?<!不顯示)票數|百分比|熱門|趨勢/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const FORBIDDEN_OUTCOME_COPY =
  /你投過|你尚未投票|你符合資格|你不符合資格|已投過票|選擇了|投給哪個|年齡門檻|地區條件|trust rule|role rule|profile.*完成|完成.*profile/i;

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters/i;

async function loadMyPollsModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/my-polls-page.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

const safeOwnedPoll = {
  poll_id: '22222222-2222-4222-8222-222222222222',
  title: '午餐偏好',
  category: 'general',
  public_lifecycle_state: 'collecting',
  closes_at: '2026-06-07T12:00:00.000Z',
  revealed_at: null,
  public_lock_ends_at: null,
  cancelled_at: null,
  unpublished_at: null,
};

describe('Phase 121 my polls runtime review checkpoint', () => {
  it('uses Phase 119/120 sign-in, load failure, and empty copy constants', async () => {
    const {
      MY_POLLS_SIGN_IN_REQUIRED_MESSAGE,
      MY_POLLS_LOAD_FAILURE_MESSAGE,
      MY_POLLS_EMPTY_MESSAGE,
      MY_POLLS_EMPTY_SUMMARY,
    } = await loadMyPollsModule();

    expect(MY_POLLS_SIGN_IN_REQUIRED_MESSAGE).toBe('請先登入後查看你建立的問卷');
    expect(MY_POLLS_LOAD_FAILURE_MESSAGE).toBe(
      '目前無法載入你建立的問卷，請稍後再試',
    );
    expect(MY_POLLS_EMPTY_MESSAGE).toBe('你目前還沒有建立問卷');
    expect(MY_POLLS_EMPTY_SUMMARY).toBe('你可以先建立一則問卷並分享投票連結。');
  });

  it('maps lifecycle states to neutral labels including post_lock', async () => {
    const { formatMyPollsLifecycleLabel } = await loadMyPollsModule();

    expect(formatMyPollsLifecycleLabel('draft')).toBe('草稿');
    expect(formatMyPollsLifecycleLabel('collecting')).toBe('收集中');
    expect(formatMyPollsLifecycleLabel('revealed')).toBe('已公開');
    expect(formatMyPollsLifecycleLabel('locked')).toBe('公開鎖定期');
    expect(formatMyPollsLifecycleLabel('post_lock')).toBe('鎖定期已結束');
    expect(formatMyPollsLifecycleLabel('cancelled')).toBe('已取消');
    expect(formatMyPollsLifecycleLabel('unpublished')).toBe('已下架');
  });

  it('accepts only creator-safe owned poll payloads and rejects unsafe fields', async () => {
    const { isCreatorOwnedPollSafe, CREATOR_OWNED_POLL_ALLOWED_KEYS } =
      await loadMyPollsModule();

    expect(isCreatorOwnedPollSafe(safeOwnedPoll)).toBe(true);
    expect(Object.keys(safeOwnedPoll).sort()).toEqual(
      [...CREATOR_OWNED_POLL_ALLOWED_KEYS].sort(),
    );
    expect(
      isCreatorOwnedPollSafe({ ...safeOwnedPoll, vote_count: 8 }),
    ).toBe(false);
    expect(
      isCreatorOwnedPollSafe({ ...safeOwnedPoll, option_id: 'secret' }),
    ).toBe(false);
  });

  it('maps creator session and owned-list failures to neutral copy without echoing payloads', async () => {
    const {
      MY_POLLS_SIGN_IN_REQUIRED_MESSAGE,
      MY_POLLS_LOAD_FAILURE_MESSAGE,
      prepareMyPollsLiveSession,
      fetchCreatorOwnedPolls,
    } = await loadMyPollsModule();

    const session401Fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });
    await expect(
      prepareMyPollsLiveSession({
        fetchImpl: session401Fetch,
        locationObject: { hostname: 'example.test' },
      }),
    ).rejects.toThrow(MY_POLLS_SIGN_IN_REQUIRED_MESSAGE);

    const nonOkFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'INTERNAL',
        message: 'option_id leak and vote_token secret',
      }),
    });
    await expect(fetchCreatorOwnedPolls(nonOkFetch)).rejects.toThrow(
      MY_POLLS_LOAD_FAILURE_MESSAGE,
    );
    await expect(fetchCreatorOwnedPolls(nonOkFetch)).rejects.not.toThrow(
      /option_id|vote_token/i,
    );
  });

  it('buckets sign-in-required errors without reading foreign error.message', async () => {
    const { isMyPollsSignInRequiredError } = await loadMyPollsModule();

    const signInError = new Error('請先登入後查看你建立的問卷');
    signInError.name = 'MyPollsSignInRequiredError';
    expect(isMyPollsSignInRequiredError(signInError)).toBe(true);

    const foreignError = new Error('option_id leak and vote_token secret');
    expect(isMyPollsSignInRequiredError(foreignError)).toBe(false);
  });

  it('separates mock dashboard markup from live owned-list region', async () => {
    const html = await readFile(join(process.cwd(), 'public/my-polls.html'), 'utf8');
    const source = await readFile(
      join(process.cwd(), 'public/frontend/my-polls-page.js'),
      'utf8',
    );

    expect(html).toContain('data-mock-dashboard="true"');
    expect(source).toContain('data-live-owned-list');
    expect(source).toContain('aria-hidden');
    expect(html).not.toContain('data-live-owned-list');
  });

  it('keeps my-polls runtime away from vote/profile paths and observability sinks', async () => {
    const source = await readFile(
      join(process.cwd(), 'public/frontend/my-polls-page.js'),
      'utf8',
    );

    expect(source).toContain('/creator/polls');
    expect(source).toContain('isMyPollsSignInRequiredError');
    expect(source).not.toMatch(/error\.message/);
    expect(source).not.toMatch(
      /\/users\/me|users\/me\/profile|vote-by-index|reference-answer|localStorage|sessionStorage|indexedDB|navigator\.sendBeacon|console\.|analytics|apm\.|trace\./i,
    );
  });

  for (const relativePath of REVIEWED_MY_POLLS_FILES) {
    it(`keeps reviewed my-polls copy neutral in ${relativePath}`, async () => {
      const raw = await readFile(join(process.cwd(), relativePath), 'utf8');
      const source = relativePath.endsWith('.js')
        ? stripJsComments(raw)
        : raw;

      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(source, relativePath).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      if (relativePath === 'public/frontend/my-polls-page.js') {
        expect(source, relativePath).not.toMatch(COUNTER_PREVIEW_COPY);
      }
    });
  }

  it('keeps Phase 121 user-visible messages free of forbidden internals', async () => {
    const myPollsPage = await loadMyPollsModule();
    const userVisibleMessages = [
      myPollsPage.MY_POLLS_SIGN_IN_REQUIRED_MESSAGE,
      myPollsPage.MY_POLLS_LOAD_FAILURE_MESSAGE,
      myPollsPage.MY_POLLS_EMPTY_MESSAGE,
      myPollsPage.MY_POLLS_EMPTY_SUMMARY,
      myPollsPage.MY_POLLS_LOADING_MESSAGE,
      ...Object.values({
        draft: myPollsPage.formatMyPollsLifecycleLabel('draft'),
        collecting: myPollsPage.formatMyPollsLifecycleLabel('collecting'),
        revealed: myPollsPage.formatMyPollsLifecycleLabel('revealed'),
        locked: myPollsPage.formatMyPollsLifecycleLabel('locked'),
        post_lock: myPollsPage.formatMyPollsLifecycleLabel('post_lock'),
        cancelled: myPollsPage.formatMyPollsLifecycleLabel('cancelled'),
        unpublished: myPollsPage.formatMyPollsLifecycleLabel('unpublished'),
      }),
    ];

    for (const message of userVisibleMessages) {
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }
  });
});
