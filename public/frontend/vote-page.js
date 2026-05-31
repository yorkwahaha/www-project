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
    throw new Error(SAFE_LOAD_FAILURE_MESSAGE);
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
    throw new Error(SAFE_SUBMIT_FAILURE_MESSAGE);
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
  message.textContent = '投票已送出。';
  root.append(message);

  const link = root.ownerDocument.createElement('a');
  link.href = `/results/${encodeURIComponent(pollId)}`;
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
  if (
    !pollId ||
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
    title.textContent = detail.title;
    description.textContent = detail.description;
    renderPollOptions(options, detail.options, controller.selectOption);
    form.hidden = false;
  } catch {
    title.textContent = '無法載入問卷';
    message.textContent = SAFE_LOAD_FAILURE_MESSAGE;
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submitButton.disabled = true;
    message.textContent = '送出中...';
    success.hidden = true;
    success.replaceChildren();
    try {
      await controller.submit();
      message.textContent = '';
      renderVoteSuccess(success, pollId);
    } catch (error) {
      message.textContent = error instanceof Error
        ? error.message
        : SAFE_SUBMIT_FAILURE_MESSAGE;
    } finally {
      submitButton.disabled = false;
    }
  });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  void bootstrapVotePage();
}
