import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_288_DOC =
  'docs/www-project-phase-288-my-polls-empty-state-copy-polish-v1.md';

const NEW_EMPTY_MESSAGE = '目前還沒有你建立的問卷。';
const NEW_EMPTY_SUMMARY = '可前往建立一則新問卷，完成後回到此頁管理。';
const NEW_EMPTY_HEADLINE = '目前還沒有你建立的問卷';

const OLD_EMPTY_MESSAGE = '你目前還沒有建立問卷。';
const OLD_EMPTY_SUMMARY =
  '你目前還沒有透過本流程建立的問卷。可先建立一則問卷，完成後在此管理並分享投票連結。';

const FORBIDDEN_OUTCOME_COPY =
  /你投過|你尚未投票|你符合資格|你不符合資格|已投過票|選擇了|投給哪個|熱門|票數|百分比|排名|趨勢/i;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 288 my polls empty state copy polish', () => {
  it('uses polished empty-state copy constants from public-mvp-ui', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const creatorCopy = await loadModule('public/frontend/creator-flow-copy.js');

    expect(publicUi.PUBLIC_MY_POLLS_EMPTY_MESSAGE).toBe(NEW_EMPTY_MESSAGE);
    expect(publicUi.PUBLIC_MY_POLLS_EMPTY_SUMMARY).toBe(NEW_EMPTY_SUMMARY);
    expect(publicUi.PUBLIC_MY_POLLS_EMPTY_HEADLINE).toBe(NEW_EMPTY_HEADLINE);
    expect(myPolls.MY_POLLS_EMPTY_MESSAGE).toBe(publicUi.PUBLIC_MY_POLLS_EMPTY_MESSAGE);
    expect(myPolls.MY_POLLS_EMPTY_SUMMARY).toBe(publicUi.PUBLIC_MY_POLLS_EMPTY_SUMMARY);
    expect(creatorCopy.CREATOR_FLOW_COPY.myPollsEmpty).toBe(NEW_EMPTY_HEADLINE);
    expect(publicUi.PUBLIC_CTA_GO_TO_CREATE_POLL_LIVE_LABEL).toBe('前往建立問卷（即時模式）');
  });

  it('keeps loading and failure copy unchanged while empty copy is polished', async () => {
    const myPolls = await loadModule('public/frontend/my-polls-page.js');

    expect(myPolls.MY_POLLS_LOADING_MESSAGE).toBe('載入你的問卷中，請稍候。');
    expect(myPolls.MY_POLLS_LOAD_FAILURE_MESSAGE).toBe(
      '目前無法載入你建立的問卷，請稍後再試。',
    );
    expect(myPolls.MY_POLLS_SIGN_IN_REQUIRED_MESSAGE).toContain('請先登入');
  });

  it('renders empty panel with existing create-poll CTA and safe copy only', async () => {
    const { renderPublicEmptyStatePanel } = await loadModule(
      'public/frontend/public-unavailable-state.js',
    );
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    function createDocumentStub() {
      const documentObject = {
        createElement(tagName: string) {
          return {
            tagName,
            className: '',
            textContent: '',
            href: '',
            children: [] as Array<ReturnType<typeof documentObject.createElement>>,
            append(child: ReturnType<typeof documentObject.createElement>) {
              this.children.push(child);
            },
            replaceChildren() {
              this.children = [];
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

    const documentObject = createDocumentStub();
    const emptyHost = documentObject.createElement('div');
    renderPublicEmptyStatePanel(documentObject, emptyHost, {
      message: publicUi.PUBLIC_MY_POLLS_EMPTY_MESSAGE,
      summary: publicUi.PUBLIC_MY_POLLS_EMPTY_SUMMARY,
      ctaHref: '/polls/new?live=1',
      ctaLabel: publicUi.PUBLIC_CTA_GO_TO_CREATE_POLL_LIVE_LABEL,
      ctaClassName: 'mvp-action-link',
    });

    const rendered = collectText(emptyHost);
    expect(rendered).toContain(NEW_EMPTY_MESSAGE);
    expect(rendered).toContain(NEW_EMPTY_SUMMARY);
    expect(rendered).toContain('前往建立問卷（即時模式）');
    expect(rendered).not.toContain(OLD_EMPTY_MESSAGE);
    expect(rendered).not.toContain(OLD_EMPTY_SUMMARY);
    expect(rendered).not.toMatch(FORBIDDEN_OUTCOME_COPY);
  });

  it('keeps my-polls-page.js free of API, storage, and tracking drift', async () => {
    const source = await readFile(
      join(process.cwd(), 'public/frontend/my-polls-page.js'),
      'utf8',
    );

    expect(source).not.toMatch(/localStorage|sessionStorage|analytics|option_id|vote_token/i);
    expect(source).toContain("fetchImpl('/creator/session'");
    expect(source).toContain("fetchImpl('/creator/polls'");
    expect(source).toContain('renderCreatorPollsEmptyState');
    expect(source).not.toContain('Phase 288');
  });

  it('keeps creator session and vote boundaries unchanged during copy polish', async () => {
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const votePage = await loadModule('public/frontend/vote-page.js');
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const fetchImpl = vi.fn(async (url: string) => {
      if (String(url).includes('/creator/session')) {
        return { ok: true, status: 201, json: async () => ({}) };
      }
      if (String(url).includes('/creator/polls')) {
        return { ok: true, status: 200, json: async () => ({ polls: [] }) };
      }
      return { ok: true, status: 201, json: async () => ({}) };
    });

    await myPolls.fetchCreatorOwnedPolls(fetchImpl);
    expect(fetchImpl).toHaveBeenCalledWith(
      '/creator/polls',
      expect.objectContaining({ credentials: 'same-origin' }),
    );

    await votePage.submitVoteByIndex({
      pollId: '11111111-1111-4111-8111-111111111111',
      optionIndex: 0,
      userId: '44444444-4444-4444-8444-444444444444',
      fetchImpl,
    });
    const voteBody = JSON.parse(String(fetchImpl.mock.calls.at(-1)?.[1]?.body));
    expect(voteBody).toEqual({ option_index: 0 });
    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
  });

  it('documents Phase 288 implementation record exists', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_288_DOC), 'utf8');
    expect(doc).toContain('my-polls-page.js');
    expect(doc).toContain('no logic change');
  });
});
