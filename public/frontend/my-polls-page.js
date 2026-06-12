import {
  buildDemoResultPath,
  buildDemoVotePath,
  parseLiveApiMode,
  showDemoOnlyFeedback,
} from './public-mvp-demo.js';
import { mountSiteChrome } from './public-mvp-layout.js';
import {
  buildAbsoluteUrl,
  buildPublicVotePath,
  copyTextToClipboard,
  isLocalDemoHostname,
  PUBLIC_CTA_COPY_VOTE_LINK_LABEL,
  PUBLIC_CTA_GO_TO_CREATE_POLL_LIVE_LABEL,
  PUBLIC_CTA_GO_TO_LOGIN_LABEL,
  PUBLIC_CTA_GO_TO_VOTE_PAGE_LABEL,
  PUBLIC_CTA_SHARE_VOTE_LINK_LABEL,
  PUBLIC_CTA_VIEW_CANCELLED_EXPLAINER_LABEL,
  PUBLIC_CTA_VIEW_LOCKED_RESULTS_LABEL,
  PUBLIC_CTA_VIEW_RESULTS_LABEL,
  PUBLIC_CTA_VIEW_UNPUBLISHED_EXPLAINER_LABEL,
  PUBLIC_MY_POLLS_CREATOR_NO_MIDTERM_CARD_HEADING,
  PUBLIC_MY_POLLS_EMPTY_MESSAGE,
  PUBLIC_MY_POLLS_EMPTY_SUMMARY,
  PUBLIC_MY_POLLS_LIVE_MANAGEMENT_PANEL_HEADING,
  PUBLIC_MY_POLLS_PAGE_LEAD,
  PUBLIC_MY_POLLS_PAGE_TITLE,
  PUBLIC_MY_POLLS_QUOTA_PANEL_HEADING,
  PUBLIC_MY_POLLS_SIGN_IN_REQUIRED_MESSAGE,
  PUBLIC_POLL_LIFECYCLE_STATUS_LABELS,
  formatPublicPollLifecycleStatusLabel,
} from './public-mvp-ui.js';
import { CREATOR_FLOW_COPY, renderCreatorManageLinks } from './creator-flow-copy.js';
import {
  CREATOR_SESSION_FAILURE,
  ensureCreatorSessionForLiveMode,
  isCreatorSessionFailureError,
  renderCreatorLifecycleActions,
} from './poll-lifecycle-controls.js';

const MOCK_SHARE_MSG = '已複製範例投票連結，可分享給他人體驗流程。';

export const MY_POLLS_SIGN_IN_REQUIRED_MESSAGE =
  PUBLIC_MY_POLLS_SIGN_IN_REQUIRED_MESSAGE;
export const MY_POLLS_LOGIN_CTA_LABEL = PUBLIC_CTA_GO_TO_LOGIN_LABEL;
export const MY_POLLS_CREATE_POLL_CTA_LABEL = PUBLIC_CTA_GO_TO_CREATE_POLL_LIVE_LABEL;
export const MY_POLLS_VOTE_CTA_LABEL = PUBLIC_CTA_GO_TO_VOTE_PAGE_LABEL;
export const MY_POLLS_LOAD_FAILURE_MESSAGE = '目前無法載入你建立的問卷，請稍後再試。';
export const MY_POLLS_EMPTY_MESSAGE = PUBLIC_MY_POLLS_EMPTY_MESSAGE;
export const MY_POLLS_EMPTY_SUMMARY = PUBLIC_MY_POLLS_EMPTY_SUMMARY;
export const MY_POLLS_LOADING_MESSAGE = '載入你的問卷中，請稍候。';
export const MY_POLLS_PAGE_TITLE = PUBLIC_MY_POLLS_PAGE_TITLE;
export const MY_POLLS_PAGE_LEAD = PUBLIC_MY_POLLS_PAGE_LEAD;
export const MY_POLLS_QUOTA_PANEL_HEADING = PUBLIC_MY_POLLS_QUOTA_PANEL_HEADING;
export const MY_POLLS_LIVE_MANAGEMENT_PANEL_HEADING =
  PUBLIC_MY_POLLS_LIVE_MANAGEMENT_PANEL_HEADING;
export const MY_POLLS_CREATOR_NO_MIDTERM_CARD_HEADING =
  PUBLIC_MY_POLLS_CREATOR_NO_MIDTERM_CARD_HEADING;
const MY_POLLS_SIGN_IN_REQUIRED_ERROR = 'MyPollsSignInRequiredError';

function createMyPollsSignInRequiredError() {
  const error = new Error(MY_POLLS_SIGN_IN_REQUIRED_MESSAGE);
  error.name = MY_POLLS_SIGN_IN_REQUIRED_ERROR;
  return error;
}

