const MAX_OPTIONS = 6;
const PUBLISH_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const SAFE_FAILURE_MESSAGE = '目前無法建立問卷，請稍後再試。';

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

export function renderCreatePollSuccess(root, created) {
  root.replaceChildren();
  root.hidden = false;

  const message = root.ownerDocument.createElement('p');
  message.textContent = `問卷已建立：${created.poll_id}`;
  root.append(message);

  const link = root.ownerDocument.createElement('a');
  link.href = `/results/${encodeURIComponent(created.poll_id)}`;
  link.textContent = '查看公開結果頁';
  root.append(link);
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

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submitButton.disabled = true;
    message.textContent = '建立中...';
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
      message.textContent = '';
      renderCreatePollSuccess(success, created);
      form.reset();
    } catch (error) {
      message.textContent = error instanceof Error
        ? error.message
        : SAFE_FAILURE_MESSAGE;
    } finally {
      submitButton.disabled = false;
    }
  });
}

if (typeof document !== 'undefined') {
  bootstrapCreatePollPage();
}
