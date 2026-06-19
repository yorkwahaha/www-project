import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const PHASE_309_DOC = 'docs/www-project-phase-309-results-reveal-animation-v1.md';
const RESULT_PAGE_JS = 'public/frontend/result-page.js';
const PUBLIC_MVP_CSS = 'public/frontend/public-mvp.css';

const displaySafeResult = {
  public_lifecycle_state: 'revealed',
  display_mode: 'rounded_with_bucketed_votes',
  total_votes_display: '100–499',
  collecting: false,
  options: [
    {
      display_label: '選項 A',
      display_percentage: '約 43%',
      display_count: '約 100–150 票',
    },
  ],
  updated_display: '最近更新',
};

async function loadResultPageModule() {
  const url = pathToFileURL(join(process.cwd(), RESULT_PAGE_JS)).href;
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
      classList: {
        tokens: new Set<string>(),
        add(token: string) {
          this.tokens.add(token);
        },
        remove(token: string) {
          this.tokens.delete(token);
        },
        contains(token: string) {
          return this.tokens.has(token);
        },
      },
      textContent: '',
      hidden: false,
      attributes: new Map<string, string>(),
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      },
      removeAttribute(name: string) {
        this.attributes.delete(name);
      },
      getAttribute(name: string) {
        return this.attributes.get(name) ?? null;
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
  const root = createElement('div');
  root.classList.add = root.classList.add.bind(root.classList);
  root.classList.remove = root.classList.remove.bind(root.classList);
  root.classList.contains = root.classList.contains.bind(root.classList);
  Object.defineProperty(root, 'className', {
    get() {
      return [...root.classList.tokens].join(' ');
    },
    set(value: string) {
      root.classList.tokens = new Set(String(value).split(/\s+/).filter(Boolean));
    },
  });
  return { root };
}

describe('Phase 309 results reveal animation (FU-304-02)', () => {
  it('documents Phase 309 in README and phase doc', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_309_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 309');
    expect(doc).toContain('FU-304-02');
    expect(readme).toContain(PHASE_309_DOC);
  });

  it('applies reveal markers only for aggregate render mode', async () => {
    const {
      RESULTS_AGGREGATE_REVEAL_CLASS,
      RESULTS_AGGREGATE_REVEAL_READY_ATTR,
      renderResultDisplay,
      shouldApplyResultsAggregateReveal,
    } = await loadResultPageModule();
    const { root } = createRoot();

    expect(shouldApplyResultsAggregateReveal('aggregate')).toBe(true);
    expect(shouldApplyResultsAggregateReveal('collecting')).toBe(false);
    expect(shouldApplyResultsAggregateReveal('unavailable')).toBe(false);

    renderResultDisplay(root, displaySafeResult);
    expect(root.classList.contains(RESULTS_AGGREGATE_REVEAL_CLASS)).toBe(true);
    expect(root.getAttribute(RESULTS_AGGREGATE_REVEAL_READY_ATTR)).toBe('true');

    renderResultDisplay(root, {
      public_lifecycle_state: 'collecting',
      display_mode: 'collecting',
      total_votes_display: '收集中',
      collecting: true,
      options: [{ display_label: '選項甲', display_percentage: null, display_count: null }],
    });
    expect(root.classList.contains(RESULTS_AGGREGATE_REVEAL_CLASS)).toBe(false);
    expect(root.getAttribute(RESULTS_AGGREGATE_REVEAL_READY_ATTR)).toBeNull();
  });

  it('keeps hidden lifecycle states free of reveal markers', async () => {
    const {
      RESULTS_AGGREGATE_REVEAL_CLASS,
      RESULTS_AGGREGATE_REVEAL_READY_ATTR,
      renderResultDisplay,
    } = await loadResultPageModule();
    const { root } = createRoot();

    renderResultDisplay(root, {
      public_lifecycle_state: 'cancelled',
      total_votes_display: '',
      options: [],
    });
    expect(root.classList.contains(RESULTS_AGGREGATE_REVEAL_CLASS)).toBe(false);
    expect(root.getAttribute(RESULTS_AGGREGATE_REVEAL_READY_ATTR)).toBeNull();
  });

  it('keeps reduced-motion handling in CSS only', async () => {
    const {
      RESULTS_AGGREGATE_REVEAL_READY_ATTR,
      syncResultsAggregateRevealPresentation,
    } = await loadResultPageModule();
    const { root } = createRoot();

    syncResultsAggregateRevealPresentation(root, 'aggregate');
    expect(root.getAttribute(RESULTS_AGGREGATE_REVEAL_READY_ATTR)).toBe('true');

    const source = await readFile(join(process.cwd(), RESULT_PAGE_JS), 'utf8');
    expect(source).not.toContain('requestAnimationFrame');
    expect(source).not.toMatch(/prefers-reduced-motion/);
  });

  it('ships reduced-motion CSS guards for results reveal animation', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');
    const phase309 = css.slice(css.indexOf('Phase 309'));

    expect(phase309).toContain('results-aggregate-reveal');
    expect(phase309).toContain('@keyframes results-aggregate-reveal-in');
    expect(phase309).toContain('data-results-reveal-ready');
    expect(phase309).toContain('@media (prefers-reduced-motion: reduce)');
    expect(phase309).toContain('animation: none !important');
  });

  it('does not change results API fetch path or aggregate payload contract', async () => {
    const source = await readFile(join(process.cwd(), RESULT_PAGE_JS), 'utf8');

    expect(source).toContain("`/polls/${encodeURIComponent(pollId)}/results`");
    expect(source).not.toContain('option_id');
    expect(source).not.toMatch(/fetchImpl\([^)]*\/home\/feed/);
    expect(source).not.toMatch(/fetchImpl\([^)]*\/polls\/feed/);
  });
});
