/**
 * Phase 58B — creator lifecycle controls (POST cancel / close / unpublish).
 * No option_id or counter data in storage, logs, or UI payloads.
 */

import {
  buildPublicResultPath,
  isLocalDemoHostname,
  parsePollApiError,
  POLL_ID_PATTERN,
} from './public-mvp-ui.js';

/** Seeded creator for localhost manual / smoke flows (matches scripts/smoke-public-local.mjs). */
export const LOCAL_DEMO_CREATOR_USER_ID = '11111111-1111-4111-8111-111111111111';

const CREATOR_USER_SESSION_KEY = 'www_public_mvp_creator_user_id';
const MANAGED_POLL_SESSION_KEY = 'www_creator_managed_poll';

const GENERIC_FAILURE = '目前無法更新問卷狀態，請稍後再試。';

/** @typedef {'cancel' | 'close' | 'unpublish'} LifecycleTransitionAction */

/** @type {Record<LifecycleTransitionAction, { path: string; label: string; confirm: string; success: string; className: string }>} */
export const LIFECYCLE_TRANSITION_COPY = {
  cancel: {
    path: 'cancel',
    label: '取消問卷',
    confirm:
      '確定要取消此問卷嗎？取消後不會產生公開結果，且無法恢復為收集中狀態。',
    success: '問卷已取消，不會產生公開結果。',
    className: 'mvp-btn mvp-btn-sm mvp-btn-accent-outline',
  },
  close: {
    path: 'close',
    label: '結束收集並公開結果',
    confirm:
      '確定要結束收集並公開結果嗎？之後將進入公開鎖定期；收集中不會顯示票數或百分比。',
    success: '問卷已公開結果，進入公開鎖定期。',
    className: 'mvp-btn mvp-btn-sm mvp-btn-primary',
  },
  unpublish: {
    path: 'unpublish',
    label: '下架問卷',
    confirm:
      '確定要下架此問卷嗎？下架後訪客將無法再查看公開結果頁（鎖定期須已結束）。',
    success: '問卷已下架。',
    className: 'mvp-btn mvp-btn-sm mvp-btn-secondary',
  },
};

/**
 * @param {string | null | undefined} lifecycleState
 * @returns {LifecycleTransitionAction[]}
 */
export function lifecycleActionsForState(lifecycleState) {
  if (lifecycleState === 'collecting') {
    return ['cancel', 'close'];
  }
  if (lifecycleState === 'post_lock') {
    return ['unpublish'];
  }
  return [];
}

export function parseCreatorManageMode(search = '') {
  const rawSearch =
    typeof search === 'string' && search.length > 0
      ? search.startsWith('?')
        ? search
        : `?${search}`
      : '';
  const params = new URLSearchParams(rawSearch);
  return params.get('creator') === '1' || params.get('manage') === '1';
}

/**
 * @param {Storage | undefined} storage
 * @param {() => string} [uuidFactory]
 */
export function resolvePublicMvpCreatorId(
  storage = globalThis.sessionStorage,
  uuidFactory = () => globalThis.crypto.randomUUID(),
) {
  const hostname = globalThis.location?.hostname;
  if (hostname && isLocalDemoHostname(hostname)) {
    return LOCAL_DEMO_CREATOR_USER_ID;
  }
  if (!storage) {
    return uuidFactory();
  }
  const existing = storage.getItem(CREATOR_USER_SESSION_KEY);
  if (existing) {
    return existing;
  }
  const created = uuidFactory();
  storage.setItem(CREATOR_USER_SESSION_KEY, created);
  return created;
}

/**
 * @param {Storage | undefined} storage
 * @returns {{ pollId: string; public_lifecycle_state: string; title?: string } | null}
 */
export function readManagedPoll(storage = globalThis.sessionStorage) {
  if (!storage) {
    return null;
  }
  const raw = storage.getItem(MANAGED_POLL_SESSION_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.pollId === 'string' &&
      POLL_ID_PATTERN.test(parsed.pollId) &&
      typeof parsed.public_lifecycle_state === 'string'
    ) {
      return {
        pollId: parsed.pollId,
        public_lifecycle_state: parsed.public_lifecycle_state,
        title: typeof parsed.title === 'string' ? parsed.title : undefined,
      };
    }
  } catch {
    // ignore corrupt session entries
  }
  return null;
}

/**
 * @param {Storage | undefined} storage
 * @param {{ pollId: string; public_lifecycle_state: string; title?: string }} poll
 */
