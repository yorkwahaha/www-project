import {
  announceToStatusRegion,
  focusFirstFocusable,
  renderPollSharePanel,
  setBusySubmitButton,
} from './public-mvp-ui.js';
import {
  mountUiMockPreviewChrome,
  parseUiMockState,
  renderMockTerminalResultState,
  renderUiMockStatePanel,
} from './policy-ui-placeholders.js';

const MAX_OPTIONS = 6;
const PUBLISH_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const SAFE_FAILURE_MESSAGE = '目前無法建立問卷，請稍後再試。';
const SUBMIT_IDLE_LABEL = '建立問卷';
const SUBMIT_BUSY_LABEL = '建立中…';

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

export async function submitCreatePoll({
  formValues,
  fetchImpl = globalThis.fetch,
  uuidFactory = () => globalThis.crypto.randomUUID(),
  now = () => new Date(),
}) {
  const normalized = normalizeCreatePollForm(formValues);
  const closesAt = new Date(now().getTime() + PUBLISH_DURATION_MS).toISOString();
  let response;
  try {
    response = await fetchImpl('/polls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': uuidFactory(),
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
  renderPollSharePanel(root, created.poll_id, options);
}

export function bootstrapCreatePollPage({
  documentObject = globalThis.document,
  fetchImpl = globalThis.fetch,
  uuidFactory = () => globalThis.crypto.randomUUID(),
  now = () => new Date(),
} = {}) {
  const form = documentObject.getElementById('create-poll-form');
  const message = documentObject.getElementById('form-message');
  const success = documentObject.getElementById('success-panel');
  const submitButton = documentObject.getElementById('create-poll-submit');
  if (!form || !message || !success || !submitButton) {
    return;
  }

  const uiMockState = parseUiMockState(globalThis.location?.search ?? '');
  mountUiMockPreviewChrome(documentObject, uiMockState);
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
      idleLabel: SUBMIT_IDLE_LABEL,
      busyLabel: SUBMIT_BUSY_LABEL,
    });
    announceToStatusRegion(message, '建立中…');
    success.hidden = true;
    success.replaceChildren();

    try {
      const created = await submitCreatePoll({
        formValues: {
          title: documentObject.getElementById('poll-title')?.value ?? '',
          description: documentObject.getElementById('poll-description')?.value ?? '',
          options: [...documentObject.querySelectorAll('input[name="option"]')]
            .map((input) => input.value),
        },
        fetchImpl,
        uuidFactory,
        now,
      });
      announceToStatusRegion(message, '問卷已建立。');
      renderCreatePollSuccess(success, created);
      form.reset();
      form.hidden = true;
      focusFirstFocusable(success);
    } catch (error) {
      announceToStatusRegion(
        message,
        error instanceof Error ? error.message : SAFE_FAILURE_MESSAGE,
      );
      setBusySubmitButton(submitButton, {
        busy: false,
        idleLabel: SUBMIT_IDLE_LABEL,
        busyLabel: SUBMIT_BUSY_LABEL,
      });
    }
  });
}

if (typeof document !== 'undefined') {
  bootstrapCreatePollPage();
}
