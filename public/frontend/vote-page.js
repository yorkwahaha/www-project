import {
  getDemoPollDetail,
  isDemoPollRouteId,
  submitVoteDemo,
} from './public-mvp-demo.js';
import {
  GENERIC_VOTE_SUBMIT_FAILURE,
  isPublicMvpPagePollId,
  announceToStatusRegion,
  buildPublicResultPath,
  focusFirstFocusable,
  isPollAcceptingVotes,
  markRegionBusy,
  messageForPollLoadFailure,
  messageForPollVotingBlocked,
  messageForVoteSubmitFailure,
  parsePollApiError,
  PUBLIC_POLL_LOAD_USER_MESSAGES,
  PUBLIC_VOTE_ROUTE_INVALID_ID_MESSAGE,
  PUBLIC_VOTE_ROUTE_MISSING_ID_MESSAGE,
  PUBLIC_VOTE_ROUTE_UNAVAILABLE_TITLE,
  PUBLIC_VOTE_DEMO_SUCCESS_MESSAGE,
  PUBLIC_VOTE_DEMO_SUCCESS_RESULT_HINT,
  PUBLIC_VOTE_DEMO_SUCCESS_STATUS_MESSAGE,
  PUBLIC_CTA_VIEW_PUBLIC_RESULTS_LABEL,
  PUBLIC_VOTE_SUCCESS_RESULT_HINT,
  PUBLIC_VOTE_SUCCESS_MESSAGE,
  PUBLIC_VOTE_SUCCESS_PANEL_ARIA_LABEL,
  PUBLIC_VOTE_SUCCESS_STATUS_MESSAGE,
  PUBLIC_VOTE_SUBMIT_USER_MESSAGES,
  PUBLIC_FORM_VOTE_OPTIONS_LEGEND,
  PUBLIC_HOME_VALUE_COLLECTING_HIDDEN_BODY,
  PUBLIC_VOTE_COLLECTING_PANEL_HEADING,
  PUBLIC_VOTE_FOLLOW_RESULTS_PANEL_HEADING,
  PUBLIC_VOTE_PAGE_REMINDER_LEAD,
  PUBLIC_VOTE_POLICY_PANEL_HEADING,
  renderPublicErrorPanel,
  renderPublicNav,
  resolvePublicErrorUserMessage,
  resolvePublicMvpUserId,
  setBusySubmitButton,
  VOTE_PAGE_LOAD_FAILURE,
  VOTE_SUBMIT_TRANSPORT_FAILURE,
} from './public-mvp-ui.js';
import { mountSiteChrome } from './public-mvp-layout.js';
import { mountOfficialVotePreVoteHint } from './official-vote-pre-vote-hints.js';
import { mountPostVoteQualityFeedback } from './post-vote-quality-feedback.js';
import {
  applyVotePageUiMockState,
  mountUiMockPreviewChrome,
  parseUiMockState,
  renderVotePagePolicyPanels,
  renderVoteQualityFeedbackPreview,
  renderVoteSuccessPolicyExtras,
} from './policy-ui-placeholders.js';

export const VOTE_SUCCESS_MESSAGE = PUBLIC_VOTE_SUCCESS_MESSAGE;
export const VOTE_SUCCESS_STATUS_MESSAGE = PUBLIC_VOTE_SUCCESS_STATUS_MESSAGE;
export const VOTE_RESULT_CTA_LABEL = PUBLIC_CTA_VIEW_PUBLIC_RESULTS_LABEL;
export const VOTE_DEMO_SUCCESS_STATUS_MESSAGE =
  PUBLIC_VOTE_DEMO_SUCCESS_STATUS_MESSAGE;
export const MISSING_SELECTION_MESSAGE = '請先選擇一個選項。';
export const VOTE_OPTIONS_LEGEND = PUBLIC_FORM_VOTE_OPTIONS_LEGEND;
export const VOTE_POLICY_PANEL_HEADING = PUBLIC_VOTE_POLICY_PANEL_HEADING;
export const VOTE_COLLECTING_PANEL_HEADING = PUBLIC_VOTE_COLLECTING_PANEL_HEADING;
export const VOTE_FOLLOW_RESULTS_PANEL_HEADING = PUBLIC_VOTE_FOLLOW_RESULTS_PANEL_HEADING;
export const VOTE_PAGE_REMINDER_LEAD = PUBLIC_VOTE_PAGE_REMINDER_LEAD;

export const VOTE_PAGE_LOAD_USER_MESSAGES = PUBLIC_POLL_LOAD_USER_MESSAGES;

export const VOTE_PAGE_SUBMIT_USER_MESSAGES = [
  ...PUBLIC_VOTE_SUBMIT_USER_MESSAGES,
  MISSING_SELECTION_MESSAGE,
];

