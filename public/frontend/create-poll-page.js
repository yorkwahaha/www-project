import {
  DEMO_POLL_SLUG,
  buildDemoResultPath,
  buildDemoVotePath,
  parseLiveApiMode,
} from './public-mvp-demo.js';
import {
  announceToStatusRegion,
  focusFirstFocusable,
  PUBLIC_CTA_GO_TO_MY_POLLS_LABEL,
  PUBLIC_CTA_GO_TO_VOTE_PAGE_LABEL,
  PUBLIC_CTA_VIEW_COLLECTING_RESULTS_LABEL,
  PUBLIC_CREATE_POLL_DEMO_PANEL_LEAD,
  PUBLIC_CREATE_POLL_DEMO_SUBMIT_LABEL,
  PUBLIC_CREATE_POLL_DEMO_SUCCESS_MESSAGE,
  PUBLIC_CREATE_POLL_LIVE_SUBMIT_STATUS_LABEL,
  PUBLIC_CREATE_POLL_SUCCESS_MESSAGE,
  PUBLIC_CREATE_POLL_SUCCESS_PANEL_ARIA_LABEL,
  PUBLIC_FORM_POLL_CATEGORY_LABEL,
  PUBLIC_FORM_POLL_CLOSE_AT_LABEL,
  PUBLIC_FORM_POLL_DESCRIPTION_LABEL,
  PUBLIC_FORM_POLL_DESCRIPTION_PLACEHOLDER,
  PUBLIC_FORM_POLL_ELIGIBILITY_AGE_LABEL,
  PUBLIC_FORM_POLL_ELIGIBILITY_AGE_PLACEHOLDER,
  PUBLIC_FORM_POLL_ELIGIBILITY_REGION_LABEL,
  PUBLIC_FORM_POLL_ELIGIBILITY_REGION_PLACEHOLDER,
  PUBLIC_FORM_POLL_OPTION_1_LABEL,
  PUBLIC_FORM_POLL_OPTION_2_LABEL,
  PUBLIC_FORM_POLL_OPTION_3_LABEL,
  PUBLIC_FORM_POLL_OPTION_4_LABEL,
  PUBLIC_FORM_POLL_OPTIONS_LEGEND,
  PUBLIC_FORM_POLL_TITLE_LABEL,
  PUBLIC_FORM_POLL_TITLE_PLACEHOLDER,
  renderPollSharePanel,
  resolvePublicErrorUserMessage,
  setBusySubmitButton,
} from './public-mvp-ui.js';
import {
  renderCreateSuccessFlowGuide,
  renderCreatorManageLinks,
} from './creator-flow-copy.js';
import {
  ensureCreatorSessionForLiveMode,
  renderCreatorLifecycleActions,
} from './poll-lifecycle-controls.js';
import {
  mountUiMockPreviewChrome,
  parseUiMockState,
  renderMockTerminalResultState,
  renderUiMockStatePanel,
} from './policy-ui-placeholders.js';

const MAX_OPTIONS = 6;
const PUBLISH_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
export const CREATE_POLL_FAILURE_MESSAGE = '目前無法建立問卷，請稍後再試。';
const SAFE_FAILURE_MESSAGE = CREATE_POLL_FAILURE_MESSAGE;

export const CREATE_POLL_USER_ERROR_MESSAGES = [
  CREATE_POLL_FAILURE_MESSAGE,
  '請填寫問卷標題。',
  '請至少填寫兩個選項。',
  '選項最多六個。',
];

const SUBMIT_IDLE_LABEL = PUBLIC_CREATE_POLL_DEMO_SUBMIT_LABEL;
export const CREATE_POLL_DEMO_SUBMIT_LABEL = PUBLIC_CREATE_POLL_DEMO_SUBMIT_LABEL;
export const CREATE_POLL_DEMO_VOTE_CTA_LABEL = PUBLIC_CTA_GO_TO_VOTE_PAGE_LABEL;
export const CREATE_POLL_DEMO_MY_POLLS_CTA_LABEL = PUBLIC_CTA_GO_TO_MY_POLLS_LABEL;
export const CREATE_POLL_DEMO_COLLECTING_RESULTS_CTA_LABEL =
  PUBLIC_CTA_VIEW_COLLECTING_RESULTS_LABEL;
