const SHARE_LINK_COPIED_MESSAGE = '已複製連結。';
const SHARE_LINK_PROMPT_MESSAGE =
  '瀏覽器無法自動複製，已顯示手動複製提示；亦可選取下方完整網址。';
const SHARE_LINK_MANUAL_COPY_MESSAGE = '無法自動複製，請手動選取下方完整網址。';

const CREATE_POLL_SHARE_SUCCESS_LEAD =
  '問卷已建立。下方為可分享的完整網址（僅含問卷識別碼）。請將投票連結傳給參與者；結果連結為公開唯讀統計頁。收集中不顯示票數或百分比，發起者亦看不到中間結果。';
const CREATE_POLL_SUCCESS_PANEL_ARIA_LABEL = '問卷建立成功';

const COPY_VOTE_LINK_LABEL = '複製投票連結';
const COPY_RESULT_LINK_LABEL = '複製結果連結';
const SHARE_VOTE_LINK_ARIA_LABEL = '複製投票頁完整網址到剪貼簿';
const COPY_RESULT_LINK_ARIA_LABEL = '複製結果頁完整網址到剪貼簿';
const SHARE_VOTE_URL_LABEL = '投票連結（分享給參與者）';
const SHARE_RESULT_URL_LABEL = '結果連結（公開唯讀統計）';
const OPEN_VOTE_PAGE_LABEL = '開啟投票頁';
const OPEN_PUBLIC_RESULTS_LABEL = '開啟公開結果頁';

const VOTE_PAGE_SHARE_SECTION_TITLE = '分享投票連結';
const RESULTS_PAGE_SHARE_SECTION_TITLE = '分享連結';
const CREATOR_OWNED_POLL_SHARE_SECTION_TITLE = '分享投票連結';

const MY_POLLS_VOTE_LINK_COPIED_MESSAGE = '已複製投票連結，可分享給參與者。';
const MY_POLLS_VOTE_LINK_COPY_FAILED_MESSAGE = '無法複製連結，請手動選取下方完整網址。';

function buildPublicVotePath(pollId) {
  return `/vote/${encodeURIComponent(pollId)}`;
}

function buildPublicResultPath(pollId) {
  return `/results/${encodeURIComponent(pollId)}`;
}

function buildAbsoluteUrl(path, locationObject = globalThis.location) {
  return new URL(path, locationObject.origin).href;
}

export const PUBLIC_SHARE_LINK_ROW_LAYOUT_ORDER = [
  'link-label',
  'copy-button',
  'inline-feedback',
  'fallback-url',
];

export const PUBLIC_SHARE_LINK_SECTION_LAYOUT_ORDER = [
  'section-title',
  'share-rows',
];

export const PUBLIC_SHARE_LINK_SECTION_CLASS = 'mvp-public-share-link-section';
export const PUBLIC_SHARE_LINK_SECTION_TITLE_CLASS = 'mvp-public-share-link-section-title';
export const PUBLIC_SHARE_LINK_ROW_CLASS = 'mvp-public-share-link-row';
export const PUBLIC_SHARE_LINK_LABEL_CLASS = 'share-url-label';
export const PUBLIC_SHARE_LINK_FALLBACK_URL_CLASS = 'share-url';
export const PUBLIC_SHARE_LINK_FEEDBACK_CLASS = 'mvp-public-share-link-feedback';

export async function copyTextToClipboard(text, {
  clipboard = globalThis.navigator?.clipboard,
  documentObject = globalThis.document,
  prompt = globalThis.prompt,
} = {}) {
  if (clipboard?.writeText) {
    try {
      await clipboard.writeText(text);
      return { ok: true, method: 'clipboard' };
    } catch {
      // fall through to legacy fallback
    }
  }

  try {
    const textarea = documentObject.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    documentObject.body.append(textarea);
    textarea.select();
    const copied = documentObject.execCommand('copy');
    textarea.remove();
    if (copied) {
      return { ok: true, method: 'execCommand' };
    }
  } catch {
    // fall through
  }

  if (typeof prompt === 'function') {
    prompt('請手動複製以下連結：', text);
    return { ok: false, method: 'prompt' };
  }

  return { ok: false, method: 'none' };
}

function applyShareLinkCopyFeedback(statusTarget, result, {
  copiedMessage = SHARE_LINK_COPIED_MESSAGE,
  promptMessage = SHARE_LINK_PROMPT_MESSAGE,
  manualCopyMessage = SHARE_LINK_MANUAL_COPY_MESSAGE,
} = {}) {
  if (!statusTarget) {
    return;
  }
  if (result.ok) {
    statusTarget.textContent = copiedMessage;
    return;
  }
  if (result.method === 'prompt') {
    statusTarget.textContent = promptMessage;
    return;
  }
  statusTarget.textContent = manualCopyMessage;
}

