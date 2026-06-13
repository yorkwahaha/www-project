import { renderQualityFeedbackBadge } from './quality-feedback-badge.js';
import {
  buildPublicVotePath,
  PUBLIC_CTA_GO_TO_VOTE_LABEL,
  PUBLIC_CTA_GO_HOME_LABEL,
  PUBLIC_EXPLORE_COLLECTING_STATUS_HINT,
  PUBLIC_EXPLORE_COLLECTING_STATUS_LABEL,
  PUBLIC_EXPLORE_EMPTY_CTA_LABEL,
  PUBLIC_EXPLORE_EMPTY_MESSAGE,
  PUBLIC_EXPLORE_EMPTY_SUMMARY,
  PUBLIC_EXPLORE_FEED_LIST_HINT,
  PUBLIC_EXPLORE_FEED_LIST_SUMMARY_HINT,
  PUBLIC_EXPLORE_FEED_LOADING_MESSAGE,
  PUBLIC_EXPLORE_LOAD_FAILURE_MESSAGE,
  PUBLIC_EXPLORE_LOAD_MORE_LABEL,
  PUBLIC_EXPLORE_LOAD_MORE_PENDING_MESSAGE,
  PUBLIC_EXPLORE_LOAD_MORE_UNAVAILABLE_MESSAGE,
  PUBLIC_EXPLORE_PAGE_LEAD,
  PUBLIC_EXPLORE_PAGE_TITLE,
  renderPublicInlineErrorNote,
} from './public-mvp-ui.js';

export const EXPLORE_PAGE_TITLE = PUBLIC_EXPLORE_PAGE_TITLE;
export const EXPLORE_PAGE_LEAD = PUBLIC_EXPLORE_PAGE_LEAD;

export const EXPLORE_COLLECTING_STATUS_LABEL = PUBLIC_EXPLORE_COLLECTING_STATUS_LABEL;
export const EXPLORE_COLLECTING_STATUS_HINT = PUBLIC_EXPLORE_COLLECTING_STATUS_HINT;

export const EXPLORE_FEED_PATH = '/polls/feed';
export const EXPLORE_FEED_DEFAULT_LIMIT = 20;
export const EXPLORE_FEED_ALLOWED_ITEM_KEYS = [
  'poll_id',
  'title',
  'category',
  'status',
  'published_display',
  'result_page_url',
  'quality_badge',
];

export const EXPLORE_LOAD_FAILURE_MESSAGE = PUBLIC_EXPLORE_LOAD_FAILURE_MESSAGE;
export const EXPLORE_LOAD_MORE_FAILURE_MESSAGE =
  PUBLIC_EXPLORE_LOAD_MORE_UNAVAILABLE_MESSAGE;
export const EXPLORE_FEED_EMPTY_MESSAGE = PUBLIC_EXPLORE_EMPTY_MESSAGE;
export const EXPLORE_VOTE_CTA_LABEL = PUBLIC_CTA_GO_TO_VOTE_LABEL;
export const EXPLORE_FEED_EMPTY_SUMMARY = PUBLIC_EXPLORE_EMPTY_SUMMARY;
export const EXPLORE_FEED_EMPTY_CTA_LABEL = PUBLIC_EXPLORE_EMPTY_CTA_LABEL;
export const EXPLORE_FEED_LIST_MESSAGE = PUBLIC_EXPLORE_FEED_LIST_HINT;
export const EXPLORE_FEED_LIST_SUMMARY = PUBLIC_EXPLORE_FEED_LIST_SUMMARY_HINT;
export const EXPLORE_FEED_LOADING_MESSAGE = PUBLIC_EXPLORE_FEED_LOADING_MESSAGE;
export const EXPLORE_LOAD_MORE_LABEL = PUBLIC_EXPLORE_LOAD_MORE_LABEL;
export const EXPLORE_LOAD_MORE_PENDING_MESSAGE =
  PUBLIC_EXPLORE_LOAD_MORE_PENDING_MESSAGE;
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
    item.result_page_url === `/results/${item.poll_id}` &&
    (item.quality_badge === null || item.quality_badge === 'positive_feedback')
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

  const badgeGroup = documentObject.createElement('div');
  badgeGroup.className = 'mvp-poll-card-badges';

  const statusBadge = documentObject.createElement('span');
  statusBadge.className = 'mvp-badge mvp-badge-collecting';
  statusBadge.textContent = EXPLORE_COLLECTING_STATUS_LABEL;
  badgeGroup.append(statusBadge);

  const qualityFeedbackBadge = renderQualityFeedbackBadge(documentObject, poll);
  if (qualityFeedbackBadge) {
    badgeGroup.append(qualityFeedbackBadge);
  }

  top.append(title, badgeGroup);

  const meta = documentObject.createElement('p');
  meta.className = 'mvp-poll-card-meta';
  meta.textContent = `${formatExploreCategory(poll.category)} · ${poll.published_display}`;

  const hint = documentObject.createElement('p');
  hint.className = 'mvp-poll-card-hint';
  hint.textContent = EXPLORE_COLLECTING_STATUS_HINT;

  const footer = documentObject.createElement('div');
  footer.className = 'mvp-poll-card-footer';

  const voteLink = documentObject.createElement('a');
  voteLink.className = 'mvp-btn mvp-btn-primary';
  voteLink.href = buildPublicVotePath(poll.poll_id);
  voteLink.textContent = PUBLIC_CTA_GO_TO_VOTE_LABEL;

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

