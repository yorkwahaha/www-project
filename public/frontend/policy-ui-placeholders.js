/**
 * Phase 41A — policy-aligned copy and mock UI placeholders (no API/persistence).
 */

export const POLICY_UI_COPY = {
  collectingBadge: '收集中',
  collectingBlindLead:
    '本問卷仍在統計期間。為避免影響後續參與者，收集中不顯示總票數、選項票數、百分比、排名、趨勢或任何進度訊號；發起者在收集中也看不到這些中間結果。',
  collectingRevealHint:
    '結果將於統計截止與公開時間後顯示（MVP：截止時間即結果公開時間）。公開前，請以頁面顯示的時間為準。',
  collectingBeforeReveal:
    '公開前，票數與百分比一律隱藏，以避免影響後續投票者。',
  votePrivacy:
    '投票不會公開揭露個人資料或個人投票紀錄；個人資料不會對外公開顯示。',
  closeVsLock:
    '「截止／結果公開」代表統計與投票結束並開始顯示彙總結果；不等於公開鎖定期結束。結果公開後進入約 5 天公開鎖定期，鎖定期內問卷不可下架、刪除、修改、重新開放投票或隱藏結果。',
  cancelVsUnpublish:
    '統計期間內若要停止問卷，請使用「取消」而非「下架」。已取消的問卷不會產生公開彙總結果。',
  unpublishAfterLock:
    '此問卷已結束公開鎖定期，並由發起者下架。',
  eligibilitySelfReport:
    '年齡資格依你在個人資料中自行填寫的出生年／月計算，並非官方驗證。',
  eligibilityIneligible:
    '你目前不符合此問卷的投票資格。你可以關注此問卷，並在結果公開後查看公開彙總統計。',
  followWhileCollecting:
    '暫不投票或尚未投票時，可關注此問卷；結果公開後可查看彙總統計（站內通知目前為示範，尚未連線後端）。',
  followButton: '關注結果',
  followButtonLong: '結果公開時以站內通知提醒我',
  followMockNote:
    '（示範按鈕：尚未連線後端，不會儲存關注或發送真實站內通知。）',
  profileFutureTitle: '個人資料與資格（尚未啟用）',
  profileFutureFields:
    '未來將需要：暱稱、出生年／月（不含日期）、居住縣市、性別（含「不願透露」）。性別可能用於個人檔案；以性別限制投票資格將另行規劃。',
};

function appendParagraph(parent, text, className = 'policy-panel-text') {
  const p = parent.ownerDocument.createElement('p');
  p.className = className;
  p.textContent = text;
  parent.append(p);
  return p;
}

function appendBadge(parent, text) {
  const span = parent.ownerDocument.createElement('span');
  span.className = 'mvp-status-badge';
  span.textContent = text;
  parent.append(span);
  return span;
}

export function createPolicyPanel(documentObject, { title, badge }) {
  const section = documentObject.createElement('section');
  section.className = 'mvp-policy-panel';

  const header = documentObject.createElement('div');
  header.className = 'mvp-policy-panel-header';

  const heading = documentObject.createElement('h2');
  const headingId = `policy-heading-${title.replace(/[^\w\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '') || 'panel'}`;
  heading.id = headingId;
  heading.className = 'mvp-policy-panel-title';
  heading.textContent = title;
  header.append(heading);
  section.setAttribute('aria-labelledby', headingId);

  if (badge) {
    appendBadge(header, badge);
  }

  section.append(header);
  return { section, heading, body: section };
}

export function renderMockFollowButton(parent, { compact = false } = {}) {
  const wrap = parent.ownerDocument.createElement('div');
  wrap.className = 'mvp-follow-mock';

  const button = parent.ownerDocument.createElement('button');
  button.type = 'button';
  button.className = 'mvp-btn-mock';
  button.disabled = true;
  button.setAttribute('aria-disabled', 'true');
  button.title = POLICY_UI_COPY.followMockNote;
  button.textContent = compact
    ? POLICY_UI_COPY.followButton
    : POLICY_UI_COPY.followButtonLong;

  wrap.append(button);
  appendParagraph(wrap, POLICY_UI_COPY.followMockNote, 'mvp-follow-mock-note');
  parent.append(wrap);
  return wrap;
}