export function writeManagedPoll(storage, poll) {
  if (!storage || !poll?.pollId || !POLL_ID_PATTERN.test(poll.pollId)) {
    return;
  }
  storage.setItem(
    MANAGED_POLL_SESSION_KEY,
    JSON.stringify({
      pollId: poll.pollId,
      public_lifecycle_state: poll.public_lifecycle_state,
      ...(poll.title ? { title: poll.title } : {}),
    }),
  );
}

/**
 * @param {{ status?: number; errorCode?: string | null; message?: string | null }} apiError
 */
export function messageForLifecycleTransitionFailure(apiError = {}) {
  const { status, errorCode, message } = apiError;
  if (errorCode === 'LIFECYCLE_CONFLICT') {
    if (
      typeof message === 'string' &&
      message.includes('Creator delete is not allowed')
    ) {
      return '公開結果期間無法刪除問卷；鎖定期結束後請使用下架。';
    }
    if (
      typeof message === 'string' &&
      message.includes('lifecycle timestamps are incomplete')
    ) {
      return '問卷狀態資料不完整，無法推進生命週期。';
    }
    return '目前問卷狀態無法執行此操作，請重新整理後再試。';
  }
  if (errorCode === 'LOCKED_PERIOD_CONFLICT') {
    return '公開鎖定期尚未結束，目前無法下架。';
  }
  if (errorCode === 'ALREADY_CANCELLED') {
    return '此問卷已取消。';
  }
  if (errorCode === 'ALREADY_UNPUBLISHED') {
    return '此問卷已下架。';
  }
  if (errorCode === 'POLL_FORBIDDEN') {
    return '僅發起者可執行此操作。';
  }
  if (errorCode === 'AUTH_REQUIRED' || status === 401) {
    return '需要發起者身分才能執行此操作。';
  }
  if (errorCode === 'POLL_NOT_FOUND' || status === 404) {
    return '找不到此問卷，可能已刪除或連結有誤。';
  }
  if (errorCode === 'POLL_VALIDATION') {
    if (message === 'Poll cannot be revealed before closes_at') {
      return '尚未到預定截止時間，無法結束收集並公開結果。';
    }
    if (message === 'Poll is not collecting responses') {
      return '問卷目前不在收集中，無法執行此操作。';
    }
    if (message === 'Poll is closed') {
      return '此問卷已結束，無法再變更狀態。';
    }
    return '無法執行此操作，請確認問卷狀態後再試。';
  }
  return GENERIC_FAILURE;
}

/**
 * @param {LifecycleTransitionAction} action
 * @param {{ confirm?: (message: string) => boolean }} [options]
 */
export function confirmLifecycleTransition(
  action,
  { confirm = globalThis.confirm } = {},
) {
  const copy = LIFECYCLE_TRANSITION_COPY[action];
  if (typeof confirm !== 'function') {
    return true;
  }
  return confirm(copy.confirm);
}

/**
 * @param {string} pollId
 * @param {LifecycleTransitionAction} action
 * @param {string} creatorUserId
 * @param {typeof fetch} [fetchImpl]
 */
export async function postPollLifecycleTransition(
  pollId,
  action,
  creatorUserId,
  fetchImpl = globalThis.fetch,
) {
  const copy = LIFECYCLE_TRANSITION_COPY[action];
  let response;
  try {
    response = await fetchImpl(
      `/polls/${encodeURIComponent(pollId)}/${copy.path}`,
      {
        method: 'POST',
        headers: { 'X-User-Id': creatorUserId },
        credentials: 'same-origin',
      },
    );
  } catch {
    throw new Error(GENERIC_FAILURE);
  }
  if (!response.ok) {
    const apiError = await parsePollApiError(response);
    throw new Error(messageForLifecycleTransitionFailure(apiError));
  }
  try {
    return await response.json();
  } catch {
    throw new Error(GENERIC_FAILURE);
  }
}

/**
 * @param {string} action
 * @param {Record<string, unknown>} body
 */
export function nextLifecycleStateFromTransition(action, body) {
  if (action === 'cancel' && body?.public_lifecycle_state === 'cancelled') {
    return 'cancelled';
  }
  if (action === 'close' && body?.public_lifecycle_state === 'revealed') {
    return 'revealed';
  }
  if (action === 'unpublish' && body?.public_lifecycle_state === 'unpublished') {
    return 'unpublished';
  }
  return null;
}

