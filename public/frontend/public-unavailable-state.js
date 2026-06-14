/**
 * Shared presentation helpers for public empty / load-failure / unavailable states.
 * Frontend-owned copy and DOM structure only; no API or storage behavior.
 */

export const PUBLIC_UNAVAILABLE_EMPTY_STATE_CLASS = 'mvp-public-empty-state';
export const PUBLIC_UNAVAILABLE_LOAD_FAILURE_CLASS = 'mvp-public-load-failure';
export const PUBLIC_UNAVAILABLE_STATUS_BLOCK_CLASS = 'mvp-public-unavailable-status';
export const PUBLIC_UNAVAILABLE_TITLE_CLASS = 'mvp-public-unavailable-title';
export const PUBLIC_UNAVAILABLE_MESSAGE_CLASS = 'mvp-public-unavailable-message';
export const PUBLIC_UNAVAILABLE_SUMMARY_CLASS = 'mvp-public-unavailable-summary';

/** Fixed presentation order for unavailable / empty / load-failure panels. */
export const PUBLIC_UNAVAILABLE_STATE_LAYOUT_ORDER = [
  'title',
  'message',
  'summary',
  'cta',
];

function clearHostChildren(host) {
  if (typeof host.replaceChildren === 'function') {
    host.replaceChildren();
    return;
  }
  if (Array.isArray(host.children)) {
    host.children = [];
  }
  host.textContent = '';
}

function appendClassName(element, className) {
  if (!element || !className) {
    return;
  }
  const existing = String(element.className ?? '').trim();
  element.className = existing ? `${existing} ${className}` : className;
}

/**
 * @param {Document} documentObject
 * @param {HTMLElement} host
 * @param {{
 *   message: string,
 *   summary?: string | null,
 *   ctaHref?: string | null,
 *   ctaLabel?: string | null,
 *   ctaClassName?: string,
 * }} [options]
 */
export function renderPublicEmptyStatePanel(
  documentObject,
  host,
  {
    message,
    summary = null,
    ctaHref = null,
    ctaLabel = null,
    ctaClassName = 'mvp-btn mvp-btn-secondary',
  } = {},
) {
  clearHostChildren(host);
  appendClassName(host, PUBLIC_UNAVAILABLE_EMPTY_STATE_CLASS);

  const lead = documentObject.createElement('p');
  lead.textContent = message;
  host.append(lead);

  if (summary) {
    const summaryParagraph = documentObject.createElement('p');
    summaryParagraph.className = 'mvp-meta';
    summaryParagraph.textContent = summary;
    host.append(summaryParagraph);
  }

  if (ctaHref && ctaLabel) {
    const link = documentObject.createElement('a');
    link.className = ctaClassName;
    link.href = ctaHref;
    link.textContent = ctaLabel;
    host.append(link);
  }
}

/**
 * @param {Document} documentObject
 * @param {HTMLElement} host
 * @param {{
 *   title?: string | null,
 *   message: string,
 *   ctaHref?: string | null,
 *   ctaLabel?: string | null,
 *   role?: string,
 * }} [options]
 */
export function renderPublicLoadFailurePanel(
  documentObject,
  host,
  {
    title = null,
    message,
    ctaHref = null,
    ctaLabel = null,
    role = 'alert',
  } = {},
) {
  clearHostChildren(host);
  host.hidden = false;
  if (typeof host.setAttribute === 'function') {
    host.setAttribute('role', role);
  }
  appendClassName(host, PUBLIC_UNAVAILABLE_LOAD_FAILURE_CLASS);

  if (title) {
    const heading = documentObject.createElement('h2');
    heading.className = `panel-heading ${PUBLIC_UNAVAILABLE_TITLE_CLASS}`;
    heading.textContent = title;
    host.append(heading);
  }

  const body = documentObject.createElement('p');
  body.className = title
    ? `panel-message ${PUBLIC_UNAVAILABLE_MESSAGE_CLASS}`
    : 'panel-message';
  body.textContent = message;
  host.append(body);

  if (ctaHref && ctaLabel) {
    const link = documentObject.createElement('a');
    link.className = 'mvp-action-link';
    link.href = ctaHref;
    link.textContent = ctaLabel;
    host.append(link);
  }
}

/**
 * Compact inline load-failure / unavailable note with optional CTA.
 *
 * @param {Document} documentObject
 * @param {HTMLElement} host
 * @param {{
 *   message: string,
 *   ctaHref?: string | null,
 *   ctaLabel?: string | null,
 * }} [options]
 */
export function renderPublicInlineFailureNote(
  documentObject,
  host,
  { message, ctaHref = null, ctaLabel = null } = {},
) {
  renderPublicLoadFailurePanel(documentObject, host, {
    message,
    ctaHref,
    ctaLabel,
    role: 'alert',
  });
}

/**
 * @param {Document} documentObject
 * @param {HTMLElement} root
 * @param {{
 *   title: string,
 *   message: string,
 *   summary?: string | null,
 *   ariaLabel?: string | null,
 *   blockClassName?: string,
 * }} [options]
 */
export function renderPublicUnavailableStatusBlock(
  documentObject,
  root,
  {
    title,
    message,
    summary = null,
    ariaLabel = null,
    blockClassName = `result-unavailable-status ${PUBLIC_UNAVAILABLE_STATUS_BLOCK_CLASS}`,
  } = {},
) {
  const block = documentObject.createElement('section');
  block.className = blockClassName;
  block.setAttribute('role', 'status');
  if (ariaLabel) {
    block.setAttribute('aria-label', ariaLabel);
  }

  const heading = documentObject.createElement('h2');
  heading.className = `result-unavailable-title ${PUBLIC_UNAVAILABLE_TITLE_CLASS}`;
  heading.textContent = title;
  block.append(heading);

  const body = documentObject.createElement('p');
  body.className = `result-unavailable-message ${PUBLIC_UNAVAILABLE_MESSAGE_CLASS}`;
  body.textContent = message;
  block.append(body);

  if (summary) {
    const summaryParagraph = documentObject.createElement('p');
    summaryParagraph.className = `result-unavailable-summary ${PUBLIC_UNAVAILABLE_SUMMARY_CLASS}`;
    summaryParagraph.textContent = summary;
    block.append(summaryParagraph);
  }

  root.append(block);
  return block;
}
