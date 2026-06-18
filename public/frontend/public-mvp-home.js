/**
 * Phase 301 / 303 — home swipe card visual shell + mixed feed.
 *
 * Renders the public homepage `/` as an ultra-minimal, vertically swipeable
 * feed. Phase 303 switches the data source to the mixed `GET /home/feed`
 * (collecting + revealed items) via home-feed.js, keeping the Phase 301 visual
 * shell. Collecting cards stay question-only (never any aggregate); revealed
 * cards show only the display-safe bucketed result summary the public results
 * page already exposes. `/polls/feed` and the explore client are untouched.
 */
import { formatExploreCategory } from './explore-page.js';
import {
  fetchHomeFeedPage,
  isHomeCollectingFeedItemSafe,
  isHomeFeedItemSafe,
  isHomeRevealedFeedItemSafe,
} from './home-feed.js';
import { renderQualityFeedbackBadge } from './quality-feedback-badge.js';
import { renderPublicEmptyStatePanel } from './public-unavailable-state.js';
import {
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
  PUBLIC_HOME_SWIPE_REVEALED_CTA,
  PUBLIC_HOME_SWIPE_REVEALED_HINT,
} from './public-mvp-ui.js';

export const HOME_SWIPE_CARD_CLASS = 'home-swipe-card';
export const HOME_SWIPE_COLLECTING_STATUS_LABEL = PUBLIC_EXPLORE_COLLECTING_STATUS_LABEL;
export const HOME_SWIPE_COLLECTING_HINT = PUBLIC_HOME_SWIPE_COLLECTING_HINT;
export const HOME_SWIPE_ANSWER_CTA_LABEL = PUBLIC_HOME_SWIPE_ANSWER_CTA;
export const HOME_SWIPE_REVEALED_CTA_LABEL = PUBLIC_HOME_SWIPE_REVEALED_CTA;
export const HOME_SWIPE_LOADING_MESSAGE = PUBLIC_HOME_SWIPE_LOADING_MESSAGE;
export const HOME_SWIPE_EMPTY_MESSAGE = PUBLIC_HOME_SWIPE_EMPTY_MESSAGE;
export const HOME_SWIPE_ERROR_MESSAGE = PUBLIC_HOME_SWIPE_ERROR_MESSAGE;

/** Backwards-compatible alias: the collecting-card guard. */
export const isHomeSwipeFeedItemSafe = isHomeCollectingFeedItemSafe;

export const HOME_SWIPE_ADJACENT_SCROLL_BLOCK = 'center';

const HOME_SWIPE_POINTER_CLICK_THRESHOLD_PX = 8;

/**
 * @param {Element | null | undefined} stage
 * @returns {Element[]}
 */
export function getHomeSwipeCards(stage) {
  if (!stage || typeof stage.querySelectorAll !== 'function') {
    return [];
  }
  return [...stage.querySelectorAll('.home-swipe-card:not(.home-swipe-card--skeleton)')];
}

/**
 * @param {Element} stage
 * @returns {number}
 */
export function resolveFocusedHomeSwipeCardIndex(stage) {
  const cards = getHomeSwipeCards(stage);
  if (!cards.length || typeof stage.getBoundingClientRect !== 'function') {
    return -1;
  }
  const stageRect = stage.getBoundingClientRect();
  const stageCenter = stageRect.top + stageRect.height / 2;
  let currentIndex = 0;
  let minDistance = Number.POSITIVE_INFINITY;
  cards.forEach((card, index) => {
    if (typeof card.getBoundingClientRect !== 'function') {
      return;
    }
    const cardRect = card.getBoundingClientRect();
    const cardCenter = cardRect.top + cardRect.height / 2;
    const distance = Math.abs(cardCenter - stageCenter);
    if (distance < minDistance) {
      minDistance = distance;
      currentIndex = index;
    }
  });
  return currentIndex;
}

/**
 * @param {Element} stage
 * @param {'next' | 'prev'} direction
 * @param {{ behavior?: ScrollBehavior }} [options]
 * @returns {boolean}
 */
export function scrollAdjacentHomeSwipeCard(
  stage,
  direction,
  { behavior = 'smooth' } = {},
) {
  const cards = getHomeSwipeCards(stage);
  const currentIndex = resolveFocusedHomeSwipeCardIndex(stage);
  if (currentIndex < 0) {
    return false;
  }
  const nextIndex =
    direction === 'next'
      ? Math.min(currentIndex + 1, cards.length - 1)
      : Math.max(currentIndex - 1, 0);
  if (nextIndex === currentIndex) {
    return false;
  }
  const target = cards[nextIndex];
  target?.scrollIntoView?.({ behavior, block: HOME_SWIPE_ADJACENT_SCROLL_BLOCK });
  return true;
}

