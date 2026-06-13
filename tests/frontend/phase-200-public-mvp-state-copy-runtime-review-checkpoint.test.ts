import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const PHASE_199_REVIEW_MODULES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/explore-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
  'public/frontend/profile-page.js',
] as const;

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters|creator_token/i;

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_STORAGE =
  /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

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

describe('Phase 200 public MVP state copy runtime review checkpoint', () => {
  it('documents Phase 200 review checkpoint in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 200');
    expect(readme).toContain(
      'docs/www-project-phase-200-public-mvp-state-copy-runtime-review-checkpoint-v1.md',
    );
  });

  it('uses result-page.js as the results runtime module filename', async () => {
    await expect(
      readFile(join(process.cwd(), 'public/frontend/result-page.js'), 'utf8'),
    ).resolves.toContain('bootstrapResultPage');
    await expect(
      readFile(join(process.cwd(), 'public/frontend/results-page.js'), 'utf8'),
    ).rejects.toThrow();
  });

  it('keeps loading and load-failure constants on safe allowlists', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    const loadingConstants = [
      publicUi.PUBLIC_EXPLORE_FEED_LOADING_MESSAGE,
      publicUi.PUBLIC_MY_POLLS_LOADING_MESSAGE,
      publicUi.PUBLIC_VOTE_PAGE_LOADING_MESSAGE,
      publicUi.PUBLIC_RESULTS_PAGE_LOADING_MESSAGE,
      publicUi.PUBLIC_PROFILE_PAGE_LOADING_MESSAGE,
    ];
    for (const message of loadingConstants) {
      expect(message).toMatch(/請稍候。$/);
      expect(publicUi.PUBLIC_PENDING_USER_MESSAGES).toContain(message);
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }

    const failureConstants = [
      publicUi.PUBLIC_EXPLORE_LOAD_FAILURE_MESSAGE,
      publicUi.PUBLIC_MY_POLLS_LOAD_FAILURE_MESSAGE,
      publicUi.PUBLIC_RESULTS_LOAD_FAILURE_MESSAGE,
      publicUi.PUBLIC_PROFILE_LOAD_FAILURE_MESSAGE,
      publicUi.PUBLIC_PROFILE_SAVE_FAILURE_MESSAGE,
    ];
    for (const message of failureConstants) {
      expect(message).toMatch(/請稍後再試。$/);
      expect(publicUi.PUBLIC_LOAD_FAILURE_USER_MESSAGES).toContain(message);
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }
  });

  it('keeps profile loading copy display-only without profile API path changes', async () => {
    const profile = await loadModule('public/frontend/profile-page.js');
    const profileSource = await readFile(
      join(process.cwd(), 'public/frontend/profile-page.js'),
      'utf8',
    );

    expect(profile.PROFILE_LOADING_MESSAGE).toBe('載入個人資料中，請稍候。');
    expect(profileSource).toContain("fetchImpl('/users/me/profile'");
    expect(profileSource).toContain('PUBLIC_PROFILE_PAGE_LOADING_MESSAGE');
    expect(profileSource).toMatch(/mountProfilePage[\s\S]*PROFILE_LOADING_MESSAGE/);
    expect(profileSource).not.toMatch(/\/users\/me['"`]/);
  });

  it('keeps vote and results load-error titles copy-only', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const voteSource = await readFile(
      join(process.cwd(), 'public/frontend/vote-page.js'),
      'utf8',
    );
    const resultSource = await readFile(
      join(process.cwd(), 'public/frontend/result-page.js'),
      'utf8',
    );

    expect(publicUi.PUBLIC_VOTE_PAGE_LOAD_ERROR_TITLE).toBe('無法載入問卷');
    expect(publicUi.PUBLIC_RESULTS_PAGE_LOAD_ERROR_TITLE).toBe('無法載入結果');
    expect(voteSource).toContain('PUBLIC_VOTE_PAGE_LOAD_ERROR_TITLE');
    expect(voteSource).toContain('resolvePublicErrorUserMessage');
    expect(resultSource).toContain('PUBLIC_RESULTS_PAGE_LOAD_ERROR_TITLE');
    expect(resultSource).toMatch(/showRouteError\(PUBLIC_RESULTS_PAGE_LOAD_ERROR_TITLE/);
    expect(resultSource).toContain('resolvePublicErrorUserMessage');
    expect(resultSource).toContain('renderResultDisplay');
  });

  it('keeps renderPublicInlineErrorNote on safe CTA fallback only', async () => {
    const { renderPublicInlineErrorNote, PUBLIC_CTA_GO_HOME_LABEL } =
      await loadModule('public/frontend/public-mvp-ui.js');
    const inlineSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/public-mvp-ui.js'), 'utf8'),
    );
    const host = createHost();

    renderPublicInlineErrorNote(host, {
      message: '目前無法載入探索列表，請稍後再試。',
      ctaHref: '/',
      ctaLabel: PUBLIC_CTA_GO_HOME_LABEL,
    });

    const messageNode = host.children.find((child) => child.className === 'panel-message');
    const linkNode = host.children.find((child) => child.tagName === 'a');
    expect(messageNode?.textContent).toBe('目前無法載入探索列表，請稍後再試。');
    expect(linkNode?.href).toBe('/');
    expect(linkNode?.textContent).toBe(PUBLIC_CTA_GO_HOME_LABEL);
    expect(inlineSource).toMatch(/function renderPublicInlineErrorNote[\s\S]*textContent = message/);
    expect(inlineSource).not.toMatch(
      /function renderPublicInlineErrorNote[\s\S]*error\.message/,
    );
  });

  it('keeps explore and my-polls error CTAs navigation-only without new fetch paths', async () => {
    const exploreSource = await readFile(
      join(process.cwd(), 'public/frontend/explore-page.js'),
      'utf8',
    );
    const myPollsSource = await readFile(
      join(process.cwd(), 'public/frontend/my-polls-page.js'),
      'utf8',
    );

    expect(exploreSource).toContain('showError(EXPLORE_LOAD_FAILURE_MESSAGE, { showHomeLink: true })');
    expect(exploreSource).toContain('showError(EXPLORE_LOAD_MORE_FAILURE_MESSAGE)');
    expect(exploreSource).toContain('fetchExploreFeedPage');
    expect(exploreSource).not.toMatch(/showError[\s\S]{0,120}fetchImpl\(/);

    expect(myPollsSource).toContain('renderPublicInlineErrorNote(host');
    expect(myPollsSource).toContain("ctaHref: '/'");
    expect(myPollsSource).toContain('PUBLIC_CTA_GO_HOME_LABEL');
    expect(myPollsSource).toContain("href = '/login'");
    expect(myPollsSource).toContain('fetchCreatorOwnedPolls');
    expect(myPollsSource).not.toMatch(/renderPublicInlineErrorNote[\s\S]{0,120}fetchImpl\(/);
  });

  it('keeps error and empty-state CSS layout-only', async () => {
    const css = await readFile(join(process.cwd(), 'public/frontend/public-mvp.css'), 'utf8');
    const exploreHtml = await readFile(join(process.cwd(), 'public/explore.html'), 'utf8');

    expect(exploreHtml).toContain('<div id="explore-error" class="mvp-error-panel"');
    expect(css).toMatch(/#error-panel,\s*\n\.mvp-error-panel/);
    expect(css).toContain('.mvp-empty-state .mvp-btn');
    expect(css).toContain('.mvp-empty-state .mvp-action-link');
    expect(css).not.toMatch(/mvp-error-panel[\s\S]{0,120}fetch|mvp-empty-state[\s\S]{0,120}fetch/);
  });

  it('keeps quality_badge presentation unchanged after Phase 199', async () => {
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const badgeSource = await readFile(
      join(process.cwd(), 'public/frontend/quality-feedback-badge.js'),
      'utf8',
    );

    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badgeSource).not.toMatch(/tooltip|title\s*=|aria-describedby|debug|score|rank/i);
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    for (const poll of [
      { quality_badge: null },
      {},
      { quality_badge: 'low_quality' },
      { quality_badge: 'unknown' },
    ]) {
      expect(badge.shouldRenderQualityFeedbackBadge(poll)).toBe(false);
    }
  });

  it('keeps Phase 199 review modules free of client storage, backend echo, and forbidden copy', async () => {
    for (const relativePath of PHASE_199_REVIEW_MODULES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      if (relativePath !== 'public/frontend/public-mvp-ui.js') {
        expect(source, relativePath).not.toMatch(FORBIDDEN_BACKEND_ECHO);
      }
      expect(source, relativePath).not.toMatch(FORBIDDEN_STORAGE);
      expect(source, relativePath).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }
  });
});