const SUBMIT_IDLE_LABEL_LIVE = PUBLIC_CREATE_POLL_LIVE_SUBMIT_STATUS_LABEL;
export const CREATE_POLL_LIVE_SUBMIT_STATUS_LABEL =
  PUBLIC_CREATE_POLL_LIVE_SUBMIT_STATUS_LABEL;
export const CREATE_POLL_SUBMIT_PENDING_MESSAGE = '建立中，請稍候。';
export const CREATE_POLL_SUCCESS_MESSAGE = PUBLIC_CREATE_POLL_SUCCESS_MESSAGE;
export const CREATE_POLL_DEMO_SUCCESS_MESSAGE =
  PUBLIC_CREATE_POLL_DEMO_SUCCESS_MESSAGE;
const SUBMIT_BUSY_LABEL = CREATE_POLL_SUBMIT_PENDING_MESSAGE;

export const CREATE_POLL_TITLE_LABEL = PUBLIC_FORM_POLL_TITLE_LABEL;
export const CREATE_POLL_TITLE_PLACEHOLDER = PUBLIC_FORM_POLL_TITLE_PLACEHOLDER;
export const CREATE_POLL_DESCRIPTION_LABEL = PUBLIC_FORM_POLL_DESCRIPTION_LABEL;
export const CREATE_POLL_DESCRIPTION_PLACEHOLDER = PUBLIC_FORM_POLL_DESCRIPTION_PLACEHOLDER;
export const CREATE_POLL_OPTIONS_LEGEND = PUBLIC_FORM_POLL_OPTIONS_LEGEND;

export function normalizeCreatePollForm({ title, description = '', options }) {
  const normalizedTitle = title.trim();
  const normalizedOptions = options.map((option) => option.trim()).filter(Boolean);

  if (!normalizedTitle) {
    throw new Error('請填寫問卷標題。');
  }
  if (normalizedOptions.length < 2) {
    throw new Error('請至少填寫兩個選項。');
  }
  if (normalizedOptions.length > MAX_OPTIONS) {
    throw new Error('選項最多六個。');
  }

  return {
    title: normalizedTitle,
    description: description.trim(),
    options: normalizedOptions,
  };
}

export function submitCreatePollDemo({ formValues }) {
  const normalized = normalizeCreatePollForm(formValues);
  return {
    poll_id: DEMO_POLL_SLUG,
    status: 'demo_static',
    title: normalized.title,
    created_at: new Date().toISOString(),
  };
}

export async function submitCreatePoll({
  formValues,
  fetchImpl = globalThis.fetch,
  now = () => new Date(),
}) {
  const normalized = normalizeCreatePollForm(formValues);
  const closesAt = new Date(now().getTime() + PUBLISH_DURATION_MS).toISOString();
  let response;
  try {
    response = await fetchImpl('/creator/polls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...normalized,
        category: 'general',
        eligible_rule_id: null,
        closes_at: closesAt,
        publish: true,
      }),
      credentials: 'same-origin',
    });
  } catch {
    throw new Error(SAFE_FAILURE_MESSAGE);
  }
  if (!response.ok) {
    throw new Error(SAFE_FAILURE_MESSAGE);
  }
  try {
    return await response.json();
  } catch {
    throw new Error(SAFE_FAILURE_MESSAGE);
  }
}

export function renderCreatePollSuccess(root, created, options = {}) {
  if (options.demoStatic) {
    renderCreatePollDemoSuccess(root);
    return;
  }
  renderPollSharePanel(root, created.poll_id, options);
  if (options.skipCreatorControls) {
    return;
  }
  renderCreateSuccessFlowGuide(root);
  renderCreatorManageLinks(root, {
    pollId: created.poll_id,
    locationObject: options.locationObject,
  });
  const lifecycleHost = root.ownerDocument.createElement('section');
  lifecycleHost.className = 'mvp-creator-lifecycle-panel';
  root.append(lifecycleHost);
  renderCreatorLifecycleActions(lifecycleHost, {
    pollId: created.poll_id,
    lifecycleState: 'collecting',
    title: options.title,
    fetchImpl: options.fetchImpl,
    flowContext: 'create',
  });
}