/**
 * @param {KeyboardEvent} event
 * @param {Element} stage
 * @param {Window} [windowObject]
 * @returns {boolean}
 */
export function handleHomeSwipeStageKeydown(event, stage, windowObject = globalThis) {
  const isNext = event.key === 'ArrowDown' || event.key === 'PageDown';
  const isPrev = event.key === 'ArrowUp' || event.key === 'PageUp';
  if (!isNext && !isPrev) {
    return false;
  }
  const reducedMotion = windowObject.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const behavior = reducedMotion ? 'auto' : 'smooth';
  const scrolled = scrollAdjacentHomeSwipeCard(stage, isNext ? 'next' : 'prev', {
    behavior,
  });
  if (scrolled) {
    event.preventDefault();
  }
  return scrolled;
}

/**
 * Attach safe whole-card navigation. The inner CTA link stays the real
 * focusable/activatable target; clicks from it (or any interactive descendant)
 * are left alone so focus and keyboard activation are never hijacked, and a
 * scroll/swipe gesture never fires a click.
 *
 * @param {Document} documentObject
 * @param {{ addEventListener?: Function }} article
 * @param {string} href
 */
function attachWholeCardNavigation(documentObject, article, href) {
  if (typeof article.addEventListener !== 'function') {
    return;
  }
  let pointerStart = null;
  article.addEventListener('pointerdown', (event) => {
    pointerStart = { x: event.clientX, y: event.clientY };
  });
  article.addEventListener('pointercancel', () => {
    pointerStart = null;
  });
  article.addEventListener('click', (event) => {
    const target = /** @type {Element | null} */ (event.target);
    if (target && typeof target.closest === 'function' && target.closest('a, button')) {
      return;
    }
    if (pointerStart) {
      const deltaX = Math.abs(event.clientX - pointerStart.x);
      const deltaY = Math.abs(event.clientY - pointerStart.y);
      pointerStart = null;
      if (
        deltaX > HOME_SWIPE_POINTER_CLICK_THRESHOLD_PX ||
        deltaY > HOME_SWIPE_POINTER_CLICK_THRESHOLD_PX
      ) {
        return;
      }
    }
    const win = documentObject.defaultView ?? globalThis;
    win.location.assign(href);
  });
}

/**
 * Build one collecting home card (question-only). Throws on unsafe items so an
 * accidental aggregate/extra field can never reach the DOM.
 *
 * @param {Document} documentObject
 * @param {Record<string, unknown>} item
 */
export function renderHomeSwipeCard(documentObject, item) {
  if (!isHomeCollectingFeedItemSafe(item)) {
    throw new Error('Unsafe home collecting feed item');
  }

  const article = documentObject.createElement('article');
  article.className = HOME_SWIPE_CARD_CLASS;
  article.dataset.pollId = item.poll_id;
  article.dataset.state = 'collecting';

  const top = documentObject.createElement('div');
  top.className = 'home-swipe-card-top';

  const statusBadge = documentObject.createElement('span');
  statusBadge.className = 'mvp-badge mvp-badge-collecting';
  statusBadge.textContent = HOME_SWIPE_COLLECTING_STATUS_LABEL;

  const meta = documentObject.createElement('span');
  meta.className = 'home-swipe-card-meta';
  meta.textContent = `${formatExploreCategory(item.category)} · ${item.published_display}`;

  top.append(statusBadge, meta);

  const title = documentObject.createElement('h2');
  title.className = 'home-swipe-card-title';
  title.textContent = item.title;

  const hint = documentObject.createElement('p');
  hint.className = 'home-swipe-card-hint';
  hint.textContent = HOME_SWIPE_COLLECTING_HINT;

  const actions = documentObject.createElement('div');
  actions.className = 'home-swipe-card-actions';

  const voteLink = documentObject.createElement('a');
  voteLink.className = 'mvp-btn mvp-btn-primary home-swipe-card-cta';
  voteLink.href = item.vote_page_url;
  voteLink.textContent = HOME_SWIPE_ANSWER_CTA_LABEL;

  const nextHint = documentObject.createElement('span');
  nextHint.className = 'home-swipe-card-next';
  nextHint.setAttribute('aria-hidden', 'true');
  nextHint.textContent = PUBLIC_HOME_SWIPE_NEXT_HINT;

  actions.append(voteLink, nextHint);
  article.append(top, title, hint, actions);

  attachWholeCardNavigation(documentObject, article, item.vote_page_url);
  return article;
}

