import {
  buildDemoResultPath,
  buildDemoVotePath,
  parseLiveApiMode,
  showDemoOnlyFeedback,
} from './public-mvp-demo.js';
import { mountSiteChrome } from './public-mvp-layout.js';
import {
  buildAbsoluteUrl,
  buildPublicResultPath,
  buildPublicVotePath,
  copyTextToClipboard,
} from './public-mvp-ui.js';
import {
  readManagedPoll,
  renderCreatorLifecycleActions,
  writeManagedPoll,
} from './poll-lifecycle-controls.js';

const MOCK_SHARE_MSG = '已複製範例投票連結，可分享給他人體驗流程。';

export function wireMyPollsDemoPage(documentObject = globalThis.document) {
  mountSiteChrome(documentObject);

  const useLiveApi = parseLiveApiMode(documentObject.defaultView?.location?.search ?? '');
  if (useLiveApi) {
    mountLiveCreatorManagePanel(documentObject);
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

function mountLiveCreatorManagePanel(documentObject) {
  const main = documentObject.getElementById('main-content');
  const managed = readManagedPoll(documentObject.defaultView?.sessionStorage);
  if (!main) {
    return;
  }

  let host = documentObject.getElementById('creator-live-manage');
  if (!host) {
    host = documentObject.createElement('section');
    host.id = 'creator-live-manage';
    host.className = 'mvp-policy-panel';
    host.style.marginBottom = '1rem';
    const lead = main.querySelector('.mvp-lead');
    if (lead?.nextSibling) {
      main.insertBefore(host, lead.nextSibling);
    } else {
      main.prepend(host);
    }
  }

  if (!managed) {
    host.replaceChildren();
    const note = documentObject.createElement('p');
    note.className = 'mvp-meta';
    note.style.margin = '0';
    note.textContent =
      '即時模式：請先以 ?live=1 建立問卷，成功後此處會顯示可操作的問卷與狀態按鈕。';
    host.append(note);
    return;
  }

  renderCreatorLifecycleActions(host, {
    pollId: managed.pollId,
    lifecycleState: managed.public_lifecycle_state,
    title: managed.title,
    storage: documentObject.defaultView?.sessionStorage,
    onStateChange: (nextState) => {
      writeManagedPoll(documentObject.defaultView?.sessionStorage, {
        ...managed,
        public_lifecycle_state: nextState,
      });
    },
  });

  const links = documentObject.createElement('p');
  links.className = 'mvp-meta';
  links.style.marginTop = '0.5rem';
  const vote = documentObject.createElement('a');
  vote.href = buildPublicVotePath(managed.pollId);
  vote.textContent = '投票頁';
  vote.style.marginRight = '0.75rem';
  const results = documentObject.createElement('a');
  results.href = `${buildPublicResultPath(managed.pollId)}?creator=1`;
  results.textContent = '結果頁（發起者）';
  links.append(vote, results);
  host.append(links);
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
  vote.textContent = '前往投票頁';

  const share = documentObject.createElement('button');
  share.type = 'button';
  share.className = 'mvp-btn mvp-btn-ghost mvp-btn-sm';
  share.textContent = '分享投票連結';
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
  results.textContent = '查看結果（鎖定期）';

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
  results.textContent = '查看結果';

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
  link.textContent = '查看取消說明';

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
  link.textContent = '查看下架說明';

  const note = documentObject.createElement('span');
  note.className = 'mvp-meta';
  note.textContent = '此問卷已結束公開鎖定期，並由發起者下架。';

  actions.append(link, note);
}

if (typeof document !== 'undefined') {
  wireMyPollsDemoPage();
}
