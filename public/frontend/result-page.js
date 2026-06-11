import {
  getDemoCollectingResultPayload,
  isDemoPollRouteId,
  renderResultUiStatePreviewLinks,
} from './public-mvp-demo.js';
import {
  isPublicMvpPagePollId,
  buildPublicVotePath,
  markRegionBusy,
  parsePollApiError,
  PUBLIC_RESULTS_CANCELLED_MESSAGE,
  PUBLIC_RESULTS_CANCELLED_TITLE,
  PUBLIC_RESULTS_COLLECTING_SUMMARY,
  PUBLIC_RESULTS_COLLECTING_TITLE,
  PUBLIC_RESULTS_EMPTY_AGGREGATE_MESSAGE,
  PUBLIC_RESULTS_POLL_UNAVAILABLE_MESSAGE,
  PUBLIC_RESULTS_UNAVAILABLE_AGGREGATE_SUMMARY,
  PUBLIC_RESULTS_UNPUBLISHED_MESSAGE,
  PUBLIC_RESULTS_UNPUBLISHED_TITLE,
  PUBLIC_CTA_CREATOR_RESULTS_LABEL,
  PUBLIC_CTA_GO_TO_VOTE_PAGE_LABEL,
  PUBLIC_CTA_MY_POLLS_LABEL,
  renderPublicErrorPanel,
  renderPublicNav,
  resolvePublicErrorUserMessage,
} from './public-mvp-ui.js';
import { mountSiteChrome } from './public-mvp-layout.js';
import {
  parseCreatorManageMode,
  renderCreatorLifecycleActions,
} from './poll-lifecycle-controls.js';
import {
  POLICY_UI_COPY,
  applyResultUiMockState,
  isCollectingUiMockState,
  mountUiMockPreviewChrome,
  parseUiMockState,
  renderCollectingPolicyExtras,
  renderResultPagePolicyExtras,
  renderUiMockStatePanel,
} from './policy-ui-placeholders.js';

function appendText(parent, tagName, text, className) {
  const element = parent.ownerDocument.createElement(tagName);
  element.className = className;
  element.textContent = text;
  parent.append(element);
}

const PUBLIC_NOTICE_TYPE = 'suspended_typo_correction_applied';
export const RESULTS_COLLECTING_TITLE = PUBLIC_RESULTS_COLLECTING_TITLE;
export const RESULTS_COLLECTING_SUMMARY = PUBLIC_RESULTS_COLLECTING_SUMMARY;
export const RESULTS_CANCELLED_TITLE = PUBLIC_RESULTS_CANCELLED_TITLE;
export const RESULTS_CANCELLED_MESSAGE = PUBLIC_RESULTS_CANCELLED_MESSAGE;
export const RESULTS_UNPUBLISHED_TITLE = PUBLIC_RESULTS_UNPUBLISHED_TITLE;
export const RESULTS_UNPUBLISHED_MESSAGE = PUBLIC_RESULTS_UNPUBLISHED_MESSAGE;
export const RESULTS_POLL_UNAVAILABLE_MESSAGE = PUBLIC_RESULTS_POLL_UNAVAILABLE_MESSAGE;
export const RESULTS_EMPTY_AGGREGATE_MESSAGE = PUBLIC_RESULTS_EMPTY_AGGREGATE_MESSAGE;
export const RESULTS_LOAD_FAILURE_MESSAGE = '目前無法載入結果，請稍後再試。';
export const RESULTS_VOTE_CTA_LABEL = PUBLIC_CTA_GO_TO_VOTE_PAGE_LABEL;
export const RESULTS_MY_POLLS_CTA_LABEL = PUBLIC_CTA_MY_POLLS_LABEL;
export const RESULT_PAGE_LOADING_MESSAGE = '載入結果中，請稍候。';
const SAFE_LOAD_FAILURE_MESSAGE = RESULTS_LOAD_FAILURE_MESSAGE;

export const RESULT_PAGE_LOAD_USER_MESSAGES = [
  RESULTS_LOAD_FAILURE_MESSAGE,
  RESULTS_POLL_UNAVAILABLE_MESSAGE,
];
/** Shown when lifecycle POST succeeded but GET /results refresh failed (Phase 58D). */
export const RESULT_DISPLAY_REFRESH_FAILURE_MESSAGE =
  '問卷狀態已更新，但結果顯示暫時無法重新載入。請重新整理頁面查看最新內容。';
