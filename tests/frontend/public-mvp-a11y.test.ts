import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

async function loadPublicMvpUiModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/public-mvp-ui.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function loadCreatePollPageModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/create-poll-page.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function loadVotePageModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/vote-page.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function loadLayoutModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/public-mvp-layout.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function loadShareLinkLayoutModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/public-share-link-layout.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

function createSubmitButton() {
  return {
    disabled: false,
    textContent: '建立問卷',
    attributes: new Map<string, string>(),
    setAttribute(name: string, value: string) {
      this.attributes.set(name, value);
    },
  };
}

describe('public MVP accessibility', () => {
  it('exposes live status regions on public HTML shells', async () => {
    const createPage = await readFile(join(process.cwd(), 'public/create-poll.html'), 'utf8');
    const votePage = await readFile(join(process.cwd(), 'public/vote.html'), 'utf8');
    const resultsPage = await readFile(join(process.cwd(), 'public/results.html'), 'utf8');
    const explorePage = await readFile(join(process.cwd(), 'public/explore.html'), 'utf8');
    const faqPage = await readFile(join(process.cwd(), 'public/faq.html'), 'utf8');
    const trustPage = await readFile(join(process.cwd(), 'public/trust-levels.html'), 'utf8');
    const loginPage = await readFile(join(process.cwd(), 'public/login.html'), 'utf8');

    expect(loginPage).toContain('skip-link');
    expect(loginPage).toContain('id="main-content"');
    expect(loginPage).toContain('role="status"');
    expect(loginPage).toContain('aria-live="polite"');

    expect(faqPage).toContain('skip-link');
    expect(faqPage).toContain('id="main-content"');
    expect(trustPage).toContain('skip-link');
    expect(trustPage).toContain('mvp-permission-matrix');
    expect(trustPage).toContain('scope="row"');
    expect(trustPage).toContain('scope="col"');

    expect(explorePage).toContain('skip-link');
    expect(explorePage).toContain('id="main-content"');
    expect(explorePage).toContain('explore-feed');
    expect(explorePage).toContain('id="explore-status"');
    expect(explorePage).toContain('/frontend/public-mvp.css');
    expect(createPage).toContain('role="status"');
    expect(createPage).toContain('aria-live="polite"');
    expect(createPage).toContain('/frontend/public-mvp.css');
    expect(votePage).toContain('id="form-message"');
    expect(votePage).toContain('role="alert"');
    expect(resultsPage).toContain('aria-label="投票結果統計"');

    const profilePage = await readFile(join(process.cwd(), 'public/profile.html'), 'utf8');
    const voteShell = await readFile(join(process.cwd(), 'public/vote.html'), 'utf8');
    const myPollsPage = await readFile(join(process.cwd(), 'public/my-polls.html'), 'utf8');
    const indexPage = await readFile(join(process.cwd(), 'public/index.html'), 'utf8');

    expect(profilePage).toContain('role="note"');
    expect(voteShell).toContain('role="note"');
    expect(myPollsPage).toContain('role="note"');
    expect(indexPage).toContain('href="/login"');
  });

  it('labels auth state chips for assistive tech', async () => {
    const { AUTH_STATE_COPY, createAuthStateChip } = await loadLayoutModule();
    const doc = {
      createElement(tagName: string) {
        return {
          tagName: tagName.toUpperCase(),
          className: '',
          href: '',
          textContent: '',
          attributes: new Map<string, string>(),
          setAttribute(name: string, value: string) {
            this.attributes.set(name, value);
          },
        };
      },
    };

    const guestChip = createAuthStateChip(doc, 'guest');
    expect(guestChip.attributes.get('aria-label')).toBe(
      AUTH_STATE_COPY.guestChipAriaLabel,
    );

    const demoChip = createAuthStateChip(doc, 'logged-in-mock');
    expect(demoChip.attributes.get('aria-label')).toBe(
      AUTH_STATE_COPY.demoIdentityChipAriaLabel,
    );
    expect(demoChip.attributes.get('role')).toBe('status');
  });

  it('updates submit button busy state for assistive tech', async () => {
    const { setBusySubmitButton } = await loadPublicMvpUiModule();
    const button = createSubmitButton();

    setBusySubmitButton(button, {
      busy: true,
      idleLabel: '建立問卷',
      busyLabel: '建立中…',
    });

    expect(button.disabled).toBe(true);
    expect(button.textContent).toBe('建立中…');
    expect(button.attributes.get('aria-busy')).toBe('true');

    setBusySubmitButton(button, {
      busy: false,
      idleLabel: '建立問卷',
      busyLabel: '建立中…',
    });

    expect(button.disabled).toBe(false);
    expect(button.attributes.get('aria-busy')).toBe('false');
  });

  it('keeps share links and copy actions after create success', async () => {
    const { renderCreatePollSuccess } = await loadCreatePollPageModule();
    let documentObject: {
      createElement(tagName: string): ReturnType<typeof createElement>;
    };
    function createElement(tagName: string) {
      return {
        tagName,
        ownerDocument: documentObject,
        textContent: '',
        href: '',
        hidden: false,
        children: [] as ReturnType<typeof createElement>[],
        attributes: new Map<string, string>(),
        setAttribute(name: string, value: string) {
          this.attributes.set(name, value);
        },
        addEventListener() {},
        append(child: ReturnType<typeof createElement>) {
          this.children.push(child);
        },
        replaceChildren() {
          this.children = [];
        },
        querySelector() {
          return this.children.find((child) => child.tagName === 'a') ?? null;
        },
        focus: vi.fn(),
      };
    }
    documentObject = { createElement };
    const root = createElement('section');

    renderCreatePollSuccess(
      root,
      { poll_id: '22222222-2222-4222-8222-222222222222' },
      {
        locationObject: { origin: 'https://example.test' },
        skipCreatorControls: true,
      },
    );

    function collectByTag(
      element: ReturnType<typeof createElement>,
      tagName: string,
    ): ReturnType<typeof createElement>[] {
      const matches: ReturnType<typeof createElement>[] = [];
      if (String(element.tagName).toLowerCase() === tagName) {
        matches.push(element);
      }
      for (const child of element.children) {
        matches.push(...collectByTag(child, tagName));
      }
      return matches;
    }

    const links = collectByTag(root, 'a');
    const buttons = collectByTag(root, 'button');
    expect(links.length).toBeGreaterThanOrEqual(2);
    expect(buttons.length).toBe(2);
    expect(root.attributes.get('role')).toBe('region');
  });

  it('labels vote options for keyboard and screen reader use', async () => {
    const { renderPollOptions } = await loadVotePageModule();
    let documentObject: {
      createElement(tagName: string): ReturnType<typeof createElement>;
    };
    function createElement(tagName: string) {
      return {
        tagName,
        ownerDocument: documentObject,
        id: '',
        htmlFor: '',
        className: '',
        type: '',
        name: '',
        value: '',
        attributes: new Map<string, string>(),
        setAttribute(name: string, value: string) {
          this.attributes.set(name, value);
        },
        addEventListener() {},
        append(child: ReturnType<typeof createElement>) {
          this.children.push(child);
        },
        replaceChildren() {
          this.children = [];
        },
        children: [] as ReturnType<typeof createElement>[],
      };
    }
    documentObject = { createElement };
    const root = {
      ownerDocument: documentObject,
      replaceChildren() {
        this.children = [];
      },
      append(child: ReturnType<typeof createElement>) {
        this.children.push(child);
      },
      children: [] as ReturnType<typeof createElement>[],
    };

    renderPollOptions(
      root,
      [
        { option_index: 0, label: 'Rice' },
        { option_index: 1, label: 'Noodles' },
      ],
      () => {},
    );

    const radio = root.children[0]!.children[0]!;
    expect(radio.id).toBe('vote-option-0');
    expect(radio.attributes.get('aria-label')).toBe('Rice');
    expect(root.children[0]!.htmlFor).toBe('vote-option-0');
  });

  it('exposes accessible share-link copy feedback regions', async () => {
    const layout = await loadShareLinkLayoutModule();
    const documentObject = {
      createElement(tagName: string) {
        const element = {
          tagName,
          className: '',
          textContent: '',
          id: '',
          _tabIndex: -1,
          get tabIndex() {
            return this._tabIndex;
          },
          set tabIndex(value: number) {
            this._tabIndex = value;
          },
          attributes: new Map<string, string>(),
          children: [] as Array<ReturnType<typeof documentObject.createElement>>,
          focus: vi.fn(),
          append(child: ReturnType<typeof documentObject.createElement>) {
            this.children.push(child);
          },
          setAttribute(name: string, value: string) {
            this.attributes.set(name, value);
            if (name === 'id') {
              this.id = value;
            }
          },
          addEventListener() {},
        };
        return element;
      },
    };
    const host = documentObject.createElement('div');

    layout.renderPublicShareLinkRow(documentObject, host, {
      label: '投票連結（分享給參與者）',
      url: 'https://example.test/vote/demo',
      copyButtonLabel: '複製投票連結',
      copyButtonAriaLabel: '複製投票頁完整網址到剪貼簿',
    });

    const row = host.children[0]!;
    const feedback = row.children.find((child) =>
      child.className.includes('mvp-public-share-link-feedback'),
    );
    const button = row.children.find((child) => child.className.includes('copy-link-button'));
    const urlCode = row.children.find((child) =>
      child.className.split(/\s+/).includes('share-url'),
    );

    expect(feedback?.attributes.get('role')).toBe('status');
    expect(feedback?.attributes.get('aria-live')).toBe('polite');
    expect(feedback?.attributes.get('aria-atomic')).toBe('true');
    expect(button?.attributes.get('aria-describedby')).toContain(feedback?.id);
    expect(urlCode?.tabIndex).toBe(0);
    expect(urlCode?.attributes.get('aria-label')).toContain('完整網址');
  });
});
