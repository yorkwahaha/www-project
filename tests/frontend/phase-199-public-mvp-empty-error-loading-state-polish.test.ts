import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const PUBLIC_STATE_RUNTIME_SURFACES = [
  'public/frontend/explore-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
  'public/frontend/profile-page.js',
  'public/frontend/quality-feedback-badge.js',
];

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters|creator_token/i;

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_BACKEND_ECHO =
  /error\.message|body\.message|apiError\.message|response\.text\(\)|JSON\.stringify\(error/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

function createHost() {
  let documentObject: {
    createElement(tagName: string): ReturnType<typeof createElement>;
  };
  function createElement(tagName: string) {
    return {
      tagName,
      ownerDocument: documentObject,
      className: '',
      textContent: '',
      href: '',
      children: [] as ReturnType<typeof createElement>[],
      replaceChildren() {
        this.children = [];
      },
      append(child: ReturnType<typeof createElement>) {
        this.children.push(child);
      },
    };
  }
  documentObject = { createElement };
  return createElement('div');
}

function collectText(element: ReturnType<typeof createHost>): string[] {
  return [
    element.textContent,
    ...element.children.flatMap((child) => collectText(child)),
  ].filter(Boolean);
}

describe('Phase 199 public MVP empty / error / loading state polish', () => {
  it('exports aligned loading and load-failure constants from public-mvp-ui', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(publicUi.PUBLIC_EXPLORE_FEED_LOADING_MESSAGE).toBe(
      '載入探索列表中，請稍候。',
    );
    expect(publicUi.PUBLIC_PROFILE_PAGE_LOADING_MESSAGE).toBe(
      '載入個人資料中，請稍候。',
    );
    expect(publicUi.PUBLIC_EXPLORE_LOAD_FAILURE_MESSAGE).toBe(
      '目前無法載入探索列表，請稍後再試。',
    );
    expect(publicUi.PUBLIC_VOTE_PAGE_LOAD_ERROR_TITLE).toBe('無法載入問卷');
    expect(publicUi.PUBLIC_RESULTS_PAGE_LOAD_ERROR_TITLE).toBe('無法載入結果');

    for (const message of publicUi.PUBLIC_PENDING_USER_MESSAGES) {
      expect(message).toMatch(/請稍候。$/);
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }

    for (const message of publicUi.PUBLIC_LOAD_FAILURE_USER_MESSAGES) {
      expect(message).toMatch(/請稍後再試。$/);
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }
  });

  it('keeps page modules on shared loading and failure constants', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const explore = await loadModule('public/frontend/explore-page.js');
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const vote = await loadModule('public/frontend/vote-page.js');
    const results = await loadModule('public/frontend/result-page.js');
    const profile = await loadModule('public/frontend/profile-page.js');

    expect(explore.EXPLORE_FEED_LOADING_MESSAGE).toBe(
      publicUi.PUBLIC_EXPLORE_FEED_LOADING_MESSAGE,
    );
    expect(myPolls.MY_POLLS_LOADING_MESSAGE).toBe(publicUi.PUBLIC_MY_POLLS_LOADING_MESSAGE);
    expect(vote.VOTE_PAGE_LOADING_MESSAGE).toBe(publicUi.PUBLIC_VOTE_PAGE_LOADING_MESSAGE);
    expect(results.RESULT_PAGE_LOADING_MESSAGE).toBe(
      publicUi.PUBLIC_RESULTS_PAGE_LOADING_MESSAGE,
    );
    expect(profile.PROFILE_LOADING_MESSAGE).toBe(
      publicUi.PUBLIC_PROFILE_PAGE_LOADING_MESSAGE,
    );
    expect(explore.EXPLORE_LOAD_FAILURE_MESSAGE).toBe(
      publicUi.PUBLIC_EXPLORE_LOAD_FAILURE_MESSAGE,
    );
    expect(myPolls.MY_POLLS_LOAD_FAILURE_MESSAGE).toBe(
      publicUi.PUBLIC_MY_POLLS_LOAD_FAILURE_MESSAGE,
    );
    expect(results.RESULTS_LOAD_FAILURE_MESSAGE).toBe(
      publicUi.PUBLIC_RESULTS_LOAD_FAILURE_MESSAGE,
    );
    expect(profile.PROFILE_LOAD_FAILURE_MESSAGE).toBe(
      publicUi.PUBLIC_PROFILE_LOAD_FAILURE_MESSAGE,
    );
  });

  it('renderPublicInlineErrorNote adds safe next-step CTA without backend echo', async () => {
    const { renderPublicInlineErrorNote, PUBLIC_CTA_GO_HOME_LABEL } =
      await loadModule('public/frontend/public-mvp-ui.js');
    const host = createHost();

    renderPublicInlineErrorNote(host, {
      message: '目前無法載入探索列表，請稍後再試。',
      ctaHref: '/',
      ctaLabel: PUBLIC_CTA_GO_HOME_LABEL,
    });

    const text = collectText(host).join(' ');
    expect(text).toContain('目前無法載入探索列表，請稍後再試。');
    expect(text).toContain(PUBLIC_CTA_GO_HOME_LABEL);
    expect(text).not.toMatch(FORBIDDEN_INTERNAL_COPY);
    expect(text).not.toMatch(FORBIDDEN_OUTCOME_COPY);
  });

  it('keeps quality_badge presentation unchanged', async () => {
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');

    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'unexpected' })).toBe(
      false,
    );
  });

  it('keeps public state runtime surfaces free of backend echo and linkage hints', async () => {
    for (const relativePath of PUBLIC_STATE_RUNTIME_SURFACES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source).not.toMatch(FORBIDDEN_BACKEND_ECHO);
      expect(source).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(source).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }
  });
});
