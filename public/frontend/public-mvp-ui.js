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

/** Frontend-owned vote route unavailable title. */
export const PUBLIC_VOTE_ROUTE_UNAVAILABLE_TITLE = '無法開啟投票頁';

/** Frontend-owned vote route unavailable messages. */
export const PUBLIC_VOTE_ROUTE_MISSING_ID_MESSAGE =
  '網址缺少問卷識別碼，請從建立問卷頁取得正確的投票連結。';
export const PUBLIC_VOTE_ROUTE_INVALID_ID_MESSAGE =
  '網址中的問卷識別碼格式不正確，請確認連結是否完整。';

/** Frontend-owned poll load / vote-blocked unavailable messages. */
export const PUBLIC_POLL_INVALID_ID_MESSAGE =
  '網址中的問卷識別碼格式不正確。';
export const PUBLIC_POLL_NOT_FOUND_MESSAGE =
  '找不到此問卷，可能已刪除、尚未公開，或連結有誤。';
export const PUBLIC_POLL_ARCHIVED_MESSAGE = '此問卷已封存，無法查看。';
export const PUBLIC_VOTE_POLL_ENDED_MESSAGE = '此問卷已結束。';
export const PUBLIC_VOTE_POLL_CLOSED_MESSAGE = '此問卷已截止，無法再投票。';
export const PUBLIC_VOTE_NOT_ACCEPTING_MESSAGE = '此問卷目前不接受投票。';
export const PUBLIC_VOTE_POLL_UNAVAILABLE_MESSAGE = '此問卷目前無法使用。';
export const PUBLIC_POLL_INVALID_REQUEST_MESSAGE =
  '請求無效，請確認連結是否正確。';

/** Frontend-owned poll load / blocked messages safe to show from caught errors. */
export const PUBLIC_POLL_LOAD_USER_MESSAGES = [
  VOTE_PAGE_LOAD_FAILURE,
  PUBLIC_POLL_INVALID_ID_MESSAGE,
  PUBLIC_POLL_NOT_FOUND_MESSAGE,
  PUBLIC_POLL_ARCHIVED_MESSAGE,
  PUBLIC_VOTE_POLL_ENDED_MESSAGE,
  PUBLIC_VOTE_POLL_CLOSED_MESSAGE,
  PUBLIC_VOTE_NOT_ACCEPTING_MESSAGE,
  PUBLIC_VOTE_POLL_UNAVAILABLE_MESSAGE,
  PUBLIC_POLL_INVALID_REQUEST_MESSAGE,
];

/** Frontend-owned vote submit messages safe to show from caught errors. */
export const PUBLIC_VOTE_SUBMIT_USER_MESSAGES = [
  GENERIC_VOTE_SUBMIT_FAILURE,
  VOTE_SUBMIT_TRANSPORT_FAILURE,
];

/** Frontend-owned generic action pending copy (submit / transition / logout). */
export const PUBLIC_ACTION_PENDING_MESSAGE = '處理中，請稍候。';

/** Frontend-owned generic loading pending copy (initial page / region fetch). */
export const PUBLIC_LOADING_PENDING_MESSAGE = '載入中，請稍候。';

/** Allowlist of safe user-visible loading / pending messages across public surfaces. */
export const PUBLIC_PENDING_USER_MESSAGES = [
  PUBLIC_ACTION_PENDING_MESSAGE,
  PUBLIC_LOADING_PENDING_MESSAGE,
  '登入中，請稍候。',
  '註冊中，請稍候。',
  '儲存中，請稍候。',
  '送出中，請稍候。',
  '建立中，請稍候。',
  '登出中，請稍候。',
  '載入探索列表中，請稍候。',
  '載入更多中，請稍候。',
  '載入問卷中，請稍候。',
  '載入結果中，請稍候。',
  '載入你的問卷中，請稍候。',
  '載入個人資料提示中，請稍候。',
];

/** Frontend-owned login success copy. */
export const PUBLIC_LOGIN_SUCCESS_MESSAGE =
  '登入成功。頁首登入狀態已更新。';

/** Frontend-owned registration success copy. */
export const PUBLIC_REGISTRATION_SUCCESS_MESSAGE =
  '註冊成功。請前往登入頁完成登入；註冊不會自動登入。';

/** Frontend-owned profile save success copy. */
export const PUBLIC_PROFILE_SAVE_SUCCESS_MESSAGE = '個人資料已儲存。';

/** Frontend-owned live create-poll form success status copy. */
export const PUBLIC_CREATE_POLL_SUCCESS_MESSAGE = '問卷已建立。';