export function createPublicShareLinkFeedback(documentObject) {
  const feedback = documentObject.createElement('p');
  feedback.className = `copy-status ${PUBLIC_SHARE_LINK_FEEDBACK_CLASS}`;
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-live', 'polite');
  return feedback;
}

/**
 * @param {Document} documentObject
 * @param {HTMLElement} host
 */
export function renderPublicShareLinkRow(
  documentObject,
  host,
  {
    label,
    url,
    copyButtonLabel,
    copyButtonAriaLabel,
    includeCopyButton = true,
    copiedMessage,
    promptMessage,
    manualCopyMessage,
  },
) {
  const row = documentObject.createElement('div');
  row.className = PUBLIC_SHARE_LINK_ROW_CLASS;

  const rowLabel = documentObject.createElement('p');
  rowLabel.className = PUBLIC_SHARE_LINK_LABEL_CLASS;
  rowLabel.textContent = label;
  row.append(rowLabel);

  const feedback = createPublicShareLinkFeedback(documentObject);

  if (includeCopyButton) {
    const button = documentObject.createElement('button');
    button.type = 'button';
    button.className = 'copy-link-button';
    button.textContent = copyButtonLabel;
    button.setAttribute('aria-label', copyButtonAriaLabel ?? copyButtonLabel);
    button.addEventListener('click', async () => {
      const result = await copyTextToClipboard(url);
      applyShareLinkCopyFeedback(feedback, result, {
        copiedMessage,
        promptMessage,
        manualCopyMessage,
      });
    });
    row.append(button);
  }

  row.append(feedback);

  const code = documentObject.createElement('code');
  code.className = PUBLIC_SHARE_LINK_FALLBACK_URL_CLASS;
  code.textContent = url;
  row.append(code);

  host.append(row);
  return { row, feedback, urlCode: code };
}

/**
 * @param {Document} documentObject
 * @param {HTMLElement} host
 */
export function mountPublicShareLinkSection(
  documentObject,
  host,
  {
    sectionTitle = '',
    rows = [],
    includeCopyButtons = true,
  },
) {
  host.replaceChildren();
  if (host.classList?.add) {
    host.classList.add(PUBLIC_SHARE_LINK_SECTION_CLASS);
  } else {
    host.className = PUBLIC_SHARE_LINK_SECTION_CLASS;
  }
  host.hidden = rows.length === 0;

  if (sectionTitle) {
    const title = documentObject.createElement('h2');
    title.className = PUBLIC_SHARE_LINK_SECTION_TITLE_CLASS;
    title.textContent = sectionTitle;
    host.append(title);
  }

  const rowsHost = documentObject.createElement('div');
  rowsHost.className = 'mvp-public-share-link-rows';
  host.append(rowsHost);

  for (const rowConfig of rows) {
    renderPublicShareLinkRow(documentObject, rowsHost, {
      includeCopyButtons,
      ...rowConfig,
    });
  }

  return rowsHost;
}

function appendOptionalOpenLink(host, { href, label }) {
  const link = host.ownerDocument.createElement('a');
  link.className = 'mvp-action-link';
  link.href = href;
  link.textContent = label;
  host.append(link);
}

export function renderPollSharePanel(root, pollId, {
  locationObject = globalThis.location,
  includeCopyButtons = true,
} = {}) {
  root.replaceChildren();
  root.hidden = false;
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', CREATE_POLL_SUCCESS_PANEL_ARIA_LABEL);

  const votePath = buildPublicVotePath(pollId);
  const resultPath = buildPublicResultPath(pollId);
  const voteUrl = buildAbsoluteUrl(votePath, locationObject);
  const resultUrl = buildAbsoluteUrl(resultPath, locationObject);

  const section = root.ownerDocument.createElement('div');
  section.className = PUBLIC_SHARE_LINK_SECTION_CLASS;
  root.append(section);

  const title = root.ownerDocument.createElement('p');
  title.className = `panel-message ${PUBLIC_SHARE_LINK_SECTION_TITLE_CLASS}`;
  title.textContent = CREATE_POLL_SHARE_SUCCESS_LEAD;
  section.append(title);

  const rowsHost = root.ownerDocument.createElement('div');
  rowsHost.className = 'mvp-public-share-link-rows';
  section.append(rowsHost);

  renderPublicShareLinkRow(root.ownerDocument, rowsHost, {
    label: SHARE_VOTE_URL_LABEL,
    url: voteUrl,
    copyButtonLabel: COPY_VOTE_LINK_LABEL,
    copyButtonAriaLabel: SHARE_VOTE_LINK_ARIA_LABEL,
    includeCopyButtons,
  });
  appendOptionalOpenLink(rowsHost, {
    href: votePath,
    label: OPEN_VOTE_PAGE_LABEL,
  });

  renderPublicShareLinkRow(root.ownerDocument, rowsHost, {
    label: SHARE_RESULT_URL_LABEL,
    url: resultUrl,
    copyButtonLabel: COPY_RESULT_LINK_LABEL,
    copyButtonAriaLabel: COPY_RESULT_LINK_ARIA_LABEL,
    includeCopyButtons,
  });
  appendOptionalOpenLink(rowsHost, {
    href: resultPath,
    label: OPEN_PUBLIC_RESULTS_LABEL,
  });
}

