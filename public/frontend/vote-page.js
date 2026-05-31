import {
  POLL_ID_PATTERN,
  buildPublicResultPath,
  messageForPollLoadFailure,
  messageForVoteSubmitFailure,
  parsePollApiError,
  renderPublicErrorPanel,
  renderPublicNav,
} from './public-mvp-ui.js';

const SAFE_LOAD_FAILURE_MESSAGE = '目前無法載入問卷，請稍後再試。';
const SAFE_SUBMIT_FAILURE_MESSAGE = '目前無法送出投票，請稍後再試。';
const MISSING_SELECTION_MESSAGE = '請先選擇一個選項。';

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
    throw new Error(SAFE_LOAD_FAILURE_MESSAGE);
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
    throw new Error(SAFE_SUBMIT_FAILURE_MESSAGE);
  }
  if (!response.ok) {
    const apiError = await parsePollApiError(response);
    throw new Error(messageForVoteSubmitFailure(apiError));
  }
  return response;
}

export function renderPollOptions(root, options, onSelect) {
  root.replaceChildren();
  for (const option of options) {
    const label = root.ownerDocument.createElement('label');
    label.className = 'vote-option';

    const input = root.ownerDocument.createElement('input');
    input.type = 'radio';
    input.name = 'poll-option';
    input.value = String(option.option_index);
    input.addEventListener('change', () => onSelect(option.option_index));
    label.append(input);

    const text = root.ownerDocument.createElement('span');
    text.textContent = option.label;
    label.append(text);

    root.append(label);
  }
}

export function renderVoteSuccess(root, pollId) {
  root.replaceChildren();
  root.hidden = false;

  const message = root.ownerDocument.createElement('p');
  message.className = 'panel-message';
  message.textContent = '投票已送出，感謝參與。';
  root.append(message);

  const hint = root.ownerDocument.createElement('p');
  hint.textContent = '可前往結果頁查看公開統計：';
  root.append(hint);

  const link = root.ownerDocument.createElement('a');
  link.href = buildPublicResultPath(pollId);
  link.textContent = '查看公開結果頁';
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

export async function bootstrapVotePage({
  windowObject = globalThis.window,
  documentObject = globalThis.document,
  fetchImpl = globalThis.fetch,
  uuidFactory = () => globalThis.crypto.randomUUID(),
} = {}) {
  const pollId = getPollIdFromVotePath(windowObject.location.pathname);
  const title = documentObject.getElementById('poll-title');
  const description = documentObject.getElementById('poll-description');
  const options = documentObject.getElementById('poll-options');
  const form = documentObject.getElementById('vote-form');
  const message = documentObject.getElementById('form-message');
  const submitButton = documentObject.getElementById('vote-submit');
  const success = documentObject.getElementById('success-panel');
  const errorPanel = documentObject.getElementById('error-panel');
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
      '無法開啟投票頁',
      '網址缺少問卷識別碼，請從建立問卷頁取得正確的投票連結。',
    );
    return;
  }

  if (!POLL_ID_PATTERN.test(pollId)) {
    showRouteError(
      '無法開啟投票頁',
      '網址中的問卷識別碼格式不正確，請確認連結是否完整。',
    );
    return;
  }

  title.textContent = '載入問卷中…';
  message.textContent = '';

  const controller = createVotePageController({
    pollId,
    userId: uuidFactory(),
    fetchImpl,
    windowObject,
    resetSelectionUi: () => {
      for (const input of documentObject.querySelectorAll('input[name="poll-option"]')) {
        input.checked = false;
      }
    },
  });

  try {
    const detail = await loadPollDetail({ pollId, fetchImpl });
    if (errorPanel) {
      errorPanel.hidden = true;
      errorPanel.replaceChildren();
    }
    title.textContent = detail.title;
    description.textContent = detail.description ?? '';
    renderPollOptions(options, detail.options, controller.selectOption);
    form.hidden = false;
  } catch (error) {
    const body = error instanceof Error ? error.message : SAFE_LOAD_FAILURE_MESSAGE;
    showRouteError('無法載入問卷', body);
    return;
  }

  let voteCompleted = false;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (voteCompleted || submitButton.disabled) {
      return;
    }
    submitButton.disabled = true;
    message.textContent = '送出中…';
    success.hidden = true;
    success.replaceChildren();
    try {
      await controller.submit();
      voteCompleted = true;
      message.textContent = '';
      form.hidden = true;
      renderVoteSuccess(success, pollId);
    } catch (error) {
      message.textContent = error instanceof Error
        ? error.message
        : SAFE_SUBMIT_FAILURE_MESSAGE;
      submitButton.disabled = false;
    }
  });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  void bootstrapVotePage();
}
