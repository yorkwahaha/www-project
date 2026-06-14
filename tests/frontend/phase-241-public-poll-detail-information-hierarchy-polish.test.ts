import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const PHASE_241_DOC =
  'docs/www-project-phase-241-public-poll-detail-information-hierarchy-polish-v1.md';

const TOUCHED_MODULES = [
  'public/frontend/public-vote-detail-layout.js',
  'public/frontend/vote-page.js',
  'public/frontend/official-vote-pre-vote-hints.js',
  'public/frontend/public-mvp.css',
  'public/vote.html',
] as const;

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_BACKEND_ECHO =
  /error\.message|body\.message|apiError\.message|response\.text\(\)|JSON\.stringify\(error/i;

const FORBIDDEN_AGGREGATE_COPY = /總票數|百分比|option breakdown|raw_count/i;

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
  statusMeta.id = 'vote-detail-status-meta';
  elements.set('vote-detail-status-meta', statusMeta);

  const statusRow = createElement('div');
  statusRow.id = 'vote-detail-status-row';
  elements.set('vote-detail-status-row', statusRow);

  const metaLine = createElement('p');
  metaLine.id = 'vote-detail-meta-line';
  elements.set('vote-detail-meta-line', metaLine);

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

describe('Phase 241 public poll detail information hierarchy polish', () => {
  it('documents Phase 241 in README and phase doc', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_241_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 241');
    expect(readme).toContain('Phase 241');
    expect(readme).toContain(PHASE_241_DOC);
  });

  it('exports shared vote detail layout helpers', async () => {
    const layout = await loadModule('public/frontend/public-vote-detail-layout.js');

    expect(layout.PUBLIC_VOTE_DETAIL_LAYOUT_ORDER).toEqual([
      'title',
      'status-meta',
      'pre-vote-hints',
      'options',
      'action-area',
      'unavailable-panel',
    ]);

    expect(layout.buildVoteDetailMetaLine({
      category: 'life',
      closes_at: '2026-12-31T12:00:00.000Z',
    })).toMatch(/生活/);
    expect(layout.buildVoteDetailMetaLine({
      category: 'life',
      closes_at: '2026-12-31T12:00:00.000Z',
    })).toMatch(/截止/);
  });

  it('syncs lifecycle status badge and meta line without aggregate leakage', async () => {
    const layout = await loadModule('public/frontend/public-vote-detail-layout.js');
    const { documentObject, statusRow, metaLine, statusMeta } = createDocumentStub();

    layout.syncVoteDetailStatusMeta(documentObject, {
      public_lifecycle_state: 'collecting',
      category: 'general',
      closes_at: '2026-12-31T12:00:00.000Z',
      title: '示範問卷',
      description: '說明文字',
    });

    expect(statusMeta.hidden).toBe(false);
    expect(statusRow.hidden).toBe(false);
    expect(statusRow.children[0]?.textContent).toBe('收集中');
    expect(metaLine.hidden).toBe(false);
    expect(metaLine.textContent).toMatch(/一般/);
    expect(metaLine.textContent).not.toMatch(FORBIDDEN_AGGREGATE_COPY);
  });

  it('keeps vote.html regions in title → status/meta → pre-vote → action → unavailable order', async () => {
    const voteHtml = await readFile(join(process.cwd(), 'public/vote.html'), 'utf8');

    expect(voteHtml).toContain('class="mvp-vote-detail-header"');
    expect(voteHtml).toContain('id="vote-detail-status-meta"');
    expect(voteHtml).toContain('id="vote-detail-pre-vote-hints"');
    expect(voteHtml).toContain('id="vote-detail-action-area"');
    expect(voteHtml).toContain('class="mvp-vote-detail-unavailable"');
    expect(voteHtml).toContain('id="poll-title"');
    expect(voteHtml).toContain('id="official-vote-pre-vote-hint"');
    expect(voteHtml).toContain('id="poll-options"');
    expect(voteHtml).toContain('id="vote-submit"');
    expect(voteHtml).toContain('id="error-panel"');

    const titleIndex = indexOfRegion(voteHtml, 'id="poll-title"');
    const statusMetaIndex = indexOfRegion(voteHtml, 'id="vote-detail-status-meta"');
    const preVoteIndex = indexOfRegion(voteHtml, 'id="vote-detail-pre-vote-hints"');
    const actionIndex = indexOfRegion(voteHtml, 'id="vote-detail-action-area"');
    const unavailableIndex = indexOfRegion(voteHtml, 'id="error-panel"');

    expect(titleIndex).toBeLessThan(statusMetaIndex);
    expect(statusMetaIndex).toBeLessThan(preVoteIndex);
    expect(preVoteIndex).toBeLessThan(actionIndex);
    expect(actionIndex).toBeLessThan(unavailableIndex);
  });

  it('wires vote-page.js to shared status/meta sync', async () => {
    const voteSource = await readFile(
      join(process.cwd(), 'public/frontend/vote-page.js'),
      'utf8',
    );
    expect(voteSource).toContain("from './public-vote-detail-layout.js'");
    expect(voteSource).toContain('syncVoteDetailStatusMeta');
    expect(voteSource).toContain('mountQualityFeedbackBadgeNearTitle');
    expect(voteSource).toContain('option_index');
    expect(voteSource).not.toMatch(FORBIDDEN_OUTCOME_COPY);
  });

  it('mounts official pre-vote hint into pre-vote hints region when present', async () => {
    const hintsSource = await readFile(
      join(process.cwd(), 'public/frontend/official-vote-pre-vote-hints.js'),
      'utf8',
    );
    expect(hintsSource).toContain('vote-detail-pre-vote-hints');
  });

  it('keeps pre-vote hints free of eligibility outcome claims', async () => {
    const hints = await loadModule('public/frontend/official-vote-pre-vote-hints.js');
    const hintsSource = stripJsComments(
      await readFile(
        join(process.cwd(), 'public/frontend/official-vote-pre-vote-hints.js'),
        'utf8',
      ),
    );

    expect(hints.PRE_VOTE_HINT_COPY.anonymous).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    expect(hints.PRE_VOTE_HINT_COPY.incompleteProfile).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    expect(hintsSource).toContain('/users/me/profile');
    expect(hintsSource).not.toMatch(FORBIDDEN_BACKEND_ECHO);
  });

  it('keeps touched runtime modules free of backend echo and aggregate leakage', async () => {
    for (const relativePath of TOUCHED_MODULES) {
      if (!relativePath.endsWith('.js')) {
        continue;
      }
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_BACKEND_ECHO);
      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }
  });

  it('keeps vote-by-index body unchanged', async () => {
    const voteSource = await readFile(
      join(process.cwd(), 'public/frontend/vote-page.js'),
      'utf8',
    );
    expect(voteSource).toContain("JSON.stringify({ option_index: optionIndex })");
    expect(voteSource).not.toContain('option_id');
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
    expect(repository).not.toContain('Phase 241');
  });
});
