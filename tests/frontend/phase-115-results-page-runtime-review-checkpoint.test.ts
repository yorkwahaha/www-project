import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const REVIEWED_RESULTS_FILES = [
  'public/frontend/result-page.js',
  'public/results.html',
];

const FORBIDDEN_OUTCOME_COPY =
  /你投過|你尚未投票|你符合資格|你不符合資格|已投過票|選擇了|投給哪個|若你剛完成投票|不代表投票失敗|年齡門檻|地區條件|trust rule|role rule/i;

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

describe('Phase 115 results page runtime review checkpoint', () => {
  it('shows display-safe aggregate only for revealed lifecycle', async () => {
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
    expect(text).not.toMatch(FORBIDDEN_INTERNAL_COPY);
  });

  it.each([
    'locked',
    'post_lock',
  ] as const)('keeps %s lifecycle in aggregate mode', async (lifecycle) => {
    const { resolveResultRenderMode } = await loadResultPageModule();
    expect(
      resolveResultRenderMode({
        public_lifecycle_state: lifecycle,
        options: [{ display_label: '選項 A', display_percentage: '約 10%' }],
      }),
    ).toBe('aggregate');
  });

  it('keeps collecting counter-free with Phase 113 copy', async () => {
    const {
      RESULTS_COLLECTING_TITLE,
      RESULTS_COLLECTING_SUMMARY,
      renderResultDisplay,
    } = await loadResultPageModule();
    const root = createRoot();

    renderResultDisplay(root, {
      public_lifecycle_state: 'collecting',
      total_votes_display: '收集中',
      options: [{ display_label: '選項甲' }],
    });

    const text = collectText(root).join(' ');
    expect(text).toContain(RESULTS_COLLECTING_TITLE);
    expect(text).toContain(RESULTS_COLLECTING_SUMMARY);
    expect(text).not.toMatch(/狀態：|0\s*票|0%|約\s*\d+%/);
    expect(text).not.toMatch(FORBIDDEN_OUTCOME_COPY);
  });

  it('keeps cancelled and unpublished counter-free with lifecycle-owned copy', async () => {
    const {
      RESULTS_CANCELLED_TITLE,
      RESULTS_CANCELLED_MESSAGE,
      RESULTS_UNPUBLISHED_TITLE,
      RESULTS_UNPUBLISHED_MESSAGE,
      renderResultDisplay,
    } = await loadResultPageModule();

    for (const [lifecycle, title, message] of [
      ['cancelled', RESULTS_CANCELLED_TITLE, RESULTS_CANCELLED_MESSAGE],
      ['unpublished', RESULTS_UNPUBLISHED_TITLE, RESULTS_UNPUBLISHED_MESSAGE],
    ] as const) {
      const root = createRoot();
      renderResultDisplay(root, {
        public_lifecycle_state: lifecycle,
        user_message: `raw backend ${lifecycle} detail with option_id secret`,
        options: [
          {
            display_label: '選項 A',
            display_percentage: '約 99%',
            display_count: '999 票',
          },
        ],
      });

      const text = collectText(root).join(' ');
      expect(text).toContain(title);
      expect(text).toContain(message);
      expect(text).not.toContain(`raw backend ${lifecycle} detail`);
      expect(text).not.toMatch(/約\s*99%|999\s*票/);
    }
  });

  it('maps poll unavailable and load failures to neutral copy without echoing payloads', async () => {
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
    await expect(
      loadResultDisplay({
        pollId: '11111111-1111-4111-8111-111111111111',
        fetchImpl: unavailableFetch,
      }),
    ).rejects.not.toThrow(/option_id|Poll not found/i);

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

  it('shows empty aggregate copy in aggregate mode', async () => {
    const { RESULTS_EMPTY_AGGREGATE_MESSAGE, renderResultDisplay } =
      await loadResultPageModule();
    const root = createRoot();

    renderResultDisplay(root, {
      public_lifecycle_state: 'revealed',
      total_votes_display: '',
      options: [],
    });

    expect(collectText(root).join(' ')).toContain(RESULTS_EMPTY_AGGREGATE_MESSAGE);
  });

  it('keeps results runtime away from vote/profile paths and observability sinks', async () => {
    const source = await readFile(
      join(process.cwd(), 'public/frontend/result-page.js'),
      'utf8',
    );

    expect(source).toContain('/polls/');
    expect(source).toContain('/results');
    expect(source).not.toMatch(
      /\/users\/me|users\/me\/profile|vote-by-index|reference-answer|localStorage|sessionStorage|indexedDB|navigator\.sendBeacon|console\.|analytics|apm\.|trace\./i,
    );
  });

  for (const relativePath of REVIEWED_RESULTS_FILES) {
    it(`keeps reviewed results copy neutral in ${relativePath}`, async () => {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');

      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(source, relativePath).not.toMatch(FORBIDDEN_INTERNAL_COPY);
    });
  }

  it('keeps Phase 115 user-visible messages free of forbidden internals', async () => {
    const resultPage = await loadResultPageModule();
    const userVisibleMessages = [
      resultPage.RESULTS_COLLECTING_TITLE,
      resultPage.RESULTS_COLLECTING_SUMMARY,
      resultPage.RESULTS_CANCELLED_TITLE,
      resultPage.RESULTS_CANCELLED_MESSAGE,
      resultPage.RESULTS_UNPUBLISHED_TITLE,
      resultPage.RESULTS_UNPUBLISHED_MESSAGE,
      resultPage.RESULTS_POLL_UNAVAILABLE_MESSAGE,
      resultPage.RESULTS_EMPTY_AGGREGATE_MESSAGE,
      resultPage.RESULTS_LOAD_FAILURE_MESSAGE,
    ];

    for (const message of userVisibleMessages) {
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }
  });
});
