import {
  POLL_ID_PATTERN,
  buildPublicVotePath,
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

export function renderResultDisplay(root, result) {
  root.replaceChildren();
  appendText(root, 'p', result.total_votes_display, 'result-total');
  appendText(root, 'p', result.updated_display, 'result-updated');

  for (const option of result.options) {
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
    if (errorPanel) {
      renderPublicErrorPanel(errorPanel, {
        title: heading,
        message: body,
        showNav: false,
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
  }
  root.textContent = '載入中…';

  try {
    const result = await loadResultDisplay({ pollId, fetchImpl });
    if (errorPanel) {
      errorPanel.hidden = true;
      errorPanel.replaceChildren();
    }
    if (pageTitle) {
      pageTitle.textContent = '投票結果';
    }
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