export function renderLifecyclePolicyPanel(parent) {
  const doc = parent.ownerDocument;
  const { section } = createPolicyPanel(doc, {
    title: '統計期間與結果公開',
    badge: POLICY_UI_COPY.collectingBadge,
  });

  appendParagraph(section, POLICY_UI_COPY.collectingBlindLead);
  appendParagraph(section, POLICY_UI_COPY.collectingRevealHint);
  appendParagraph(section, POLICY_UI_COPY.closeVsLock, 'policy-panel-text policy-panel-emphasis');
  appendParagraph(section, POLICY_UI_COPY.cancelVsUnpublish);
  appendParagraph(section, `下架範例用語：${POLICY_UI_COPY.unpublishAfterLock}`, 'policy-panel-text policy-panel-muted');

  parent.append(section);
  return section;
}

export function renderEligibilityPlaceholderPanel(parent) {
  const doc = parent.ownerDocument;
  const { section } = createPolicyPanel(doc, {
    title: '投票資格（示範）',
    badge: '尚未啟用',
  });

  const list = doc.createElement('ul');
  list.className = 'policy-field-list';
  for (const item of [
    '年齡：未設定（示範：12–15、18–30、65+ 等區間，依自行填寫的出生年／月判斷）',
    '地區：未設定（示範：可限制特定縣市）',
    '性別：不限制（MVP 不以性別作為投票資格）',
    '你的狀態：示範用 — 尚未連線真實資格判斷',
  ]) {
    const li = doc.createElement('li');
    li.textContent = item;
    list.append(li);
  }
  section.append(list);

  appendParagraph(section, POLICY_UI_COPY.eligibilitySelfReport);
  appendParagraph(section, POLICY_UI_COPY.eligibilityIneligible, 'policy-panel-text policy-panel-muted');

  parent.append(section);
  return section;
}

export function renderVotePagePolicyPanels(parent) {
  parent.replaceChildren();
  renderLifecyclePolicyPanel(parent);
  renderEligibilityPlaceholderPanel(parent);

  const followSection = parent.ownerDocument.createElement('section');
  followSection.className = 'mvp-policy-panel';
  const h2 = parent.ownerDocument.createElement('h2');
  h2.className = 'mvp-policy-panel-title';
  h2.textContent = '關注結果';
  followSection.append(h2);
  appendParagraph(
    followSection,
    '不符合資格或暫不投票的參與者，可在結果公開後查看彙總統計；MVP 僅規劃站內通知，不含 Email／推播。',
  );
  renderMockFollowButton(followSection);
  parent.append(followSection);
}

export function renderCollectingPolicyExtras(block) {
  appendParagraph(block, POLICY_UI_COPY.collectingBeforeReveal, 'result-collecting-why');
  appendParagraph(block, POLICY_UI_COPY.votePrivacy, 'result-collecting-privacy');
}

export function renderResultPagePolicyExtras(root, { collecting }) {
  const doc = root.ownerDocument;
  const wrap = doc.createElement('aside');
  wrap.className = 'mvp-policy-aside';
  wrap.setAttribute('aria-label', '政策說明');

  if (collecting) {
    const followPanel = doc.createElement('section');
    followPanel.className = 'mvp-policy-panel';
    const h2 = doc.createElement('h2');
    h2.className = 'mvp-policy-panel-title';
    h2.textContent = '收集中 — 可關注結果';
    followPanel.append(h2);
    appendParagraph(followPanel, POLICY_UI_COPY.followWhileCollecting);
    renderMockFollowButton(followPanel, { compact: false });
    wrap.append(followPanel);
  }

  const glossary = doc.createElement('section');
  glossary.className = 'mvp-policy-panel mvp-policy-panel-compact';
  const h2g = doc.createElement('h2');
  h2g.className = 'mvp-policy-panel-title';
  h2g.textContent = '名詞對照';
  glossary.append(h2g);
  appendParagraph(glossary, POLICY_UI_COPY.closeVsLock);
  appendParagraph(glossary, POLICY_UI_COPY.cancelVsUnpublish);
  wrap.append(glossary);

  root.append(wrap);
}

export function renderVoteSuccessPolicyExtras(root) {
  renderMockFollowButton(root, { compact: false });
}