export function renderCreatePollDemoSuccess(root) {
  root.replaceChildren();
  root.hidden = false;
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', PUBLIC_CREATE_POLL_SUCCESS_PANEL_ARIA_LABEL);

  const hint = root.ownerDocument.createElement('p');
  hint.className = 'panel-message';
  hint.textContent = PUBLIC_CREATE_POLL_DEMO_PANEL_LEAD;
  root.append(hint);

  const voteLink = root.ownerDocument.createElement('a');
  voteLink.className = 'mvp-action-link';
  voteLink.href = buildDemoVotePath();
  voteLink.textContent = PUBLIC_CTA_GO_TO_VOTE_PAGE_LABEL;
  root.append(voteLink);

  const myPollsLink = root.ownerDocument.createElement('a');
  myPollsLink.className = 'mvp-action-link';
  myPollsLink.href = '/my-polls?nav=logged-in-mock';
  myPollsLink.textContent = PUBLIC_CTA_GO_TO_MY_POLLS_LABEL;
  root.append(myPollsLink);

  const resultLink = root.ownerDocument.createElement('a');
  resultLink.className = 'mvp-action-link mvp-action-link-muted';
  resultLink.href = buildDemoResultPath('collecting');
  resultLink.textContent = PUBLIC_CTA_VIEW_COLLECTING_RESULTS_LABEL;
  root.append(resultLink);
}

/**
 * @param {Document} documentObject
 */
export function syncCreatePollFormFieldCopy(documentObject) {
  if (typeof documentObject.querySelector !== 'function') {
    return;
  }
  const titleLabel = documentObject.querySelector('label[for="poll-title"]');
  if (titleLabel) {
    titleLabel.textContent = PUBLIC_FORM_POLL_TITLE_LABEL;
  }
  const titleInput = documentObject.getElementById('poll-title');
  if (titleInput) {
    titleInput.placeholder = PUBLIC_FORM_POLL_TITLE_PLACEHOLDER;
  }

  const descriptionLabel = documentObject.querySelector('label[for="poll-description"]');
  if (descriptionLabel) {
    descriptionLabel.textContent = PUBLIC_FORM_POLL_DESCRIPTION_LABEL;
  }
  const descriptionInput = documentObject.getElementById('poll-description');
  if (descriptionInput) {
    descriptionInput.placeholder = PUBLIC_FORM_POLL_DESCRIPTION_PLACEHOLDER;
  }

  const categoryLabel = documentObject.querySelector('label[for="poll-category"]');
  if (categoryLabel) {
    categoryLabel.textContent = PUBLIC_FORM_POLL_CATEGORY_LABEL;
  }

  const optionsLegend = documentObject.querySelector('#create-poll-form fieldset legend');
  if (optionsLegend) {
    optionsLegend.textContent = PUBLIC_FORM_POLL_OPTIONS_LEGEND;
  }

  const optionLabels = [
    ['poll-option-1', PUBLIC_FORM_POLL_OPTION_1_LABEL],
    ['poll-option-2', PUBLIC_FORM_POLL_OPTION_2_LABEL],
    ['poll-option-3', PUBLIC_FORM_POLL_OPTION_3_LABEL],
    ['poll-option-4', PUBLIC_FORM_POLL_OPTION_4_LABEL],
  ];
  for (const [controlId, labelText] of optionLabels) {
    const optionLabel = documentObject.querySelector(`label[for="${controlId}"]`);
    if (optionLabel) {
      optionLabel.textContent = labelText;
    }
  }

  const closeAtLabel = documentObject.querySelector('label[for="poll-close-at"]');
  if (closeAtLabel) {
    closeAtLabel.textContent = PUBLIC_FORM_POLL_CLOSE_AT_LABEL;
  }

  const eligibilityAgeLabel = documentObject.querySelector('label[for="poll-eligibility-age"]');
  if (eligibilityAgeLabel) {
    eligibilityAgeLabel.textContent = PUBLIC_FORM_POLL_ELIGIBILITY_AGE_LABEL;
  }
  const eligibilityAgeInput = documentObject.getElementById('poll-eligibility-age');
  if (eligibilityAgeInput) {
    eligibilityAgeInput.placeholder = PUBLIC_FORM_POLL_ELIGIBILITY_AGE_PLACEHOLDER;
  }

  const eligibilityRegionLabel = documentObject.querySelector(
    'label[for="poll-eligibility-region"]',
  );
  if (eligibilityRegionLabel) {
    eligibilityRegionLabel.textContent = PUBLIC_FORM_POLL_ELIGIBILITY_REGION_LABEL;
  }
  const eligibilityRegionInput = documentObject.getElementById('poll-eligibility-region');
  if (eligibilityRegionInput) {
    eligibilityRegionInput.placeholder = PUBLIC_FORM_POLL_ELIGIBILITY_REGION_PLACEHOLDER;
  }
}

