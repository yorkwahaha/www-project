/**
 * Phase 301 — home swipe card visual shell.
 *
 * Renders the public homepage `/` as an ultra-minimal, vertically swipeable
 * feed of *collecting-only* poll cards. It reuses the existing freshness-only
 * `/polls/feed` contract (via explore-page.js) without changing it, and never
 * renders counts, percentages, totals, ranks, trends, progress or any other
 * aggregate. Revealed-result cards are intentionally out of scope.
 */
import {
  fetchExploreFeedPage,
  formatExploreCategory,
  isExploreFeedItemSafe,
} from './explore-page.js';
import { renderPublicEmptyStatePanel } from './public-unavailable-state.js';
import {
  buildPublicVotePath,
  PUBLIC_EXPLORE_COLLECTING_STATUS_LABEL,
  PUBLIC_HOME_SWIPE_ANSWER_CTA,
  PUBLIC_HOME_SWIPE_COLLECTING_HINT,
  PUBLIC_HOME_SWIPE_EMPTY_CTA_LABEL,
  PUBLIC_HOME_SWIPE_EMPTY_MESSAGE,
  PUBLIC_HOME_SWIPE_EMPTY_SUMMARY,
  PUBLIC_HOME_SWIPE_ERROR_MESSAGE,
  PUBLIC_HOME_SWIPE_EXPLORE_FALLBACK_LABEL,
  PUBLIC_HOME_SWIPE_LIST_READY_MESSAGE,
  PUBLIC_HOME_SWIPE_LOADING_MESSAGE,
  PUBLIC_HOME_SWIPE_LOAD_MORE_LABEL,
  PUBLIC_HOME_SWIPE_NEXT_HINT,
  PUBLIC_HOME_SWIPE_RETRY_LABEL,
} from './public-mvp-ui.js';

export const HOME_SWIPE_CARD_CLASS = 'home-swipe-card';
export const HOME_SWIPE_COLLECTING_STATUS_LABEL = PUBLIC_EXPLORE_COLLECTING_STATUS_LABEL;
export const HOME_SWIPE_COLLECTING_HINT = PUBLIC_HOME_SWIPE_COLLECTING_HINT;
export const HOME_SWIPE_ANSWER_CTA_LABEL = PUBLIC_HOME_SWIPE_ANSWER_CTA;
export const HOME_SWIPE_LOADING_MESSAGE = PUBLIC_HOME_SWIPE_LOADING_MESSAGE;
export const HOME_SWIPE_EMPTY_MESSAGE = PUBLIC_HOME_SWIPE_EMPTY_MESSAGE;
export const HOME_SWIPE_ERROR_MESSAGE = PUBLIC_HOME_SWIPE_ERROR_MESSAGE;

/** Re-export of the freshness-only feed item guard (collecting-only contract). */
export const isHomeSwipeFeedItemSafe = isExploreFeedItemSafe;

/**
 * Build one collecting-only home swipe card. Reads ONLY non-aggregate fields
 * (poll_id, title, category, published_display). Throws on unsafe items so an
 * accidental aggregate field can never reach the DOM.
 *
 * @param {Document} documentObject
 * @param {Record<string, unknown>} poll
 */
export function renderHomeSwipeCard(documentObject, poll) {
  if (!isExploreFeedItemSafe(poll)) {
    throw new Error('Unsafe home swipe feed item');
  }

  const article = documentObject.createElement('article');
  article.className = HOME_SWIPE_CARD_CLASS;
  article.dataset.pollId = poll.poll_id;

  const top = documentObject.createElement('div');
  top.className = 'home-swipe-card-top';

  const statusBadge = documentObject.createElement('span');
  statusBadge.className = 'mvp-badge mvp-badge-collecting';
  statusBadge.textContent = HOME_SWIPE_COLLECTING_STATUS_LABEL;

  const meta = documentObject.createElement('span');
  meta.className = 'home-swipe-card-meta';
  meta.textContent = `${formatExploreCategory(poll.category)} · ${poll.published_display}`;

  top.append(statusBadge, meta);

  const title = documentObject.createElement('h2');
  title.className = 'home-swipe-card-title';
  title.textContent = poll.title;

  const hint = documentObject.createElement('p');
  hint.className = 'home-swipe-card-hint';
  hint.textContent = HOME_SWIPE_COLLECTING_HINT;

  const actions = documentObject.createElement('div');
  actions.className = 'home-swipe-card-actions';

  const voteLink = documentObject.createElement('a');
  voteLink.className = 'mvp-btn mvp-btn-primary home-swipe-card-cta';
  voteLink.href = buildPublicVotePath(poll.poll_id);
  voteLink.textContent = HOME_SWIPE_ANSWER_CTA_LABEL;

  const nextHint = documentObject.createElement('span');
  nextHint.className = 'home-swipe-card-next';
  nextHint.setAttribute('aria-hidden', 'true');
  nextHint.textContent = PUBLIC_HOME_SWIPE_NEXT_HINT;

  actions.append(voteLink, nextHint);
  article.append(top, title, hint, actions);

  // Whole-card navigation as a progressive enhancement. The CTA link stays the
  // real focusable/activatable target; clicks originating from it (or any other
  // interactive descendant) are left alone so focus and keyboard activation are
  // never hijacked, and a scroll/swipe gesture never fires a click.
  if (typeof article.addEventListener === 'function') {
    article.addEventListener('click', (event) => {
      const target = /** @type {Element | null} */ (event.target);
      if (target && typeof target.closest === 'function' && target.closest('a, button')) {
        return;
      }
      const win = documentObject.defaultView ?? globalThis;
      win.location.assign(buildPublicVotePath(poll.poll_id));
    });
  }

  return article;
}