const PUBLIC_LIFECYCLE_STATES = [
  'draft',
  'collecting',
  'cancelled',
  'revealed',
  'locked',
  'post_lock',
  'unpublished',
];
const LIFECYCLE_AGGREGATE_STATES = new Set(['revealed', 'locked', 'post_lock']);
const LIFECYCLE_UNAVAILABLE_STATES = new Set(['draft', 'cancelled', 'unpublished']);
export function messageForResultLoadFailure({ status, errorCode } = {}) {
  if (
    status === 404 ||
    errorCode === 'POLL_NOT_FOUND' ||
    errorCode === 'INVALID_POLL_ID' ||
    errorCode === 'POLL_VALIDATION'
  ) {
    return RESULTS_POLL_UNAVAILABLE_MESSAGE;
  }
  return RESULTS_LOAD_FAILURE_MESSAGE;
}

export function getPollIdFromResultPath(pathname) {
  const match = pathname.match(/^\/results\/([^/]+)$/);
  return match?.[1] ?? null;
}

export async function loadResultDisplay({ pollId, fetchImpl = globalThis.fetch }) {
  let response;
  try {
    response = await fetchImpl(`/polls/${encodeURIComponent(pollId)}/results`, {
      method: 'GET',
      credentials: 'omit',
      cache: 'no-store',
    });
  } catch {
    throw new Error(RESULTS_LOAD_FAILURE_MESSAGE);
  }
  if (!response.ok) {
    const apiError = await parsePollApiError(response);
    throw new Error(messageForResultLoadFailure(apiError));
  }
  try {
    return await response.json();
  } catch {
    throw new Error(RESULTS_LOAD_FAILURE_MESSAGE);
  }
}

export async function loadPublicNotices({ pollId, fetchImpl = globalThis.fetch }) {
  const response = await fetchImpl(
    `/polls/${encodeURIComponent(pollId)}/public-notices`,
    {
      method: 'GET',
      credentials: 'omit',
      cache: 'no-store',
    },
  );
  if (!response.ok) {
    throw new Error('Unable to load public notices');
  }
  return response.json();
}

export function getPublicLifecycleState(result) {
  if (!result || typeof result !== 'object') {
    return null;
  }
  const state = result.public_lifecycle_state;
  if (typeof state === 'string' && PUBLIC_LIFECYCLE_STATES.includes(state)) {
    return state;
  }
  return null;
}

function isLegacyCollectingResult(result) {
  if (!result || typeof result !== 'object') {
    return false;
  }
  if (result.collecting === true || result.display_mode === 'collecting') {
    return true;
  }
  const options = Array.isArray(result.options) ? result.options : [];
  if (options.length === 0) {
    return false;
  }
  return options.every(
    (option) =>
      option &&
      typeof option === 'object' &&
      option.display_count == null &&
      option.display_percentage == null,
  );
}

/** Lifecycle collecting only; ignores display-tier sub-30 signals after reveal. */
export function isCollectingResult(result) {
  const lifecycle = getPublicLifecycleState(result);
  if (lifecycle !== null) {
    return lifecycle === 'collecting';
  }
  return isLegacyCollectingResult(result);
}

export function resolveUnavailableUserMessage(result) {
  const lifecycle = getPublicLifecycleState(result);
  if (lifecycle === 'cancelled') {
    return RESULTS_CANCELLED_MESSAGE;
  }
  if (lifecycle === 'unpublished') {
    return RESULTS_UNPUBLISHED_MESSAGE;
  }
  return RESULTS_POLL_UNAVAILABLE_MESSAGE;
}

export function resolveResultRenderMode(result) {
  const lifecycle = getPublicLifecycleState(result);
  if (lifecycle === 'collecting') {
    return 'collecting';
  }
  if (LIFECYCLE_UNAVAILABLE_STATES.has(lifecycle)) {
    return 'unavailable';
  }
  if (LIFECYCLE_AGGREGATE_STATES.has(lifecycle)) {
    return 'aggregate';
  }
  if (isLegacyCollectingResult(result)) {
    return 'collecting';
  }
  return 'aggregate';
}

