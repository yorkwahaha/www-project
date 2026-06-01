import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

async function loadPolicyUiMockModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/policy-ui-placeholders.js'),
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
      prepend(child: ReturnType<typeof createElement>) {
        this.children.unshift(child);
      },
      append(child: ReturnType<typeof createElement>) {
        this.children.push(child);
      },
      replaceChildren() {
        this.children = [];
      },
      setAttribute() {},
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

const apiCollecting = {
  display_mode: 'collecting',
  total_votes_display: '收集中',
  collecting: true,
  options: [
    {
      option_index: 0,
      display_label: '選項甲',
      display_count: null,
      display_percentage: null,
    },
  ],
};

const apiRevealed = {
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
};

describe('policy ui mock state', () => {
  it('parses only known ui_state query values', async () => {
    const { parseUiMockState, VALID_UI_MOCK_STATES } =
      await loadPolicyUiMockModule();

    expect(VALID_UI_MOCK_STATES).toContain('collecting');
    expect(parseUiMockState('?ui_state=collecting')).toBe('collecting');
    expect(parseUiMockState('?ui_state=cancelled')).toBe('cancelled');
    expect(parseUiMockState('?ui_state=unknown')).toBeNull();
    expect(parseUiMockState('')).toBeNull();
  });

  it('forces collecting preview payload to hide counts', async () => {
    const { toCollectingPreviewPayload } = await loadPolicyUiMockModule();
    const payload = toCollectingPreviewPayload(apiRevealed);

    expect(payload.collecting).toBe(true);
    expect(payload.total_votes_display).toBe('收集中');
    expect(payload.options[0].display_count).toBeNull();
    expect(payload.options[0].display_percentage).toBeNull();
  });

  it('labels revealed preview payload as demo-only', async () => {
    const { toRevealedPreviewPayload } = await loadPolicyUiMockModule();
    const payload = toRevealedPreviewPayload(apiCollecting);

    expect(payload.collecting).toBe(false);
    expect(payload.total_votes_display).toMatch(/範例/);
    expect(payload.options[0].display_percentage).toMatch(/範例/);
  });

  it('renders cancelled terminal state without vote aggregates', async () => {
    const { renderMockTerminalResultState } = await loadPolicyUiMockModule();
    const root = createRoot();

    renderMockTerminalResultState(root, 'cancelled');

    const text = collectText(root).join(' ');
    expect(text).toMatch(/取消/);
    expect(text).toMatch(/不會產生公開彙總結果/);
    expect(text).not.toMatch(/0\s*票|0%/);
  });

  it('renders unpublished terminal state with required wording', async () => {
    const { renderMockTerminalResultState } = await loadPolicyUiMockModule();
    const root = createRoot();

    renderMockTerminalResultState(root, 'unpublished');

    const text = collectText(root).join(' ');
    expect(text).toContain('此問卷已結束公開鎖定期，並由發起者下架。');
  });

  it('renders followed mock chip and demo-only notification note', async () => {
    const { renderUiMockStatePanel } = await loadPolicyUiMockModule();
    const root = createRoot();

    renderUiMockStatePanel(root, 'followed');

    const text = collectText(root).join(' ');
    expect(text).toMatch(/已關注結果/);
    expect(text).toMatch(/站內通知/);
    expect(text).toMatch(/範例|尚未開放|登入與通知/);
  });

  it('skips glossary aside when skipGlossary is true', async () => {
    const { renderResultPagePolicyExtras } = await loadPolicyUiMockModule();
    const root = createRoot();

    renderResultPagePolicyExtras(root, {
      collecting: false,
      skipGlossary: true,
      skipFollowPanel: true,
    });

    const text = collectText(root).join(' ');
    expect(text).not.toMatch(/名詞對照/);
  });

  it('renders preview banner marked as non-persistent', async () => {
    const { renderUiMockPreviewBanner } = await loadPolicyUiMockModule();
    const root = createRoot();

    renderUiMockPreviewBanner(root, 'ineligible');

    const text = collectText(root).join(' ');
    expect(text).toMatch(/範例資料|不代表真實問卷/);
    expect(text).toMatch(/不符合資格/);
  });
});
