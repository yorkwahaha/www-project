import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

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

describe('Phase 120 my polls empty unavailable state runtime polish', () => {
  it('uses Phase 119 copy constants', async () => {
    const {
      MY_POLLS_SIGN_IN_REQUIRED_MESSAGE,
      MY_POLLS_LOAD_FAILURE_MESSAGE,
      MY_POLLS_EMPTY_MESSAGE,
      MY_POLLS_EMPTY_SUMMARY,
    } = await loadMyPollsModule();

    expect(MY_POLLS_SIGN_IN_REQUIRED_MESSAGE).toBe(
      '請先登入，才能查看並管理你建立的問卷。若尚未註冊，請先到註冊頁建立帳號，完成後再回來登入。',
    );
    expect(MY_POLLS_LOAD_FAILURE_MESSAGE).toBe(
      '目前無法載入你建立的問卷，請稍後再試。',
    );
    expect(MY_POLLS_EMPTY_MESSAGE).toBe('你目前還沒有建立問卷。');
    expect(MY_POLLS_EMPTY_SUMMARY).toBe(
      '你目前還沒有透過本流程建立的問卷。可先建立一則問卷，完成後在此管理並分享投票連結。',
    );
  });

  it('maps lifecycle states to neutral labels', async () => {
    const { formatMyPollsLifecycleLabel } = await loadMyPollsModule();

    expect(formatMyPollsLifecycleLabel('draft')).toBe('草稿');
    expect(formatMyPollsLifecycleLabel('collecting')).toBe('收集中');
    expect(formatMyPollsLifecycleLabel('revealed')).toBe('已公開');
    expect(formatMyPollsLifecycleLabel('locked')).toBe('公開鎖定期');
    expect(formatMyPollsLifecycleLabel('cancelled')).toBe('已取消');
    expect(formatMyPollsLifecycleLabel('unpublished')).toBe('已下架');
  });

  it('rejects unsafe owned poll payloads', async () => {
    const { isCreatorOwnedPollSafe, fetchCreatorOwnedPolls } =
      await loadMyPollsModule();

    expect(isCreatorOwnedPollSafe(safeOwnedPoll)).toBe(true);
    expect(
      isCreatorOwnedPollSafe({ ...safeOwnedPoll, vote_count: 8 }),
    ).toBe(false);

    const unsafeFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        polls: [{ ...safeOwnedPoll, option_id: 'secret' }],
      }),
    });
    await expect(fetchCreatorOwnedPolls(unsafeFetch)).rejects.toThrow(
      '目前無法載入你建立的問卷，請稍後再試。',
    );
  });

  it('maps non-demo creator session 401 to sign-in required copy', async () => {
    const {
      MY_POLLS_SIGN_IN_REQUIRED_MESSAGE,
      prepareMyPollsLiveSession,
    } = await loadMyPollsModule();

    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });

    await expect(
      prepareMyPollsLiveSession({
        fetchImpl,
        locationObject: { hostname: 'example.test' },
      }),
    ).rejects.toThrow(MY_POLLS_SIGN_IN_REQUIRED_MESSAGE);
  });

  it('maps owned-list fetch failures to neutral copy without echoing payloads', async () => {
    const { MY_POLLS_LOAD_FAILURE_MESSAGE, fetchCreatorOwnedPolls } =
      await loadMyPollsModule();

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

  it('keeps my-polls runtime away from vote/profile paths and observability sinks', async () => {
    const source = await readFile(
      join(process.cwd(), 'public/frontend/my-polls-page.js'),
      'utf8',
    );

    expect(source).toContain('/creator/polls');
    expect(source).toContain('isMyPollsSignInRequiredError');
    expect(source).not.toMatch(
      /\/users\/me|users\/me\/profile|vote-by-index|reference-answer|localStorage|sessionStorage|indexedDB|navigator\.sendBeacon|console\.|analytics|apm\.|trace\./i,
    );
    expect(source).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    expect(source).not.toMatch(FORBIDDEN_INTERNAL_COPY);
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
});