export function normalizeDisplaySafeResult(result) {
  if (!result || typeof result !== 'object') {
    return null;
  }
  const options = Array.isArray(result.options)
    ? result.options.filter(
        (option) =>
          option &&
          typeof option === 'object' &&
          typeof option.display_label === 'string',
      )
    : [];
  const mode = resolveResultRenderMode(result);
  return {
    mode,
    public_lifecycle_state: getPublicLifecycleState(result),
    collecting: mode === 'collecting',
    user_message: mode === 'unavailable' ? resolveUnavailableUserMessage(result) : '',
    total_votes_display:
      typeof result.total_votes_display === 'string'
        ? result.total_votes_display
        : '',
    updated_display:
      typeof result.updated_display === 'string' ? result.updated_display : '',
    options,
  };
}

export function renderCollectingStatusBlock(root) {
  const block = root.ownerDocument.createElement('section');
  block.className = 'result-collecting-status';
  block.setAttribute('role', 'status');
  block.setAttribute('aria-label', '收集中狀態說明');

  appendText(block, 'h2', RESULTS_COLLECTING_TITLE, 'result-collecting-title');
  appendText(
    block,
    'p',
    RESULTS_COLLECTING_SUMMARY,
    'result-collecting-summary',
  );
  appendText(
    block,
    'p',
    POLICY_UI_COPY.collectingRevealHint,
    'result-collecting-reveal',
  );
  renderCollectingPolicyExtras(block);

  root.append(block);
}

function unavailableStatusTitle(lifecycleState) {
  if (lifecycleState === 'cancelled') {
    return RESULTS_CANCELLED_TITLE;
  }
  if (lifecycleState === 'unpublished') {
    return RESULTS_UNPUBLISHED_TITLE;
  }
  return RESULTS_POLL_UNAVAILABLE_MESSAGE;
}

export function renderUnavailableStatusBlock(
  root,
  { userMessage, lifecycleState = null } = {},
) {
  const block = root.ownerDocument.createElement('section');
  block.className = 'result-unavailable-status';
  block.setAttribute('role', 'status');
  block.setAttribute('aria-label', '結果不可用說明');

  appendText(block, 'h2', unavailableStatusTitle(lifecycleState), 'result-unavailable-title');
  appendText(
    block,
    'p',
    userMessage || RESULTS_POLL_UNAVAILABLE_MESSAGE,
    'result-unavailable-message',
  );
  appendText(
    block,
    'p',
    PUBLIC_RESULTS_UNAVAILABLE_AGGREGATE_SUMMARY,
    'result-unavailable-summary',
  );

  root.append(block);
}

export function renderResultsReadOnlyIntro(root, pollId) {
  root.replaceChildren();
  root.hidden = false;

  const lead = root.ownerDocument.createElement('p');
  lead.className = 'results-intro-lead';
  lead.textContent =
    '此為公開結果頁（唯讀）：可查看目前顯示安全的統計摘要，無法在此投票或編輯問卷。';
  root.append(lead);

  const scope = root.ownerDocument.createElement('p');
  scope.className = 'mvp-meta results-intro-scope';
  scope.textContent =
    '本頁不含登入、個人化推薦、排行榜或 feed 列表。已公開結果為顯示安全的區間化摘要，非即時原始票數。';
  const privacy = root.ownerDocument.createElement('p');
  privacy.className = 'mvp-meta results-intro-privacy';
  privacy.textContent = POLICY_UI_COPY.votePrivacy;
  root.append(privacy);
  root.append(scope);

  if (pollId) {
    const voteHint = root.ownerDocument.createElement('p');
    voteHint.className = 'results-intro-vote-hint';
    voteHint.textContent = '若要參與投票，請前往投票頁：';
    root.append(voteHint);

    const voteLink = root.ownerDocument.createElement('a');
    voteLink.className = 'mvp-action-link vote-cta-link';
    voteLink.href = buildPublicVotePath(pollId);
    voteLink.textContent = PUBLIC_CTA_GO_TO_VOTE_PAGE_LABEL;
    root.append(voteLink);
  }
}

function renderOptionLabelsList(root, options, { headingText }) {
  if (headingText) {
    appendText(root, 'h2', headingText, 'result-options-heading');
  }
  for (const option of options) {
    const optionElement = root.ownerDocument.createElement('section');
    optionElement.className = 'result-option result-option-label-only';
    appendText(optionElement, 'h3', option.display_label, 'result-label');
    root.append(optionElement);
  }
}

