/**
 * Phase 41A / 42B — policy-aligned copy and mock UI placeholders (no API/persistence).
 */

import { createHelpIcon, createMascot, HELP_COPY } from './public-mvp-layout.js';

/** Phase 45 — trust level policy preview (documentation-aligned; not enforced). */
export const TRUST_LEVEL_PREVIEW_COPY = {
  createLead:
    'Lv.1 註冊用戶可發起一般問卷；政治／高風險類別需更高信任並經事前審核。目前為公開展示版，送出僅檢查欄位，不會儲存資料。',
  voteLead:
    '正式投票可能需要登入；收集中不顯示期中結果。投票是否計票以送出當下系統判定為準。',
  myPollsLead:
    '發起額度與品質點數目前以範例資料展示，非真實帳號數值；優質題目看的是多種品質訊號，不是單純按讚。',
};

/** Phase 45 follow-up — post-vote quality feedback (policy preview only). */
export const QUALITY_FEEDBACK_PREVIEW = {
  prompt: '你覺得這個問題如何？可複選',
  positiveTags: [
    '題目清楚',
    '無刻意誤導',
    '有參考價值／值得省思',
    '新奇有趣',
    '中立客觀',
    '我想看結果',
  ],
  softNeutralTag: '有點無言／不知道該怎麼說',
  footnote:
    '優質題目看的是多種品質訊號，不是單純按讚。此項功能將在登入與計分完成後開放。',
};

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
    '送出投票後，系統會依該投票的規則在當下處理；頁面不預先顯示條件細節。',
  eligibilityIneligible:
    '目前無法完成這次投票。請確認已登入並完成必要的個人資料後再試；若問題持續，請稍後再試。',
  followWhileCollecting:
    '暫不投票或尚未投票時，可關注此問卷；結果公開後可查看彙總統計（站內通知完成後開放，目前不會儲存）。',
  followButton: '關注結果',
  followButtonLong: '結果公開時以站內通知提醒我',
  followMockNote:
    '這項功能會在登入與通知系統完成後開放；目前不會儲存關注或發送通知。',
  profileHelpFields:
    '若需要補充正式投票可能使用的基本個人資料，可前往「個人資料」更新；此提示不代表一定可以完成投票。',
};

function appendParagraph(parent, text, className = 'policy-panel-text') {
  const p = parent.ownerDocument.createElement('p');
  p.className = className;
  p.textContent = text;
  parent.append(p);
  return p;
}

function appendParagraphWithHelp(parent, text, help, className = 'policy-panel-text') {
  const doc = parent.ownerDocument;
  const p = doc.createElement('p');
  p.className = className;
  p.append(doc.createTextNode(text));
  p.append(createHelpIcon(doc, help));
  parent.append(p);
  return p;
}

function appendPanelClass(element, className) {
  const existing = typeof element.className === 'string' ? element.className : '';
  if (!existing.split(/\s+/).includes(className)) {
    element.className = existing ? `${existing} ${className}` : className;
  }
}

function appendBadge(parent, text, badgeClass = 'mvp-status-badge') {
  const span = parent.ownerDocument.createElement('span');
  span.className = badgeClass;
  span.textContent = text;
  parent.append(span);
  return span;
}

/**
 * @param {Document} documentObject
 * @param {{ title: string, badge?: string, badgeClass?: string, mascotVariant?: string, titleHelp?: { label: string, text: string } }} opts
 */
