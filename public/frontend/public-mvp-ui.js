/** Shared public MVP UI helpers with no durable storage. */

export const POLL_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Demo slug allowed on public HTML routes only (not backend poll APIs). */
export const PUBLIC_MVP_DEMO_POLL_SLUG = 'demo';

export function isPublicMvpPagePollId(pollId) {
  return (
    POLL_ID_PATTERN.test(pollId) ||
    pollId === PUBLIC_MVP_DEMO_POLL_SLUG
  );
}

export const VOTE_PAGE_LOAD_FAILURE = '目前無法載入問卷，請稍後再試。';
export const VOTE_SUBMIT_TRANSPORT_FAILURE = '目前無法送出投票，請稍後再試。';
export const GENERIC_VOTE_SUBMIT_FAILURE =
  '目前無法完成這次投票。請確認已登入並完成必要的個人資料後再試；若問題持續，請稍後再試。';

/** Frontend-owned poll load / blocked messages safe to show from caught errors. */
export const PUBLIC_POLL_LOAD_USER_MESSAGES = [
  VOTE_PAGE_LOAD_FAILURE,
  '網址中的問卷識別碼格式不正確。',
  '找不到此問卷，可能已刪除、尚未公開，或連結有誤。',
  '此問卷已封存，無法查看。',
  '此問卷已結束。',
  '此問卷已截止，無法再投票。',
  '此問卷目前不接受投票。',
  '此問卷目前無法使用。',
  '請求無效，請確認連結是否正確。',
];

/** Frontend-owned vote submit messages safe to show from caught errors. */
export const PUBLIC_VOTE_SUBMIT_USER_MESSAGES = [
  GENERIC_VOTE_SUBMIT_FAILURE,
  VOTE_SUBMIT_TRANSPORT_FAILURE,
];

const GENERIC_LOAD_FAILURE = VOTE_PAGE_LOAD_FAILURE;

/**
 * Returns a frontend-owned user message from a caught error, or fallback.
 * Never surfaces foreign error.message (network, backend, runtime).
 *
 * @param {unknown} error
 * @param {string} fallbackMessage
 * @param {readonly string[]} allowedMessages
 */
export function resolvePublicErrorUserMessage(
  error,
  fallbackMessage,
  allowedMessages,
) {
  if (
    error instanceof Error &&
    typeof error.message === 'string' &&
    allowedMessages.includes(error.message)
  ) {
    return error.message;
  }
  return fallbackMessage;
}

const PUBLIC_POLL_LIFECYCLE_STATES = [
  'draft',
  'collecting',
  'cancelled',
  'revealed',
  'locked',
  'post_lock',
  'unpublished',
];

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

export function messageForVoteSubmitFailure() {
  return GENERIC_VOTE_SUBMIT_FAILURE;
}

/**
 * @param {unknown} detail
 * @returns {string | null}
 */
export function getPublicLifecycleStateFromPoll(detail) {
  if (!detail || typeof detail !== 'object' || Array.isArray(detail)) {
    return null;
  }
  const state = /** @type {{ public_lifecycle_state?: unknown }} */ (detail)
    .public_lifecycle_state;
  if (
    typeof state === 'string' &&
    PUBLIC_POLL_LIFECYCLE_STATES.includes(state)
  ) {
    return state;
  }
  return null;
}

/**
 * @param {unknown} detail
 */
export function isPollAcceptingVotes(detail) {
  const lifecycle = getPublicLifecycleStateFromPoll(detail);
  if (lifecycle !== null) {
    return lifecycle === 'collecting';
  }
  if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
    const status = /** @type {{ status?: unknown }} */ (detail).status;
    return status === 'active';
  }
  return false;
}

/**
 * @param {unknown} detail
 */
export function messageForPollVotingBlocked(detail) {
  const lifecycle = getPublicLifecycleStateFromPoll(detail);
  if (
    lifecycle === 'cancelled' ||
    lifecycle === 'unpublished' ||
    lifecycle === 'draft'
  ) {
    return '此問卷目前無法使用。';
  }
  if (
    lifecycle === 'revealed' ||
    lifecycle === 'locked' ||
    lifecycle === 'post_lock'
  ) {
    return '此問卷已結束。';
  }
  if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
    const status = /** @type {{ status?: unknown }} */ (detail).status;
    if (status === 'closed') {
      return '此問卷已截止，無法再投票。';
    }
  }
  return '此問卷目前不接受投票。';
}

