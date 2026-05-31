/**
 * Phase 42A — shared public chrome (static visual only; no auth/persistence).
 */

export const HELP_COPY = {
  collectingHidden:
    '收票中不顯示票數、百分比、排名或趨勢，避免影響後續投票者。',
  revealTime: 'MVP：截止時間即結果公開時間；公開後才可查看聚合結果。',
  lockPeriod:
    '結果公開後約 5 天為公開鎖定期；期間發起者無法編輯、下架、刪除或隱藏結果。',
  eligibility:
    '年齡依個人檔案自行填寫的出生年／月判斷，非政府驗證。',
  followNotify: 'MVP 僅站內通知示意，尚未連線後端，不會儲存追蹤狀態。',
  cancelVsUnpublish:
    '收票中停止請用「取消」，不產生公開結果；鎖定期結束後的「下架」另當別論。',
};

/**
 * @param {Document} documentObject
 * @param {{ label: string, text: string, id?: string }} opts
 */
export function createHelpIcon(documentObject, { label, text, id }) {
  const wrap = documentObject.createElement('span');
  wrap.className = 'mvp-help';
  wrap.tabIndex = 0;
  wrap.setAttribute('role', 'button');
  wrap.setAttribute('aria-label', label);

  const icon = documentObject.createElement('span');
  icon.className = 'mvp-help-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '?';

  const tip = documentObject.createElement('span');
  tip.className = 'mvp-help-tip';
  tip.id = id ?? undefined;
  tip.setAttribute('role', 'tooltip');
  tip.textContent = text;

  wrap.append(icon, tip);
  return wrap;
}

/**
 * @param {Document} documentObject
 * @param {'collecting'|'locked'|'followed'|'cancelled'|'idle'} [variant]
 */
export function createMascot(documentObject, variant = 'idle') {
  const root = documentObject.createElement('div');
  root.className = `mvp-mascot mvp-mascot--${variant}`;
  root.setAttribute('aria-hidden', 'true');
  root.title = '問問（示意）';

  const body = documentObject.createElement('span');
  body.className = 'mvp-mascot-body';

  const face = documentObject.createElement('span');
  face.className = 'mvp-mascot-face';

  const prop = documentObject.createElement('span');
  prop.className = 'mvp-mascot-prop';

  body.append(face, prop);
  root.append(body);
  return root;
}

const NAV_LINKS = [
  { href: '/', key: 'home', label: '首頁' },
  { href: '/explore', key: 'explore', label: '探索' },
  { href: '/polls/new', key: 'create', label: '發起提問' },
];

/**
 * @param {HTMLElement} mount
 * @param {{ nav?: 'guest'|'logged-in-mock', active?: string }} [options]
 */
export function renderSiteHeader(mount, options = {}) {
  const doc = mount.ownerDocument;
  const navMode = options.nav ?? mount.dataset.nav ?? 'guest';
  const active = options.active ?? mount.dataset.active ?? '';

  mount.replaceChildren();
  mount.className = 'mvp-site-header';

  const inner = doc.createElement('div');
  inner.className = 'mvp-site-header-inner';

  const brand = doc.createElement('a');
  brand.className = 'mvp-logo';
  brand.href = '/';
  brand.innerHTML =
    '<span class="mvp-logo-mark" aria-hidden="true">W</span><span class="mvp-logo-text">大家想知道</span>';

  const nav = doc.createElement('nav');
  nav.className = 'mvp-site-nav';
  nav.setAttribute('aria-label', '主要導覽');

  for (const link of NAV_LINKS) {
    const a = doc.createElement('a');
    a.href = link.href;
    a.textContent = link.label;
    if (link.key === active) {
      a.setAttribute('aria-current', 'page');
    }
    nav.append(a);
  }

  const actions = doc.createElement('div');
  actions.className = 'mvp-site-actions';

  if (navMode === 'logged-in-mock') {
    const myPolls = doc.createElement('a');
    myPolls.className = 'mvp-btn mvp-btn-ghost mvp-btn-sm';
    myPolls.href = '/my-polls';
    myPolls.textContent = '我的問卷';

    const create = doc.createElement('a');
    create.className = 'mvp-btn mvp-btn-primary mvp-btn-sm';
    create.href = '/polls/new';
    create.textContent = '發起提問';

    const avatar = doc.createElement('span');
    avatar.className = 'mvp-avatar';
    avatar.title = '使用者選單（示意）';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = 'Y';

    actions.append(myPolls, create, avatar);
  } else {
    const login = doc.createElement('a');
    login.className = 'mvp-btn mvp-btn-ghost mvp-btn-sm';
    login.href = '#login-mock';
    login.textContent = '登入';

    const signup = doc.createElement('a');
    signup.className = 'mvp-btn mvp-btn-primary mvp-btn-sm';
    signup.href = '#signup-mock';
    signup.textContent = '註冊 / 開始使用';

    actions.append(login, signup);
  }

  inner.append(brand, nav, actions);
  mount.append(inner);
}

export function mountSiteChrome(documentObject) {
  const header = documentObject.getElementById('site-header');
  if (header) {
    renderSiteHeader(header, {
      nav: header.dataset.nav,
      active: header.dataset.active,
    });
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mountSiteChrome(document));
  } else {
    mountSiteChrome(document);
  }
}
