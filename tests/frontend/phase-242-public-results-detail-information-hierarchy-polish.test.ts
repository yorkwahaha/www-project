import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const PHASE_242_DOC =
  'docs/www-project-phase-242-public-results-detail-information-hierarchy-polish-v1.md';

const TOUCHED_MODULES = [
  'public/frontend/public-results-detail-layout.js',
  'public/frontend/result-page.js',
  'public/frontend/public-mvp.css',
  'public/results.html',
] as const;

const FORBIDDEN_BACKEND_ECHO =
  /error\.message|body\.message|apiError\.message|response\.text\(\)|JSON\.stringify\(error/i;

const FORBIDDEN_HIDDEN_AGGREGATE =
  /raw_count|poll_option_vote_counters|demographic|profile breakdown/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function createDocumentStub() {
  const elements = new Map<string, ReturnType<typeof createElement>>();
  function createElement(tagName: string) {
    const element = {
      tagName,
      id: '',
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
    return element;
  }

  const documentObject = {
    createElement,
    getElementById(id: string) {
      return elements.get(id) ?? null;
    },
  };

  const statusMeta = createElement('section');
  statusMeta.id = 'results-detail-status-meta';
  elements.set('results-detail-status-meta', statusMeta);

  const statusRow = createElement('div');
  statusRow.id = 'results-detail-status-row';
  elements.set('results-detail-status-row', statusRow);

  const metaLine = createElement('p');
  metaLine.id = 'results-detail-meta-line';
  elements.set('results-detail-meta-line', metaLine);

  return { documentObject, statusRow, metaLine, statusMeta };
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

function indexOfRegion(html: string, marker: string) {
  const index = html.indexOf(marker);
  expect(index).toBeGreaterThanOrEqual(0);
  return index;
}

describe('Phase 242 public results detail information hierarchy polish', () => {
  it('documents Phase 242 in README and phase doc', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_242_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 242');
    expect(readme).toContain('Phase 242');
    expect(readme).toContain(PHASE_242_DOC);
  });

  it('exports shared results detail layout helpers', async () => {
    const layout = await loadModule('public/frontend/public-results-detail-layout.js');

    expect(layout.PUBLIC_RESULTS_DETAIL_LAYOUT_ORDER).toEqual([
      'title',
      'status-meta',
      'visibility-hints',
      'result-content',
      'unavailable-panel',
      'navigation-cta',
    ]);

    expect(
      layout.buildResultsDetailMetaLine({
        public_lifecycle_state: 'revealed',
        updated_display: '最近更新',
      }),
    ).toBe('最近更新');

    expect(
      layout.buildResultsDetailMetaLine({
        public_lifecycle_state: 'collecting',
        updated_display: '最近更新',
      }),
    ).toBe('');
  });

  it('syncs lifecycle status badge and hides meta for collecting state', async () => {
    const layout = await loadModule('public/frontend/public-results-detail-layout.js');
    const { documentObject, statusRow, metaLine, statusMeta } = createDocumentStub();

    layout.syncResultsDetailStatusMeta(documentObject, {
      public_lifecycle_state: 'collecting',
      updated_display: '最近更新',
    });

    expect(statusMeta.hidden).toBe(false);
    expect(statusRow.hidden).toBe(false);
    expect(statusRow.children[0]?.textContent).toBe('收集中');
    expect(metaLine.hidden).toBe(true);
    expect(metaLine.textContent).toBe('');
  });

  it('keeps results.html regions in title → status/meta → visibility → content → unavailable → nav order', async () => {
    const resultsHtml = await readFile(join(process.cwd(), 'public/results.html'), 'utf8');

    expect(resultsHtml).toContain('class="mvp-results-detail-header"');
    expect(resultsHtml).toContain('id="results-detail-status-meta"');
    expect(resultsHtml).toContain('id="results-detail-visibility-hints"');
    expect(resultsHtml).toContain('id="results-detail-content"');
    expect(resultsHtml).toContain('class="mvp-results-detail-unavailable"');
    expect(resultsHtml).toContain('class="results-intro"');
    expect(resultsHtml).toContain('id="result-display"');
    expect(resultsHtml).toContain('id="bottom-nav"');

    const titleIndex = indexOfRegion(resultsHtml, 'id="page-title"');
    const statusMetaIndex = indexOfRegion(resultsHtml, 'id="results-detail-status-meta"');
    const visibilityIndex = indexOfRegion(resultsHtml, 'id="results-detail-visibility-hints"');
    const contentIndex = indexOfRegion(resultsHtml, 'id="results-detail-content"');
    const unavailableIndex = indexOfRegion(resultsHtml, 'id="error-panel"');
    const navIndex = indexOfRegion(resultsHtml, 'id="bottom-nav"');

    expect(titleIndex).toBeLessThan(statusMetaIndex);
    expect(statusMetaIndex).toBeLessThan(visibilityIndex);
    expect(visibilityIndex).toBeLessThan(contentIndex);
    expect(contentIndex).toBeLessThan(unavailableIndex);
    expect(unavailableIndex).toBeLessThan(navIndex);
  });

  it('wires result-page.js to shared status/meta sync without evaluator changes', async () => {
    const resultSource = await readFile(
      join(process.cwd(), 'public/frontend/result-page.js'),
      'utf8',
    );

    expect(resultSource).toContain("from './public-results-detail-layout.js'");
    expect(resultSource).toContain('syncResultsDetailStatusMeta');
    expect(resultSource).toContain('normalizeDisplaySafeResult');
    expect(resultSource).toContain('resolveResultRenderMode');
    expect(resultSource).toContain('mountQualityFeedbackBadgeNearTitle');
    expect(resultSource).not.toMatch(FORBIDDEN_BACKEND_ECHO);
  });

  it('keeps collecting and unavailable render modes free of hidden aggregate in status meta', async () => {
    const layout = await loadModule('public/frontend/public-results-detail-layout.js');
    const resultPage = await loadModule('public/frontend/result-page.js');

    for (const payload of [
      { public_lifecycle_state: 'collecting', total_votes_display: '收集中' },
      { public_lifecycle_state: 'cancelled', total_votes_display: '結果不可用' },
      { public_lifecycle_state: 'unpublished', total_votes_display: '結果不可用' },
    ]) {
      expect(layout.buildResultsDetailMetaLine(payload)).toBe('');
    }

    const collecting = resultPage.normalizeDisplaySafeResult({
      public_lifecycle_state: 'collecting',
      total_votes_display: '收集中',
      options: [{ display_label: 'A' }],
    });
    expect(collecting?.mode).toBe('collecting');

    const unavailable = resultPage.normalizeDisplaySafeResult({
      public_lifecycle_state: 'cancelled',
      options: [],
    });
    expect(unavailable?.mode).toBe('unavailable');
  });

  it('keeps aggregate render path using existing display-safe fields only', async () => {
    const resultPage = await loadModule('public/frontend/result-page.js');
    const resultSource = await readFile(
      join(process.cwd(), 'public/frontend/result-page.js'),
      'utf8',
    );

    const normalized = resultPage.normalizeDisplaySafeResult({
      public_lifecycle_state: 'revealed',
      total_votes_display: '100–499',
      updated_display: '最近更新',
      options: [
        {
          display_label: '選項 A',
          display_percentage: '52%',
          display_count: '120',
        },
      ],
    });

    expect(normalized?.mode).toBe('aggregate');
    expect(normalized?.total_votes_display).toBe('100–499');
    expect(resultSource).toContain('option.display_percentage');
    expect(resultSource).toContain('option.display_count');
    expect(resultSource).toContain('total_votes_display');
    expect(resultSource).not.toMatch(FORBIDDEN_HIDDEN_AGGREGATE);
  });

  it('keeps touched runtime modules free of backend echo patterns', async () => {
    for (const relativePath of TOUCHED_MODULES) {
      if (!relativePath.endsWith('.js')) {
        continue;
      }
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_BACKEND_ECHO);
      expect(source, relativePath).not.toMatch(FORBIDDEN_HIDDEN_AGGREGATE);
    }
  });

  it('keeps Official Vote transaction order unchanged in backend source', async () => {
    const repository = await readFile(join(process.cwd(), 'src/polls/repository.ts'), 'utf8');
    const transactionStart = repository.indexOf('async function castOfficialVote(');
    const transactionEnd = repository.indexOf('async function resolveOfficialVoteOptionIdWithClient');
    const transactionBody = repository.slice(transactionStart, transactionEnd);
    expect(transactionBody.indexOf('isProfileEligibleForOfficialVote')).toBeGreaterThan(-1);
    expect(transactionBody.indexOf('insertVoteToken')).toBeGreaterThan(
      transactionBody.indexOf('resolveOfficialVoteOptionIdWithClient'),
    );
    expect(repository).not.toContain('Phase 242');
  });
});