export function isMyPollsSignInRequiredError(error) {
  return error instanceof Error && error.name === MY_POLLS_SIGN_IN_REQUIRED_ERROR;
}

export const CREATOR_OWNED_POLL_ALLOWED_KEYS = [
  'poll_id',
  'title',
  'category',
  'public_lifecycle_state',
  'closes_at',
  'revealed_at',
  'public_lock_ends_at',
  'cancelled_at',
  'unpublished_at',
];

const MY_POLLS_LIFECYCLE_BADGE_CLASSES = {
  draft: 'mvp-badge mvp-badge-muted',
  collecting: 'mvp-badge mvp-badge-collecting',
  revealed: 'mvp-badge mvp-badge-revealed',
  locked: 'mvp-badge mvp-badge-locked',
  post_lock: 'mvp-badge mvp-badge-muted',
  cancelled: 'mvp-badge mvp-badge-danger',
  unpublished: 'mvp-badge mvp-badge-muted',
};

export function formatMyPollsLifecycleLabel(lifecycleState) {
  return formatPublicPollLifecycleStatusLabel(lifecycleState);
}

export function lifecycleBadgeClassForMyPolls(lifecycleState) {
  return (
    MY_POLLS_LIFECYCLE_BADGE_CLASSES[lifecycleState] ??
    MY_POLLS_LIFECYCLE_BADGE_CLASSES.draft
  );
}

export function isCreatorOwnedPollSafe(poll) {
  if (!poll || typeof poll !== 'object') {
    return false;
  }
  const keys = Object.keys(poll);
  if (
    keys.length !== CREATOR_OWNED_POLL_ALLOWED_KEYS.length ||
    !CREATOR_OWNED_POLL_ALLOWED_KEYS.every((key) => keys.includes(key))
  ) {
    return false;
  }
  return (
    typeof poll.poll_id === 'string' &&
    typeof poll.title === 'string' &&
    typeof poll.category === 'string' &&
    Object.hasOwn(PUBLIC_POLL_LIFECYCLE_STATUS_LABELS, poll.public_lifecycle_state) &&
    typeof poll.closes_at === 'string' &&
    (poll.revealed_at === null || typeof poll.revealed_at === 'string') &&
    (poll.public_lock_ends_at === null ||
      typeof poll.public_lock_ends_at === 'string') &&
    (poll.cancelled_at === null || typeof poll.cancelled_at === 'string') &&
    (poll.unpublished_at === null || typeof poll.unpublished_at === 'string')
  );
}

export async function prepareMyPollsLiveSession({
  fetchImpl = globalThis.fetch,
  locationObject = globalThis.location,
} = {}) {
  let response;
  try {
    response = await fetchImpl('/creator/session', {
      method: 'GET',
      credentials: 'same-origin',
    });
  } catch {
    throw new Error(MY_POLLS_LOAD_FAILURE_MESSAGE);
  }
  if (response.ok) {
    return;
  }
  if (
    response.status === 401 &&
    locationObject?.hostname &&
    !isLocalDemoHostname(locationObject.hostname)
  ) {
    throw createMyPollsSignInRequiredError();
  }
  try {
    await ensureCreatorSessionForLiveMode({ fetchImpl, locationObject });
  } catch (error) {
    if (isCreatorSessionFailureError(error)) {
      throw error;
    }
    throw new Error(MY_POLLS_LOAD_FAILURE_MESSAGE);
  }
}

export function syncMyPollsPageSectionHeadings(documentObject) {
  if (typeof documentObject.querySelector !== 'function') {
    return;
  }
  const pageHeading = documentObject.querySelector('#main-content > h1');
  if (pageHeading) {
    pageHeading.textContent = PUBLIC_MY_POLLS_PAGE_TITLE;
  }
  const quotaHeading = documentObject.querySelector(
    'aside.mvp-policy-panel[aria-label="額度與操作說明"] h2',
  );
  if (quotaHeading) {
    quotaHeading.textContent = PUBLIC_MY_POLLS_QUOTA_PANEL_HEADING;
  }
  const sidePanelHeading = documentObject.querySelector('.mvp-side-panel h2');
  if (sidePanelHeading) {
    sidePanelHeading.textContent = PUBLIC_MY_POLLS_CREATOR_NO_MIDTERM_CARD_HEADING;
  }
}

export function syncMyPollsPageLeadParagraphs(documentObject) {
  if (typeof documentObject.getElementById !== 'function') {
    return;
  }
  const pageLead = documentObject.getElementById('my-polls-page-lead');
  if (pageLead) {
    pageLead.textContent = PUBLIC_MY_POLLS_PAGE_LEAD;
  }
}