export function renderResultDisplay(
  root,
  result,
  { attachPolicyExtras = true } = {},
) {
  root.replaceChildren();
  const normalized = normalizeDisplaySafeResult(result);
  if (!normalized) {
    appendText(root, 'p', RESULTS_LOAD_FAILURE_MESSAGE, 'result-empty');
    return;
  }

  if (normalized.mode === 'collecting') {
    renderCollectingStatusBlock(root);
    if (normalized.options.length === 0) {
      if (attachPolicyExtras) {
        renderResultPagePolicyExtras(root, { collecting: true });
      }
      return;
    }
    renderOptionLabelsList(root, normalized.options, {
      headingText: '目前公開的選項（不含票數）',
    });
    if (attachPolicyExtras) {
      renderResultPagePolicyExtras(root, { collecting: true });
    }
    return;
  }

  if (normalized.mode === 'unavailable') {
    renderUnavailableStatusBlock(root, {
      userMessage: normalized.user_message,
      lifecycleState: normalized.public_lifecycle_state,
    });
    if (normalized.options.length === 0) {
      if (attachPolicyExtras) {
        renderResultPagePolicyExtras(root, { collecting: false });
      }
      return;
    }
    renderOptionLabelsList(root, normalized.options, {
      headingText: '問卷選項（不含票數）',
    });
    if (attachPolicyExtras) {
      renderResultPagePolicyExtras(root, { collecting: false });
    }
    return;
  }

  if (normalized.total_votes_display) {
    appendText(root, 'p', normalized.total_votes_display, 'result-total');
  }
  if (normalized.updated_display) {
    appendText(root, 'p', normalized.updated_display, 'result-updated');
  }

  if (normalized.options.length === 0) {
    appendText(root, 'p', RESULTS_EMPTY_AGGREGATE_MESSAGE, 'result-empty');
    if (attachPolicyExtras) {
      renderResultPagePolicyExtras(root, { collecting: false });
    }
    return;
  }

  for (const option of normalized.options) {
    const optionElement = root.ownerDocument.createElement('section');
    optionElement.className = 'result-option';
    appendText(optionElement, 'h2', option.display_label, 'result-label');
    if (option.display_percentage != null && option.display_percentage !== '') {
      appendText(optionElement, 'p', option.display_percentage, 'result-percentage');
    }
    if (option.display_count != null && option.display_count !== '') {
      appendText(optionElement, 'p', option.display_count, 'result-count');
    }
    root.append(optionElement);
  }

  if (attachPolicyExtras) {
    renderResultPagePolicyExtras(root, { collecting: false });
  }
}

export function renderPublicNotices(root, noticeList) {
  root.replaceChildren();
  const notices = Array.isArray(noticeList?.notices)
    ? noticeList.notices.filter((notice) => notice.notice_type === PUBLIC_NOTICE_TYPE)
    : [];
  root.hidden = notices.length === 0;

  for (const notice of notices) {
    const noticeElement = root.ownerDocument.createElement('article');
    noticeElement.className = 'public-notice';
    appendText(noticeElement, 'p', '修正公告', 'public-notice-label');
    appendText(noticeElement, 'h2', notice.title, 'public-notice-title');
    appendText(noticeElement, 'p', notice.body, 'public-notice-body');
    appendText(noticeElement, 'p', notice.created_at, 'public-notice-created-at');
    root.append(noticeElement);
  }
}

function mountCreatorLifecyclePanel(
  host,
  {
    pollId,
    demoOnly,
    apiLifecycle,
    search,
    fetchImpl,
    onRefreshResultDisplay,
  },
) {
  if (demoOnly || !apiLifecycle) {
    host.hidden = true;
    host.replaceChildren();
    return;
  }
  if (!parseCreatorManageMode(search)) {
    host.hidden = true;
    host.replaceChildren();
    return;
  }
  const lifecycleState = apiLifecycle;
  renderCreatorLifecycleActions(host, {
    pollId,
    lifecycleState,
    title: undefined,
    fetchImpl,
    flowContext: 'results',
    onTransitionSuccess: onRefreshResultDisplay,
  });
}

