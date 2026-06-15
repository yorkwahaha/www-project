import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_240_DOC =
  'docs/www-project-phase-240-public-poll-unavailable-state-presentation-polish-v1.md';

const TOUCHED_MODULES = [
  'public/frontend/public-unavailable-state.js',
  'public/frontend/public-mvp-ui.js',
  'public/frontend/explore-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/result-page.js',
  'public/frontend/vote-page.js',
  'public/frontend/public-mvp.css',
  'public/explore.html',
] as const;

const FORBIDDEN_BACKEND_ECHO =
  /error\.message|body\.message|apiError\.message|response\.text\(\)|JSON\.stringify\(error/i;

const FORBIDDEN_DEBUG_LEAKAGE =
  /request_id|requestId|trace_id|traceId|stack trace|internal code|error_code/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function createDocumentStub() {
  const documentObject = {
    createElement(tagName: string) {
      return {
        tagName,
        className: '',
        textContent: '',
        href: '',
        hidden: false,
        ownerDocument: documentObject,
        children: [] as Array<ReturnType<typeof documentObject.createElement>>,
        attributes: new Map<string, string>(),
        setAttribute(name: string, value: string) {
          this.attributes.set(name, value);
        },
        replaceChildren() {
          this.children = [];
        },
        append(child: ReturnType<typeof documentObject.createElement>) {
          this.children.push(child);
        },
      };
    },
  };
  return documentObject;
}

function collectText(node: {
  textContent: string;
  children: Array<{ textContent: string; children?: unknown[] }>;
}): string {
  return [
    node.textContent,
    ...node.children.flatMap((child) => collectText(child as typeof node)),
  ].join(' ');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 240 public poll unavailable state presentation polish', () => {
  it('documents Phase 240 in README and phase doc', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_240_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 240');
    expect(doc).toContain('Public Poll Unavailable State Presentation Polish');
    expect(doc).toContain('PUBLIC_UNAVAILABLE_STATE_LAYOUT_ORDER');
    expect(readme).toContain('Phase 240');
    expect(readme).toContain(PHASE_240_DOC);
  });

  it('exports shared unavailable state layout helpers', async () => {
    const unavailable = await loadModule('public/frontend/public-unavailable-state.js');

    expect(unavailable.PUBLIC_UNAVAILABLE_STATE_LAYOUT_ORDER).toEqual([
      'title',
      'message',
      'summary',
      'cta',
    ]);

    const documentObject = createDocumentStub();
    const emptyHost = documentObject.createElement('div');
    unavailable.renderPublicEmptyStatePanel(documentObject, emptyHost, {
      message: '目前沒有可瀏覽的公開問卷。',
      summary: '請稍後再回來看看，或建立一則新問卷。',
      ctaHref: '/polls/new?live=1',
      ctaLabel: '建立問卷',
    });
    expect(emptyHost.className).toContain('mvp-public-empty-state');
    expect(collectText(emptyHost)).toContain('目前沒有可瀏覽的公開問卷。');

    const failureHost = documentObject.createElement('div');
    unavailable.renderPublicLoadFailurePanel(documentObject, failureHost, {
      title: '無法載入探索列表',
      message: '目前無法載入探索列表，請稍後再試。',
      ctaHref: '/',
      ctaLabel: '返回首頁',
    });
    expect(failureHost.className).toContain('mvp-public-load-failure');
    expect(collectText(failureHost)).toContain('無法載入探索列表');
  });

  it('keeps public-mvp-ui error panels on shared helpers', async () => {
    const uiSource = await readFile(join(process.cwd(), 'public/frontend/public-mvp-ui.js'), 'utf8');
    expect(uiSource).toContain("from './public-unavailable-state.js'");
    expect(uiSource).toContain('renderPublicLoadFailurePanel');
  });

  it('unifies explore empty and load failure presentation', async () => {
    const explore = await loadModule('public/frontend/explore-page.js');
    const exploreSource = await readFile(
      join(process.cwd(), 'public/frontend/explore-page.js'),
      'utf8',
    );
    const exploreHtml = await readFile(join(process.cwd(), 'public/explore.html'), 'utf8');
    const documentObject = createDocumentStub();
    const emptyPanel = documentObject.createElement('div');
    emptyPanel.id = 'explore-empty';
    emptyPanel.replaceChildren = function replaceChildren() {
      this.children = [];
    };
    const documentWithEmpty = {
      ...documentObject,
      getElementById(id: string) {
        return id === 'explore-empty' ? emptyPanel : null;
      },
    };

    explore.syncExploreEmptyStatePanel(documentWithEmpty);

    expect(exploreSource).toContain('renderPublicEmptyStatePanel');
    expect(exploreSource).toContain('renderPublicLoadFailurePanel');
    expect(exploreSource).toContain('PUBLIC_EXPLORE_LOAD_ERROR_TITLE');
    expect(exploreSource).not.toMatch(/errorPanel\.textContent\s*=\s*message/);
    expect(exploreHtml).toContain('id="explore-empty"');
    expect(exploreHtml).toContain('mvp-empty-state');
    expect(collectText(emptyPanel)).toContain('目前沒有可瀏覽的公開問卷。');
  });

  it('unifies my-polls empty and load failure presentation', async () => {
    const myPollsSource = await readFile(
      join(process.cwd(), 'public/frontend/my-polls-page.js'),
      'utf8',
    );

    expect(myPollsSource).toContain('renderPublicEmptyStatePanel');
    expect(myPollsSource).toContain('renderPublicInlineErrorNote');
  });

  it('keeps results unavailable block without aggregate leakage', async () => {
    const resultPage = await loadModule('public/frontend/result-page.js');
    const resultSource = await readFile(
      join(process.cwd(), 'public/frontend/result-page.js'),
      'utf8',
    );
    const documentObject = createDocumentStub();
    const root = documentObject.createElement('div');

    resultPage.renderUnavailableStatusBlock(root, {
      lifecycleState: 'cancelled',
      userMessage: '此問卷已取消，無法查看公開結果。',
    });

    const serialized = JSON.stringify(root);
    expect(resultSource).toContain('renderPublicUnavailableStatusBlock');
    expect(serialized).toContain('此問卷已取消');
    expect(serialized).toContain('不顯示總票數');
    expect(serialized).not.toMatch(/%|vote_count|option_id|raw_count/i);
  });

  it('keeps resolvePublicErrorUserMessage from echoing foreign errors', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const message = ui.resolvePublicErrorUserMessage(
      new Error('POLL_NOT_FOUND internal trace_id=abc'),
      ui.PUBLIC_RESULTS_LOAD_FAILURE_MESSAGE,
      ui.PUBLIC_POLL_LOAD_USER_MESSAGES,
    );
    expect(message).toBe(ui.PUBLIC_RESULTS_LOAD_FAILURE_MESSAGE);
    expect(message).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
  });

  it('keeps vote load failure panel and vote-by-index boundaries', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const voteSource = await readFile(join(process.cwd(), 'public/frontend/vote-page.js'), 'utf8');
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({
        vote_token: 'secret-token',
        option_id: 'secret-option',
        shard_id: 7,
      }),
    }));

    expect(voteSource).toContain('renderPublicErrorPanel');
    expect(voteSource).toContain('resolvePublicErrorUserMessage');

    await votePage.submitVoteByIndex({
      pollId: '11111111-1111-4111-8111-111111111111',
      optionIndex: 1,
      userId: '44444444-4444-4444-8444-444444444444',
      fetchImpl,
    });
    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ option_index: 1 });
  });

  it('keeps touched runtime modules free of backend echo patterns', async () => {
    const runtimeModules = TOUCHED_MODULES.filter(
      (path) =>
        path.endsWith('.js') &&
        path !== 'public/frontend/public-mvp-ui.js',
    );
    for (const relativePath of runtimeModules) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_BACKEND_ECHO);
    }
  });

  it('keeps Official Vote transaction order unchanged', async () => {
    const repository = await readFile(join(process.cwd(), 'src/polls/repository.ts'), 'utf8');
    const transactionStart = repository.indexOf('async function castOfficialVote(');
    const transactionEnd = repository.indexOf('async function resolveOfficialVoteOptionIdWithClient');
    const transactionBody = repository.slice(transactionStart, transactionEnd);
    expect(transactionBody.indexOf('isProfileEligibleForOfficialVote')).toBeGreaterThan(-1);
    expect(transactionBody.indexOf('insertVoteToken')).toBeGreaterThan(
      transactionBody.indexOf('resolveOfficialVoteOptionIdWithClient'),
    );
    expect(repository).not.toContain('Phase 240');
  });
});