/**
 * @param {Document} documentObject
 * @param {{ pollId?: string; locationObject?: Location }} [options]
 */
export function syncVotePageShareLinks(
  documentObject,
  { pollId, locationObject = globalThis.location } = {},
) {
  if (typeof documentObject.getElementById !== 'function') {
    return;
  }
  const host = documentObject.getElementById('vote-detail-share-links');
  if (!host) {
    return;
  }
  if (!pollId) {
    host.hidden = true;
    host.replaceChildren();
    return;
  }

  const voteUrl = buildAbsoluteUrl(buildPublicVotePath(pollId), locationObject);
  mountPublicShareLinkSection(documentObject, host, {
    sectionTitle: VOTE_PAGE_SHARE_SECTION_TITLE,
    rows: [
      {
        label: SHARE_VOTE_URL_LABEL,
        url: voteUrl,
        copyButtonLabel: COPY_VOTE_LINK_LABEL,
        copyButtonAriaLabel: SHARE_VOTE_LINK_ARIA_LABEL,
      },
    ],
  });
  host.hidden = false;
}

/**
 * @param {Document} documentObject
 * @param {{ pollId?: string; locationObject?: Location }} [options]
 */
export function syncResultsPageShareLinks(
  documentObject,
  { pollId, locationObject = globalThis.location } = {},
) {
  if (typeof documentObject.getElementById !== 'function') {
    return;
  }
  const host = documentObject.getElementById('results-detail-share-links');
  if (!host) {
    return;
  }
  if (!pollId) {
    host.hidden = true;
    host.replaceChildren();
    return;
  }

  const votePath = buildPublicVotePath(pollId);
  const resultPath = buildPublicResultPath(pollId);
  mountPublicShareLinkSection(documentObject, host, {
    sectionTitle: RESULTS_PAGE_SHARE_SECTION_TITLE,
    rows: [
      {
        label: SHARE_VOTE_URL_LABEL,
        url: buildAbsoluteUrl(votePath, locationObject),
        copyButtonLabel: COPY_VOTE_LINK_LABEL,
        copyButtonAriaLabel: SHARE_VOTE_LINK_ARIA_LABEL,
      },
      {
        label: SHARE_RESULT_URL_LABEL,
        url: buildAbsoluteUrl(resultPath, locationObject),
        copyButtonLabel: COPY_RESULT_LINK_LABEL,
        copyButtonAriaLabel: COPY_RESULT_LINK_ARIA_LABEL,
      },
    ],
  });
  host.hidden = false;
}

/**
 * @param {Document} documentObject
 * @param {HTMLElement} host
 * @param {{ pollId: string; locationObject?: Location }} options
 */
export function mountCreatorOwnedPollShareLinks(documentObject, host, {
  pollId,
  locationObject = globalThis.location,
}) {
  const voteUrl = buildAbsoluteUrl(buildPublicVotePath(pollId), locationObject);
  mountPublicShareLinkSection(documentObject, host, {
    sectionTitle: CREATOR_OWNED_POLL_SHARE_SECTION_TITLE,
    rows: [
      {
        label: SHARE_VOTE_URL_LABEL,
        url: voteUrl,
        copyButtonLabel: COPY_VOTE_LINK_LABEL,
        copyButtonAriaLabel: SHARE_VOTE_LINK_ARIA_LABEL,
        copiedMessage: MY_POLLS_VOTE_LINK_COPIED_MESSAGE,
        manualCopyMessage: MY_POLLS_VOTE_LINK_COPY_FAILED_MESSAGE,
        promptMessage: MY_POLLS_VOTE_LINK_COPY_FAILED_MESSAGE,
      },
    ],
  });
}