export function syncExplorePageSectionHeadings(documentObject) {
  const exploreHeading = documentObject.getElementById('explore-heading');
  if (exploreHeading) {
    exploreHeading.textContent = PUBLIC_EXPLORE_PAGE_TITLE;
  }
}

export function syncExplorePageLeadParagraphs(documentObject) {
  const exploreLead = documentObject.getElementById('explore-page-lead');
  if (exploreLead) {
    exploreLead.textContent = PUBLIC_EXPLORE_PAGE_LEAD;
  }
}

export function syncExplorePageMicrocopy(documentObject) {
  const loadMoreButton = documentObject.getElementById('explore-load-more');
  if (loadMoreButton) {
    loadMoreButton.textContent = PUBLIC_EXPLORE_LOAD_MORE_LABEL;
  }
}

export function syncExploreEmptyStatePanel(documentObject) {
  const emptyPanel = documentObject.getElementById('explore-empty');
  if (!emptyPanel) {
    return;
  }
  const paragraphs = emptyPanel.querySelectorAll('p');
  if (paragraphs[0]) {
    paragraphs[0].textContent = PUBLIC_EXPLORE_EMPTY_MESSAGE;
  }
  if (paragraphs[1]) {
    paragraphs[1].textContent = PUBLIC_EXPLORE_EMPTY_SUMMARY;
  }
  const createLink = emptyPanel.querySelector('a[href="/polls/new?live=1"]');
  if (createLink) {
    createLink.textContent = PUBLIC_EXPLORE_EMPTY_CTA_LABEL;
  }
}

export function syncExplorePageLeadLinks(documentObject) {
  if (typeof documentObject.getElementById !== 'function') {
    return;
  }
  const homeLink = documentObject.getElementById('explore-home-cta');
  if (homeLink) {
    homeLink.textContent = PUBLIC_CTA_GO_HOME_LABEL;
  }
}

export function syncExplorePageStatusCopy(documentObject) {
  const statusRegion = documentObject.getElementById('explore-status');
  if (statusRegion) {
    statusRegion.textContent = EXPLORE_FEED_LOADING_MESSAGE;
  }
}

function mountExplorePage(documentObject, windowObject = globalThis) {
  syncExplorePageSectionHeadings(documentObject);
  syncExplorePageLeadParagraphs(documentObject);
  syncExplorePageMicrocopy(documentObject);
  syncExploreEmptyStatePanel(documentObject);
  syncExplorePageLeadLinks(documentObject);
  syncExplorePageStatusCopy(documentObject);
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

  const showError = (message, { showHomeLink = false } = {}) => {
    setExplorePanelVisible(errorPanel, true);
    if (errorPanel) {
      if (showHomeLink) {
        renderPublicInlineErrorNote(errorPanel, {
          message,
          ctaHref: '/',
          ctaLabel: PUBLIC_CTA_GO_HOME_LABEL,
        });
      } else {
        errorPanel.replaceChildren();
        errorPanel.textContent = message;
      }
    }
    setExplorePanelVisible(emptyPanel, false);
    setExplorePanelVisible(loadMoreButton, false);
  };

  const clearError = () => {
    setExplorePanelVisible(errorPanel, false);
    if (errorPanel) {
      errorPanel.replaceChildren();
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
        showError(EXPLORE_LOAD_FAILURE_MESSAGE, { showHomeLink: true });
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
        loadMoreButton.textContent = PUBLIC_EXPLORE_LOAD_MORE_LABEL;
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