export function createPolicyPanel(documentObject, {
  title,
  badge,
  badgeClass,
  mascotVariant,
  titleHelp,
}) {
  const section = documentObject.createElement('section');
  section.className = 'mvp-policy-panel';

  const header = documentObject.createElement('div');
  header.className = 'mvp-policy-panel-header';

  if (mascotVariant) {
    const mascotWrap = documentObject.createElement('div');
    mascotWrap.className = 'mvp-policy-panel-mascot';
    mascotWrap.append(createMascot(documentObject, mascotVariant));
    header.append(mascotWrap);
  }

  const titleWrap = documentObject.createElement('div');
  titleWrap.className = 'mvp-policy-panel-title-wrap';

  const heading = documentObject.createElement('h2');
  const headingId = `policy-heading-${title.replace(/[^\w\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '') || 'panel'}`;
  heading.id = headingId;
  heading.className = 'mvp-policy-panel-title';
  heading.textContent = title;
  titleWrap.append(heading);
  if (titleHelp) {
    titleWrap.append(createHelpIcon(documentObject, titleHelp));
  }
  header.append(titleWrap);
  section.setAttribute('aria-labelledby', headingId);

  if (badge) {
    appendBadge(header, badge, badgeClass ?? 'mvp-status-badge');
  }

  section.append(header);
  return { section, heading, header, body: section };
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
    badgeClass: 'mvp-badge mvp-badge-collecting',
    mascotVariant: 'collecting',
    titleHelp: {
      label: '收集中為何不顯示票數',
      text: HELP_COPY.collectingHidden,
    },
  });

  appendParagraph(section, POLICY_UI_COPY.collectingBlindLead);
  appendParagraph(section, POLICY_UI_COPY.collectingRevealHint);
  appendParagraphWithHelp(
    section,
    '結果公開後進入約 5 天公開鎖定期。',
    { label: '公開鎖定期說明', text: HELP_COPY.lockPeriod },
    'policy-panel-text policy-panel-emphasis',
  );
  appendParagraphWithHelp(
    section,
    POLICY_UI_COPY.cancelVsUnpublish,
    { label: '取消與下架', text: HELP_COPY.cancelVsUnpublish },
  );
  appendParagraph(
    section,
    `下架範例：${POLICY_UI_COPY.unpublishAfterLock}`,
    'policy-panel-text policy-panel-muted',
  );

  parent.append(section);
  return section;
}

export function renderEligibilityPlaceholderPanel(parent) {
  const doc = parent.ownerDocument;
  const { section } = createPolicyPanel(doc, {
    title: '正式投票提醒',
    badge: 'Official Vote',
    badgeClass: 'mvp-badge mvp-badge-muted',
    mascotVariant: 'idle',
    titleHelp: {
      label: '投票如何處理',
      text: HELP_COPY.eligibility,
    },
  });

  const list = doc.createElement('ul');
  list.className = 'policy-field-list';
  for (const item of [
    '送出投票後才由系統在當下處理。',
    '頁面不預先顯示條件細節或判定結果。',
    '若需要補充基本個人資料，可從個人資料頁更新。',
  ]) {
    const li = doc.createElement('li');
    li.textContent = item;
    list.append(li);
  }
  section.append(list);

  appendParagraph(section, POLICY_UI_COPY.eligibilitySelfReport);
  appendParagraph(section, POLICY_UI_COPY.profileHelpFields);
  appendParagraph(section, POLICY_UI_COPY.eligibilityIneligible, 'policy-panel-text policy-panel-muted');

  const profileLink = doc.createElement('a');
  profileLink.className = 'mvp-action-link';
  profileLink.href = '/profile';
  profileLink.textContent = '前往個人資料';
  section.append(profileLink);

  parent.append(section);
  return section;
}

export function renderCollectingPolicyExtras(block) {
  appendParagraph(block, POLICY_UI_COPY.collectingBeforeReveal, 'result-collecting-why');
  appendParagraph(block, POLICY_UI_COPY.votePrivacy, 'result-collecting-privacy');
}

