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
  PUBLIC_ACTION_PENDING_MESSAGE,
  PUBLIC_LIFECYCLE_ALREADY_CANCELLED_MESSAGE,
  PUBLIC_LIFECYCLE_ALREADY_UNPUBLISHED_MESSAGE,
  PUBLIC_LIFECYCLE_AUTH_REQUIRED_MESSAGE,
  PUBLIC_LIFECYCLE_CANCELLED_NOTE_MESSAGE,
  PUBLIC_LIFECYCLE_CANCEL_SUCCESS_MESSAGE,
  PUBLIC_LIFECYCLE_CLOSE_SUCCESS_MESSAGE,
  PUBLIC_LIFECYCLE_DELETE_LOCKED_MESSAGE,
  PUBLIC_LIFECYCLE_FORBIDDEN_MESSAGE,
  PUBLIC_LIFECYCLE_GENERIC_ACTION_UNAVAILABLE_MESSAGE,
  PUBLIC_LIFECYCLE_INCOMPLETE_STATE_MESSAGE,
  PUBLIC_LIFECYCLE_INVALID_STATE_ACTION_MESSAGE,
  PUBLIC_LIFECYCLE_LOCKED_ACTION_UNAVAILABLE_MESSAGE,
  PUBLIC_LIFECYCLE_NO_ACTION_AVAILABLE_MESSAGE,
  PUBLIC_LIFECYCLE_NOT_COLLECTING_MESSAGE,
  PUBLIC_LIFECYCLE_POLL_CLOSED_MESSAGE,
  PUBLIC_LIFECYCLE_POLL_NOT_FOUND_MESSAGE,
  PUBLIC_LIFECYCLE_REFRESH_DEFERRED_SUCCESS_MESSAGE,
  PUBLIC_LIFECYCLE_REVEAL_TOO_EARLY_MESSAGE,
  PUBLIC_LIFECYCLE_UNPUBLISH_LOCKED_MESSAGE,
  PUBLIC_LIFECYCLE_UNPUBLISH_SUCCESS_MESSAGE,
  PUBLIC_LIFECYCLE_UNPUBLISHED_VISITOR_MESSAGE,
  resolvePublicErrorUserMessage,
  setBusySubmitButton,
} from './public-mvp-ui.js';

/** Seeded creator for localhost manual / smoke flows (matches scripts/smoke-public-local.mjs). */
export const LOCAL_DEMO_CREATOR_USER_ID = '11111111-1111-4111-8111-111111111111';

export const LIFECYCLE_ACTION_PENDING_MESSAGE = PUBLIC_ACTION_PENDING_MESSAGE;

export const LIFECYCLE_GENERIC_FAILURE = '目前無法更新問卷狀態，請稍後再試。';
const GENERIC_FAILURE = LIFECYCLE_GENERIC_FAILURE;
export const LIFECYCLE_RESULT_REFRESH_DEFERRED_STATUS =
  PUBLIC_LIFECYCLE_REFRESH_DEFERRED_SUCCESS_MESSAGE;
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

/** @typedef {'cancel' | 'close' | 'unpublish'} LifecycleTransitionAction */

/** @type {Record<LifecycleTransitionAction, { path: string; label: string; confirm: string; success: string; className: string }>} */
export const LIFECYCLE_TRANSITION_COPY = {
  cancel: {
    path: 'cancel',
    label: '取消問卷',
    confirm:
      '確定要取消此問卷嗎？取消後不會產生公開結果，且無法恢復為收集中狀態。',
    success: PUBLIC_LIFECYCLE_CANCEL_SUCCESS_MESSAGE,
    className: 'mvp-btn mvp-btn-sm mvp-btn-accent-outline',
  },
  close: {
    path: 'close',
    label: '結束收集並公開結果',
    confirm:
      '確定要結束收集並公開結果嗎？之後將進入公開鎖定期；收集中不會顯示票數或百分比。',
    success: PUBLIC_LIFECYCLE_CLOSE_SUCCESS_MESSAGE,
    className: 'mvp-btn mvp-btn-sm mvp-btn-primary',
  },
  unpublish: {
    path: 'unpublish',
    label: '下架問卷',
    confirm:
      '確定要下架此問卷嗎？下架後訪客將無法再查看公開結果頁（鎖定期須已結束）。',
    success: PUBLIC_LIFECYCLE_UNPUBLISH_SUCCESS_MESSAGE,
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
      return PUBLIC_LIFECYCLE_DELETE_LOCKED_MESSAGE;
    }
    if (
      typeof message === 'string' &&
      message.includes('lifecycle timestamps are incomplete')
    ) {
      return PUBLIC_LIFECYCLE_INCOMPLETE_STATE_MESSAGE;
    }
    return PUBLIC_LIFECYCLE_INVALID_STATE_ACTION_MESSAGE;
  }
  if (errorCode === 'LOCKED_PERIOD_CONFLICT') {
    return PUBLIC_LIFECYCLE_UNPUBLISH_LOCKED_MESSAGE;
  }
  if (errorCode === 'ALREADY_CANCELLED') {
    return PUBLIC_LIFECYCLE_ALREADY_CANCELLED_MESSAGE;
  }
  if (errorCode === 'ALREADY_UNPUBLISHED') {
    return PUBLIC_LIFECYCLE_ALREADY_UNPUBLISHED_MESSAGE;
  }
  if (errorCode === 'POLL_FORBIDDEN') {
    return PUBLIC_LIFECYCLE_FORBIDDEN_MESSAGE;
  }
  if (errorCode === 'AUTH_REQUIRED' || status === 401) {
    return PUBLIC_LIFECYCLE_AUTH_REQUIRED_MESSAGE;
  }
  if (errorCode === 'POLL_NOT_FOUND' || status === 404) {
    return PUBLIC_LIFECYCLE_POLL_NOT_FOUND_MESSAGE;
  }
  if (errorCode === 'POLL_VALIDATION') {
    if (message === 'Poll cannot be revealed before closes_at') {
      return PUBLIC_LIFECYCLE_REVEAL_TOO_EARLY_MESSAGE;
    }
    if (message === 'Poll is not collecting responses') {
      return PUBLIC_LIFECYCLE_NOT_COLLECTING_MESSAGE;
    }
    if (message === 'Poll is closed') {
      return PUBLIC_LIFECYCLE_POLL_CLOSED_MESSAGE;
    }
    return PUBLIC_LIFECYCLE_GENERIC_ACTION_UNAVAILABLE_MESSAGE;
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
    return PUBLIC_LIFECYCLE_LOCKED_ACTION_UNAVAILABLE_MESSAGE;
  }
  if (lifecycleState === 'cancelled') {
    return PUBLIC_LIFECYCLE_CANCELLED_NOTE_MESSAGE;
  }
  if (lifecycleState === 'unpublished') {
    return PUBLIC_LIFECYCLE_UNPUBLISHED_VISITOR_MESSAGE;
  }
  return PUBLIC_LIFECYCLE_NO_ACTION_AVAILABLE_MESSAGE;
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
  const idleLabel = copy.label;
  setBusySubmitButton(button, {
    busy: true,
    idleLabel,
    busyLabel: LIFECYCLE_ACTION_PENDING_MESSAGE,
  });
  status.textContent = LIFECYCLE_ACTION_PENDING_MESSAGE;
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
    setBusySubmitButton(button, {
      busy: false,
      idleLabel,
      busyLabel: LIFECYCLE_ACTION_PENDING_MESSAGE,
    });
  }
}

export function isManageablePollId(pollId) {
  return typeof pollId === 'string' && POLL_ID_PATTERN.test(pollId);
}
