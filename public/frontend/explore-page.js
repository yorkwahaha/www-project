import {
  buildPublicVotePath,
  PUBLIC_EXPLORE_EMPTY_MESSAGE,
  PUBLIC_EXPLORE_LOAD_MORE_UNAVAILABLE_MESSAGE,
} from './public-mvp-ui.js';

export const EXPLORE_FEED_PATH = '/polls/feed';
export const EXPLORE_FEED_DEFAULT_LIMIT = 20;
export const EXPLORE_FEED_ALLOWED_ITEM_KEYS = [
  'poll_id',
  'title',
  'category',
  'status',
  'published_display',
  'result_page_url',
];

export const EXPLORE_LOAD_FAILURE_MESSAGE = '目前無法載入探索列表，請稍後再試。';
export const EXPLORE_LOAD_MORE_FAILURE_MESSAGE =
  PUBLIC_EXPLORE_LOAD_MORE_UNAVAILABLE_MESSAGE;
export const EXPLORE_FEED_EMPTY_MESSAGE = PUBLIC_EXPLORE_EMPTY_MESSAGE;
export const EXPLORE_FEED_EMPTY_SUMMARY = '你可以先發起一則問卷並分享投票連結。';
export const EXPLORE_FEED_LIST_MESSAGE = '顯示公開問卷列表';
export const EXPLORE_FEED_LIST_SUMMARY =
  '依最近發布排序；非熱門、票數、個人化或榜單。';
export const EXPLORE_FEED_LOADING_MESSAGE = '載入探索列表中，請稍候。';
export const EXPLORE_LOAD_MORE_PENDING_MESSAGE = '載入更多中，請稍候。';
const CATEGORY_LABELS = {
  general: '一般',
  life: '生活',
  workplace: '職場',
};

export function formatExploreCategory(category) {
  const normalized = String(category ?? '').trim().toLowerCase();
  return CATEGORY_LABELS[normalized] ?? (normalized ? category : '一般');
}

export function isExploreFeedItemSafe(item) {
  if (!item || typeof item !== 'object') {
    return false;
  }
  const keys = Object.keys(item);
  if (
    keys.length !== EXPLORE_FEED_ALLOWED_ITEM_KEYS.length ||
    !EXPLORE_FEED_ALLOWED_ITEM_KEYS.every((key) => keys.includes(key))
  ) {
    return false;
  }
  return (
    typeof item.poll_id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.category === 'string' &&
    item.status === 'active' &&
    item.published_display === '最近發布' &&
    typeof item.result_page_url === 'string' &&
    item.result_page_url === `/results/${item.poll_id}`
  );
}

export function isExploreFeedPayloadSafe(body) {
  if (!body || typeof body !== 'object' || !Array.isArray(body.polls)) {
    return false;
  }
  if (body.next_cursor !== null && typeof body.next_cursor !== 'string') {
    return false;
  }
  return body.polls.every((poll) => isExploreFeedItemSafe(poll));
}

export function buildExploreFeedRequestUrl({
  origin = 'http://127.0.0.1',
  limit = EXPLORE_FEED_DEFAULT_LIMIT,
  cursor = null,
} = {}) {
  const url = new URL(EXPLORE_FEED_PATH, origin);
  url.searchParams.set('limit', String(limit));
  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }
  return url;
}

export async function fetchExploreFeedPage({
  fetchImpl = globalThis.fetch,
  origin = globalThis.location?.origin ?? 'http://127.0.0.1',
  limit = EXPLORE_FEED_DEFAULT_LIMIT,
  cursor = null,
} = {}) {
  const response = await fetchImpl(
    buildExploreFeedRequestUrl({ origin, limit, cursor }).toString(),
    {
      method: 'GET',
      credentials: 'omit',
      cache: 'no-store',
    },
  );
  if (!response.ok) {
    throw new Error(EXPLORE_LOAD_FAILURE_MESSAGE);
  }
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(EXPLORE_LOAD_FAILURE_MESSAGE);
  }
  if (!isExploreFeedPayloadSafe(body)) {
    throw new Error(EXPLORE_LOAD_FAILURE_MESSAGE);
  }
  return body;
}

