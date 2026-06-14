import {
  formatPublicPollCardCloseTimeLabel,
  formatPublicPollCardMetaLine,
} from './public-poll-card.js';
import {
  formatPublicPollLifecycleStatusLabel,
  getPublicLifecycleStateFromPoll,
} from './public-mvp-ui.js';

export const PUBLIC_VOTE_DETAIL_LAYOUT_ORDER = [
  'title',
  'status-meta',
  'pre-vote-hints',
  'options',
  'action-area',
  'unavailable-panel',
];

export const PUBLIC_VOTE_DETAIL_HEADER_CLASS = 'mvp-vote-detail-header';
export const PUBLIC_VOTE_DETAIL_STATUS_META_CLASS = 'mvp-vote-detail-status-meta';
export const PUBLIC_VOTE_DETAIL_STATUS_ROW_CLASS = 'mvp-vote-detail-status-row';
export const PUBLIC_VOTE_DETAIL_META_CLASS = 'mvp-vote-detail-meta';
export const PUBLIC_VOTE_DETAIL_DESCRIPTION_CLASS = 'mvp-vote-detail-description';
export const PUBLIC_VOTE_DETAIL_PRE_VOTE_HINTS_CLASS = 'mvp-vote-detail-pre-vote-hints';
export const PUBLIC_VOTE_DETAIL_ACTION_AREA_CLASS = 'mvp-vote-detail-action-area';
export const PUBLIC_VOTE_DETAIL_UNAVAILABLE_CLASS = 'mvp-vote-detail-unavailable';

const VOTE_DETAIL_CATEGORY_LABELS = {
  general: '一般',
  life: '生活',
  workplace: '職場',
};

const VOTE_DETAIL_LIFECYCLE_BADGE_CLASSES = {
  draft: 'mvp-badge mvp-badge-muted',
  collecting: 'mvp-badge mvp-badge-collecting',
  revealed: 'mvp-badge mvp-badge-revealed',
  locked: 'mvp-badge mvp-badge-locked',
  post_lock: 'mvp-badge mvp-badge-muted',
  cancelled: 'mvp-badge mvp-badge-danger',
  unpublished: 'mvp-badge mvp-badge-muted',
};

/**
 * @param {string | null | undefined} category
 */
export function formatVoteDetailCategoryLabel(category) {
  const normalized = String(category ?? '').trim().toLowerCase();
  return VOTE_DETAIL_CATEGORY_LABELS[normalized] ?? (normalized ? category : '一般');
}

/**
 * @param {string | null | undefined} lifecycleState
 */
export function lifecycleBadgeClassForVoteDetail(lifecycleState) {
  return (
    VOTE_DETAIL_LIFECYCLE_BADGE_CLASSES[lifecycleState] ??
    VOTE_DETAIL_LIFECYCLE_BADGE_CLASSES.draft
  );
}

/**
 * @param {unknown} detail
 */
export function buildVoteDetailMetaLine(detail) {
  if (!detail || typeof detail !== 'object' || Array.isArray(detail)) {
    return '';
  }
  const record = /** @type {{ category?: unknown; closes_at?: unknown }} */ (detail);
  return formatPublicPollCardMetaLine(
    formatVoteDetailCategoryLabel(
      typeof record.category === 'string' ? record.category : null,
    ),
    formatPublicPollCardCloseTimeLabel(
      typeof record.closes_at === 'string' ? record.closes_at : null,
    ),
  );
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
 * @param {unknown} [detail]
 */
export function syncVoteDetailStatusMeta(documentObject, detail = null) {
  if (typeof documentObject.getElementById !== 'function') {
    return;
  }

  const statusMetaSection = documentObject.getElementById('vote-detail-status-meta');
  const statusRow = documentObject.getElementById('vote-detail-status-row');
  const metaLine = documentObject.getElementById('vote-detail-meta-line');

  if (!statusRow || !metaLine) {
    return;
  }

  if (!detail) {
    clearElementChildren(statusRow);
    statusRow.hidden = true;
    metaLine.textContent = '';
    metaLine.hidden = true;
    if (statusMetaSection) {
      statusMetaSection.hidden = true;
    }
    return;
  }

  const lifecycle = getPublicLifecycleStateFromPoll(detail);
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

  const meta = buildVoteDetailMetaLine(detail);
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
