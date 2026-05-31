function appendText(parent, tagName, text, className) {
  const element = parent.ownerDocument.createElement(tagName);
  element.className = className;
  element.textContent = text;
  parent.append(element);
}

const PUBLIC_NOTICE_TYPE = 'suspended_typo_correction_applied';

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
    throw new Error('Unable to load results');
  }
  return response.json();
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

export async function bootstrapResultPage({
  windowObject = globalThis.window,
  documentObject = globalThis.document,
  fetchImpl = globalThis.fetch,
  } = {}) {
  const pollId = getPollIdFromResultPath(windowObject.location.pathname);
  const root = documentObject.getElementById('result-display');
  const publicNoticesRoot = documentObject.getElementById('public-notices');
  if (!pollId || !root) {
    return;
  }

  try {
    const result = await loadResultDisplay({ pollId, fetchImpl });
    renderResultDisplay(root, result);
  } catch {
    root.textContent = '無法載入結果';
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
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  void bootstrapResultPage();
}
