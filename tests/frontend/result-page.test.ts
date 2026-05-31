import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

async function loadResultPageModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/result-page.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function loadSubmissionPrivacyModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/submission-privacy.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

function createRoot() {
  let documentObject: {
    createElement(tagName: string): ReturnType<typeof createElement>;
  };
  function createElement(tagName: string) {
    return {
      tagName,
      ownerDocument: documentObject,
      className: '',
      textContent: '',
      hidden: false,
      children: [] as ReturnType<typeof createElement>[],
      append(child: ReturnType<typeof createElement>) {
        this.children.push(child);
      },
      replaceChildren() {
        this.children = [];
      },
    };
  }
  documentObject = { createElement };
  return createElement('div');
}

function collectText(element: ReturnType<typeof createRoot>): string[] {
  return [
    element.textContent,
    ...element.children.flatMap((child) => collectText(child)),
  ].filter(Boolean);
}

const displaySafeResult = {
  poll_id: '11111111-1111-4111-8111-111111111111',
  display_mode: 'rounded_with_bucketed_votes',
  total_votes_display: '100–499',
  collecting: false,
  options: [
    {
      option_index: 0,
      display_label: '選項 A',
      display_percentage: '約 43%',
      display_count: '約 100–150 票',
    },
  ],
  updated_display: '最近更新',
};

const publicNotice = {
  notice_id: '22222222-2222-4222-8222-222222222222',
  poll_id: displaySafeResult.poll_id,
  notice_type: 'suspended_typo_correction_applied',
  title: 'Poll typo correction applied',
  body: 'Correction did not change semantic direction.',
  created_at: '2026-06-15T10:00:00.000Z',
  correction_request_id: 'private-request-id',
  admin_id: 'private-admin-id',
  reason_text: 'private reason',
  review_context: { peer_decisions: ['private decision'] },
  vote_token: 'private-vote-token',
  option_id: 'private-option-id',
};

describe('public result page', () => {
  it('calls only the public display-safe result endpoint once', async () => {
    const { loadResultDisplay } = await loadResultPageModule();
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => displaySafeResult,
    }));

    await expect(
      loadResultDisplay({ pollId: displaySafeResult.poll_id, fetchImpl }),
    ).resolves.toEqual(displaySafeResult);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith(
      `/polls/${displaySafeResult.poll_id}/results`,
      {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store',
      },
    );
  });

  it('loads public notices from the poll-scoped public endpoint', async () => {
    const { loadPublicNotices } = await loadResultPageModule();
    const noticeList = { notices: [publicNotice] };
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => noticeList,
    }));

    await expect(
      loadPublicNotices({ pollId: displaySafeResult.poll_id, fetchImpl }),
    ).resolves.toEqual(noticeList);

    expect(fetchImpl).toHaveBeenCalledWith(
      `/polls/${displaySafeResult.poll_id}/public-notices`,
      {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store',
      },
    );
  });

  it('renders backend-provided display strings without deriving precision', async () => {
    const { renderResultDisplay } = await loadResultPageModule();
    const root = createRoot();

    renderResultDisplay(root, displaySafeResult);

    expect(collectText(root)).toEqual([
      '100–499',
      '最近更新',
      '選項 A',
      '約 43%',
      '約 100–150 票',
    ]);
  });

  it('renders identical content for direct visits and post-vote redirects', async () => {
    const { getPollIdFromResultPath, renderResultDisplay } =
      await loadResultPageModule();
    const { getPublicResultPath } = await loadSubmissionPrivacyModule();
    const directRoot = createRoot();
    const redirectRoot = createRoot();

    const directPollId = getPollIdFromResultPath(`/results/${displaySafeResult.poll_id}`);
    const redirectPollId = getPollIdFromResultPath(
      getPublicResultPath(displaySafeResult.poll_id),
    );
    renderResultDisplay(directRoot, displaySafeResult);
    renderResultDisplay(redirectRoot, displaySafeResult);

    expect(directPollId).toBe(displaySafeResult.poll_id);
    expect(redirectPollId).toBe(displaySafeResult.poll_id);
    expect(collectText(redirectRoot)).toEqual(collectText(directRoot));
  });

  it('hides the public notice region when the API returns no notices', async () => {
    const { renderPublicNotices } = await loadResultPageModule();
    const root = createRoot();

    renderPublicNotices(root, { notices: [] });

    expect(root.hidden).toBe(true);
    expect(collectText(root)).toEqual([]);
  });

  it('renders only allowlisted public notice fields near the result display', async () => {
    const { renderPublicNotices } = await loadResultPageModule();
    const root = createRoot();

    renderPublicNotices(root, {
      notices: [
        publicNotice,
        {
          ...publicNotice,
          notice_type: 'internal_admin_note',
          title: 'Internal only',
          body: 'Private workflow context',
        },
      ],
    });

    expect(root.hidden).toBe(false);
    expect(collectText(root)).toEqual([
      '修正公告',
      publicNotice.title,
      publicNotice.body,
      publicNotice.created_at,
    ]);
    expect(collectText(root).join(' ')).not.toMatch(
      /private-request-id|private-admin-id|private reason|private decision|private-vote-token|private-option-id|Internal only|Private workflow context/,
    );
  });

  it('maps poll-not-found result failures to a friendly message', async () => {
    const { loadResultDisplay } = await loadResultPageModule();
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 404,
      json: async () => ({ error: 'POLL_NOT_FOUND', message: 'Poll not found' }),
    }));

    await expect(
      loadResultDisplay({ pollId: displaySafeResult.poll_id, fetchImpl }),
    ).rejects.toThrow('找不到此問卷');
  });

  it('keeps result content visible when public notice loading fails', async () => {
    const { bootstrapResultPage } = await loadResultPageModule();
    const resultRoot = createRoot();
    const publicNoticesRoot = createRoot();
    publicNoticesRoot.hidden = true;
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => displaySafeResult,
      })
      .mockResolvedValueOnce({ ok: false });

    await bootstrapResultPage({
      windowObject: {
        location: { pathname: `/results/${displaySafeResult.poll_id}` },
      },
      documentObject: {
        getElementById(id: string) {
          if (id === 'result-display') {
            return resultRoot;
          }
          if (id === 'public-notices') {
            return publicNoticesRoot;
          }
          return null;
        },
      },
      fetchImpl,
    });

    expect(collectText(resultRoot)).toContain(displaySafeResult.total_votes_display);
    expect(publicNoticesRoot.hidden).toBe(true);
    expect(collectText(publicNoticesRoot)).toEqual([]);
  });

  it('contains no auto-refresh, precision reconstruction, or debug output', async () => {
    const source = await readFile(
      join(process.cwd(), 'public/frontend/result-page.js'),
      'utf8',
    );

    expect(source).not.toMatch(
      /setInterval|setTimeout|WebSocket|EventSource|requestAnimationFrame|console\.|Date\(|Math\./,
    );
    expect(source).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie/);
  });
});
