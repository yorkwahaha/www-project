import {
  formatPublicPollLifecycleStatusLabel,
  getPublicLifecycleStateFromPoll,
} from './public-mvp-ui.js';
import { lifecycleBadgeClassForVoteDetail } from './public-vote-detail-layout.js';

export const PUBLIC_RESULTS_DETAIL_LAYOUT_ORDER = [
  'title',
  'status-meta',
  'visibility-hints',
  'result-content',
  'unavailable-panel',
  'navigation-cta',
];

export const PUBLIC_RESULTS_DETAIL_HEADER_CLASS = 'mvp-results-detail-header';
export const PUBLIC_RESULTS_DETAIL_STATUS_META_CLASS = 'mvp-results-detail-status-meta';
export const PUBLIC_RESULTS_DETAIL_STATUS_ROW_CLASS = 'mvp-results-detail-status-row';
export const PUBLIC_RESULTS_DETAIL_META_CLASS = 'mvp-results-detail-meta';
export const PUBLIC_RESULTS_DETAIL_VISIBILITY_HINTS_CLASS =
  'mvp-results-detail-visibility-hints';
export const PUBLIC_RESULTS_DETAIL_CONTENT_CLASS = 'mvp-results-detail-content';
export const PUBLIC_RESULTS_DETAIL_UNAVAILABLE_CLASS = 'mvp-results-detail-unavailable';
export const PUBLIC_RESULTS_DETAIL_NAV_CLASS = 'mvp-results-detail-nav';

const RESULTS_AGGREGATE_HIDDEN_STATES = new Set([
  'collecting',
  'cancelled',
  'unpublished',
  'draft',
]);

/**
 * @param {unknown} result
 */
export function buildResultsDetailMetaLine(result) {
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    return '';
  }
  const record = /** @type {{ updated_display?: unknown; public_lifecycle_state?: unknown }} */ (
    result
  );
  const lifecycle = getPublicLifecycleStateFromPoll(result);
  if (lifecycle && RESULTS_AGGREGATE_HIDDEN_STATES.has(lifecycle)) {
    return '';
  }
  const updated =
    typeof record.updated_display === 'string' ? record.updated_display.trim() : '';
  return updated;
}

function clearElementChildren(element) {
  if (typeof element.replaceChildren === 'function') {
    element.replaceChildren();
    return;
  }
  if (Array.isArray(element.children)) {
    element.children = [];
  }
  element.textContent = '';
}

/**
 * @param {Document} documentObject
 * @param {unknown} [result]
 */
export function syncResultsDetailStatusMeta(documentObject, result = null) {
  if (typeof documentObject.getElementById !== 'function') {
    return;
  }

  const statusMetaSection = documentObject.getElementById('results-detail-status-meta');
  const statusRow = documentObject.getElementById('results-detail-status-row');
  const metaLine = documentObject.getElementById('results-detail-meta-line');

  if (!statusRow || !metaLine) {
    return;
  }

  if (!result) {
    clearElementChildren(statusRow);
    statusRow.hidden = true;
    metaLine.textContent = '';
    metaLine.hidden = true;
    if (statusMetaSection) {
      statusMetaSection.hidden = true;
    }
    return;
  }

  const lifecycle = getPublicLifecycleStateFromPoll(result);
  clearElementChildren(statusRow);
  if (lifecycle) {
    const badge = documentObject.createElement('span');
    badge.className = lifecycleBadgeClassForVoteDetail(lifecycle);
    badge.textContent = formatPublicPollLifecycleStatusLabel(lifecycle);
    if (typeof statusRow.append === 'function') {
      statusRow.append(badge);
    }
    statusRow.hidden = false;
  } else {
    statusRow.hidden = true;
  }

  const meta = buildResultsDetailMetaLine(result);
  if (meta) {
    metaLine.textContent = meta;
    metaLine.hidden = false;
  } else {
    metaLine.textContent = '';
    metaLine.hidden = true;
  }

  if (statusMetaSection) {
    statusMetaSection.hidden = false;
  }
}