export function renderPublicNav(root) {
  const nav = root.ownerDocument.createElement('nav');
  nav.className = 'public-nav';
  nav.setAttribute('aria-label', '網站導覽');

  const home = root.ownerDocument.createElement('a');
  home.href = '/';
  home.textContent = '首頁';
  nav.append(home);

  const explore = root.ownerDocument.createElement('a');
  explore.href = '/explore';
  explore.textContent = '探索';
  nav.append(explore);

  const create = root.ownerDocument.createElement('a');
  create.href = '/polls/new';
  create.textContent = '發起提問';
  nav.append(create);

  const profile = root.ownerDocument.createElement('a');
  profile.href = '/profile';
  profile.textContent = '個人資料';
  nav.append(profile);

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

function appendShareUrlDisplay(parent, { label, url }) {
  const row = parent.ownerDocument.createElement('div');
  row.className = 'share-url-row';

  const rowLabel = parent.ownerDocument.createElement('p');
  rowLabel.className = 'share-url-label';
  rowLabel.textContent = label;
  row.append(rowLabel);

  const code = parent.ownerDocument.createElement('code');
  code.className = 'share-url';
  code.textContent = url;
  row.append(code);

  parent.append(row);
  return code;
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
      if (result.ok) {
        statusTarget.textContent = '已複製連結。';
      } else if (result.method === 'prompt') {
        statusTarget.textContent =
          '瀏覽器無法自動複製，已顯示手動複製提示；亦可選取上方完整網址。';
      } else {
        statusTarget.textContent = '無法自動複製，請手動選取上方完整網址。';
      }
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
  hint.textContent =
    '問卷已建立。下方為可分享的完整網址（僅含問卷識別碼）。請將投票連結傳給參與者；結果連結為公開唯讀統計頁。收集中不顯示票數或百分比，發起者亦看不到中間結果。';
  root.append(hint);

  const copyStatus = root.ownerDocument.createElement('p');
  copyStatus.className = 'copy-status';
  copyStatus.setAttribute('role', 'status');
  copyStatus.setAttribute('aria-live', 'polite');
  root.append(copyStatus);

  appendShareUrlDisplay(root, { label: '投票連結（分享給參與者）', url: voteUrl });

  const voteLink = root.ownerDocument.createElement('a');
  voteLink.className = 'mvp-action-link';
  voteLink.href = votePath;
  voteLink.textContent = '開啟投票頁';
  root.append(voteLink);

  if (includeCopyButtons) {
    appendCopyButton(root, {
      label: '複製投票連結',
      url: voteUrl,
      statusTarget: copyStatus,
      ariaLabel: '複製投票頁完整網址到剪貼簿',
    });
  }

  appendShareUrlDisplay(root, { label: '結果連結（公開唯讀統計）', url: resultUrl });

  const resultLink = root.ownerDocument.createElement('a');
  resultLink.className = 'mvp-action-link';
  resultLink.href = resultPath;
  resultLink.textContent = '開啟公開結果頁';
  root.append(resultLink);

  if (includeCopyButtons) {
    appendCopyButton(root, {
      label: '複製結果連結',
      url: resultUrl,
      statusTarget: copyStatus,
      ariaLabel: '複製結果頁完整網址到剪貼簿',
    });
  }
}

/** Fake local-only voter UUID; must exist in DB with trust_level=official when using demo:public:local. */
export const LOCAL_DEMO_VOTER_USER_ID = '44444444-4444-4444-8444-444444444444';

/** Second local demo voter for a second browser session (still localhost-only header). */
export const LOCAL_DEMO_VOTER_B_USER_ID = '55555555-5555-5555-8555-555555555555';

export function isLocalDemoHostname(hostname) {
  return hostname === '127.0.0.1' || hostname === 'localhost';
}

/**
 * On 127.0.0.1 / localhost only, use seeded demo voter id so manual npm/demo voting works.
 * Production hosts keep random runtime UUID (no durable storage).
 */
export function resolvePublicMvpUserId(uuidFactory = () => globalThis.crypto.randomUUID()) {
  const hostname = globalThis.location?.hostname;
  if (hostname && isLocalDemoHostname(hostname)) {
    const params = new URLSearchParams(globalThis.location?.search ?? '');
    if (params.get('demoVoter') === 'b') {
      return LOCAL_DEMO_VOTER_B_USER_ID;
    }
    return LOCAL_DEMO_VOTER_USER_ID;
  }
  return uuidFactory();
}