function paintResultPageFromPayload(pageContext, result) {
  const {
    pollId,
    root,
    introRoot,
    pageTitle,
    creatorLifecycleHost,
    uiMockState,
    demoOnly,
    search,
    fetchImpl,
    onRefreshResultDisplay,
  } = pageContext;
  const apiLifecycle = getPublicLifecycleState(result);
  if (pageTitle) {
    if (uiMockState === 'cancelled' || apiLifecycle === 'cancelled') {
      pageTitle.textContent = '問卷已取消';
    } else if (uiMockState === 'unpublished' || apiLifecycle === 'unpublished') {
      pageTitle.textContent = RESULTS_UNPUBLISHED_TITLE;
    } else if (demoOnly) {
      pageTitle.textContent = '示範結果頁（唯讀）';
    } else {
      pageTitle.textContent = '公開結果（唯讀）';
    }
    pageTitle.removeAttribute('aria-busy');
  }
  if (introRoot) {
    introRoot.hidden =
      uiMockState === 'cancelled' ||
      uiMockState === 'unpublished' ||
      apiLifecycle === 'cancelled' ||
      apiLifecycle === 'unpublished';
    if (!introRoot.hidden) {
      renderResultsReadOnlyIntro(introRoot, pollId);
    } else {
      introRoot.replaceChildren();
    }
  }
  if (creatorLifecycleHost) {
    mountCreatorLifecyclePanel(creatorLifecycleHost, {
      pollId,
      demoOnly,
      apiLifecycle,
      search,
      fetchImpl,
      onRefreshResultDisplay,
    });
  }
  markRegionBusy(root, false);
  const mockApply = applyResultUiMockState(root, result, uiMockState);
  if (!mockApply.terminal) {
    renderResultDisplay(root, mockApply.payload ?? result, {
      attachPolicyExtras: false,
    });
    const displayPayload = mockApply.payload ?? result;
    const collecting =
      uiMockState != null
        ? isCollectingUiMockState(uiMockState)
        : isCollectingResult(displayPayload);
    if (uiMockState && uiMockState !== 'collecting') {
      renderUiMockStatePanel(root, uiMockState);
    }
    renderResultPagePolicyExtras(root, {
      collecting,
      skipFollowPanel:
        uiMockState === 'followed' || uiMockState === 'ineligible',
      skipGlossary: Boolean(uiMockState) || demoOnly,
    });
  }
}

export function renderResultRefreshFailureNotice(root) {
  const documentObject = root.ownerDocument;
  if (typeof root.querySelector === 'function') {
    root.querySelector('.result-refresh-failure-notice')?.remove();
  }
  const notice = documentObject.createElement('section');
  notice.className = 'result-refresh-failure-notice';
  notice.setAttribute('role', 'status');
  notice.setAttribute('aria-live', 'polite');
  notice.setAttribute('aria-label', '結果顯示更新提示');
  appendText(
    notice,
    'p',
    RESULT_DISPLAY_REFRESH_FAILURE_MESSAGE,
    'result-refresh-failure-message',
  );
  if (typeof root.prepend === 'function') {
    root.prepend(notice);
  } else {
    root.children.unshift(notice);
  }
}

/**
 * Re-fetch result API payload and repaint main display (Phase 58C).
 * @returns {Promise<{ refreshed: boolean }>}
 */
export async function refreshResultPageDisplay(pageContext) {
  const { pollId, demoOnly, root, fetchImpl = globalThis.fetch } = pageContext;
  if (demoOnly) {
    return { refreshed: true };
  }
  try {
    const result = await loadResultDisplay({ pollId, fetchImpl });
    paintResultPageFromPayload(pageContext, result);
    return { refreshed: true };
  } catch {
    if (root) {
      renderResultRefreshFailureNotice(root);
    }
    return { refreshed: false };
  }
}

export function renderResultPageNav(root, pollId) {
  root.replaceChildren();
  renderPublicNav(root);

  if (pollId) {
    const voteLink = root.ownerDocument.createElement('a');
    voteLink.className = 'vote-cta-link';
    voteLink.href = buildPublicVotePath(pollId);
    voteLink.textContent = PUBLIC_CTA_GO_TO_VOTE_PAGE_LABEL;
    root.append(voteLink);
  }
}

