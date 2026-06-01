/**
 * Phase 44 — shared public MVP demo/static helpers (no API, no persistence).
 */

import { buildPublicResultPath, buildPublicVotePath } from './public-mvp-ui.js';

/** Stable slug for clickable demo vote/result routes (not a backend poll id). */
export const DEMO_POLL_SLUG = 'demo';

/** Legacy alias used by create-poll demo success payloads. */
export const DEMO_MOCK_POLL_ID = DEMO_POLL_SLUG;

const DEMO_POLL_TITLE = '你平常通勤主要使用哪種交通工具？';
const DEMO_POLL_DESCRIPTION =
  '此為範例問卷，用來展示投票與結果頁的使用方式；目前先以範例資料展示。';

const DEMO_POLL_OPTION_LABELS = [
  '大眾運輸（捷運、公車等）',
  '自行開車或機車',
  '單車或步行',
  '多種方式混合',
];

export function parseLiveApiMode(search = '') {
  const rawSearch =
    typeof search === 'string' && search.length > 0
      ? search.startsWith('?')
        ? search
        : `?${search}`
      : '';
  return new URLSearchParams(rawSearch).get('live') === '1';
}

export function parseDemoQueryFlag(search = '') {
  const rawSearch =
    typeof search === 'string' && search.length > 0
      ? search.startsWith('?')
        ? search
        : `?${search}`
      : '';
  return new URLSearchParams(rawSearch).get('demo') === '1';
}

export function isDemoPollRouteId(pollId) {
  return typeof pollId === 'string' && pollId.trim().toLowerCase() === DEMO_POLL_SLUG;
}

export function buildDemoVotePath() {
  return buildPublicVotePath(DEMO_POLL_SLUG);
}

export function buildDemoResultPath(uiState) {
  const base = buildPublicResultPath(DEMO_POLL_SLUG);
  if (!uiState) {
    return base;
  }
  return `${base}?ui_state=${encodeURIComponent(uiState)}`;
}

export { buildPublicResultPath, buildPublicVotePath };

export function buildExploreStateHref(path, uiState) {
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}ui_state=${encodeURIComponent(uiState)}`;
}

export function getDemoPollDetail() {
  return {
    title: DEMO_POLL_TITLE,
    description: DEMO_POLL_DESCRIPTION,
    options: DEMO_POLL_OPTION_LABELS.map((label, option_index) => ({
      option_index,
      label,
    })),
  };
}

export function getDemoCollectingResultPayload() {
  return {
    poll_id: DEMO_POLL_SLUG,
    public_lifecycle_state: 'collecting',
    collecting: true,
    display_mode: 'collecting',
    total_votes_display: '收集中',
    updated_display: '',
    options: DEMO_POLL_OPTION_LABELS.map((display_label, option_index) => ({
      option_index,
      display_label,
      display_percentage: null,
      display_count: null,
    })),
  };
}

export function submitVoteDemo({ optionIndex }) {
  if (!Number.isInteger(optionIndex) || optionIndex < 0) {
    throw new Error('請先選擇一個選項。');
  }
  return { ok: true, demo: true };
}

/**
 * @param {HTMLElement} target
 * @param {string} message
 */
export function showDemoOnlyFeedback(target, message) {
  if (!target) {
    return;
  }
  const doc = target.ownerDocument;
  const host =
    target.closest('[data-demo-feedback-host]') ??
    target.closest('td') ??
    target.parentElement;
  if (!host) {
    return;
  }
  let status = host.querySelector('.mvp-demo-action-feedback');
  if (!status) {
    status = doc.createElement('p');
    status.className = 'mvp-demo-action-feedback';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    host.append(status);
  }
  status.textContent = message;
}

export const RESULT_UI_STATE_PREVIEW_LINKS = [
  { uiState: 'collecting', label: '收集中' },
  { uiState: 'revealed', label: '已公開' },
  { uiState: 'locked', label: '公開鎖定期' },
  { uiState: 'post_lock', label: '鎖定期已結束' },
  { uiState: 'cancelled', label: '已取消' },
  { uiState: 'unpublished', label: '已下架' },
];

export function renderResultUiStatePreviewLinks(root, pollId) {
  root.replaceChildren();
  const doc = root.ownerDocument;
  const wrap = doc.createElement('div');
  wrap.className = 'mvp-preview-links-block';
  wrap.setAttribute('role', 'navigation');
  wrap.setAttribute('aria-label', '問卷狀態範例');

  const lead = doc.createElement('p');
  lead.className = 'mvp-meta';
  lead.textContent = '切換不同狀態範例（不代表真實問卷）：';
  wrap.append(lead);

  const list = doc.createElement('ul');
  list.className = 'mvp-preview-links';

  for (const item of RESULT_UI_STATE_PREVIEW_LINKS) {
    const li = doc.createElement('li');
    const a = doc.createElement('a');
    const href = item.uiState
      ? `${buildPublicResultPath(pollId)}?ui_state=${encodeURIComponent(item.uiState)}`
      : buildPublicResultPath(pollId);
    a.href = href;
    a.textContent = item.label;
    li.append(a);
    list.append(li);
  }
  wrap.append(list);
  root.append(wrap);
  return wrap;
}