/** Frontend-owned demo create-poll form success status copy. */
export const PUBLIC_CREATE_POLL_DEMO_SUCCESS_MESSAGE =
  '表單通過檢查（展示用），資料不會儲存。';

/** Frontend-owned demo create-poll success panel lead copy. */
export const PUBLIC_CREATE_POLL_DEMO_PANEL_LEAD =
  '此流程展示未來的使用方式：表單已通過檢查，資料不會儲存。可繼續體驗下列頁面：';

/** Frontend-owned create-poll share panel lead copy. */
export const PUBLIC_CREATE_POLL_SHARE_SUCCESS_LEAD =
  '問卷已建立。下方為可分享的完整網址（僅含問卷識別碼）。請將投票連結傳給參與者；結果連結為公開唯讀統計頁。收集中不顯示票數或百分比，發起者亦看不到中間結果。';

/** Frontend-owned vote success panel copy. */
export const PUBLIC_VOTE_SUCCESS_MESSAGE = '投票已送出，感謝參與。';

/** Frontend-owned vote success form status copy. */
export const PUBLIC_VOTE_SUCCESS_STATUS_MESSAGE = '投票已送出。';

/** Frontend-owned demo vote success status copy. */
export const PUBLIC_VOTE_DEMO_SUCCESS_STATUS_MESSAGE =
  '投票流程已展示（不會儲存）。';

/** Frontend-owned demo vote success panel copy. */
export const PUBLIC_VOTE_DEMO_SUCCESS_MESSAGE =
  '此流程展示未來的使用方式，投票不會儲存。';

/** Frontend-owned vote success result-page hint copy. */
export const PUBLIC_VOTE_SUCCESS_RESULT_HINT =
  '收集中結果頁不顯示票數或百分比。結果公開後可查看彙總統計：';

/** Frontend-owned demo vote success result-page hint copy. */
export const PUBLIC_VOTE_DEMO_SUCCESS_RESULT_HINT =
  '收集中結果頁不顯示票數或百分比。可前往結果頁查看收集中說明：';

/** Frontend-owned lifecycle cancel success copy. */
export const PUBLIC_LIFECYCLE_CANCEL_SUCCESS_MESSAGE =
  '問卷已取消，不會產生公開結果。';

/** Frontend-owned lifecycle close success copy. */
export const PUBLIC_LIFECYCLE_CLOSE_SUCCESS_MESSAGE =
  '問卷已公開結果，進入公開鎖定期。';

/** Frontend-owned lifecycle unpublish success copy. */
export const PUBLIC_LIFECYCLE_UNPUBLISH_SUCCESS_MESSAGE = '問卷已下架。';

/** Frontend-owned lifecycle success when result refresh is deferred. */
export const PUBLIC_LIFECYCLE_REFRESH_DEFERRED_SUCCESS_MESSAGE =
  '狀態已更新。結果顯示暫時無法重新載入，請重新整理頁面。';

/** Frontend-owned share-link copy success copy. */
export const PUBLIC_SHARE_LINK_COPIED_MESSAGE = '已複製連結。';

/** Frontend-owned share-link manual prompt copy. */
export const PUBLIC_SHARE_LINK_PROMPT_MESSAGE =
  '瀏覽器無法自動複製，已顯示手動複製提示；亦可選取上方完整網址。';

/** Frontend-owned share-link manual fallback copy. */
export const PUBLIC_SHARE_LINK_MANUAL_COPY_MESSAGE =
  '無法自動複製，請手動選取上方完整網址。';