export const VOTE_PAGE_LOADING_MESSAGE = '載入問卷中，請稍候。';
export const VOTE_SUBMIT_PENDING_MESSAGE = '送出中，請稍候。';

const SUBMIT_IDLE_LABEL = '送出投票';
const SUBMIT_BUSY_LABEL = VOTE_SUBMIT_PENDING_MESSAGE;

export function getPollIdFromVotePath(pathname) {
  const match = pathname.match(/^\/vote\/([^/]+)$/);
  return match?.[1] ?? null;
}

export async function loadPollDetail({ pollId, fetchImpl = globalThis.fetch }) {
  const response = await fetchImpl(`/polls/${encodeURIComponent(pollId)}`, {
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
    throw new Error(VOTE_PAGE_LOAD_FAILURE);
  }
}

export async function submitVoteByIndex({
  pollId,
  optionIndex,
  userId,
  fetchImpl = globalThis.fetch,
}) {
  if (!Number.isInteger(optionIndex) || optionIndex < 0) {
    throw new Error(MISSING_SELECTION_MESSAGE);
  }
  let response;
  try {
    response = await fetchImpl(
      `/polls/${encodeURIComponent(pollId)}/vote-by-index`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({ option_index: optionIndex }),
        credentials: 'same-origin',
      },
    );
  } catch {
    throw new Error(VOTE_SUBMIT_TRANSPORT_FAILURE);
  }
  if (!response.ok) {
    await parsePollApiError(response);
    throw new Error(messageForVoteSubmitFailure());
  }
  return response;
}

export function renderPollOptions(root, options, onSelect) {
  root.replaceChildren();
  for (const option of options) {
    const inputId = `vote-option-${option.option_index}`;
    const label = root.ownerDocument.createElement('label');
    label.className = 'vote-option';
    label.htmlFor = inputId;

    const input = root.ownerDocument.createElement('input');
    input.type = 'radio';
    input.id = inputId;
    input.name = 'poll-option';
    input.value = String(option.option_index);
    input.setAttribute('aria-label', option.label);
    input.addEventListener('change', () => {
      for (const peer of root.children) {
        if (peer.className?.startsWith('vote-option')) {
          peer.className = 'vote-option';
        }
      }
      label.className = 'vote-option is-selected';
      onSelect(option.option_index);
    });
    label.append(input);

    const text = root.ownerDocument.createElement('span');
    text.textContent = option.label;
    label.append(text);

    root.append(label);
  }
}

export function renderVoteSuccess(
  root,
  pollId,
  { demoOnly = false, fetchImpl = globalThis.fetch } = {},
) {
  root.replaceChildren();
  root.hidden = false;
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', PUBLIC_VOTE_SUCCESS_PANEL_ARIA_LABEL);

  const message = root.ownerDocument.createElement('p');
  message.className = 'panel-message';
  message.textContent = demoOnly
    ? PUBLIC_VOTE_DEMO_SUCCESS_MESSAGE
    : VOTE_SUCCESS_MESSAGE;
  root.append(message);

  const hint = root.ownerDocument.createElement('p');
  hint.textContent = demoOnly
    ? PUBLIC_VOTE_DEMO_SUCCESS_RESULT_HINT
    : PUBLIC_VOTE_SUCCESS_RESULT_HINT;
  root.append(hint);

  if (demoOnly) {
    renderVoteQualityFeedbackPreview(root);
  } else {
    mountPostVoteQualityFeedback(root, { pollId, fetchImpl });
  }
  renderVoteSuccessPolicyExtras(root);

  const link = root.ownerDocument.createElement('a');
  link.className = 'mvp-action-link';
  link.href = buildPublicResultPath(pollId);
  link.textContent = PUBLIC_CTA_VIEW_PUBLIC_RESULTS_LABEL;
  root.append(link);
}

export function createVotePageController({
  pollId,
  userId,
  fetchImpl = globalThis.fetch,
  windowObject = globalThis.window,
  resetSelectionUi = () => {},
}) {
  let selectedOptionIndex = null;

  function clearRuntimeMemory() {
    selectedOptionIndex = null;
    resetSelectionUi();
  }

  function selectOption(optionIndex) {
    selectedOptionIndex = optionIndex;
  }

  async function submit() {
    try {
      return await submitVoteByIndex({
        pollId,
        optionIndex: selectedOptionIndex,
        userId,
        fetchImpl,
      });
    } finally {
      clearRuntimeMemory();
    }
  }

  windowObject.addEventListener('pagehide', clearRuntimeMemory);
  windowObject.addEventListener('pageshow', (event) => {
    if (event.persisted === true) {
      clearRuntimeMemory();
    }
  });

  return {
    selectOption,
    submit,
    clearRuntimeMemory,
    hasSensitiveRuntimeState: () => selectedOptionIndex !== null,
  };
}