export function wireMyPollsDemoPage(documentObject = globalThis.document) {
  mountSiteChrome(documentObject);
  syncMyPollsPageSectionHeadings(documentObject);
  syncMyPollsPageLeadParagraphs(documentObject);

  const useLiveApi = parseLiveApiMode(documentObject.defaultView?.location?.search ?? '');
  const mockWrap = documentObject.querySelector('.mvp-dash-table-wrap');
  if (mockWrap) {
    mockWrap.setAttribute('data-mock-dashboard', 'true');
    if (useLiveApi) {
      mockWrap.setAttribute('aria-hidden', 'true');
    }
  }
  if (useLiveApi) {
    void mountLiveCreatorManagePanel(documentObject);
  }

  const table = documentObject.querySelector('.mvp-dash-table tbody');
  if (!table) {
    return;
  }

  const rows = [...table.querySelectorAll('tr')];
  if (rows.length < 5) {
    return;
  }

  wireCollectingRow(rows[0], documentObject, { demoOnly: true });
  wireLockedRow(rows[1], documentObject);
  wirePostLockRow(rows[2], documentObject, { demoOnly: true });
  wireCancelledRow(rows[3], documentObject);
  wireUnpublishedRow(rows[4], documentObject);
}

export async function fetchCreatorOwnedPolls(fetchImpl = globalThis.fetch) {
  let response;
  try {
    response = await fetchImpl('/creator/polls', {
      method: 'GET',
      credentials: 'same-origin',
    });
  } catch {
    throw new Error(MY_POLLS_LOAD_FAILURE_MESSAGE);
  }
  if (!response.ok) {
    throw new Error(MY_POLLS_LOAD_FAILURE_MESSAGE);
  }
  try {
    const body = await response.json();
    if (!body || !Array.isArray(body.polls)) {
      throw new Error(MY_POLLS_LOAD_FAILURE_MESSAGE);
    }
    if (!body.polls.every((poll) => isCreatorOwnedPollSafe(poll))) {
      throw new Error(MY_POLLS_LOAD_FAILURE_MESSAGE);
    }
    return body.polls;
  } catch {
    throw new Error(MY_POLLS_LOAD_FAILURE_MESSAGE);
  }
}

async function mountLiveCreatorManagePanel(documentObject) {
  const main = documentObject.getElementById('main-content');
  if (!main) {
    return;
  }
  const fetchImpl = documentObject.defaultView?.fetch ?? globalThis.fetch;

  let host = documentObject.getElementById('creator-live-manage');
  if (!host) {
    host = documentObject.createElement('section');
    host.id = 'creator-live-manage';
    host.className = 'mvp-policy-panel mvp-creator-live-manage';
    const lead = main.querySelector('.mvp-lead');
    if (lead?.nextSibling) {
      main.insertBefore(host, lead.nextSibling);
    } else {
      main.prepend(host);
    }
  }
  host.setAttribute('data-live-owned-list', 'true');

  host.setAttribute('role', 'region');
  host.setAttribute('aria-label', '即時問卷管理');
  host.replaceChildren();

  const status = documentObject.createElement('p');
  status.className = 'mvp-meta';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.textContent = MY_POLLS_LOADING_MESSAGE;
  host.append(status);

  try {
    await prepareMyPollsLiveSession({
      fetchImpl,
      locationObject: documentObject.defaultView?.location ?? globalThis.location,
    });
    const polls = await fetchCreatorOwnedPolls(fetchImpl);
    host.replaceChildren();
    if (polls.length === 0) {
      renderCreatorPollsEmptyState(host, documentObject);
      return;
    }
    renderCreatorPollsList(host, documentObject, polls, fetchImpl);
  } catch (error) {
    const showLoginLink = isMyPollsSignInRequiredError(error);
    const failureMessage = isCreatorSessionFailureError(error)
      ? CREATOR_SESSION_FAILURE
      : MY_POLLS_LOAD_FAILURE_MESSAGE;
    renderMyPollsUnavailableState(host, documentObject, {
      message: showLoginLink
        ? MY_POLLS_SIGN_IN_REQUIRED_MESSAGE
        : failureMessage,
      showLoginLink,
    });
  }
}

