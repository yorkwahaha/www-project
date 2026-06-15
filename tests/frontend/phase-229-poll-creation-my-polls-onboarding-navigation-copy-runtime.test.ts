import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_229_MODULES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/creator-flow-copy.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/my-polls-page.js',
] as const;

const FORBIDDEN_DEBUG_LEAKAGE =
  /request_id|requestId|option_id|trace_id|traceId|stack trace|internal code|error_code/i;

const FORBIDDEN_ENGINEER_COPY =
  /fail closed|AUTH_REQUIRED|creator_session|X-User-Id|ownership resolver|fail closed/i;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 229 poll creation my polls onboarding navigation copy runtime', () => {
  it('documents Phase 229 in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 229');
    expect(readme).toContain(
      'docs/www-project-phase-229-poll-creation-my-polls-onboarding-navigation-copy-runtime-v1.md',
    );
  });

  it('centralizes creator onboarding copy in PUBLIC_CREATOR_ONBOARDING_MESSAGES', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');

    expect(ui.PUBLIC_CREATOR_ONBOARDING_MESSAGES).toContain(ui.PUBLIC_CREATE_POLL_PAGE_LEAD);
    expect(ui.PUBLIC_CREATOR_ONBOARDING_MESSAGES).toContain(ui.PUBLIC_CREATE_POLL_PAGE_BANNER_BODY);
    expect(ui.PUBLIC_CREATOR_ONBOARDING_MESSAGES).toContain(ui.PUBLIC_MY_POLLS_PAGE_LEAD);
    expect(ui.PUBLIC_CREATOR_ONBOARDING_MESSAGES).toContain(ui.PUBLIC_MY_POLLS_PAGE_BANNER_BODY);
    expect(ui.PUBLIC_CREATOR_ONBOARDING_MESSAGES).toContain(
      ui.PUBLIC_CREATOR_CREATE_SUCCESS_MANAGE_HINT,
    );
    expect(ui.PUBLIC_CREATE_POLL_PAGE_LEAD).toContain('收集中看不到期中票數或百分比');
    expect(ui.PUBLIC_CREATE_POLL_PAGE_BANNER_BODY).toContain('?live=1');
    expect(ui.PUBLIC_CREATE_POLL_PAGE_BANNER_BODY).toContain('不會儲存');
    expect(ui.PUBLIC_MY_POLLS_PAGE_LEAD).toContain('收集中看不到票數');
    expect(ui.PUBLIC_CREATOR_MY_POLLS_LEAD_HINT).toContain('建立流程');
    expect(ui.PUBLIC_CREATOR_MY_POLLS_LEAD_HINT).not.toMatch(/工作階段/);
    expect(ui.PUBLIC_HINT_TEXT_MESSAGES).toEqual(
      expect.arrayContaining(ui.PUBLIC_CREATOR_ONBOARDING_MESSAGES),
    );
  });

  it('keeps creator-flow-copy re-exports aligned with shared onboarding hints', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const creator = await loadModule('public/frontend/creator-flow-copy.js');

    expect(creator.CREATOR_FLOW_COPY.createSuccessManage).toBe(
      ui.PUBLIC_CREATOR_CREATE_SUCCESS_MANAGE_HINT,
    );
    expect(creator.CREATOR_FLOW_COPY.myPollsLead).toBe(ui.PUBLIC_CREATOR_MY_POLLS_LEAD_HINT);
    expect(creator.CREATOR_ONBOARDING_MESSAGES).toEqual(ui.PUBLIC_CREATOR_ONBOARDING_MESSAGES);
  });

  it('wires create-poll onboarding copy into banner, lead, and nav mount points', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const banner = { textContent: '' };
    const pageLead = { textContent: '' };
    const liveHint = { textContent: '' };
    const navHint = {
      replaceChildren: vi.fn(),
      append: vi.fn(),
    };
    const documentObject = {
      getElementById(id: string) {
        if (id === 'create-poll-page-banner') {
          return banner;
        }
        if (id === 'create-poll-page-lead') {
          return pageLead;
        }
        if (id === 'create-poll-live-mode-hint') {
          return liveHint;
        }
        if (id === 'create-poll-my-polls-nav-hint') {
          return navHint;
        }
        return null;
      },
      querySelector: () => null,
      createTextNode: (value: string) => ({ nodeType: 3, textContent: value }),
      createElement: (tagName: string) => ({
        tagName,
        href: '',
        textContent: '',
      }),
    };

    createPoll.syncCreatePollPageOnboardingCopy(documentObject);
    expect(pageLead.textContent).toBe(ui.PUBLIC_CREATE_POLL_PAGE_LEAD);
    expect(banner.textContent).toBe(ui.PUBLIC_CREATE_POLL_PAGE_BANNER_BODY);
    expect(liveHint.textContent).toBe(ui.PUBLIC_CREATE_POLL_LIVE_MODE_HINT);
    expect(navHint.replaceChildren).toHaveBeenCalled();
    expect(navHint.append).toHaveBeenCalled();
  });

  it('wires my-polls onboarding copy into banner, quota panel, and nav mount points', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const banner = { textContent: '' };
    const pageLead = { textContent: '' };
    const quotaBody = {
      replaceChildren: vi.fn(),
      append: vi.fn(),
    };
    const navHint = {
      replaceChildren: vi.fn(),
      append: vi.fn(),
    };
    const documentObject = {
      getElementById(id: string) {
        if (id === 'my-polls-page-banner') {
          return banner;
        }
        if (id === 'my-polls-page-lead') {
          return pageLead;
        }
        if (id === 'my-polls-quota-panel-body') {
          return quotaBody;
        }
        if (id === 'my-polls-create-poll-nav-hint') {
          return navHint;
        }
        if (id === 'my-polls-creator-side-note') {
          return { textContent: '' };
        }
        return null;
      },
      querySelector: () => null,
      createTextNode: (value: string) => ({ nodeType: 3, textContent: value }),
      createElement: (tagName: string) => ({
        tagName,
        href: '',
        textContent: '',
      }),
    };

    myPolls.syncMyPollsPageOnboardingCopy(documentObject);
    expect(pageLead.textContent).toBe(ui.PUBLIC_MY_POLLS_PAGE_LEAD);
    expect(banner.textContent).toBe(ui.PUBLIC_MY_POLLS_PAGE_BANNER_BODY);
    expect(quotaBody.replaceChildren).toHaveBeenCalled();
    expect(navHint.replaceChildren).toHaveBeenCalled();
  });

  it('keeps demo vs live creator API paths unchanged', async () => {
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const createPollSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/create-poll-page.js'), 'utf8'),
    );
    const myPollsSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/my-polls-page.js'), 'utf8'),
    );
    const pollId = '22222222-2222-4222-8222-222222222222';

    const createFetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ poll_id: pollId, status: 'active' }),
    }));
    await createPoll.submitCreatePoll({
      formValues: { title: '測試', description: '', options: ['A', 'B'] },
      fetchImpl: createFetch,
      now: () => new Date('2026-05-31T12:00:00.000Z'),
    });
    expect(createFetch).toHaveBeenCalledWith(
      '/creator/polls',
      expect.objectContaining({ method: 'POST', credentials: 'same-origin' }),
    );

    const sessionFetch = vi.fn(async (url: string) => {
      if (url === '/creator/session') {
        return { ok: true, status: 200, json: async () => ({}) };
      }
      throw new Error('unexpected');
    });
    await myPolls.prepareMyPollsLiveSession({
      fetchImpl: sessionFetch,
      locationObject: { hostname: '127.0.0.1' },
    });
    expect(sessionFetch).toHaveBeenCalledWith('/creator/session', {
      method: 'GET',
      credentials: 'same-origin',
    });

    expect(createPollSource).toContain('submitCreatePollDemo');
    expect(createPollSource).toContain("fetchImpl('/creator/polls'");
    expect(myPollsSource).toContain("fetchImpl('/creator/polls'");
    expect(createPollSource).not.toMatch(FORBIDDEN_STORAGE);
    expect(myPollsSource).not.toMatch(FORBIDDEN_STORAGE);
  });

  it('aligns static HTML fallback with shared onboarding constants', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const createPollHtml = await readFile(join(process.cwd(), 'public/create-poll.html'), 'utf8');
    const myPollsHtml = await readFile(join(process.cwd(), 'public/my-polls.html'), 'utf8');

    expect(createPollHtml).toContain('id="create-poll-page-banner"');
    expect(createPollHtml).toContain('id="create-poll-live-mode-hint"');
    expect(createPollHtml).toContain('id="create-poll-my-polls-nav-hint"');
    expect(createPollHtml).toContain('id="create-poll-page-lead"');
    expect(ui.PUBLIC_CREATE_POLL_PAGE_LEAD).toContain('期中票數或百分比');
    expect(ui.PUBLIC_CREATE_POLL_PAGE_BANNER_BODY).toContain('?live=1');
    expect(myPollsHtml).toContain('id="my-polls-page-banner"');
    expect(myPollsHtml).toContain('id="my-polls-quota-panel-body"');
    expect(myPollsHtml).toContain('id="my-polls-create-poll-nav-hint"');
    expect(myPollsHtml).toContain('id="my-polls-page-lead"');
    expect(ui.PUBLIC_MY_POLLS_PAGE_LEAD).toContain('收集中看不到票數');
    expect(ui.PUBLIC_MY_POLLS_PAGE_BANNER_BODY).toContain('?live=1');
    expect(myPollsHtml).not.toContain('creator_session');
    expect(myPollsHtml).not.toContain('X-User-Id');
  });

  it('keeps onboarding modules free of forbidden debug, storage, and engineer copy', async () => {
    for (const relativePath of PHASE_229_MODULES) {
      const source = stripJsComments(await readFile(join(process.cwd(), relativePath), 'utf8'));
      expect(source, relativePath).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
      expect(source, relativePath).not.toMatch(FORBIDDEN_STORAGE);
    }

    const myPollsHtml = await readFile(join(process.cwd(), 'public/my-polls.html'), 'utf8');
    expect(myPollsHtml).not.toMatch(FORBIDDEN_ENGINEER_COPY);
    for (const message of (
      await loadModule('public/frontend/public-mvp-ui.js')
    ).PUBLIC_CREATOR_ONBOARDING_MESSAGES) {
      expect(message).not.toMatch(FORBIDDEN_ENGINEER_COPY);
    }
  });
});