export function renderExplorePollCard(documentObject, poll) {
  if (!isExploreFeedItemSafe(poll)) {
    throw new Error('Unsafe explore feed item');
  }

  const article = documentObject.createElement('article');
  article.className = 'mvp-poll-card';
  article.dataset.pollId = poll.poll_id;

  const top = documentObject.createElement('div');
  top.className = 'mvp-poll-card-top';

  const title = documentObject.createElement('h3');
  title.textContent = poll.title;

  const badge = documentObject.createElement('span');
  badge.className = 'mvp-badge mvp-badge-collecting';
  badge.textContent = '收集中';

  top.append(title, badge);

  const meta = documentObject.createElement('p');
  meta.className = 'mvp-poll-card-meta';
  meta.textContent = `${formatExploreCategory(poll.category)} · ${poll.published_display}`;

  const hint = documentObject.createElement('p');
  hint.className = 'mvp-poll-card-hint';
  hint.textContent = '收集中 · 不顯示票數';

  const footer = documentObject.createElement('div');
  footer.className = 'mvp-poll-card-footer';

  const voteLink = documentObject.createElement('a');
  voteLink.className = 'mvp-btn mvp-btn-primary';
  voteLink.href = buildPublicVotePath(poll.poll_id);
  voteLink.textContent = '前往投票';

  footer.append(voteLink);
  article.append(top, meta, hint, footer);
  return article;
}

function setExplorePanelVisible(panel, visible) {
  if (!panel) {
    return;
  }
  panel.hidden = !visible;
}

function mountExplorePage(documentObject, windowObject = globalThis) {
  const listRoot = documentObject.getElementById('explore-feed-list');
  const statusRegion = documentObject.getElementById('explore-status');
  const errorPanel = documentObject.getElementById('explore-error');
  const emptyPanel = documentObject.getElementById('explore-empty');
  const loadMoreButton = documentObject.getElementById('explore-load-more');
  if (!listRoot || !statusRegion) {
    return;
  }

  let nextCursor = null;
  let loading = false;

  const announce = (message) => {
    statusRegion.textContent = message;
  };

  const showError = (message) => {
    setExplorePanelVisible(errorPanel, true);
    if (errorPanel) {
      errorPanel.textContent = message;
    }
    setExplorePanelVisible(emptyPanel, false);
    setExplorePanelVisible(loadMoreButton, false);
  };

  const clearError = () => {
    setExplorePanelVisible(errorPanel, false);
    if (errorPanel) {
      errorPanel.textContent = '';
    }
  };

  const updateEmptyState = (hasItems) => {
    setExplorePanelVisible(emptyPanel, !hasItems);
  };

  const updateLoadMore = () => {
    setExplorePanelVisible(loadMoreButton, Boolean(nextCursor));
    if (loadMoreButton) {
      loadMoreButton.disabled = loading;
    }
  };

  const appendPolls = (polls) => {
    for (const poll of polls) {
      listRoot.append(renderExplorePollCard(documentObject, poll));
    }
    updateEmptyState(listRoot.children.length > 0);
  };

  const loadPage = async ({ reset = false } = {}) => {
    if (loading) {
      return;
    }
    loading = true;
    clearError();
    if (reset) {
      listRoot.replaceChildren();
      nextCursor = null;
      announce(EXPLORE_FEED_LOADING_MESSAGE);
      listRoot.setAttribute('aria-busy', 'true');
    } else if (loadMoreButton) {
      loadMoreButton.setAttribute('aria-busy', 'true');
      loadMoreButton.textContent = EXPLORE_LOAD_MORE_PENDING_MESSAGE;
    }

    try {
      const body = await fetchExploreFeedPage({
        fetchImpl: windowObject.fetch.bind(windowObject),
        origin: windowObject.location.origin,
        cursor: reset ? null : nextCursor,
      });
      appendPolls(body.polls);
      nextCursor = body.next_cursor;
      const total = listRoot.children.length;
      announce(
        total === 0
          ? EXPLORE_FEED_EMPTY_MESSAGE
          : `${EXPLORE_FEED_LIST_MESSAGE}（${EXPLORE_FEED_LIST_SUMMARY}）`,
      );
    } catch {
      if (reset && listRoot.children.length === 0) {
        showError(EXPLORE_LOAD_FAILURE_MESSAGE);
        announce(EXPLORE_LOAD_FAILURE_MESSAGE);
      } else {
        showError(EXPLORE_LOAD_MORE_FAILURE_MESSAGE);
        announce(EXPLORE_LOAD_MORE_FAILURE_MESSAGE);
      }
    } finally {
      loading = false;
      listRoot.removeAttribute('aria-busy');
      if (loadMoreButton) {
        loadMoreButton.removeAttribute('aria-busy');
        loadMoreButton.textContent = '載入更多';
      }
      updateLoadMore();
    }
  };

  loadMoreButton?.addEventListener('click', () => {
    void loadPage({ reset: false });
  });

  void loadPage({ reset: true });
}

if (typeof document !== 'undefined') {
  mountExplorePage(document);
}