/**
 * Build one revealed home card showing only the display-safe bucketed result
 * summary (leading option label + bucketed percentage + bucketed total). Never
 * renders raw counts or option linkage. Throws on unsafe items.
 *
 * @param {Document} documentObject
 * @param {Record<string, any>} item
 */
export function renderHomeRevealedCard(documentObject, item) {
  if (!isHomeRevealedFeedItemSafe(item)) {
    throw new Error('Unsafe home revealed feed item');
  }

  const article = documentObject.createElement('article');
  article.className = `${HOME_SWIPE_CARD_CLASS} home-swipe-card--revealed`;
  article.dataset.pollId = item.poll_id;
  article.dataset.state = 'revealed';

  const top = documentObject.createElement('div');
  top.className = 'home-swipe-card-top';

  const statusBadge = documentObject.createElement('span');
  statusBadge.className = 'mvp-badge mvp-badge-revealed';
  statusBadge.textContent = item.lifecycle_label;
  top.append(statusBadge);

  const feedbackBadge = renderQualityFeedbackBadge(documentObject, item);
  if (feedbackBadge) {
    top.append(feedbackBadge);
  }

  const meta = documentObject.createElement('span');
  meta.className = 'home-swipe-card-meta';
  meta.textContent = `${formatExploreCategory(item.category)} · ${item.published_display}`;
  top.append(meta);

  const title = documentObject.createElement('h2');
  title.className = 'home-swipe-card-title';
  title.textContent = item.title;

  const hint = documentObject.createElement('p');
  hint.className = 'home-swipe-card-hint';
  hint.textContent = PUBLIC_HOME_SWIPE_REVEALED_HINT;

  const summary = documentObject.createElement('div');
  summary.className = 'home-swipe-card-result';
  const lead = item.result_summary.leading_option;
  if (lead) {
    const leadLabel = documentObject.createElement('span');
    leadLabel.className = 'home-swipe-card-result-lead';
    leadLabel.textContent = lead.display_label;

    const leadPercent = documentObject.createElement('span');
    leadPercent.className = 'home-swipe-card-result-percent';
    leadPercent.textContent = lead.display_percentage;

    summary.append(leadLabel, leadPercent);
  }
  const totalMeta = documentObject.createElement('span');
  totalMeta.className = 'home-swipe-card-result-total';
  totalMeta.textContent = item.result_summary.total_votes_display;
  summary.append(totalMeta);

  const actions = documentObject.createElement('div');
  actions.className = 'home-swipe-card-actions';

  const resultLink = documentObject.createElement('a');
  resultLink.className = 'mvp-btn mvp-btn-primary home-swipe-card-cta';
  resultLink.href = item.result_page_url;
  resultLink.textContent = HOME_SWIPE_REVEALED_CTA_LABEL;

  const nextHint = documentObject.createElement('span');
  nextHint.className = 'home-swipe-card-next';
  nextHint.setAttribute('aria-hidden', 'true');
  nextHint.textContent = PUBLIC_HOME_SWIPE_NEXT_HINT;

  actions.append(resultLink, nextHint);
  article.append(top, title, hint, summary, actions);

  attachWholeCardNavigation(documentObject, article, item.result_page_url);
  return article;
}

/**
 * Dispatch one validated home feed item to its renderer. Returns `null` for
 * any item that fails validation (dropped, never rendered).
 *
 * @param {Document} documentObject
 * @param {Record<string, unknown>} item
 */
export function renderHomeFeedItem(documentObject, item) {
  if (!isHomeFeedItemSafe(item)) {
    return null;
  }
  if (item.state === 'revealed') {
    return renderHomeRevealedCard(documentObject, item);
  }
  return renderHomeSwipeCard(documentObject, item);
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

  const appendItems = (items) => {
    for (const item of items) {
      const card = renderHomeFeedItem(documentObject, item);
      if (card) {
        stage.append(card);
        cardCount += 1;
      }
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
      const body = await fetchHomeFeedPage({
        fetchImpl: windowObject.fetch.bind(windowObject),
        origin: windowObject.location.origin,
        cursor: reset ? null : nextCursor,
      });
      if (reset) {
        clearSkeleton();
      }
      appendItems(body.items);
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

  if (typeof stage.addEventListener === 'function') {
    stage.tabIndex = 0;
    stage.addEventListener('keydown', (event) => {
      handleHomeSwipeStageKeydown(event, stage, windowObject);
    });
  }

  void loadPage({ reset: true });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mountHomeSwipeFeed(document));
  } else {
    mountHomeSwipeFeed(document);
  }
}