function renderMyPollsUnavailableState(
  host,
  documentObject,
  { message, showLoginLink = false },
) {
  host.replaceChildren();
  host.setAttribute('role', 'note');
  host.setAttribute('aria-label', '即時問卷管理說明');
  const note = documentObject.createElement('p');
  note.className = 'mvp-meta';
  note.setAttribute('role', 'status');
  note.setAttribute('aria-live', 'polite');
  note.textContent = message;
  host.append(note);
  if (showLoginLink) {
    const loginLink = documentObject.createElement('a');
    loginLink.className = 'mvp-action-link';
    loginLink.href = '/login';
    loginLink.textContent = PUBLIC_CTA_GO_TO_LOGIN_LABEL;
    host.append(loginLink);
  }
}

function renderCreatorPollsEmptyState(host, documentObject) {
  host.setAttribute('role', 'note');
  host.setAttribute('aria-label', '即時問卷管理說明');
  const note = documentObject.createElement('p');
  note.className = 'mvp-meta';
  note.textContent = MY_POLLS_EMPTY_MESSAGE;
  host.append(note);
  const summary = documentObject.createElement('p');
  summary.className = 'mvp-meta';
  summary.textContent = MY_POLLS_EMPTY_SUMMARY;
  host.append(summary);
  const createLink = documentObject.createElement('a');
  createLink.className = 'mvp-action-link';
  createLink.href = '/polls/new?live=1';
  createLink.textContent = PUBLIC_CTA_GO_TO_CREATE_POLL_LIVE_LABEL;
  host.append(createLink);
}

function renderCreatorPollsList(host, documentObject, polls, fetchImpl) {
  const heading = documentObject.createElement('h2');
  heading.className = 'mvp-policy-panel-title';
    heading.textContent = PUBLIC_MY_POLLS_LIVE_MANAGEMENT_PANEL_HEADING;
  host.append(heading);

  const lead = documentObject.createElement('p');
  lead.className = 'mvp-meta';
  lead.textContent = CREATOR_FLOW_COPY.myPollsLead;
  host.append(lead);

  for (const poll of polls) {
    renderCreatorOwnedPoll(host, documentObject, poll, fetchImpl);
  }
}

function renderCreatorOwnedPoll(host, documentObject, poll, fetchImpl) {
  if (!isCreatorOwnedPollSafe(poll)) {
    throw new Error('Unsafe creator owned poll');
  }

  const pollHost = documentObject.createElement('section');
  pollHost.className = 'mvp-creator-live-poll';
  host.append(pollHost);

  const heading = documentObject.createElement('h3');
  heading.className = 'mvp-creator-lifecycle-title';
  heading.textContent = poll.title
    ? `即時問卷：${poll.title}`
    : '即時問卷';
  pollHost.append(heading);

  const meta = documentObject.createElement('p');
  meta.className = 'mvp-meta mvp-creator-live-poll-meta';
  const badge = documentObject.createElement('span');
  badge.className = lifecycleBadgeClassForMyPolls(poll.public_lifecycle_state);
  badge.textContent = formatMyPollsLifecycleLabel(poll.public_lifecycle_state);
  meta.append(badge);
  if (poll.category) {
    const category = documentObject.createElement('span');
    category.textContent = ` · ${poll.category}`;
    meta.append(category);
  }
  pollHost.append(meta);

  renderCreatorManageLinks(pollHost, {
    pollId: poll.poll_id,
    locationObject: documentObject.defaultView?.location ?? globalThis.location,
  });

  const shareRow = documentObject.createElement('p');
  shareRow.className = 'mvp-meta mvp-creator-flow-share-row';
  const shareVote = documentObject.createElement('button');
  shareVote.type = 'button';
  shareVote.className = 'mvp-btn mvp-btn-ghost mvp-btn-sm';
  shareVote.textContent = PUBLIC_CTA_COPY_VOTE_LINK_LABEL;
  shareVote.addEventListener('click', async () => {
    const url = buildAbsoluteUrl(buildPublicVotePath(poll.poll_id));
    const result = await copyTextToClipboard(url);
    showDemoOnlyFeedback(
      shareVote,
      result.ok ? '已複製投票連結，可分享給參與者。' : '無法複製連結，請手動複製上方投票頁網址。',
    );
  });
  shareRow.append(shareVote);
  pollHost.append(shareRow);

  const lifecycleHost = documentObject.createElement('section');
  lifecycleHost.className = 'mvp-creator-lifecycle-panel mvp-creator-flow-lifecycle';
  pollHost.append(lifecycleHost);

  renderCreatorLifecycleActions(lifecycleHost, {
    pollId: poll.poll_id,
    lifecycleState: poll.public_lifecycle_state,
    title: poll.title,
    fetchImpl,
    flowContext: 'manage',
    onStateChange: (nextState) => {
      poll.public_lifecycle_state = nextState;
    },
  });
}