function setPanelVisible(panel, visible) {
  if (panel) {
    panel.hidden = !visible;
  }
}

/**
 * @param {Document} documentObject
 * @param {Window} [windowObject]
 */
export function mountHomeSwipeFeed(documentObject, windowObject = globalThis) {
  if (typeof documentObject.getElementById !== 'function') {
    return;
  }
  const stage = documentObject.getElementById('home-swipe-stage');
  const statusRegion = documentObject.getElementById('home-swipe-status');
  if (!stage || !statusRegion) {
    return;
  }
  const loadMoreButton = documentObject.getElementById('home-swipe-load-more');
  const emptyPanel = documentObject.getElementById('home-swipe-empty');
  const errorPanel = documentObject.getElementById('home-swipe-error');

  let nextCursor = null;
  let loading = false;
  let cardCount = 0;

  const announce = (message) => {
    statusRegion.textContent = message;
  };

  const clearError = () => {
    setPanelVisible(errorPanel, false);
    if (errorPanel && typeof errorPanel.replaceChildren === 'function') {
      errorPanel.replaceChildren();
    }
  };

  const showError = () => {
    if (errorPanel && typeof errorPanel.replaceChildren === 'function') {
      errorPanel.replaceChildren();

      const body = documentObject.createElement('p');
      body.className = 'panel-message';
      body.textContent = PUBLIC_HOME_SWIPE_ERROR_MESSAGE;

      const actions = documentObject.createElement('div');
      actions.className = 'home-swipe-error-actions';

      const retry = documentObject.createElement('button');
      retry.type = 'button';
      retry.className = 'mvp-btn mvp-btn-secondary';
      retry.textContent = PUBLIC_HOME_SWIPE_RETRY_LABEL;
      retry.addEventListener?.('click', () => {
        void loadPage({ reset: true });
      });

      const exploreLink = documentObject.createElement('a');
      exploreLink.className = 'mvp-action-link';
      exploreLink.href = '/explore';
      exploreLink.textContent = PUBLIC_HOME_SWIPE_EXPLORE_FALLBACK_LABEL;

      actions.append(retry, exploreLink);
      errorPanel.append(body, actions);
      setPanelVisible(errorPanel, true);
    }
    announce(PUBLIC_HOME_SWIPE_ERROR_MESSAGE);
  };

  const showEmpty = () => {
    if (emptyPanel) {
      renderPublicEmptyStatePanel(documentObject, emptyPanel, {
        message: PUBLIC_HOME_SWIPE_EMPTY_MESSAGE,
        summary: PUBLIC_HOME_SWIPE_EMPTY_SUMMARY,
        ctaHref: '/polls/new?live=1',
        ctaLabel: PUBLIC_HOME_SWIPE_EMPTY_CTA_LABEL,
      });
      setPanelVisible(emptyPanel, true);
    }
    announce(PUBLIC_HOME_SWIPE_EMPTY_MESSAGE);
  };

  const updateLoadMore = () => {
    setPanelVisible(loadMoreButton, Boolean(nextCursor));
    if (loadMoreButton) {
      loadMoreButton.disabled = loading;
      loadMoreButton.textContent = PUBLIC_HOME_SWIPE_LOAD_MORE_LABEL;
    }
  };

  const clearSkeleton = () => {
    const skeleton = stage.querySelector?.('.home-swipe-card--skeleton');
    skeleton?.remove?.();
  };

  const appendPolls = (polls) => {
    for (const poll of polls) {
      stage.append(renderHomeSwipeCard(documentObject, poll));
      cardCount += 1;
    }
  };

  const loadPage = async ({ reset = false } = {}) => {
    if (loading) {
      return;
    }
    loading = true;
    clearError();
    if (reset) {
      announce(PUBLIC_HOME_SWIPE_LOADING_MESSAGE);
      stage.setAttribute('aria-busy', 'true');
    }
    updateLoadMore();

    try {
      const body = await fetchExploreFeedPage({
        fetchImpl: windowObject.fetch.bind(windowObject),
        origin: windowObject.location.origin,
        cursor: reset ? null : nextCursor,
      });
      if (reset) {
        clearSkeleton();
      }
      appendPolls(body.polls);
      nextCursor = body.next_cursor;
      if (cardCount === 0) {
        showEmpty();
      } else {
        setPanelVisible(emptyPanel, false);
        announce(PUBLIC_HOME_SWIPE_LIST_READY_MESSAGE);
      }
    } catch {
      if (reset) {
        clearSkeleton();
      }
      showError();
    } finally {
      loading = false;
      stage.removeAttribute('aria-busy');
      updateLoadMore();
    }
  };

  loadMoreButton?.addEventListener?.('click', () => {
    void loadPage({ reset: false });
  });

  void loadPage({ reset: true });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mountHomeSwipeFeed(document));
  } else {
    mountHomeSwipeFeed(document);
  }
}
