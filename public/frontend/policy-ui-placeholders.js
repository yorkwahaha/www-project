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

export function renderCollectingPolicyExtras(block) {
  appendParagraph(block, POLICY_UI_COPY.collectingBeforeReveal, 'result-collecting-why');
  appendParagraph(block, POLICY_UI_COPY.votePrivacy, 'result-collecting-privacy');
}

export function renderResultPagePolicyExtras(
  root,
  { collecting, skipFollowPanel = false } = {},
) {
  const doc = root.ownerDocument;
  const wrap = doc.createElement('aside');
  wrap.className = 'mvp-policy-aside';
  wrap.setAttribute('aria-label', '政策說明');

  if (collecting && !skipFollowPanel) {
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

/** Phase 41B — querystring `ui_state` preview (no API/persistence). */
export const VALID_UI_MOCK_STATES = [
  'collecting',
  'revealed',
  'locked',
  'post_lock',
  'cancelled',
  'unpublished',
  'ineligible',
  'followed',
];

const UI_MOCK_STATE_LABELS = {
  collecting: '收集中（預覽）',
  revealed: '結果已公開（預覽）',
  locked: '公開鎖定期（預覽）',
  post_lock: '鎖定期已結束（預覽）',
  cancelled: '已取消（預覽）',
  unpublished: '已下架（預覽）',
  ineligible: '不符合資格（預覽）',
  followed: '已關注結果（預覽）',
};

export function parseUiMockState(search = '') {
  const rawSearch =
    typeof search === 'string' && search.length > 0
      ? search.startsWith('?')
        ? search
        : `?${search}`
      : '';
  const value = new URLSearchParams(rawSearch).get('ui_state')?.trim().toLowerCase();
  if (!value || !VALID_UI_MOCK_STATES.includes(value)) {
    return null;
  }
  return value;
}

export function isCollectingUiMockState(state) {
  return (
    state === 'collecting' || state === 'ineligible' || state === 'followed'
  );
}

export function toCollectingPreviewPayload(apiResult) {
  const options = Array.isArray(apiResult?.options) ? apiResult.options : [];
  return {
    ...apiResult,
    collecting: true,
    display_mode: 'collecting',
    total_votes_display: '收集中',
    options: options.map((option, index) => ({
      ...option,
      option_index: option?.option_index ?? index,
      display_label:
        typeof option?.display_label === 'string'
          ? option.display_label
          : typeof option?.label === 'string'
            ? option.label
            : `選項 ${index + 1}`,
      display_count: null,
      display_percentage: null,
    })),
  };
}

export function toRevealedPreviewPayload(apiResult) {
  const options = Array.isArray(apiResult?.options) ? apiResult.options : [];
  const labels =
    options.length > 0
      ? options.map((option, index) =>
          typeof option?.display_label === 'string'
            ? option.display_label
            : typeof option?.label === 'string'
              ? option.label
              : `選項 ${index + 1}`,
        )
      : ['選項 A', '選項 B'];
  return {
    ...apiResult,
    collecting: false,
    display_mode: 'rounded_with_bucketed_votes',
    total_votes_display: '100–499（UI 預覽示範，非即時資料）',
    updated_display: '最近更新（UI 預覽示範）',
    options: labels.map((display_label, option_index) => ({
      option_index,
      display_label,
      display_percentage: '約 40%（預覽示範）',
      display_count: '約 40–60 票（預覽示範）',
    })),
  };
}

export function resolveMockResultPayload(apiResult, mockState) {
  if (!mockState) {
    return apiResult;
  }
  if (mockState === 'cancelled' || mockState === 'unpublished') {
    return null;
  }
  if (isCollectingUiMockState(mockState)) {
    return toCollectingPreviewPayload(apiResult);
  }
  if (mockState === 'revealed' || mockState === 'locked' || mockState === 'post_lock') {
    return toRevealedPreviewPayload(apiResult);
  }
  return apiResult;
}

export function renderUiMockPreviewBanner(parent, mockState) {
  if (!parent || !mockState) {
    return null;
  }
  const doc = parent.ownerDocument;
  const banner = doc.createElement('div');
  banner.className = 'ui-mock-preview-banner';
  banner.setAttribute('role', 'status');
  banner.setAttribute('aria-live', 'polite');

  const badge = doc.createElement('span');
  badge.className = 'mvp-status-badge ui-mock-preview-badge';
  badge.textContent = UI_MOCK_STATE_LABELS[mockState] ?? mockState;
  banner.append(badge);

  const text = doc.createElement('p');
  text.className = 'ui-mock-preview-text';
  text.textContent =
    '此頁以網址參數 ui_state 顯示政策文案預覽，不代表後端真實狀態，也不會寫入任何資料。';
  banner.append(text);

  parent.prepend(banner);
  return banner;
}

function renderDisabledMockActions(parent, labels) {
  const doc = parent.ownerDocument;
  const row = doc.createElement('div');
  row.className = 'ui-mock-actions';
  for (const label of labels) {
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'mvp-btn-mock';
    button.disabled = true;
    button.setAttribute('aria-disabled', 'true');
    button.textContent = label;
    row.append(button);
  }
  parent.append(row);
  return row;
}

export function renderUiMockStatePanel(parent, mockState) {
  if (!parent || !mockState) {
    return null;
  }
  const doc = parent.ownerDocument;
  const panel = doc.createElement('section');
  panel.className = 'mvp-policy-panel ui-mock-state-panel';

  const title = doc.createElement('h2');
  title.className = 'mvp-policy-panel-title';
  panel.append(title);

  if (mockState === 'collecting') {
    title.textContent = '收集中';
    appendParagraph(panel, POLICY_UI_COPY.collectingBlindLead);
    appendParagraph(panel, POLICY_UI_COPY.collectingRevealHint);
    parent.append(panel);
    return panel;
  }

  if (mockState === 'revealed') {
    title.textContent = '結果已公開';
    appendParagraph(
      panel,
      '統計期間已結束，彙總結果開始對外公開。此為 UI 預覽；實際頁面仍以 API 回傳為準。',
    );
    parent.append(panel);
    return panel;
  }

  if (mockState === 'locked') {
    title.textContent = '公開鎖定期進行中';
    appendParagraph(
      panel,
      '結果公開後約 5 天內為公開鎖定期。鎖定期內發起者不可下架、刪除、修改內容、重新開放投票或隱藏結果（以下按鈕僅示範，未連線後端）。',
    );
    renderDisabledMockActions(panel, [
      '下架（鎖定期內不可用）',
      '刪除（鎖定期內不可用）',
      '修改問卷（鎖定期內不可用）',
    ]);
    parent.append(panel);
    return panel;
  }

  if (mockState === 'post_lock') {
    title.textContent = '公開鎖定期已結束';
    appendParagraph(
      panel,
      '鎖定期結束後，發起者可選擇維持公開或下架問卷。以下「下架」僅為 UI 示範，不會執行真實操作。',
    );
    renderDisabledMockActions(panel, ['下架問卷（示範，未啟用）']);
    appendParagraph(
      panel,
      `下架用語範例：${POLICY_UI_COPY.unpublishAfterLock}`,
      'policy-panel-text policy-panel-muted',
    );
    parent.append(panel);
    return panel;
  }

  if (mockState === 'ineligible') {
    title.textContent = '不符合投票資格';
    appendParagraph(panel, POLICY_UI_COPY.eligibilityIneligible);
    renderMockFollowButton(panel, { compact: false });
    parent.append(panel);
    return panel;
  }

  if (mockState === 'followed') {
    title.textContent = '已關注結果（示範）';
    appendParagraph(
      panel,
      '你正以示範模式標記為「已關注結果」。結果公開時的站內通知尚未連線後端，不會真的發送通知。',
    );
    const chip = doc.createElement('p');
    chip.className = 'ui-mock-followed-chip';
    chip.textContent = '已關注結果 · 站內通知（示範）';
    panel.append(chip);
    parent.append(panel);
    return panel;
  }

  return null;
}

export function renderMockTerminalResultState(root, mockState) {
  root.replaceChildren();
  const doc = root.ownerDocument;
  const panel = doc.createElement('section');
  panel.className = 'mvp-policy-panel ui-mock-terminal-state';
  panel.setAttribute('role', 'status');

  const title = doc.createElement('h2');
  title.className = 'mvp-policy-panel-title';
  if (mockState === 'cancelled') {
    title.textContent = '問卷已取消';
    appendParagraph(
      panel,
      '此問卷已由發起者在結果形成前取消。不會產生公開彙總結果，也不顯示收集中票數或百分比。',
    );
    appendParagraph(
      panel,
      '請注意：取消不同於下架；請勿在統計期間內使用「下架」描述停止中的問卷。',
      'policy-panel-text policy-panel-emphasis',
    );
  } else {
    title.textContent = '問卷已下架';
    appendParagraph(panel, POLICY_UI_COPY.unpublishAfterLock);
    appendParagraph(
      panel,
      '此為 UI 預覽。真實下架行為尚未在此 MVP 實作，也不會改變後端資料。',
      'policy-panel-text policy-panel-muted',
    );
  }
  panel.prepend(title);
  root.append(panel);
}

export function applyResultUiMockState(root, apiResult, mockState) {
  if (!mockState) {
    return { usedApiResult: true };
  }
  if (mockState === 'cancelled' || mockState === 'unpublished') {
    renderMockTerminalResultState(root, mockState);
    return { usedApiResult: false, terminal: true };
  }
  const payload = resolveMockResultPayload(apiResult, mockState);
  return { usedApiResult: true, payload };
}

export function renderVotePagePolicyPanels(parent, options = {}) {
  const { mockState = null } = options;
  parent.replaceChildren();
  renderLifecyclePolicyPanel(parent);

  if (mockState === 'ineligible') {
    const doc = parent.ownerDocument;
    const { section } = createPolicyPanel(doc, {
      title: '投票資格',
      badge: '不符合（預覽）',
    });
    appendParagraph(section, POLICY_UI_COPY.eligibilitySelfReport);
    appendParagraph(section, POLICY_UI_COPY.eligibilityIneligible);
    parent.append(section);
  } else {
    renderEligibilityPlaceholderPanel(parent);
  }

  const followSection = parent.ownerDocument.createElement('section');
  followSection.className = 'mvp-policy-panel';
  const h2 = parent.ownerDocument.createElement('h2');
  h2.className = 'mvp-policy-panel-title';
  h2.textContent = mockState === 'followed' ? '已關注結果（預覽）' : '關注結果';
  followSection.append(h2);

  if (mockState === 'followed') {
    appendParagraph(
      followSection,
      '示範狀態：已關注此問卷的結果公開通知（站內通知，尚未連線後端）。你仍可返回投票，除非處於不符合資格預覽。',
    );
    const chip = followSection.ownerDocument.createElement('p');
    chip.className = 'ui-mock-followed-chip';
    chip.textContent = '已關注結果 · 站內通知（示範）';
    followSection.append(chip);
  } else {
    appendParagraph(
      followSection,
      '不符合資格或暫不投票的參與者，可在結果公開後查看彙總統計；MVP 僅規劃站內通知，不含 Email／推播。',
    );
    renderMockFollowButton(followSection);
  }
  parent.append(followSection);
}

export function applyVotePageUiMockState({
  mockState,
  form,
  policyPanels,
  message,
  title,
}) {
  if (!mockState) {
    return;
  }
  if (mockState === 'cancelled') {
    if (form) {
      form.hidden = true;
    }
    if (message) {
      message.textContent =
        '（預覽）此問卷已取消，無法投票，也不會產生公開彙總結果。';
    }
    if (title) {
      title.textContent = `${title.textContent}（已取消 · 預覽）`;
    }
    return;
  }
  if (mockState === 'unpublished') {
    if (form) {
      form.hidden = true;
    }
    if (message) {
      message.textContent = `（預覽）${POLICY_UI_COPY.unpublishAfterLock}`;
    }
    return;
  }
  if (mockState === 'ineligible') {
    if (form) {
      form.hidden = true;
    }
    if (message) {
      message.textContent = `（預覽）${POLICY_UI_COPY.eligibilityIneligible}`;
    }
  }
}

export function mountUiMockPreviewChrome(documentObject, mockState) {
  if (!mockState || !documentObject) {
    return;
  }
  const main = documentObject.getElementById('main-content');
  if (main) {
    renderUiMockPreviewBanner(main, mockState);
  }
}