function wireCollectingRow(row, documentObject, { demoOnly = false } = {}) {
  const actions = row.querySelector('td:last-child');
  if (!actions) {
    return;
  }
  actions.setAttribute('data-demo-feedback-host', 'true');
  actions.replaceChildren();

  const vote = documentObject.createElement('a');
  vote.className = 'mvp-btn mvp-btn-primary mvp-btn-sm';
  vote.href = demoOnly ? buildDemoVotePath() : '#';
  vote.textContent = PUBLIC_CTA_GO_TO_VOTE_PAGE_LABEL;

  const share = documentObject.createElement('button');
  share.type = 'button';
  share.className = 'mvp-btn mvp-btn-ghost mvp-btn-sm';
  share.textContent = PUBLIC_CTA_SHARE_VOTE_LINK_LABEL;
  share.addEventListener('click', async () => {
    const url = buildAbsoluteUrl(
      demoOnly ? buildDemoVotePath() : vote.href,
    );
    const result = await copyTextToClipboard(url);
    showDemoOnlyFeedback(
      share,
      result.ok ? MOCK_SHARE_MSG : '無法複製連結，請手動複製投票頁網址。',
    );
  });

  const cancel = documentObject.createElement('button');
  cancel.type = 'button';
  cancel.className = 'mvp-btn mvp-btn-sm mvp-btn-accent-outline';
  cancel.textContent = '取消問卷';
  if (demoOnly) {
    cancel.addEventListener('click', () => {
      showDemoOnlyFeedback(
        cancel,
        '此為範例列。請使用上方「即時問卷」區塊，或先以 ?live=1 建立問卷。',
      );
    });
  }

  actions.append(vote, share, cancel);
}

function wireLockedRow(row, documentObject) {
  const actions = row.querySelector('td:last-child');
  if (!actions) {
    return;
  }
  actions.className = '';
  actions.replaceChildren();

  const results = documentObject.createElement('a');
  results.className = 'mvp-btn mvp-btn-secondary mvp-btn-sm';
  results.href = buildDemoResultPath('locked');
  results.textContent = PUBLIC_CTA_VIEW_LOCKED_RESULTS_LABEL;

  const note = documentObject.createElement('span');
  note.className = 'mvp-meta';
  note.textContent = '鎖定期內無法下架／刪除／修改';

  actions.append(results, note);
}

function wirePostLockRow(row, documentObject, { demoOnly = false } = {}) {
  const actions = row.querySelector('td:last-child');
  if (!actions) {
    return;
  }
  actions.setAttribute('data-demo-feedback-host', 'true');
  actions.replaceChildren();

  const results = documentObject.createElement('a');
  results.className = 'mvp-btn mvp-btn-secondary mvp-btn-sm';
  results.href = buildDemoResultPath('post_lock');
  results.textContent = PUBLIC_CTA_VIEW_RESULTS_LABEL;

  const unpublish = documentObject.createElement('button');
  unpublish.type = 'button';
  unpublish.className = 'mvp-btn mvp-btn-secondary mvp-btn-sm';
  unpublish.textContent = '下架問卷';
  if (demoOnly) {
    unpublish.addEventListener('click', () => {
      showDemoOnlyFeedback(
        unpublish,
        '此為範例列。請使用上方「即時問卷」區塊操作已建立的問卷。',
      );
    });
  }

  actions.append(results, unpublish);
}

function wireCancelledRow(row, documentObject) {
  const actions = row.querySelector('td:last-child');
  if (!actions) {
    return;
  }
  actions.replaceChildren();

  const link = documentObject.createElement('a');
  link.className = 'mvp-btn mvp-btn-ghost mvp-btn-sm';
  link.href = buildDemoResultPath('cancelled');
  link.textContent = PUBLIC_CTA_VIEW_CANCELLED_EXPLAINER_LABEL;

  const note = documentObject.createElement('span');
  note.className = 'mvp-meta';
  note.textContent = '無公開結果';

  actions.append(link, note);
}

function wireUnpublishedRow(row, documentObject) {
  const actions = row.querySelector('td:last-child');
  if (!actions) {
    return;
  }
  actions.replaceChildren();

  const link = documentObject.createElement('a');
  link.className = 'mvp-btn mvp-btn-ghost mvp-btn-sm';
  link.href = buildDemoResultPath('unpublished');
  link.textContent = PUBLIC_CTA_VIEW_UNPUBLISHED_EXPLAINER_LABEL;

  const note = documentObject.createElement('span');
  note.className = 'mvp-meta';
  note.textContent = '此問卷已結束公開鎖定期，並由發起者下架。';

  actions.append(link, note);
}

if (typeof document !== 'undefined') {
  wireMyPollsDemoPage();
}