/** Allowlist of safe user-visible success / completion messages across public surfaces. */
export const PUBLIC_SUCCESS_USER_MESSAGES = [
  PUBLIC_LOGIN_SUCCESS_MESSAGE,
  PUBLIC_REGISTRATION_SUCCESS_MESSAGE,
  PUBLIC_PROFILE_SAVE_SUCCESS_MESSAGE,
  PUBLIC_CREATE_POLL_SUCCESS_MESSAGE,
  PUBLIC_CREATE_POLL_DEMO_SUCCESS_MESSAGE,
  PUBLIC_CREATE_POLL_SHARE_SUCCESS_LEAD,
  PUBLIC_VOTE_SUCCESS_MESSAGE,
  PUBLIC_VOTE_SUCCESS_STATUS_MESSAGE,
  PUBLIC_VOTE_DEMO_SUCCESS_STATUS_MESSAGE,
  PUBLIC_VOTE_DEMO_SUCCESS_MESSAGE,
  PUBLIC_LIFECYCLE_CANCEL_SUCCESS_MESSAGE,
  PUBLIC_LIFECYCLE_CLOSE_SUCCESS_MESSAGE,
  PUBLIC_LIFECYCLE_UNPUBLISH_SUCCESS_MESSAGE,
  PUBLIC_LIFECYCLE_REFRESH_DEFERRED_SUCCESS_MESSAGE,
  PUBLIC_SHARE_LINK_COPIED_MESSAGE,
  PUBLIC_SHARE_LINK_PROMPT_MESSAGE,
  PUBLIC_SHARE_LINK_MANUAL_COPY_MESSAGE,
  '問卷已建立。請先複製並分享「投票連結」給參與者；收集中不顯示票數或百分比。',
  '可在下方變更問卷狀態，或前往「我的問卷」與「結果頁（發起者）」繼續管理。',
  PUBLIC_CREATE_POLL_DEMO_PANEL_LEAD,
  PUBLIC_VOTE_SUCCESS_RESULT_HINT,
  PUBLIC_VOTE_DEMO_SUCCESS_RESULT_HINT,
];

/** Frontend-owned neutral pre-vote hints when submit may be unavailable. */
export const PUBLIC_VOTE_PRE_VOTE_ANONYMOUS_HINT =
  '正式投票可能需要登入。若你尚未登入，可前往登入頁完成登入後再嘗試投票。';
export const PUBLIC_VOTE_PRE_VOTE_INCOMPLETE_PROFILE_HINT =
  '部分正式投票可能會在投票當下檢查出生年月與粗粒度居住地區。若你尚未填寫，可至個人資料頁補充或更新；此提示不代表一定可以完成投票。';
export const PUBLIC_VOTE_PRE_VOTE_NEUTRAL_SUBMIT_HINT =
  '送出投票後，系統會依該投票的規則在當下判定是否可計票。此提示不代表一定可以完成投票。';

/** Frontend-owned results unavailable / non-aggregate copy. */
export const PUBLIC_RESULTS_COLLECTING_TITLE = '結果尚未公開';
export const PUBLIC_RESULTS_COLLECTING_SUMMARY =
  '本問卷仍在收集中。此頁不顯示總票數、選項票數、百分比、排名或趨勢。';
export const PUBLIC_RESULTS_CANCELLED_TITLE = '問卷已取消';
export const PUBLIC_RESULTS_CANCELLED_MESSAGE =
  '此問卷已取消，不會產生可公開顯示的聚合結果。';
export const PUBLIC_RESULTS_UNPUBLISHED_TITLE = '問卷目前無法查看';
export const PUBLIC_RESULTS_UNPUBLISHED_MESSAGE =
  '此問卷目前無法查看，頁面不顯示聚合結果。';
export const PUBLIC_RESULTS_POLL_UNAVAILABLE_MESSAGE = '問卷目前無法使用。';
export const PUBLIC_RESULTS_EMPTY_AGGREGATE_MESSAGE = '目前沒有可顯示的聚合結果。';
export const PUBLIC_RESULTS_UNAVAILABLE_AGGREGATE_SUMMARY =
  '此頁不顯示總票數、選項票數、百分比、排名、趨勢或任何進度訊號。';

/** Frontend-owned explore unavailable copy. */
export const PUBLIC_EXPLORE_LOAD_MORE_UNAVAILABLE_MESSAGE =
  '無法載入更多問卷，請稍後再試。';
export const PUBLIC_EXPLORE_EMPTY_MESSAGE = '目前沒有正在收集中的公開問卷。';

/** Frontend-owned auth / profile action unavailable copy. */
export const PUBLIC_MY_POLLS_SIGN_IN_REQUIRED_MESSAGE =
  '請先登入後查看你建立的問卷。';
export const PUBLIC_PROFILE_VIEW_SIGN_IN_REQUIRED_MESSAGE =
  '編輯個人資料前請先登入。';
export const PUBLIC_PROFILE_EDIT_SIGN_IN_REQUIRED_MESSAGE =
  '請先登入後再編輯個人資料。';
export const PUBLIC_AUTH_GUEST_SIGN_IN_CTA_ARIA_LABEL = '尚未登入，前往登入頁';

/** Frontend-owned create-poll demo unavailable-to-persist label. */
export const PUBLIC_CREATE_POLL_DEMO_SUBMIT_LABEL = '建立問卷（展示用，不儲存）';