/**
 * @param {HTMLElement} host
 * @param {{
 *   pollId: string;
 *   lifecycleState: string;
 *   title?: string;
 *   fetchImpl?: typeof fetch;
 *   storage?: Storage;
 *   creatorUserId?: string;
 *   onStateChange?: (nextState: string) => void;
 * }} options
 */
export function renderCreatorLifecycleActions(host, options) {
  const {
    pollId,
    lifecycleState,
    title,
    fetchImpl = globalThis.fetch,
    storage = globalThis.sessionStorage,
    creatorUserId = resolvePublicMvpCreatorId(storage),
    onStateChange,
  } = options;

  host.replaceChildren();
  host.hidden = false;
  host.setAttribute('role', 'region');
  host.setAttribute('aria-label', '發起者問卷狀態操作');

  const heading = host.ownerDocument.createElement('h2');
  heading.className = 'mvp-policy-panel-title mvp-creator-lifecycle-title';
  heading.textContent = title
    ? `發起者操作：${title}`
    : '發起者問卷狀態操作';
  host.append(heading);

  const lead = host.ownerDocument.createElement('p');
  lead.className = 'mvp-meta mvp-creator-lifecycle-lead';
  lead.textContent =
    '以下操作會變更公開狀態；收集中不會顯示票數。公開鎖定期內無法下架或刪除。';
  host.append(lead);

  const toolbar = host.ownerDocument.createElement('div');
  toolbar.className = 'mvp-creator-lifecycle-toolbar';
  toolbar.setAttribute('data-demo-feedback-host', 'true');
  host.append(toolbar);

  const status = host.ownerDocument.createElement('p');
  status.className = 'mvp-demo-action-feedback';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  host.append(status);

  const actions = lifecycleActionsForState(lifecycleState);
  if (actions.length === 0) {
    const note = host.ownerDocument.createElement('p');
    note.className = 'mvp-meta';
    note.textContent = lifecycleNoteForState(lifecycleState);
    toolbar.append(note);
    return;
  }

  for (const action of actions) {
    const copy = LIFECYCLE_TRANSITION_COPY[action];
    const button = host.ownerDocument.createElement('button');
    button.type = 'button';
    button.className = copy.className;
    button.textContent = copy.label;
    button.addEventListener('click', () => {
      void runLifecycleTransition({
        button,
        action,
        pollId,
        creatorUserId,
        fetchImpl,
        storage,
        status,
        title,
        onStateChange,
        host,
      });
    });
    toolbar.append(button);
  }

  const resultLink = host.ownerDocument.createElement('a');
  resultLink.className = 'mvp-action-link mvp-action-link-muted';
  resultLink.href = `${buildPublicResultPath(pollId)}?creator=1`;
  resultLink.textContent = '查看公開結果頁';
  toolbar.append(resultLink);
}

function lifecycleNoteForState(lifecycleState) {
  if (lifecycleState === 'revealed' || lifecycleState === 'locked') {
    return '問卷已公開結果並處於公開鎖定期，目前無法取消、下架或修改內容。';
  }
  if (lifecycleState === 'cancelled') {
    return '此問卷已取消，不會產生公開結果。';
  }
  if (lifecycleState === 'unpublished') {
    return '此問卷已下架，訪客無法再查看公開結果。';
  }
  return '此狀態目前沒有可執行的發起者操作。';
}

async function runLifecycleTransition({
  button,
  action,
  pollId,
  creatorUserId,
  fetchImpl,
  storage,
  status,
  title,
  onStateChange,
  host,
}) {
  if (!confirmLifecycleTransition(action)) {
    return;
  }
  const copy = LIFECYCLE_TRANSITION_COPY[action];
  button.disabled = true;
  status.textContent = '處理中…';
  try {
    const body = await postPollLifecycleTransition(
      pollId,
      action,
      creatorUserId,
      fetchImpl,
    );
    const nextState = nextLifecycleStateFromTransition(action, body);
    if (nextState) {
      writeManagedPoll(storage, {
        pollId,
        public_lifecycle_state: nextState,
        title,
      });
      onStateChange?.(nextState);
      renderCreatorLifecycleActions(host, {
        pollId,
        lifecycleState: nextState,
        title,
        fetchImpl,
        storage,
        creatorUserId,
        onStateChange,
      });
    }
    status.textContent = copy.success;
  } catch (error) {
    status.textContent =
      error instanceof Error ? error.message : GENERIC_FAILURE;
    button.disabled = false;
  }
}

export function isManageablePollId(pollId) {
  return typeof pollId === 'string' && POLL_ID_PATTERN.test(pollId);
}