/**
 * @param {{
 *   detail: unknown;
 *   submitButton: HTMLButtonElement | null;
 *   message: HTMLElement | null;
 *   collectingNotice?: HTMLElement | null;
 * }} input
 */
export function applyVotePageVotingAvailability({
  detail,
  submitButton,
  message,
  collectingNotice = null,
}) {
  if (isPollAcceptingVotes(detail)) {
    return { votingAllowed: true, blockedMessage: null };
  }
  const blockedMessage = messageForPollVotingBlocked(detail);
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.setAttribute('aria-disabled', 'true');
  }
  announceToStatusRegion(message, blockedMessage);
  if (collectingNotice) {
    collectingNotice.hidden = true;
  }
  return { votingAllowed: false, blockedMessage };
}

/**
 * @param {Document} documentObject
 */
export function syncVoteFormFieldCopy(documentObject) {
  if (typeof documentObject.querySelector !== 'function') {
    return;
  }
  const legend = documentObject.querySelector('#vote-form fieldset legend');
  if (legend) {
    legend.textContent = PUBLIC_FORM_VOTE_OPTIONS_LEGEND;
  }
}

export function syncVotePageSectionHeadings(documentObject) {
  if (typeof documentObject.querySelector !== 'function') {
    return;
  }
  const policyHeading = documentObject.querySelector(
    'aside.mvp-policy-panel[aria-label="投票須知"] h2',
  );
  if (policyHeading) {
    policyHeading.textContent = PUBLIC_VOTE_POLICY_PANEL_HEADING;
  }
  const collectingHeading = documentObject.querySelector(
    '#vote-collecting-notice h2',
  );
  if (collectingHeading) {
    collectingHeading.textContent = PUBLIC_VOTE_COLLECTING_PANEL_HEADING;
  }
  const followHeading = documentObject.querySelector('#vote-side-panel h2');
  if (followHeading) {
    followHeading.textContent = PUBLIC_VOTE_FOLLOW_RESULTS_PANEL_HEADING;
  }
  if (typeof documentObject.getElementById === 'function') {
    const collectingNoticeBody = documentObject.getElementById('vote-collecting-notice-body');
    if (collectingNoticeBody) {
      collectingNoticeBody.textContent = PUBLIC_HOME_VALUE_COLLECTING_HIDDEN_BODY;
    }
  }
}

export function syncVotePageLeadParagraphs(documentObject) {
  if (typeof documentObject.getElementById !== 'function') {
    return;
  }
  const reminderLead = documentObject.getElementById('vote-page-reminder-lead');
  if (reminderLead) {
    reminderLead.textContent = PUBLIC_VOTE_PAGE_REMINDER_LEAD;
  }
}