/** Frontend-owned lifecycle action unavailable copy. */
export const PUBLIC_LIFECYCLE_LOCKED_ACTION_UNAVAILABLE_MESSAGE =
  '問卷已公開結果並處於公開鎖定期，目前無法取消、下架或修改內容。';
export const PUBLIC_LIFECYCLE_CANCELLED_NOTE_MESSAGE =
  '此問卷已取消，不會產生公開結果。';
export const PUBLIC_LIFECYCLE_UNPUBLISHED_VISITOR_MESSAGE =
  '此問卷已下架，訪客無法再查看公開結果。';
export const PUBLIC_LIFECYCLE_NO_ACTION_AVAILABLE_MESSAGE =
  '此狀態目前沒有可執行的發起者操作。';
export const PUBLIC_LIFECYCLE_DELETE_LOCKED_MESSAGE =
  '公開結果期間無法刪除問卷；鎖定期結束後請使用下架。';
export const PUBLIC_LIFECYCLE_INCOMPLETE_STATE_MESSAGE =
  '問卷狀態資料不完整，無法推進生命週期。';
export const PUBLIC_LIFECYCLE_INVALID_STATE_ACTION_MESSAGE =
  '目前問卷狀態無法執行此操作，請重新整理後再試。';
export const PUBLIC_LIFECYCLE_UNPUBLISH_LOCKED_MESSAGE =
  '公開鎖定期尚未結束，目前無法下架。';
export const PUBLIC_LIFECYCLE_ALREADY_CANCELLED_MESSAGE = '此問卷已取消。';
export const PUBLIC_LIFECYCLE_ALREADY_UNPUBLISHED_MESSAGE = '此問卷已下架。';
export const PUBLIC_LIFECYCLE_FORBIDDEN_MESSAGE = '僅發起者可執行此操作。';
export const PUBLIC_LIFECYCLE_AUTH_REQUIRED_MESSAGE =
  '需要發起者身分才能執行此操作。';
export const PUBLIC_LIFECYCLE_POLL_NOT_FOUND_MESSAGE =
  '找不到此問卷，可能已刪除或連結有誤。';
export const PUBLIC_LIFECYCLE_REVEAL_TOO_EARLY_MESSAGE =
  '尚未到預定截止時間，無法結束收集並公開結果。';
export const PUBLIC_LIFECYCLE_NOT_COLLECTING_MESSAGE =
  '問卷目前不在收集中，無法執行此操作。';
export const PUBLIC_LIFECYCLE_POLL_CLOSED_MESSAGE =
  '此問卷已結束，無法再變更狀態。';
export const PUBLIC_LIFECYCLE_GENERIC_ACTION_UNAVAILABLE_MESSAGE =
  '無法執行此操作，請確認問卷狀態後再試。';

