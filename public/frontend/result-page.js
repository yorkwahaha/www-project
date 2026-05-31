import {
  POLL_ID_PATTERN,
  buildPublicVotePath,
  markRegionBusy,
  messageForPollLoadFailure,
  parsePollApiError,
  renderPublicErrorPanel,
  renderPublicNav,
} from './public-mvp-ui.js';

function appendText(parent, tagName, text, className) {
  const element = parent.ownerDocument.createElement(tagName);
  element.className = className;
  element.textContent = text;
  parent.append(element);
}

const PUBLIC_NOTICE_TYPE = 'suspended_typo_correction_applied';
const SAFE_LOAD_FAILURE_MESSAGE = '目前無法載入結果，請稍後再試。';

export function getPollIdFromResultPath(pathname) {
  const match = pathname.match(/^\/results\/([^/]+)$/);
  return match?.[1] ?? null;
}

export async function loadResultDisplay({ pollId, fetchImpl = globalThis.fetch }) {
  const response = await fetchImpl(`/polls/${encodeURIComponent(pollId)}/results`, {
    method: 'GET',
    credentials: 'omit',
    cache: 'no-store',
  });
  if (!response.ok) {
    const apiError = await parsePollApiError(response);
    throw new Error(messageForPollLoadFailure(apiError));
  }
  try {
    return await response.json();
  } catch {
    throw new Error(SAFE_LOAD_FAILURE_MESSAGE);
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
  return {
    total_votes_display:
      typeof result.total_votes_display === 'string'
        ? result.total_votes_display
        : '目前尚無可顯示的總票數區間。',
    updated_display:
      typeof result.updated_display === 'string' ? result.updated_display : '',
    options,
  };
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
    '本頁不含登入、個人化推薦、排行榜或 feed 列表；統計為區間化呈現，非即時原始票數。';
  root.append(scope);

  if (pollId) {
    const voteHint = root.ownerDocument.createElement('p');
    voteHint.className = 'results-intro-vote-hint';
    voteHint.textContent = '若要參與投票，請前往投票頁：';
    root.append(voteHint);

    const voteLink = root.ownerDocument.createElement('a');
    voteLink.className = 'mvp-action-link vote-cta-link';
    voteLink.href = buildPublicVotePath(pollId);
    voteLink.textContent = '前往投票頁';
    root.append(voteLink);
  }
}

export function renderResultDisplay(root, result) {
  root.replaceChildren();
  const normalized = normalizeDisplaySafeResult(result);
  if (!normalized) {
    appendText(root, 'p', '目前無法顯示統計，請稍後再試。', 'result-empty');
    return;
  }

  appendText(root, 'p', normalized.total_votes_display, 'result-total');
  if (normalized.updated_display) {
    appendText(root, 'p', normalized.updated_display, 'result-updated');
  }

  if (normalized.options.length === 0) {
    appendText(root, 'p', '目前尚無可顯示的選項統計。', 'result-empty');
    return;
  }

  for (const option of normalized.options) {
    const optionElement = root.ownerDocument.createElement('section');
    optionElement.className = 'result-option';
    appendText(optionElement, 'h2', option.display_label, 'result-label');
    if (option.display_percentage !== null) {
      appendText(optionElement, 'p', option.display_percentage, 'result-percentage');
    }
    if (option.display_count !== null) {
      appendText(optionElement, 'p', option.display_count, 'result-count');
    }
    root.append(optionElement);
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

export function renderResultPageNav(root, pollId) {
  root.replaceChildren();
  renderPublicNav(root);

  if (pollId) {
    const voteLink = root.ownerDocument.createElement('a');
    voteLink.className = 'vote-cta-link';
    voteLink.href = buildPublicVotePath(pollId);
    voteLink.textContent = '前往投票頁';
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
  if (!root) {
    return;
  }

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

  if (!POLL_ID_PATTERN.test(pollId)) {
    showRouteError(
      '無法開啟結果頁',
      '網址中的問卷識別碼格式不正確，請確認連結是否完整。',
    );
    return;
  }

  if (pageTitle) {
    pageTitle.textContent = '載入結果中…';
    pageTitle.setAttribute('aria-busy', 'true');
  }
  root.replaceChildren();
  const loading = root.ownerDocument.createElement('p');
  loading.textContent = '載入中…';
  root.append(loading);
  markRegionBusy(root, true);

  try {
    const result = await loadResultDisplay({ pollId, fetchImpl });
    if (errorPanel) {
      errorPanel.hidden = true;
      errorPanel.replaceChildren();
    }
    if (pageTitle) {
      pageTitle.textContent = '公開結果（唯讀）';
      pageTitle.removeAttribute('aria-busy');
    }
    if (introRoot) {
      renderResultsReadOnlyIntro(introRoot, pollId);
    }
    markRegionBusy(root, false);
    renderResultDisplay(root, result);
  } catch (error) {
    const body = error instanceof Error ? error.message : SAFE_LOAD_FAILURE_MESSAGE;
    showRouteError('無法載入結果', body);
    return;
  }

  if (publicNoticesRoot) {
    try {
      const notices = await loadPublicNotices({ pollId, fetchImpl });
      renderPublicNotices(publicNoticesRoot, notices);
    } catch {
      renderPublicNotices(publicNoticesRoot, { notices: [] });
    }
  }

  if (bottomNav) {
    renderResultPageNav(bottomNav, pollId);
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  void bootstrapResultPage();
}