export function renderResultPagePolicyExtras(
  root,
  { collecting, skipFollowPanel = false, skipGlossary = false } = {},
) {
  const doc = root.ownerDocument;
  const wrap = doc.createElement('aside');
  wrap.className = 'mvp-policy-aside';
  wrap.setAttribute('aria-label', '政策說明');

  if (collecting && !skipFollowPanel) {
    const { section: followPanel } = createPolicyPanel(doc, {
      title: '收集中 — 可關注結果',
      badge: '站內通知（範例）',
      badgeClass: 'mvp-badge mvp-badge-followed',
      mascotVariant: 'followed',
      titleHelp: {
        label: '關注結果說明',
        text: HELP_COPY.followNotify,
      },
    });
    appendParagraph(followPanel, POLICY_UI_COPY.followWhileCollecting);
    renderMockFollowButton(followPanel, { compact: false });
    wrap.append(followPanel);
  }

  if (!skipGlossary) {
    const { section: glossary } = createPolicyPanel(doc, {
      title: '名詞對照',
      mascotVariant: 'locked',
    });
    appendPanelClass(glossary, 'mvp-policy-panel-compact');
    appendParagraph(glossary, POLICY_UI_COPY.closeVsLock);
    appendParagraph(glossary, POLICY_UI_COPY.cancelVsUnpublish);
    wrap.append(glossary);
  }

  if (wrap.children.length > 0) {
    root.append(wrap);
  }
}

export function renderVoteSuccessPolicyExtras(root) {
  renderMockFollowButton(root, { compact: false });
}

/** Disabled chip preview after vote success (no persistence or scoring). */
export function renderVoteQualityFeedbackPreview(parent) {
  const doc = parent.ownerDocument;
  const wrap = doc.createElement('aside');
  wrap.className = 'mvp-quality-feedback-preview';
  wrap.setAttribute('aria-label', '投票後題目品質回饋（展示用）');

  const heading = doc.createElement('h3');
  heading.className = 'mvp-quality-feedback-preview-title';
  heading.textContent = '投票後可協助回饋題目品質';
  wrap.append(heading);

  const prompt = doc.createElement('p');
  prompt.className = 'mvp-meta mvp-quality-feedback-preview-prompt';
  prompt.textContent = `${QUALITY_FEEDBACK_PREVIEW.prompt}（展示用，尚未開放）`;
  wrap.append(prompt);

  const chips = doc.createElement('div');
  chips.className = 'mvp-quality-feedback-chips';
  chips.setAttribute('role', 'group');
  chips.setAttribute('aria-label', QUALITY_FEEDBACK_PREVIEW.prompt);

  for (const label of QUALITY_FEEDBACK_PREVIEW.positiveTags) {
    const chip = doc.createElement('button');
    chip.type = 'button';
    chip.className = 'mvp-quality-feedback-chip';
    chip.disabled = true;
    chip.setAttribute('aria-disabled', 'true');
    chip.textContent = label;
    chips.append(chip);
  }

  const neutral = doc.createElement('button');
  neutral.type = 'button';
  neutral.className = 'mvp-quality-feedback-chip mvp-quality-feedback-chip--neutral';
  neutral.disabled = true;
  neutral.setAttribute('aria-disabled', 'true');
  neutral.textContent = QUALITY_FEEDBACK_PREVIEW.softNeutralTag;
  chips.append(neutral);

  wrap.append(chips);

  const note = doc.createElement('p');
  note.className = 'mvp-meta mvp-quality-feedback-preview-note';
  note.textContent = QUALITY_FEEDBACK_PREVIEW.footnote;
  wrap.append(note);

  parent.append(wrap);
  return wrap;
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
  collecting: '收集中',
  revealed: '已公開',
  locked: '公開鎖定期',
  post_lock: '鎖定期已結束',
  cancelled: '已取消',
  unpublished: '已下架',
  ineligible: '暫不投票',
  followed: '已關注結果',
};

