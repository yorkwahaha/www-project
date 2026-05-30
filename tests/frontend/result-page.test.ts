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