export async function bootstrapVotePage({
  windowObject = globalThis.window,
  documentObject = globalThis.document,
  fetchImpl = globalThis.fetch,
  uuidFactory = () => globalThis.crypto.randomUUID(),
} = {}) {
  syncVotePageSectionHeadings(documentObject);
  syncVotePageLeadParagraphs(documentObject);
  syncVoteFormFieldCopy(documentObject);
  const pollId = getPollIdFromVotePath(windowObject.location.pathname);
  const title = documentObject.getElementById('poll-title');
  const description = documentObject.getElementById('poll-description');
  const options = documentObject.getElementById('poll-options');
  const form = documentObject.getElementById('vote-form');
  const message = documentObject.getElementById('form-message');
  const submitButton = documentObject.getElementById('vote-submit');
  const success = documentObject.getElementById('success-panel');
  const errorPanel = documentObject.getElementById('error-panel');
  const policyPanels = documentObject.getElementById('vote-policy-panels');
  if (
    !title ||
    !description ||
    !options ||
    !form ||
    !message ||
    !submitButton ||
    !success
  ) {
    return;
  }

  mountSiteChrome(documentObject, { fetchImpl });

  const uiMockState = parseUiMockState(windowObject.location.search);
  mountUiMockPreviewChrome(documentObject, uiMockState);

  const showRouteError = (heading, body) => {
    title.textContent = heading;
    description.textContent = '';
    form.hidden = true;
    success.hidden = true;
    message.textContent = '';
    if (errorPanel) {
      renderPublicErrorPanel(errorPanel, {
        title: heading,
        message: body,
        showNav: false,
      });
      errorPanel.hidden = false;
    } else {
      message.textContent = body;
      renderPublicNav(title.parentElement ?? title);
    }
  };

  if (!pollId) {
    showRouteError(
      PUBLIC_VOTE_ROUTE_UNAVAILABLE_TITLE,
      PUBLIC_VOTE_ROUTE_MISSING_ID_MESSAGE,
    );
    return;
  }

  if (!isPublicMvpPagePollId(pollId)) {
    showRouteError(
      PUBLIC_VOTE_ROUTE_UNAVAILABLE_TITLE,
      PUBLIC_VOTE_ROUTE_INVALID_ID_MESSAGE,
    );
    return;
  }

  const demoOnly = isDemoPollRouteId(pollId);
  title.textContent = demoOnly ? '範例問卷' : VOTE_PAGE_LOADING_MESSAGE;
  title.setAttribute('aria-busy', 'true');
  markRegionBusy(form, true);
  announceToStatusRegion(message, '');

  const controller = createVotePageController({
    pollId,
    userId: resolvePublicMvpUserId(uuidFactory),
    fetchImpl,
    windowObject,
    resetSelectionUi: () => {
      for (const input of documentObject.querySelectorAll('input[name="poll-option"]')) {
        input.checked = false;
      }
      for (const label of documentObject.querySelectorAll('.vote-option.is-selected')) {
        label.className = 'vote-option';
      }
    },
  });

  let votingAllowed = true;

  try {
    const detail = demoOnly
      ? getDemoPollDetail()
      : await loadPollDetail({ pollId, fetchImpl });
    if (errorPanel) {
      errorPanel.hidden = true;
      errorPanel.replaceChildren();
    }
    title.textContent = detail.title;
    title.removeAttribute('aria-busy');
    description.textContent = detail.description ?? '';
    renderPollOptions(options, detail.options, controller.selectOption);
    if (policyPanels) {
      renderVotePagePolicyPanels(policyPanels, { mockState: uiMockState });
      policyPanels.hidden = false;
    }
    const collectingNotice = documentObject.getElementById('vote-collecting-notice');
    if (collectingNotice) {
      collectingNotice.hidden = Boolean(policyPanels && !policyPanels.hidden);
    }
    form.hidden = false;
    ({ votingAllowed } = applyVotePageVotingAvailability({
      detail,
      submitButton,
      message,
      collectingNotice,
    }));
    void mountOfficialVotePreVoteHint(documentObject, { fetchImpl });
    applyVotePageUiMockState({
      mockState: uiMockState,
      form,
      policyPanels,
      message,
      title,
    });
    markRegionBusy(form, false);
  } catch (error) {
    const body = resolvePublicErrorUserMessage(
      error,
      VOTE_PAGE_LOAD_FAILURE,
      VOTE_PAGE_LOAD_USER_MESSAGES,
    );
    showRouteError('無法載入問卷', body);
    return;
  }

  let voteCompleted = false;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (voteCompleted || submitButton.disabled || !votingAllowed) {
      return;
    }
    setBusySubmitButton(submitButton, {
      busy: true,
      idleLabel: SUBMIT_IDLE_LABEL,
      busyLabel: SUBMIT_BUSY_LABEL,
    });
    announceToStatusRegion(message, VOTE_SUBMIT_PENDING_MESSAGE);
    success.hidden = true;
    success.replaceChildren();
    try {
      if (demoOnly) {
        if (controller.hasSensitiveRuntimeState() === false) {
          throw new Error(MISSING_SELECTION_MESSAGE);
        }
        const selected = documentObject.querySelector(
          'input[name="poll-option"]:checked',
        );
        const optionIndex = selected ? Number(selected.value) : null;
        submitVoteDemo({ optionIndex });
        controller.clearRuntimeMemory();
      } else {
        await controller.submit();
      }
      voteCompleted = true;
      announceToStatusRegion(
        message,
        demoOnly ? VOTE_DEMO_SUCCESS_STATUS_MESSAGE : VOTE_SUCCESS_STATUS_MESSAGE,
      );
      form.hidden = true;
      renderVoteSuccess(success, pollId, { demoOnly, fetchImpl });
      focusFirstFocusable(success);
    } catch (error) {
      const failureMessage = resolvePublicErrorUserMessage(
        error,
        GENERIC_VOTE_SUBMIT_FAILURE,
        VOTE_PAGE_SUBMIT_USER_MESSAGES,
      );
      announceToStatusRegion(message, failureMessage);
      setBusySubmitButton(submitButton, {
        busy: false,
        idleLabel: SUBMIT_IDLE_LABEL,
        busyLabel: SUBMIT_BUSY_LABEL,
      });
    }
  });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  void bootstrapVotePage();
}