const UI_MOCK_STATE_PANEL_CONFIG = {
  collecting: {
    title: '收集中',
    badge: '收集中',
    badgeClass: 'mvp-badge mvp-badge-collecting',
    mascot: 'collecting',
  },
  revealed: {
    title: '結果已公開',
    badge: '已公開',
    badgeClass: 'mvp-badge mvp-badge-revealed',
    mascot: 'idle',
  },
  locked: {
    title: '公開鎖定期進行中',
    badge: '公開鎖定期',
    badgeClass: 'mvp-badge mvp-badge-locked',
    mascot: 'locked',
  },
  post_lock: {
    title: '公開鎖定期已結束',
    badge: '可下架',
    badgeClass: 'mvp-badge mvp-badge-muted',
    mascot: 'idle',
  },
  ineligible: {
    title: '暫不投票',
    badge: '請稍後再試',
    badgeClass: 'mvp-badge mvp-badge-muted',
    mascot: 'idle',
  },
  followed: {
    title: '已關注結果',
    badge: '已關注',
    badgeClass: 'mvp-badge mvp-badge-followed',
    mascot: 'followed',
  },
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
    public_lifecycle_state: 'collecting',
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
    total_votes_display: '100–499（範例區間，非即時資料）',
    updated_display: '最近更新（範例）',
    options: labels.map((display_label, option_index) => ({
      option_index,
      display_label,
      display_percentage: '約 40%（範例）',
      display_count: '約 40–60 票（範例）',
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
  banner.className = 'ui-mock-preview-banner mvp-mock-banner';
  banner.setAttribute('role', 'status');
  banner.setAttribute('aria-live', 'polite');

  const badge = doc.createElement('span');
  badge.className = 'mvp-badge mvp-badge-muted ui-mock-preview-badge';
  badge.textContent = UI_MOCK_STATE_LABELS[mockState] ?? mockState;
  banner.append(badge);

  const text = doc.createElement('p');
  text.className = 'ui-mock-preview-text';
  text.textContent =
    '展示用，不儲存：目前以範例資料展示此狀態，不代表真實問卷。';
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
  const config = UI_MOCK_STATE_PANEL_CONFIG[mockState];
  if (!config) {
    return null;
  }
  const doc = parent.ownerDocument;
  const { section: panel } = createPolicyPanel(doc, {
    title: config.title,
    badge: config.badge,
    badgeClass: config.badgeClass,
    mascotVariant: config.mascot,
    titleHelp:
      mockState === 'collecting'
        ? { label: '收集中說明', text: HELP_COPY.collectingHidden }
        : mockState === 'locked'
          ? { label: '鎖定期說明', text: HELP_COPY.lockPeriod }
          : undefined,
  });
  appendPanelClass(panel, 'ui-mock-state-panel');

  if (mockState === 'collecting') {
    appendParagraph(panel, POLICY_UI_COPY.collectingBlindLead);
    appendParagraph(panel, POLICY_UI_COPY.collectingRevealHint);
  } else if (mockState === 'revealed') {
    appendParagraph(
      panel,
      '投票與統計已結束，彙總結果開始公開。正式上線後以系統顯示的狀態與時間為準。',
    );
  } else if (mockState === 'locked') {
    appendParagraph(
      panel,
      '結果公開後約 5 天為公開鎖定期；期間不可下架、刪除、修改或隱藏結果（按鈕僅展示流程）。',
    );
    renderDisabledMockActions(panel, [
      '下架（鎖定期內不可用）',
      '刪除（鎖定期內不可用）',
      '修改問卷（鎖定期內不可用）',
    ]);
  } else if (mockState === 'post_lock') {
    appendParagraph(
      panel,
      '鎖定期結束後，發起者可維持公開或下架；以下按鈕不會執行真實操作。',
    );
    renderDisabledMockActions(panel, ['下架問卷（展示用，尚未開放）']);
    appendParagraph(
      panel,
      POLICY_UI_COPY.unpublishAfterLock,
      'policy-panel-text policy-panel-muted',
    );
  } else if (mockState === 'ineligible') {
    appendParagraph(panel, POLICY_UI_COPY.eligibilityIneligible);
    renderMockFollowButton(panel, { compact: false });
  } else if (mockState === 'followed') {
    appendParagraph(
      panel,
      '已標記關注結果（範例）；站內通知將在登入與通知系統完成後開放。',
    );
    const chip = doc.createElement('p');
    chip.className = 'ui-mock-followed-chip';
    chip.textContent = '已關注結果 · 站內通知（範例）';
    panel.append(chip);
  }

  parent.append(panel);
  return panel;
}

export function renderMockTerminalResultState(root, mockState) {
  root.replaceChildren();
  const doc = root.ownerDocument;
  const isCancelled = mockState === 'cancelled';
  const { section: panel } = createPolicyPanel(doc, {
    title: isCancelled ? '問卷已取消' : '問卷已下架',
    badge: isCancelled ? '已取消' : '已下架',
    badgeClass: isCancelled
      ? 'mvp-badge mvp-badge-danger'
      : 'mvp-badge mvp-badge-muted',
    mascotVariant: isCancelled ? 'cancelled' : 'idle',
    titleHelp: isCancelled
      ? { label: '取消與下架', text: HELP_COPY.cancelVsUnpublish }
      : undefined,
  });
  appendPanelClass(panel, 'ui-mock-terminal-state');
  panel.setAttribute('role', 'status');

  if (isCancelled) {
    appendParagraph(
      panel,
      '發起者於結果形成前取消。不會產生公開彙總結果，也不顯示票數或百分比。',
    );
    appendParagraph(
      panel,
      '收集中停止請稱「取消」，不是「下架」。',
      'policy-panel-text policy-panel-emphasis',
    );
  } else {
    appendParagraph(panel, POLICY_UI_COPY.unpublishAfterLock);
    appendParagraph(
      panel,
      '下架功能尚未開放；此頁僅展示說明，不會變更任何資料。',
      'policy-panel-text policy-panel-muted',
    );
  }
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
      title: '正式投票提醒',
      badge: '中性提示',
      badgeClass: 'mvp-badge mvp-badge-muted',
      mascotVariant: 'idle',
      titleHelp: { label: '投票說明', text: HELP_COPY.eligibility },
    });
    appendParagraph(section, POLICY_UI_COPY.eligibilitySelfReport);
    appendParagraph(section, POLICY_UI_COPY.eligibilityIneligible);
    parent.append(section);
  } else {
    renderEligibilityPlaceholderPanel(parent);
  }

  const doc = parent.ownerDocument;
  const { section: followSection } = createPolicyPanel(doc, {
    title: mockState === 'followed' ? '已關注結果' : '關注結果',
    badge: mockState === 'followed' ? '已關注' : '站內通知（範例）',
    badgeClass:
      mockState === 'followed'
        ? 'mvp-badge mvp-badge-followed'
        : 'mvp-badge mvp-badge-muted',
    mascotVariant: 'followed',
    titleHelp: { label: '關注結果', text: HELP_COPY.followNotify },
  });

  if (mockState === 'followed') {
    appendParagraph(
      followSection,
      '已關注結果公開通知（站內，範例）。暫不投票時仍可等待結果公開。',
    );
    const chip = doc.createElement('p');
    chip.className = 'ui-mock-followed-chip';
    chip.textContent = '已關注結果 · 站內通知（範例）';
    followSection.append(chip);
  } else {
    appendParagraph(
      followSection,
      '可於結果公開後查看彙總；站內通知將在登入與通知系統完成後開放，不含 Email／推播。',
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
        '此問卷已取消（範例展示），無法投票，也不會產生公開彙總結果。';
    }
    if (title) {
      title.textContent = `${title.textContent}（已取消）`;
    }
    return;
  }
  if (mockState === 'unpublished') {
    if (form) {
      form.hidden = true;
    }
    if (message) {
      message.textContent = POLICY_UI_COPY.unpublishAfterLock;
    }
    return;
  }
  if (mockState === 'ineligible') {
    if (form) {
      form.hidden = true;
    }
    if (message) {
      message.textContent = POLICY_UI_COPY.eligibilityIneligible;
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
