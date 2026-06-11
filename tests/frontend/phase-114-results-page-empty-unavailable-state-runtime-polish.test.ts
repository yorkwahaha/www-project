import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const FORBIDDEN_OUTCOME_COPY =
  /你投過|你尚未投票|你符合資格|你不符合資格|已投過票|選擇了|投給哪個|年齡門檻|地區條件|trust rule|role rule/i;

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters/i;

async function loadResultPageModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/result-page.js'),
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
      href: '',
      textContent: '',
      hidden: false,
      attributes: new Map<string, string>(),
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      },
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

describe('Phase 114 results page empty unavailable state runtime polish', () => {
  it('uses Phase 113 collecting copy without counters or personal vote state', async () => {
    const {
      RESULTS_COLLECTING_TITLE,
      RESULTS_COLLECTING_SUMMARY,
      renderResultDisplay,
    } = await loadResultPageModule();
    const root = createRoot();

    renderResultDisplay(root, {
      public_lifecycle_state: 'collecting',
      display_mode: 'collecting',
      total_votes_display: '收集中',
      collecting: true,
      options: [
        {
          display_label: '選項甲',
          display_percentage: null,
          display_count: null,
        },
      ],
    });

    const text = collectText(root).join(' ');
    expect(RESULTS_COLLECTING_TITLE).toBe('結果尚未公開');
    expect(text).toContain(RESULTS_COLLECTING_TITLE);
    expect(text).toContain(RESULTS_COLLECTING_SUMMARY);
    expect(text).not.toMatch(/狀態：|0\s*票|0%|約\s*\d+%/);
    expect(text).not.toMatch(FORBIDDEN_OUTCOME_COPY);
  });

  it('uses lifecycle-specific unavailable copy without echoing backend user_message', async () => {
    const {
      RESULTS_CANCELLED_TITLE,
      RESULTS_CANCELLED_MESSAGE,
      RESULTS_UNPUBLISHED_TITLE,
      RESULTS_UNPUBLISHED_MESSAGE,
      resolveUnavailableUserMessage,
      renderResultDisplay,
    } = await loadResultPageModule();

    const cancelledPayload = {
      public_lifecycle_state: 'cancelled',
      user_message: 'raw backend cancelled detail with option_id secret',
      options: [],
    };
    const unpublishedPayload = {
      public_lifecycle_state: 'unpublished',
      user_message: 'raw backend unpublished detail with vote_token secret',
      options: [],
    };

    expect(resolveUnavailableUserMessage(cancelledPayload)).toBe(
      RESULTS_CANCELLED_MESSAGE,
    );
    expect(resolveUnavailableUserMessage(unpublishedPayload)).toBe(
      RESULTS_UNPUBLISHED_MESSAGE,
    );

    const cancelledRoot = createRoot();
    renderResultDisplay(cancelledRoot, cancelledPayload);
    const cancelledText = collectText(cancelledRoot).join(' ');
    expect(cancelledText).toContain(RESULTS_CANCELLED_TITLE);
    expect(cancelledText).toContain(RESULTS_CANCELLED_MESSAGE);
    expect(cancelledText).not.toContain('raw backend cancelled detail');

    const unpublishedRoot = createRoot();
    renderResultDisplay(unpublishedRoot, unpublishedPayload);
    const unpublishedText = collectText(unpublishedRoot).join(' ');
    expect(unpublishedText).toContain(RESULTS_UNPUBLISHED_TITLE);
    expect(unpublishedText).toContain(RESULTS_UNPUBLISHED_MESSAGE);
    expect(unpublishedText).not.toContain('raw backend unpublished detail');
  });

  it('maps result load failures to neutral unavailable or transport copy', async () => {
    const {
      RESULTS_POLL_UNAVAILABLE_MESSAGE,
      RESULTS_LOAD_FAILURE_MESSAGE,
      messageForResultLoadFailure,
      loadResultDisplay,
    } = await loadResultPageModule();

    expect(
      messageForResultLoadFailure({ status: 404, errorCode: 'POLL_NOT_FOUND' }),
    ).toBe(RESULTS_POLL_UNAVAILABLE_MESSAGE);
    expect(messageForResultLoadFailure({ status: 500, errorCode: null })).toBe(
      RESULTS_LOAD_FAILURE_MESSAGE,
    );

    const unavailableFetch = vi.fn(async () => ({
      ok: false,
      status: 404,
      json: async () => ({
        error: 'POLL_NOT_FOUND',
        message: 'Poll not found with option_id abc',
      }),
    }));
    await expect(
      loadResultDisplay({
        pollId: '11111111-1111-4111-8111-111111111111',
        fetchImpl: unavailableFetch,
      }),
    ).rejects.toThrow(RESULTS_POLL_UNAVAILABLE_MESSAGE);

    const transportFetch = vi.fn(async () => {
      throw new Error('network down');
    });
    await expect(
      loadResultDisplay({
        pollId: '11111111-1111-4111-8111-111111111111',
        fetchImpl: transportFetch,
      }),
    ).rejects.toThrow(RESULTS_LOAD_FAILURE_MESSAGE);
  });

  it('shows empty aggregate copy only in aggregate mode', async () => {
    const { RESULTS_EMPTY_AGGREGATE_MESSAGE, renderResultDisplay } =
      await loadResultPageModule();
    const root = createRoot();

    renderResultDisplay(root, {
      public_lifecycle_state: 'revealed',
      display_mode: 'rounded_with_bucketed_votes',
      total_votes_display: '',
      options: [],
    });

    expect(collectText(root).join(' ')).toContain(RESULTS_EMPTY_AGGREGATE_MESSAGE);
  });

  it('keeps aggregate mode display-safe fields for revealed lifecycle', async () => {
    const { renderResultDisplay } = await loadResultPageModule();
    const root = createRoot();

    renderResultDisplay(root, {
      public_lifecycle_state: 'revealed',
      display_mode: 'rounded_with_bucketed_votes',
      total_votes_display: '100–499',
      options: [
        {
          display_label: '選項 A',
          display_percentage: '約 43%',
          display_count: '約 100–150 票',
        },
      ],
    });

    const text = collectText(root).join(' ');
    expect(text).toContain('100–499');
    expect(text).toContain('約 43%');
    expect(text).toContain('約 100–150 票');
  });

  it('keeps result-page copy free of internal identifiers and personal vote state', async () => {
    const source = await readFile(
      join(process.cwd(), 'public/frontend/result-page.js'),
      'utf8',
    );

    expect(source).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    expect(source).not.toMatch(FORBIDDEN_INTERNAL_COPY);
    expect(source).not.toMatch(/messageForPollLoadFailure/);
    expect(source).toContain('messageForResultLoadFailure');
    expect(source).not.toMatch(/不代表投票失敗|若你剛完成投票/);
  });
});