/** Allowlist of safe user-visible disabled / unavailable messages across public surfaces. */
export const PUBLIC_UNAVAILABLE_USER_MESSAGES = [
  PUBLIC_VOTE_ROUTE_UNAVAILABLE_TITLE,
  PUBLIC_VOTE_ROUTE_MISSING_ID_MESSAGE,
  PUBLIC_VOTE_ROUTE_INVALID_ID_MESSAGE,
  PUBLIC_VOTE_POLL_UNAVAILABLE_MESSAGE,
  PUBLIC_VOTE_POLL_ENDED_MESSAGE,
  PUBLIC_VOTE_POLL_CLOSED_MESSAGE,
  PUBLIC_VOTE_NOT_ACCEPTING_MESSAGE,
  PUBLIC_POLL_ARCHIVED_MESSAGE,
  PUBLIC_VOTE_PRE_VOTE_ANONYMOUS_HINT,
  PUBLIC_VOTE_PRE_VOTE_INCOMPLETE_PROFILE_HINT,
  PUBLIC_VOTE_PRE_VOTE_NEUTRAL_SUBMIT_HINT,
  PUBLIC_RESULTS_COLLECTING_TITLE,
  PUBLIC_RESULTS_COLLECTING_SUMMARY,
  PUBLIC_RESULTS_CANCELLED_TITLE,
  PUBLIC_RESULTS_CANCELLED_MESSAGE,
  PUBLIC_RESULTS_UNPUBLISHED_TITLE,
  PUBLIC_RESULTS_UNPUBLISHED_MESSAGE,
  PUBLIC_RESULTS_POLL_UNAVAILABLE_MESSAGE,
  PUBLIC_RESULTS_EMPTY_AGGREGATE_MESSAGE,
  PUBLIC_RESULTS_UNAVAILABLE_AGGREGATE_SUMMARY,
  PUBLIC_EXPLORE_LOAD_MORE_UNAVAILABLE_MESSAGE,
  PUBLIC_EXPLORE_EMPTY_MESSAGE,
  PUBLIC_MY_POLLS_SIGN_IN_REQUIRED_MESSAGE,
  PUBLIC_PROFILE_VIEW_SIGN_IN_REQUIRED_MESSAGE,
  PUBLIC_PROFILE_EDIT_SIGN_IN_REQUIRED_MESSAGE,
  PUBLIC_AUTH_GUEST_SIGN_IN_CTA_ARIA_LABEL,
  PUBLIC_CREATE_POLL_DEMO_SUBMIT_LABEL,
  PUBLIC_LIFECYCLE_LOCKED_ACTION_UNAVAILABLE_MESSAGE,
  PUBLIC_LIFECYCLE_CANCELLED_NOTE_MESSAGE,
  PUBLIC_LIFECYCLE_UNPUBLISHED_VISITOR_MESSAGE,
  PUBLIC_LIFECYCLE_NO_ACTION_AVAILABLE_MESSAGE,
  PUBLIC_LIFECYCLE_DELETE_LOCKED_MESSAGE,
  PUBLIC_LIFECYCLE_INCOMPLETE_STATE_MESSAGE,
  PUBLIC_LIFECYCLE_INVALID_STATE_ACTION_MESSAGE,
  PUBLIC_LIFECYCLE_UNPUBLISH_LOCKED_MESSAGE,
  PUBLIC_LIFECYCLE_ALREADY_CANCELLED_MESSAGE,
  PUBLIC_LIFECYCLE_ALREADY_UNPUBLISHED_MESSAGE,
  PUBLIC_LIFECYCLE_FORBIDDEN_MESSAGE,
  PUBLIC_LIFECYCLE_AUTH_REQUIRED_MESSAGE,
  PUBLIC_LIFECYCLE_POLL_NOT_FOUND_MESSAGE,
  PUBLIC_LIFECYCLE_REVEAL_TOO_EARLY_MESSAGE,
  PUBLIC_LIFECYCLE_NOT_COLLECTING_MESSAGE,
  PUBLIC_LIFECYCLE_POLL_CLOSED_MESSAGE,
  PUBLIC_LIFECYCLE_GENERIC_ACTION_UNAVAILABLE_MESSAGE,
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
    return PUBLIC_POLL_INVALID_ID_MESSAGE;
  }
  if (status === 404 || errorCode === 'POLL_NOT_FOUND') {
    return PUBLIC_POLL_NOT_FOUND_MESSAGE;
  }
  if (errorCode === 'POLL_VALIDATION') {
    if (message === 'Poll is archived') {
      return PUBLIC_POLL_ARCHIVED_MESSAGE;
    }
    if (message === 'Poll is closed') {
      return PUBLIC_VOTE_POLL_ENDED_MESSAGE;
    }
    if (message === 'Poll is no longer accepting responses') {
      return PUBLIC_VOTE_POLL_CLOSED_MESSAGE;
    }
    if (message === 'Poll is not accepting responses') {
      return PUBLIC_VOTE_NOT_ACCEPTING_MESSAGE;
    }
    return PUBLIC_VOTE_POLL_UNAVAILABLE_MESSAGE;
  }
  if (status === 400) {
    return PUBLIC_POLL_INVALID_REQUEST_MESSAGE;
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
    return PUBLIC_VOTE_POLL_UNAVAILABLE_MESSAGE;
  }
  if (
    lifecycle === 'revealed' ||
    lifecycle === 'locked' ||
    lifecycle === 'post_lock'
  ) {
    return PUBLIC_VOTE_POLL_ENDED_MESSAGE;
  }
  if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
    const status = /** @type {{ status?: unknown }} */ (detail).status;
    if (status === 'closed') {
      return PUBLIC_VOTE_POLL_CLOSED_MESSAGE;
    }
  }
  return PUBLIC_VOTE_NOT_ACCEPTING_MESSAGE;
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
        statusTarget.textContent = PUBLIC_SHARE_LINK_COPIED_MESSAGE;
      } else if (result.method === 'prompt') {
        statusTarget.textContent = PUBLIC_SHARE_LINK_PROMPT_MESSAGE;
      } else {
        statusTarget.textContent = PUBLIC_SHARE_LINK_MANUAL_COPY_MESSAGE;
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
  hint.textContent = PUBLIC_CREATE_POLL_SHARE_SUCCESS_LEAD;
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
