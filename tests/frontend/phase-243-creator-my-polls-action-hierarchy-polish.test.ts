import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_243_DOC =
  'docs/www-project-phase-243-creator-my-polls-action-hierarchy-polish-v1.md';

const TOUCHED_MODULES = [
  'public/frontend/public-creator-owned-poll-layout.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/poll-lifecycle-controls.js',
  'public/frontend/public-mvp.css',
] as const;

const FORBIDDEN_BACKEND_ECHO =
  /error\.message|body\.message|apiError\.message|response\.text\(\)|JSON\.stringify\(error/i;

const FORBIDDEN_AGGREGATE =
  /raw_count|poll_option_vote_counters|hidden aggregate|option breakdown/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 243 creator my polls action hierarchy polish', () => {
  it('documents Phase 243 in README and phase doc', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_243_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 243');
    expect(readme).toContain('Phase 243');
    expect(readme).toContain(PHASE_243_DOC);
  });

  it('exports shared creator owned poll action layout helpers', async () => {
    const layout = await loadModule('public/frontend/public-creator-owned-poll-layout.js');

    expect(layout.PUBLIC_CREATOR_OWNED_POLL_ACTION_LAYOUT_ORDER).toEqual([
      'title-status-meta',
      'lifecycle-hint',
      'primary-actions',
      'secondary-actions',
      'destructive-actions',
      'nav-links',
      'inline-feedback',
    ]);

    expect(layout.lifecycleActionGroupForTransition('close')).toBe('primary');
    expect(layout.lifecycleActionGroupForTransition('cancel')).toBe('destructive');
    expect(layout.lifecycleActionGroupForTransition('unpublish')).toBe('destructive');
  });

  it('creates grouped action slots in fixed order', async () => {
    const layout = await loadModule('public/frontend/public-creator-owned-poll-layout.js');
    const documentObject = {
      createElement(tagName: string) {
        const element = {
          tagName,
          className: '',
          textContent: '',
          children: [] as Array<ReturnType<typeof documentObject.createElement>>,
          append(child: ReturnType<typeof documentObject.createElement>) {
            this.children.push(child);
          },
          setAttribute() {},
        };
        return element;
      },
    };

    const slots = layout.createCreatorOwnedPollActionArea(documentObject);
    expect(slots.area.className).toContain('mvp-creator-owned-poll-action-area');
    expect(slots.hint.className).toContain('mvp-creator-owned-poll-lifecycle-hint');
    expect(slots.primary.className).toContain('mvp-creator-owned-poll-primary-actions');
    expect(slots.secondary.className).toContain('mvp-creator-owned-poll-secondary-actions');
    expect(slots.destructive.className).toContain('mvp-creator-owned-poll-destructive-actions');
    expect(slots.navLinks.className).toContain('mvp-creator-owned-poll-nav-links');
    expect(slots.feedback.className).toContain('mvp-creator-owned-poll-feedback');

    const childOrder = slots.area.children.map((child) => child.className);
    expect(childOrder[0]).toContain('lifecycle-hint');
    expect(childOrder[1]).toContain('primary-actions');
    expect(childOrder[2]).toContain('secondary-actions');
    expect(childOrder[3]).toContain('destructive-actions');
    expect(childOrder[4]).toContain('nav-links');
    expect(childOrder[5]).toContain('feedback');
  });

  it('wires my-polls live owned poll render to grouped action hosts', async () => {
    const myPollsSource = await readFile(
      join(process.cwd(), 'public/frontend/my-polls-page.js'),
      'utf8',
    );

    expect(myPollsSource).toContain("from './public-creator-owned-poll-layout.js'");
    expect(myPollsSource).toContain('createCreatorOwnedPollActionArea');
    expect(myPollsSource).toContain('buildCreatorOwnedPollHeader');
    expect(myPollsSource).toContain('actionLayoutHosts: actionSlots');
    expect(myPollsSource).toContain('actionSlots.secondary.append(shareVote)');
    expect(myPollsSource).toContain('renderCreatorManageLinks(actionSlots.navLinks');
    expect(myPollsSource).not.toMatch(FORBIDDEN_AGGREGATE);
  });

  it('groups lifecycle actions into primary and destructive hosts without API changes', async () => {
    const lifecycle = await loadModule('public/frontend/poll-lifecycle-controls.js');
    const lifecycleSource = await readFile(
      join(process.cwd(), 'public/frontend/poll-lifecycle-controls.js'),
      'utf8',
    );

    expect(lifecycle.lifecycleActionPresentationGroup('close')).toBe('primary');
    expect(lifecycle.lifecycleActionPresentationGroup('cancel')).toBe('destructive');
    expect(lifecycleSource).toContain('actionLayoutHosts');
    expect(lifecycleSource).toContain('confirmLifecycleTransition');
    expect(lifecycleSource).toContain('postPollLifecycleTransition');
    expect(lifecycleSource).toContain('lifecycleActionPresentationGroup');
  });

  it('places close before cancel in grouped collecting layout', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false));
    const { renderCreatorLifecycleActions } = await loadModule(
      'public/frontend/poll-lifecycle-controls.js',
    );

    const slots = {
      hint: makeHost(),
      primary: makeHost('mvp-creator-owned-poll-primary-actions'),
      secondary: makeHost('mvp-creator-owned-poll-secondary-actions'),
      destructive: makeHost('mvp-creator-owned-poll-destructive-actions'),
      navLinks: makeHost('mvp-creator-owned-poll-nav-links'),
      feedback: makeHost('mvp-creator-owned-poll-feedback'),
    };
    const area = makeHost('mvp-creator-owned-poll-action-area');

    renderCreatorLifecycleActions(area, {
      pollId: '22222222-2222-4222-8222-222222222222',
      lifecycleState: 'collecting',
      showPanelTitle: false,
      actionLayoutHosts: slots,
      fetchImpl: vi.fn(),
    });

    expect(slots.primary.children.map(buttonLabel)).toEqual(['結束收集並公開結果']);
    expect(slots.destructive.children.map(buttonLabel)).toEqual(['取消問卷']);
    vi.unstubAllGlobals();
  });

  it('keeps default lifecycle toolbar behavior for non-grouped hosts', async () => {
    const { renderCreatorLifecycleActions } = await loadModule(
      'public/frontend/poll-lifecycle-controls.js',
    );
    const host = makeHost('mvp-creator-lifecycle-panel');

    renderCreatorLifecycleActions(host, {
      pollId: '22222222-2222-4222-8222-222222222222',
      lifecycleState: 'collecting',
      fetchImpl: vi.fn(),
    });

    const toolbar = host.children.find((child) =>
      String(child.className).includes('mvp-creator-lifecycle-toolbar'),
    );
    expect(toolbar?.children
      .filter((child) => String(child.tagName).toLowerCase() === 'button')
      .map(buttonLabel)).toEqual([
      '取消問卷',
      '結束收集並公開結果',
    ]);
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
      expect(source, relativePath).not.toMatch(FORBIDDEN_AGGREGATE);
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
    expect(repository).not.toContain('Phase 243');
  });
});

function makeHost(className = '') {
  let documentObject: {
    createElement(tagName: string): HostNode;
  };
  function createElement(tagName: string): HostNode {
    const element: HostNode = {
      tagName,
      ownerDocument: documentObject,
      className: className,
      textContent: '',
      hidden: false,
      children: [],
      append(child: HostNode) {
        this.children.push(child);
      },
      replaceChildren() {
        this.children = [];
      },
      setAttribute() {},
      addEventListener() {},
      querySelector() {
        return null;
      },
    };
    return element;
  }
  documentObject = { createElement };
  return createElement('section');
}

type HostNode = {
  tagName: string;
  ownerDocument: { createElement(tagName: string): HostNode };
  className: string;
  textContent: string;
  hidden: boolean;
  children: HostNode[];
  append(child: HostNode): void;
  replaceChildren(): void;
  setAttribute(name: string, value: string): void;
  addEventListener(type: string, handler: () => void): void;
  querySelector(selector: string): HostNode | null;
};

function buttonLabel(node: HostNode) {
  return node.textContent;
}
