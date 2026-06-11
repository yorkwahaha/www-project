/**
 * Phase 58B — creator lifecycle controls (POST cancel / close / unpublish).
 * No option_id, counter data, or creator authority in storage, logs, or UI payloads.
 */

import {
  lifecycleLeadForContext,
  renderCreatorActionGuide,
} from './creator-flow-copy.js';
import {
  buildPublicResultPath,
  isLocalDemoHostname,
  parsePollApiError,
  POLL_ID_PATTERN,
  resolvePublicErrorUserMessage,
} from './public-mvp-ui.js';

/** Seeded creator for localhost manual / smoke flows (matches scripts/smoke-public-local.mjs). */
export const LOCAL_DEMO_CREATOR_USER_ID = '11111111-1111-4111-8111-111111111111';

export const LIFECYCLE_GENERIC_FAILURE = '目前無法更新問卷狀態，請稍後再試。';
const GENERIC_FAILURE = LIFECYCLE_GENERIC_FAILURE;
const LIFECYCLE_RESULT_REFRESH_DEFERRED_STATUS =
  '狀態已更新。結果顯示暫時無法重新載入，請重新整理頁面。';
export const CREATOR_SESSION_FAILURE = '目前無法確認發起者身分，請稍後再試。';
export const CREATOR_SESSION_ERROR_NAME = 'CreatorSessionFailureError';

export function creatorSessionFailureError() {
  const error = new Error(CREATOR_SESSION_FAILURE);
  error.name = CREATOR_SESSION_ERROR_NAME;
  return error;
}

export function isCreatorSessionFailureError(error) {
  return error instanceof Error && error.name === CREATOR_SESSION_ERROR_NAME;
}

export const LIFECYCLE_USER_ERROR_MESSAGES = [
  LIFECYCLE_GENERIC_FAILURE,
  CREATOR_SESSION_FAILURE,
  '公開結果期間無法刪除問卷；鎖定期結束後請使用下架。',
  '問卷狀態資料不完整，無法推進生命週期。',
  '目前問卷狀態無法執行此操作，請重新整理後再試。',
  '公開鎖定期尚未結束，目前無法下架。',
  '此問卷已取消。',
  '此問卷已下架。',
  '僅發起者可執行此操作。',
  '需要發起者身分才能執行此操作。',
  '找不到此問卷，可能已刪除或連結有誤。',
  '尚未到預定截止時間，無法結束收集並公開結果。',
  '問卷目前不在收集中，無法執行此操作。',
  '此問卷已結束，無法再變更狀態。',
  '無法執行此操作，請確認問卷狀態後再試。',
];

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
 * @param {() => string} [uuidFactory]
 */
export function resolvePublicMvpCreatorId(
  uuidFactory = () => globalThis.crypto.randomUUID(),
) {
  const hostname = globalThis.location?.hostname;
  if (hostname && isLocalDemoHostname(hostname)) {
    return LOCAL_DEMO_CREATOR_USER_ID;
  }
  return uuidFactory();
}

/**
 * @param {{ fetchImpl?: typeof fetch; locationObject?: Location }} [options]
 */
export async function ensureCreatorSessionForLiveMode({
  fetchImpl = globalThis.fetch,
  locationObject = globalThis.location,
} = {}) {
  let response;
  try {
    response = await fetchImpl('/creator/session', {
      method: 'GET',
      credentials: 'same-origin',
    });
  } catch {
    throw creatorSessionFailureError();
  }
  if (response.ok) {
    return true;
  }
  if (response.status !== 401 || !isLocalDemoHostname(locationObject?.hostname)) {
    throw creatorSessionFailureError();
  }
  try {
    response = await fetchImpl('/creator/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: LOCAL_DEMO_CREATOR_USER_ID }),
      credentials: 'same-origin',
    });
  } catch {
    throw creatorSessionFailureError();
  }
  if (!response.ok) {
    throw creatorSessionFailureError();
  }
  return true;
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
 * @param {typeof fetch} [fetchImpl]
 */
export async function postPollLifecycleTransition(
  pollId,
  action,
  fetchImpl = globalThis.fetch,
) {
  const copy = LIFECYCLE_TRANSITION_COPY[action];
  let response;
  try {
    response = await fetchImpl(
      `/creator/polls/${encodeURIComponent(pollId)}/${copy.path}`,
      {
        method: 'POST',
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
 *   onStateChange?: (nextState: string) => void;
 *   onTransitionSuccess?: () =>
 *     | void
 *     | Promise<void | { refreshed?: boolean }>;
 *   flowContext?: 'create' | 'manage' | 'results';
 *   showFlowGuide?: boolean;
 * }} options
 */
export function renderCreatorLifecycleActions(host, options) {
  const {
    pollId,
    lifecycleState,
    title,
    fetchImpl = globalThis.fetch,
    onStateChange,
    onTransitionSuccess,
    flowContext = 'manage',
    showFlowGuide = true,
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
  lead.textContent = lifecycleLeadForContext(flowContext, lifecycleState);
  host.append(lead);

  if (showFlowGuide) {
    renderCreatorActionGuide(host, lifecycleState);
  }

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
        fetchImpl,
        status,
        title,
        onStateChange,
        onTransitionSuccess,
        flowContext,
        showFlowGuide,
        host,
      });
    });
    toolbar.append(button);
  }

  const resultLink = host.ownerDocument.createElement('a');
  resultLink.className = 'mvp-action-link mvp-action-link-muted';
  resultLink.href = `${buildPublicResultPath(pollId)}?creator=1`;
  resultLink.textContent = '結果頁（發起者）';
  toolbar.append(resultLink);
}

function lifecycleFeedbackElement(host, fallback) {
  if (host && typeof host.querySelector === 'function') {
    const node = host.querySelector('.mvp-demo-action-feedback');
    if (node) {
      return node;
    }
  }
  return fallback;
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
  fetchImpl,
  status,
  title,
  onStateChange,
  onTransitionSuccess,
  flowContext,
  showFlowGuide,
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
      fetchImpl,
    );
    const nextState = nextLifecycleStateFromTransition(action, body);
    if (nextState) {
      onStateChange?.(nextState);
      renderCreatorLifecycleActions(host, {
        pollId,
        lifecycleState: nextState,
        title,
        fetchImpl,
        onStateChange,
        onTransitionSuccess,
        flowContext,
        showFlowGuide,
      });
      const refreshOutcome = await onTransitionSuccess?.();
      const feedback = lifecycleFeedbackElement(host, status);
      feedback.textContent =
        refreshOutcome && refreshOutcome.refreshed === false
          ? LIFECYCLE_RESULT_REFRESH_DEFERRED_STATUS
          : copy.success;
    } else {
      lifecycleFeedbackElement(host, status).textContent = copy.success;
    }
  } catch (error) {
    lifecycleFeedbackElement(host, status).textContent =
      resolvePublicErrorUserMessage(
        error,
        GENERIC_FAILURE,
        LIFECYCLE_USER_ERROR_MESSAGES,
      );
    button.disabled = false;
  }
}

export function isManageablePollId(pollId) {
  return typeof pollId === 'string' && POLL_ID_PATTERN.test(pollId);
}
