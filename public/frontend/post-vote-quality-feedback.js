export const QUALITY_FEEDBACK_MVP_TAGS = [
  '表達清楚',
  '選項公平',
  '值得思考',
  '期待結果',
  '題目不優',
];

export const QUALITY_FEEDBACK_PROMPT = '這題給你的感覺是？';
export const QUALITY_FEEDBACK_PRIVACY_NOTE =
  '回饋只用來累計題目品質，不會記錄你選了哪個選項。';
export const QUALITY_FEEDBACK_SUCCESS_MESSAGE = '已收到，謝謝你的回饋。';
export const QUALITY_FEEDBACK_FAILURE_MESSAGE =
  '目前無法送出回饋，稍後可再試一次。';
export const QUALITY_FEEDBACK_PANEL_ARIA_LABEL = '投票後題目品質回饋';

export async function submitQualityFeedback({
  pollId,
  feedbackTag,
  fetchImpl = globalThis.fetch,
}) {
  let response;
  try {
    response = await fetchImpl(
      `/polls/${encodeURIComponent(pollId)}/quality-feedback`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback_tag: feedbackTag }),
        credentials: 'omit',
      },
    );
  } catch {
    throw new Error(QUALITY_FEEDBACK_FAILURE_MESSAGE);
  }
  if (!response.ok) {
    throw new Error(QUALITY_FEEDBACK_FAILURE_MESSAGE);
  }
  return response;
}

function setChipDisabled(chip, disabled) {
  chip.disabled = disabled;
  if (disabled) {
    chip.setAttribute('aria-disabled', 'true');
  } else {
    chip.removeAttribute('aria-disabled');
  }
}

function setAllChipsDisabled(chips, disabled) {
  for (const chip of chips.children) {
    setChipDisabled(chip, disabled);
  }
}

/**
 * Post-vote quality feedback UI. Mount only after a successful vote.
 */
export function mountPostVoteQualityFeedback(
  parent,
  { pollId, fetchImpl = globalThis.fetch } = {},
) {
  const doc = parent.ownerDocument;
  const wrap = doc.createElement('aside');
  wrap.className = 'mvp-quality-feedback';
  wrap.setAttribute('aria-label', QUALITY_FEEDBACK_PANEL_ARIA_LABEL);
  wrap.setAttribute('data-quality-feedback', 'post-vote');

  const prompt = doc.createElement('p');
  prompt.className = 'mvp-quality-feedback-prompt';
  prompt.textContent = QUALITY_FEEDBACK_PROMPT;
  wrap.append(prompt);

  const note = doc.createElement('p');
  note.className = 'mvp-meta mvp-quality-feedback-note';
  note.textContent = QUALITY_FEEDBACK_PRIVACY_NOTE;
  wrap.append(note);

  const chips = doc.createElement('div');
  chips.className = 'mvp-quality-feedback-chips';
  chips.setAttribute('role', 'group');
  chips.setAttribute('aria-label', QUALITY_FEEDBACK_PROMPT);

  const status = doc.createElement('p');
  status.className = 'mvp-quality-feedback-status';
  status.hidden = true;
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  let submitSucceeded = false;

  function showStatus(message, variant) {
    status.textContent = message;
    status.hidden = false;
    status.className =
      variant === 'error'
        ? 'mvp-quality-feedback-status mvp-quality-feedback-status--error'
        : 'mvp-quality-feedback-status mvp-quality-feedback-status--success';
  }

  for (const label of QUALITY_FEEDBACK_MVP_TAGS) {
    const chip = doc.createElement('button');
    chip.type = 'button';
    chip.className =
      label === '題目不優'
        ? 'mvp-quality-feedback-chip mvp-quality-feedback-chip--neutral'
        : 'mvp-quality-feedback-chip';
    chip.textContent = label;
    chip.addEventListener('click', async () => {
      if (submitSucceeded) {
        return;
      }
      setAllChipsDisabled(chips, true);
      status.hidden = true;
      try {
        await submitQualityFeedback({ pollId, feedbackTag: label, fetchImpl });
        submitSucceeded = true;
        showStatus(QUALITY_FEEDBACK_SUCCESS_MESSAGE, 'success');
      } catch {
        setAllChipsDisabled(chips, false);
        showStatus(QUALITY_FEEDBACK_FAILURE_MESSAGE, 'error');
      }
    });
    chips.append(chip);
  }

  wrap.append(chips);
  wrap.append(status);
  parent.append(wrap);
  return wrap;
}
