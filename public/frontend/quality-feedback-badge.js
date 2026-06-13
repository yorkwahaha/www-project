export const QUALITY_FEEDBACK_BADGE_LABEL = '回饋良好';
export const QUALITY_FEEDBACK_BADGE_CLASS = 'positive-feedback-badge';

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
