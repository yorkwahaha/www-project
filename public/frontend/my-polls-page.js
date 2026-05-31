import {
  buildDemoResultPath,
  buildDemoVotePath,
  showDemoOnlyFeedback,
} from './public-mvp-demo.js';
import { mountSiteChrome } from './public-mvp-layout.js';
import { copyTextToClipboard, buildAbsoluteUrl } from './public-mvp-ui.js';

const MOCK_CANCEL_MSG =
  '（示意）已記錄「取消問卷」操作；未連線後端，問卷狀態不會真的變更。';
const MOCK_UNPUBLISH_MSG =
  '（示意）已記錄「下架問卷」操作；未連線後端，公開狀態不會真的變更。';
const MOCK_SHARE_MSG = '（示意）請將下方投票頁連結分享給參與者。';

export function wireMyPollsDemoPage(documentObject = globalThis.document) {
  mountSiteChrome(documentObject);

  const table = documentObject.querySelector('.mvp-dash-table tbody');
  if (!table) {
    return;
  }

  const rows = [...table.querySelectorAll('tr')];
  if (rows.length < 5) {
    return;
  }

  wireCollectingRow(rows[0], documentObject);
  wireLockedRow(rows[1], documentObject);
  wirePostLockRow(rows[2], documentObject);
  wireCancelledRow(rows[3], documentObject);
  wireUnpublishedRow(rows[4], documentObject);
}

function wireCollectingRow(row, documentObject) {
  const actions = row.querySelector('td:last-child');
  if (!actions) {
    return;
  }
  actions.setAttribute('data-demo-feedback-host', 'true');
  actions.replaceChildren();

  const vote = documentObject.createElement('a');
  vote.className = 'mvp-btn mvp-btn-primary mvp-btn-sm';
  vote.href = buildDemoVotePath();
  vote.textContent = '前往投票頁';

  const share = documentObject.createElement('button');
  share.type = 'button';
  share.className = 'mvp-btn mvp-btn-ghost mvp-btn-sm';
  share.textContent = '分享投票連結';
  share.addEventListener('click', async () => {
    const url = buildAbsoluteUrl(buildDemoVotePath());
    const result = await copyTextToClipboard(url);
    showDemoOnlyFeedback(
      share,
      result.ok ? `已複製示範投票連結。${MOCK_SHARE_MSG}` : MOCK_SHARE_MSG,
    );
  });

  const cancel = documentObject.createElement('button');
  cancel.type = 'button';
  cancel.className = 'mvp-btn mvp-btn-sm mvp-btn-accent-outline';
  cancel.textContent = '取消問卷（示意）';
  cancel.addEventListener('click', () => {
    showDemoOnlyFeedback(cancel, MOCK_CANCEL_MSG);
  });

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

function wirePostLockRow(row, documentObject) {
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
  unpublish.textContent = '下架問卷（示意）';
  unpublish.addEventListener('click', () => {
    showDemoOnlyFeedback(unpublish, MOCK_UNPUBLISH_MSG);
  });

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
