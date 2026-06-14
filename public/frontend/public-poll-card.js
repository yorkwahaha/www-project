import { renderQualityFeedbackBadge } from './quality-feedback-badge.js';

export const PUBLIC_POLL_CARD_CLASS = 'mvp-poll-card';
export const PUBLIC_POLL_CARD_STATUS_ROW_CLASS = 'mvp-poll-card-status-row';
export const PUBLIC_POLL_CARD_META_CLASS = 'mvp-poll-card-meta';
export const PUBLIC_POLL_CARD_HINT_CLASS = 'mvp-poll-card-hint';
export const PUBLIC_POLL_CARD_FOOTER_CLASS = 'mvp-poll-card-footer';
export const PUBLIC_POLL_CARD_TIME_CELL_CLASS = 'mvp-poll-card-time-cell';

/** Fixed child order: title → status row → meta → hint/body → footer CTA. */
export const PUBLIC_POLL_CARD_METADATA_LAYOUT_ORDER = [
  'title',
  'status-row',
  'meta',
  'hint-or-body',
  'footer-cta',
];

export function formatPublicPollCardMetaLine(categoryLabel, timeLabel) {
  const category = String(categoryLabel ?? '').trim();
  const time = String(timeLabel ?? '').trim();
  if (category && time) {
    return `${category} · ${time}`;
  }
  return category || time;
}

export function formatPublicPollCardCloseTimeLabel(isoTimestamp) {
  if (!isoTimestamp || typeof isoTimestamp !== 'string') {
    return '';
  }
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const formatted = date.toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `截止 ${formatted}`;
}

export function buildPublicPollCardTitle(documentObject, title) {
  const heading = documentObject.createElement('h3');
  heading.textContent = title;
  return heading;
}

export function appendPublicPollCardStatusRow(
  documentObject,
  parent,
  { statusElement, pollRecord = null } = {},
) {
  const row = documentObject.createElement('div');
  row.className = PUBLIC_POLL_CARD_STATUS_ROW_CLASS;
  if (statusElement) {
    row.append(statusElement);
  }
  const feedbackBadge = pollRecord
    ? renderQualityFeedbackBadge(documentObject, pollRecord)
    : null;
  if (feedbackBadge) {
    row.append(feedbackBadge);
  }
  parent.append(row);
  return row;
}

export function buildPublicPollCardMeta(documentObject, metaLine) {
  const meta = documentObject.createElement('p');
  meta.className = PUBLIC_POLL_CARD_META_CLASS;
  meta.textContent = metaLine;
  return meta;
}

export function buildPublicPollCardHint(documentObject, hintText) {
  const hint = documentObject.createElement('p');
  hint.className = PUBLIC_POLL_CARD_HINT_CLASS;
  hint.textContent = hintText;
  return hint;
}

export function buildPublicPollCardFooter(documentObject, ...children) {
  const footer = documentObject.createElement('div');
  footer.className = PUBLIC_POLL_CARD_FOOTER_CLASS;
  for (const child of children) {
    if (child) {
      footer.append(child);
    }
  }
  return footer;
}
