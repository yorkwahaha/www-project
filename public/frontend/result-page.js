function appendText(parent, tagName, text, className) {
  const element = parent.ownerDocument.createElement(tagName);
  element.className = className;
  element.textContent = text;
  parent.append(element);
}

export function getPollIdFromResultPath(pathname) {
  const match = pathname.match(/^\/results\/([^/]+)$/);
  return match?.[1] ?? null;
}

export async function loadResultDisplay({ pollId, fetchImpl = globalThis.fetch }) {
  const response = await fetchImpl(`/polls/${encodeURIComponent(pollId)}/results`, {
    method: 'GET',
    credentials: 'omit',
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error('Unable to load results');
  }
  return response.json();
}

export function renderResultDisplay(root, result) {
  root.replaceChildren();
  appendText(root, 'p', result.total_votes_display, 'result-total');
  appendText(root, 'p', result.updated_display, 'result-updated');

  for (const option of result.options) {
    const optionElement = root.ownerDocument.createElement('section');
    optionElement.className = 'result-option';
    appendText(optionElement, 'h2', option.display_label, 'result-label');
    if (option.display_percentage !== null) {
      appendText(optionElement, 'p', option.display_percentage, 'result-percentage');
    }
    if (option.display_count !== null) {
      appendText(optionElement, 'p', option.display_count, 'result-count');
    }
    root.append(optionElement);
  }
}

export async function bootstrapResultPage({
  windowObject = globalThis.window,
  documentObject = globalThis.document,
  fetchImpl = globalThis.fetch,
} = {}) {
  const pollId = getPollIdFromResultPath(windowObject.location.pathname);
  const root = documentObject.getElementById('result-display');
  if (!pollId || !root) {
    return;
  }

  try {
    const result = await loadResultDisplay({ pollId, fetchImpl });
    renderResultDisplay(root, result);
  } catch {
    root.textContent = '無法載入結果';
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  void bootstrapResultPage();
}