export function bootstrapCreatePollPage({
  documentObject = globalThis.document,
  fetchImpl = globalThis.fetch,
  uuidFactory = () => globalThis.crypto.randomUUID(),
  now = () => new Date(),
} = {}) {
  syncCreatePollFormFieldCopy(documentObject);
  const form = documentObject.getElementById('create-poll-form');
  const message = documentObject.getElementById('form-message');
  const success = documentObject.getElementById('success-panel');
  const submitButton = documentObject.getElementById('create-poll-submit');
  if (!form || !message || !success || !submitButton) {
    return;
  }

  const search = globalThis.location?.search ?? '';
  const useLiveApi = parseLiveApiMode(search);
  const uiMockState = parseUiMockState(search);
  mountUiMockPreviewChrome(documentObject, uiMockState);
  submitButton.textContent = useLiveApi ? SUBMIT_IDLE_LABEL_LIVE : SUBMIT_IDLE_LABEL;

  const formParent = form.parentElement;
  if (uiMockState && formParent) {
    if (uiMockState === 'cancelled' || uiMockState === 'unpublished') {
      const terminalHost = documentObject.createElement('div');
      terminalHost.id = 'create-mock-terminal';
      formParent.insertBefore(terminalHost, form);
      renderMockTerminalResultState(terminalHost, uiMockState);
    } else if (uiMockState !== 'collecting') {
      renderUiMockStatePanel(formParent, uiMockState);
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitButton.disabled) {
      return;
    }
    setBusySubmitButton(submitButton, {
      busy: true,
      idleLabel: useLiveApi ? SUBMIT_IDLE_LABEL_LIVE : SUBMIT_IDLE_LABEL,
      busyLabel: SUBMIT_BUSY_LABEL,
    });
    announceToStatusRegion(message, CREATE_POLL_SUBMIT_PENDING_MESSAGE);
    success.hidden = true;
    success.replaceChildren();

    const formValues = {
      title: documentObject.getElementById('poll-title')?.value ?? '',
      description: documentObject.getElementById('poll-description')?.value ?? '',
      options: [...documentObject.querySelectorAll('input[name="option"]')].map(
        (input) => input.value,
      ),
    };

    try {
      if (useLiveApi) {
        await ensureCreatorSessionForLiveMode({
          fetchImpl,
          locationObject: globalThis.location,
        });
      }
      const created = useLiveApi
        ? await submitCreatePoll({
            formValues,
            fetchImpl,
            now,
          })
        : submitCreatePollDemo({ formValues });
      announceToStatusRegion(
        message,
        useLiveApi ? CREATE_POLL_SUCCESS_MESSAGE : CREATE_POLL_DEMO_SUCCESS_MESSAGE,
      );
      renderCreatePollSuccess(success, created, {
        demoStatic: !useLiveApi,
        fetchImpl,
        title: formValues.title.trim(),
      });
      form.reset();
      form.hidden = true;
      focusFirstFocusable(success);
    } catch (error) {
      announceToStatusRegion(
        message,
        resolvePublicErrorUserMessage(
          error,
          SAFE_FAILURE_MESSAGE,
          CREATE_POLL_USER_ERROR_MESSAGES,
        ),
      );
    } finally {
      if (!form.hidden) {
        setBusySubmitButton(submitButton, {
          busy: false,
          idleLabel: useLiveApi ? SUBMIT_IDLE_LABEL_LIVE : SUBMIT_IDLE_LABEL,
          busyLabel: SUBMIT_BUSY_LABEL,
        });
      }
    }
  });
}

if (typeof document !== 'undefined') {
  bootstrapCreatePollPage();
}