export async function bootstrapResultPage({
  windowObject = globalThis.window,
  documentObject = globalThis.document,
  fetchImpl = globalThis.fetch,
} = {}) {
  const pollId = getPollIdFromResultPath(windowObject.location.pathname);
  const root = documentObject.getElementById('result-display');
  const introRoot = documentObject.getElementById('results-intro');
  const publicNoticesRoot = documentObject.getElementById('public-notices');
  const pageTitle = documentObject.getElementById('page-title');
  const errorPanel = documentObject.getElementById('error-panel');
  const bottomNav = documentObject.getElementById('bottom-nav');
  const statePreviewLinks = documentObject.getElementById('result-state-preview-links');
  const creatorLifecycleHost = documentObject.getElementById('creator-lifecycle-host');
  if (!root) {
    return;
  }

  mountSiteChrome(documentObject);

  const uiMockState = parseUiMockState(windowObject.location.search);
  mountUiMockPreviewChrome(documentObject, uiMockState);

  const showRouteError = (heading, body) => {
    if (pageTitle) {
      pageTitle.textContent = heading;
    }
    if (introRoot) {
      introRoot.hidden = true;
      introRoot.replaceChildren();
    }
    if (errorPanel) {
      renderPublicErrorPanel(errorPanel, {
        title: heading,
        message: body,
        showNav: true,
      });
      errorPanel.hidden = false;
    }
    root.replaceChildren();
    const fallback = root.ownerDocument.createElement('p');
    fallback.textContent = body;
    root.append(fallback);
    if (bottomNav) {
      renderResultPageNav(bottomNav, null);
    }
  };

  if (!pollId) {
    showRouteError(
      '無法開啟結果頁',
      '網址缺少問卷識別碼，請從建立問卷頁或投票頁取得正確連結。',
    );
    return;
  }

  if (!isPublicMvpPagePollId(pollId)) {
    showRouteError(
      '無法開啟結果頁',
      '網址中的問卷識別碼格式不正確，請確認連結是否完整。',
    );
    return;
  }

  const demoOnly = isDemoPollRouteId(pollId);
  if (statePreviewLinks) {
    renderResultUiStatePreviewLinks(statePreviewLinks, pollId);
    statePreviewLinks.hidden = false;
  }

  if (pageTitle) {
    pageTitle.textContent = RESULT_PAGE_LOADING_MESSAGE;
    pageTitle.setAttribute('aria-busy', 'true');
  }
  root.replaceChildren();
  const loading = root.ownerDocument.createElement('p');
  loading.textContent = RESULT_PAGE_LOADING_MESSAGE;
  root.append(loading);
  markRegionBusy(root, true);

  try {
    const result = demoOnly
      ? getDemoCollectingResultPayload()
      : await loadResultDisplay({ pollId, fetchImpl });
    if (errorPanel) {
      errorPanel.hidden = true;
      errorPanel.replaceChildren();
    }
    const pageContext = {
      pollId,
      root,
      introRoot,
      pageTitle,
      creatorLifecycleHost,
      uiMockState,
      demoOnly,
      search: windowObject.location.search,
      fetchImpl,
      onRefreshResultDisplay: null,
    };
    pageContext.onRefreshResultDisplay = () => refreshResultPageDisplay(pageContext);
    paintResultPageFromPayload(pageContext, result);
  } catch (error) {
    const body = resolvePublicErrorUserMessage(
      error,
      SAFE_LOAD_FAILURE_MESSAGE,
      RESULT_PAGE_LOAD_USER_MESSAGES,
    );
    showRouteError('無法載入結果', body);
    return;
  }

  if (publicNoticesRoot) {
    if (demoOnly) {
      renderPublicNotices(publicNoticesRoot, { notices: [] });
    } else {
      try {
        const notices = await loadPublicNotices({ pollId, fetchImpl });
        renderPublicNotices(publicNoticesRoot, notices);
      } catch {
        renderPublicNotices(publicNoticesRoot, { notices: [] });
      }
    }
  }

  if (bottomNav) {
    renderResultPageNav(bottomNav, pollId);
    const myPolls = bottomNav.ownerDocument.createElement('a');
    myPolls.className = 'mvp-action-link';
    myPolls.href = '/my-polls?nav=logged-in-mock';
    myPolls.textContent = PUBLIC_CTA_MY_POLLS_LABEL;
    bottomNav.append(myPolls);
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  void bootstrapResultPage();
}
