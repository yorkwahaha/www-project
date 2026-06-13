export const QUALITY_FEEDBACK_BADGE_LABEL = '回饋良好';
export const QUALITY_FEEDBACK_BADGE_CLASS = 'positive-feedback-badge';
export const QUALITY_FEEDBACK_BADGE_ROW_CLASS = 'mvp-quality-feedback-badge-row';

export function shouldRenderQualityFeedbackBadge(poll) {
  return poll?.quality_badge === 'positive_feedback';
}

export function renderQualityFeedbackBadge(documentObject, poll) {
  if (!shouldRenderQualityFeedbackBadge(poll)) {
    return null;
  }

  const badge = documentObject.createElement('span');
  badge.className = `mvp-badge ${QUALITY_FEEDBACK_BADGE_CLASS}`;
  badge.textContent = QUALITY_FEEDBACK_BADGE_LABEL;
  return badge;
}

export function mountQualityFeedbackBadgeNearTitle(documentObject, titleElement, poll) {
  if (!titleElement) {
    return null;
  }

  const parent = titleElement.parentNode ?? titleElement.parentElement;
  if (!parent) {
    return null;
  }

  const nextSibling = titleElement.nextSibling ?? titleElement.nextElementSibling;
  let row =
    nextSibling &&
    typeof nextSibling === 'object' &&
    'className' in nextSibling &&
    String(nextSibling.className).includes(QUALITY_FEEDBACK_BADGE_ROW_CLASS)
      ? nextSibling
      : null;

  if (!row) {
    row = documentObject.createElement('div');
    row.className = QUALITY_FEEDBACK_BADGE_ROW_CLASS;
    if (typeof parent.insertBefore === 'function') {
      parent.insertBefore(row, titleElement.nextSibling ?? null);
    } else if (typeof parent.append === 'function') {
      parent.append(row);
    }
  }

  if (typeof row.replaceChildren === 'function') {
    row.replaceChildren();
  } else if (Array.isArray(row.children)) {
    row.children = [];
  }

  const badge = renderQualityFeedbackBadge(documentObject, poll);
  if (badge) {
    if (typeof row.append === 'function') {
      row.append(badge);
    } else if (Array.isArray(row.children)) {
      row.children.push(badge);
    }
    row.hidden = false;
  } else {
    row.hidden = true;
  }

  return row;
}
