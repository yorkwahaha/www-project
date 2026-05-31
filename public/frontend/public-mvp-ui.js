/** Shared public MVP UI helpers (no durable storage, no option_id). */

export const POLL_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const GENERIC_LOAD_FAILURE = '目前無法載入，請稍後再試。';

export function setBusySubmitButton(
  button,
  { busy, idleLabel, busyLabel },
) {
  button.disabled = busy;
  button.setAttribute('aria-busy', busy ? 'true' : 'false');
  button.textContent = busy ? busyLabel : idleLabel;
}

export function announceToStatusRegion(element, text) {
  if (element) {
    element.textContent = text;
  }
}

export function markRegionBusy(element, busy) {
  if (!element) {
    return;
  }
  if (busy) {
    element.setAttribute('aria-busy', 'true');
  } else {
    element.removeAttribute('aria-busy');
  }
}

export function focusFirstFocusable(root) {
  const target = root.querySelector('a[href], button:not([disabled])');
  target?.focus?.();
}

export function buildPublicVotePath(pollId) {
  return `/vote/${encodeURIComponent(pollId)}`;
}

export function buildPublicResultPath(pollId) {
  return `/results/${encodeURIComponent(pollId)}`;
}

export function buildAbsoluteUrl(path, locationObject = globalThis.location) {
  return new URL(path, locationObject.origin).href;
}

export async function parsePollApiError(response) {
  try {
    const body = await response.json();
    if (body && typeof body.error === 'string') {
      return {
        status: response.status,
        errorCode: body.error,
        message: typeof body.message === 'string' ? body.message : null,
      };
    }
  } catch {
    // ignore malformed error payloads
  }
  return { status: response.status, errorCode: null, message: null };
}

export function messageForPollLoadFailure({ status, errorCode, message } = {}) {
  if (errorCode === 'INVALID_POLL_ID') {
    return '網址中的問卷識別碼格式不正確。';
  }
  if (status === 404 || errorCode === 'POLL_NOT_FOUND') {
    return '找不到此問卷，可能已刪除、尚未公開，或連結有誤。';
  }
  if (errorCode === 'POLL_VALIDATION') {
    if (message === 'Poll is archived') {
      return '此問卷已封存，無法查看。';
    }
    if (message === 'Poll is closed') {
      return '此問卷已結束。';
    }
    if (message === 'Poll is no longer accepting responses') {
      return '此問卷已截止，無法再投票。';
    }
    if (message === 'Poll is not accepting responses') {
      return '此問卷目前不接受投票。';
    }
    return '此問卷目前無法使用。';
  }
  if (status === 400) {
    return '請求無效，請確認連結是否正確。';
  }
  return GENERIC_LOAD_FAILURE;
}

export function messageForVoteSubmitFailure({ status, errorCode, message } = {}) {
  if (errorCode === 'OFFICIAL_VOTE_DUPLICATE') {
    return '您已在此問卷投過票，可前往結果頁查看。';
  }
  if (errorCode === 'POLL_NOT_FOUND' || status === 404) {
    return '找不到此問卷，無法送出投票。';
  }
  const loadLike = messageForPollLoadFailure({ status, errorCode, message });
  if (loadLike !== GENERIC_LOAD_FAILURE) {
    return loadLike;
  }
  return '目前無法送出投票，請稍後再試。';
}

export function renderPublicNav(root) {
  const nav = root.ownerDocument.createElement('nav');
  nav.className = 'public-nav';
  nav.setAttribute('aria-label', '網站導覽');

  const home = root.ownerDocument.createElement('a');
  home.href = '/';
  home.textContent = '首頁';
  nav.append(home);

  const create = root.ownerDocument.createElement('a');
  create.href = '/polls/new';
  create.textContent = '建立問卷';
  nav.append(create);

  root.append(nav);
  return nav;
}

export function renderPublicErrorPanel(
  root,
  { title, message, showNav = true } = {},
) {
  root.replaceChildren();
  root.hidden = false;
  root.setAttribute('role', 'alert');

  const heading = root.ownerDocument.createElement('h2');
  heading.className = 'panel-heading';
  heading.textContent = title;
  root.append(heading);

  const body = root.ownerDocument.createElement('p');
  body.className = 'panel-message';
  body.textContent = message;
  root.append(body);

  if (showNav) {
    renderPublicNav(root);
  }
}

export async function copyTextToClipboard(text, {
  clipboard = globalThis.navigator?.clipboard,
  documentObject = globalThis.document,
  prompt = globalThis.prompt,
} = {}) {
  if (clipboard?.writeText) {
    try {
      await clipboard.writeText(text);
      return { ok: true, method: 'clipboard' };
    } catch {
      // fall through to legacy fallback
    }
  }

  try {
    const textarea = documentObject.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    documentObject.body.append(textarea);
    textarea.select();
    const copied = documentObject.execCommand('copy');
    textarea.remove();
    if (copied) {
      return { ok: true, method: 'execCommand' };
    }
  } catch {
    // fall through
  }

  if (typeof prompt === 'function') {
    prompt('請手動複製以下連結：', text);
    return { ok: false, method: 'prompt' };
  }

  return { ok: false, method: 'none' };
}

function appendCopyButton(parent, { label, url, statusTarget, ariaLabel }) {
  const button = parent.ownerDocument.createElement('button');
  button.type = 'button';
  button.className = 'copy-link-button';
  button.textContent = label;
  button.setAttribute('aria-label', ariaLabel ?? label);
  button.addEventListener('click', async () => {
    const result = await copyTextToClipboard(url);
    if (statusTarget) {
      statusTarget.textContent = result.ok
        ? '已複製連結。'
        : '無法自動複製，請手動選取上方連結。';
    }
  });
  parent.append(button);
}

export function renderPollSharePanel(root, pollId, {
  locationObject = globalThis.location,
  includeCopyButtons = true,
} = {}) {
  root.replaceChildren();
  root.hidden = false;
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', '問卷建立成功');

  const votePath = buildPublicVotePath(pollId);
  const resultPath = buildPublicResultPath(pollId);
  const voteUrl = buildAbsoluteUrl(votePath, locationObject);
  const resultUrl = buildAbsoluteUrl(resultPath, locationObject);

  const hint = root.ownerDocument.createElement('p');
  hint.className = 'panel-message';
  hint.textContent = '問卷已建立。請分享投票連結給參與者，或自行查看結果頁。';
  root.append(hint);

  const copyStatus = root.ownerDocument.createElement('p');
  copyStatus.className = 'copy-status';
  copyStatus.setAttribute('role', 'status');
  copyStatus.setAttribute('aria-live', 'polite');
  root.append(copyStatus);

  const voteLink = root.ownerDocument.createElement('a');
  voteLink.href = votePath;
  voteLink.textContent = '前往投票頁（可分享）';
  root.append(voteLink);

  if (includeCopyButtons) {
    appendCopyButton(root, {
      label: '複製投票連結',
      url: voteUrl,
      statusTarget: copyStatus,
      ariaLabel: '複製投票頁連結到剪貼簿',
    });
  }

  const resultLink = root.ownerDocument.createElement('a');
  resultLink.href = resultPath;
  resultLink.textContent = '查看公開結果頁';
  root.append(resultLink);

  if (includeCopyButtons) {
    appendCopyButton(root, {
      label: '複製結果連結',
      url: resultUrl,
      statusTarget: copyStatus,
      ariaLabel: '複製結果頁連結到剪貼簿',
    });
  }
}
