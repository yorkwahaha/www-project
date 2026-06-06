/**
 * Phase 42A — shared public chrome (static visual only; no auth/persistence).
 * Phase 75 — auth state indicator + navigation copy polish.
 */

import { AUTH_STATE_COPY } from './auth-state-copy.js';
import { mountLoginStateRead } from './login-state-ui.js';

export { AUTH_STATE_COPY };

export const HELP_COPY = {
  collectingHidden:
    '收集中不顯示票數、百分比、總計、排名、趨勢或進度；發起者亦同，避免影響後續投票者。',
  revealTime: 'MVP：截止時間即結果公開時間；公開後才可查看聚合結果。',
  lockPeriod:
    '結果公開後約 5 天為公開鎖定期；期間發起者無法編輯、下架、刪除或隱藏結果。',
  eligibility:
    '年齡依個人檔案自行填寫的出生年／月判斷，非政府驗證。',
  followNotify:
    '站內通知將在登入與通知系統完成後開放；目前不會儲存追蹤狀態。',
  cancelVsUnpublish:
    '收集中停止請用「取消」，不產生公開結果；鎖定期結束後的「下架」另當別論。',
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
  root.title = '問問';

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

/** Phase 42B — `?nav=` demo switch only (not authentication). */
export const VALID_DEMO_NAV_MODES = ['guest', 'logged-in-mock'];

const NAV_LINKS = [
  { href: '/', key: 'home', label: '首頁' },
  { href: '/explore', key: 'explore', label: '探索' },
  { href: '/profile', key: 'profile', label: '個人資料' },
  { href: '/polls/new', key: 'create', label: '發起提問' },
];

export function parseDemoNavMode(search = '') {
  const rawSearch =
    typeof search === 'string' && search.length > 0
      ? search.startsWith('?')
        ? search
        : `?${search}`
      : '';
  const value = new URLSearchParams(rawSearch).get('nav')?.trim().toLowerCase();
  if (!value || !VALID_DEMO_NAV_MODES.includes(value)) {
    return null;
  }
  return value;
}

/**
 * URL `?nav=` overrides header `data-nav` when valid; otherwise falls back to data-nav or guest.
 * @param {HTMLElement | null | undefined} headerEl
 * @param {string} [search]
 */
export function resolveDemoNavMode(headerEl, search = '') {
  const fromUrl = parseDemoNavMode(search);
  if (fromUrl) {
    return fromUrl;
  }
  const fromData = headerEl?.dataset?.nav?.trim().toLowerCase();
  if (fromData && VALID_DEMO_NAV_MODES.includes(fromData)) {
    return fromData;
  }
  return 'guest';
}

/**
 * @param {Document} doc
 * @param {'guest'|'logged-in-mock'} navMode
 */
export function createAuthStateChip(doc, navMode) {
  if (navMode === 'logged-in-mock') {
    const chip = doc.createElement('span');
    chip.className = 'mvp-auth-state-chip mvp-auth-state-chip--demo';
    chip.setAttribute('role', 'status');
    chip.textContent = AUTH_STATE_COPY.demoIdentityChipLabel;
    chip.setAttribute('aria-label', AUTH_STATE_COPY.demoIdentityChipAriaLabel);
    chip.title = AUTH_STATE_COPY.demoIdentityChipTitle;
    return chip;
  }

  const chip = doc.createElement('a');
  chip.className = 'mvp-auth-state-chip mvp-auth-state-chip--guest';
  chip.href = '/login';
  chip.textContent = AUTH_STATE_COPY.guestChipLabel;
  chip.setAttribute('aria-label', AUTH_STATE_COPY.guestChipAriaLabel);
  chip.title = AUTH_STATE_COPY.guestChipTitle;
  return chip;
}

/**
 * @param {HTMLElement} mount
 * @param {{ nav?: 'guest'|'logged-in-mock', active?: string }} [options]
 */
export function renderSiteHeader(mount, options = {}) {
  const doc = mount.ownerDocument;
  const navMode =
    options.nav && VALID_DEMO_NAV_MODES.includes(options.nav)
      ? options.nav
      : resolveDemoNavMode(mount, options.search ?? '');
  mount.dataset.nav = navMode;
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
  actions.append(createAuthStateChip(doc, navMode));

  if (navMode === 'logged-in-mock') {
    const myPolls = doc.createElement('a');
    myPolls.className = 'mvp-btn mvp-btn-ghost mvp-btn-sm';
    myPolls.href = '/my-polls';
    myPolls.textContent = '我的問卷';

    const profile = doc.createElement('a');
    profile.className = 'mvp-btn mvp-btn-ghost mvp-btn-sm';
    profile.href = '/profile';
    profile.textContent = '個人資料';

    const create = doc.createElement('a');
    create.className = 'mvp-btn mvp-btn-primary mvp-btn-sm';
    create.href = '/polls/new';
    create.textContent = '發起提問';

    actions.append(myPolls, profile, create);
  } else {
    const login = doc.createElement('a');
    login.className = 'mvp-btn mvp-btn-ghost mvp-btn-sm';
    login.href = '/login';
    login.textContent = AUTH_STATE_COPY.guestSecondaryCta;
    login.setAttribute('aria-label', '前往登入說明頁');

    const signup = doc.createElement('a');
    signup.className = 'mvp-btn mvp-btn-primary mvp-btn-sm';
    signup.href = '/login';
    signup.textContent = AUTH_STATE_COPY.guestPrimaryCta;
    signup.setAttribute('aria-label', '了解正式登入狀態與本機 demo 身分邊界');

    actions.append(login, signup);
  }

  inner.append(brand, nav, actions);
  mount.append(inner);
}

/**
 * @param {HTMLElement} parent
 * @param {'guest'|'logged-in-mock'} navMode
 */
export function renderAuthStateBanner(parent, navMode) {
  if (!parent || !VALID_DEMO_NAV_MODES.includes(navMode)) {
    return null;
  }
  const doc = parent.ownerDocument;
  if (parent.querySelector('.mvp-auth-state-banner')) {
    return null;
  }

  const banner = doc.createElement('aside');
  banner.className = 'mvp-auth-state-banner';
  banner.setAttribute('role', 'note');
  banner.setAttribute('aria-label', AUTH_STATE_COPY.bannerAriaLabel);

  const lead = doc.createElement('p');
  lead.className = 'mvp-auth-state-banner-lead';
  const leadStrong = doc.createElement('strong');
  leadStrong.textContent = AUTH_STATE_COPY.bannerGuestLead;
  lead.append(leadStrong, '：', AUTH_STATE_COPY.bannerGuestBody);

  const local = doc.createElement('p');
  local.className = 'mvp-auth-state-banner-local';
  const localStrong = doc.createElement('strong');
  localStrong.textContent = AUTH_STATE_COPY.bannerLocalDemoTitle;
  local.append(
    localStrong,
    '：',
    AUTH_STATE_COPY.bannerLocalDemoBody,
    ' ',
  );
  const loginLink = doc.createElement('a');
  loginLink.href = '/login';
  loginLink.textContent = '登入說明';
  local.append(loginLink, '。');

  banner.append(lead, local);

  if (navMode === 'logged-in-mock') {
    const navNote = doc.createElement('p');
    navNote.className = 'mvp-auth-state-banner-nav';
    navNote.textContent = AUTH_STATE_COPY.bannerNavDemoNote;
    banner.append(navNote);
  }

  parent.prepend(banner);
  return banner;
}

/** @deprecated Use renderAuthStateBanner */
export function renderDemoNavBanner(parent, navMode) {
  return renderAuthStateBanner(parent, navMode);
}

/**
 * @param {Document} documentObject
 */
export function enhanceDemoNavSwitch(documentObject) {
  if (typeof documentObject?.querySelector !== 'function') {
    return null;
  }
  const block = documentObject.querySelector('.mvp-demo-nav-switch');
  if (!block) {
    return null;
  }
  block.setAttribute('role', 'note');
  block.replaceChildren();

  const label = documentObject.createTextNode(`${AUTH_STATE_COPY.demoNavSwitchLabel}：`);
  const guest = documentObject.createElement('a');
  guest.href = '?nav=guest';
  guest.textContent = AUTH_STATE_COPY.demoNavGuestLink;

  const sep = documentObject.createTextNode(' · ');

  const loggedIn = documentObject.createElement('a');
  loggedIn.href = '?nav=logged-in-mock';
  loggedIn.textContent = AUTH_STATE_COPY.demoNavLoggedInLink;

  block.append(label, guest, sep, loggedIn);
  return block;
}

const FOOTER_LINKS = [
  { href: '/faq', label: '常見問題' },
  { href: '/trust-levels', label: '權限與信任等級' },
];

/**
 * @param {HTMLElement} mount
 */
export function renderSiteFooter(mount) {
  const doc = mount.ownerDocument;
  const path = doc.defaultView?.location?.pathname ?? '';
  mount.replaceChildren();
  mount.className = 'mvp-site-footer';

  const inner = doc.createElement('div');
  inner.className = 'mvp-site-footer-inner';

  const nav = doc.createElement('nav');
  nav.className = 'mvp-site-footer-nav';
  nav.setAttribute('aria-label', '說明與政策');

  for (const link of FOOTER_LINKS) {
    const a = doc.createElement('a');
    a.href = link.href;
    a.textContent = link.label;
    if (path === link.href || path === `${link.href}/`) {
      a.setAttribute('aria-current', 'page');
    }
    nav.append(a);
  }

  const note = doc.createElement('p');
  note.className = 'mvp-site-footer-note';
  note.textContent =
    '公開展示版政策說明；帳號、通知與計分等功能將陸續開放。';

  inner.append(nav, note);
  mount.append(inner);
}

function elementHasClass(element, className) {
  if (!element) {
    return false;
  }
  if (typeof element.classList?.contains === 'function') {
    return element.classList.contains(className);
  }
  return (
    typeof element.className === 'string' &&
    element.className.split(/\s+/).includes(className)
  );
}

function mountSiteFooter(documentObject) {
  if (typeof documentObject?.getElementById !== 'function') {
    return;
  }
  let footer = documentObject.getElementById('site-footer');
  if (!footer) {
    if (
      typeof documentObject.createElement !== 'function' ||
      !documentObject.body ||
      typeof documentObject.body.append !== 'function'
    ) {
      return;
    }
    footer = documentObject.createElement('footer');
    footer.id = 'site-footer';
    documentObject.body.append(footer);
  }
  renderSiteFooter(footer);
}

export function mountSiteChrome(documentObject, options = {}) {
  const search =
    typeof documentObject.defaultView?.location?.search === 'string'
      ? documentObject.defaultView.location.search
      : '';
  const header = documentObject.getElementById('site-header');
  if (header) {
    renderSiteHeader(header, {
      search,
      active: header.dataset.active,
    });
    if (parseDemoNavMode(search)) {
      header.setAttribute('data-nav-demo', 'true');
    } else {
      header.removeAttribute('data-nav-demo');
    }
    void mountLoginStateRead(documentObject, options);
  }
  const navMode = header
    ? resolveDemoNavMode(header, search)
    : parseDemoNavMode(search) ?? 'guest';
  const main = documentObject.getElementById('main-content');
  if (main && !elementHasClass(main, 'mvp-login-shell')) {
    renderAuthStateBanner(main, navMode);
  }
  enhanceDemoNavSwitch(documentObject);
  mountSiteFooter(documentObject);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mountSiteChrome(document));
  } else {
    mountSiteChrome(document);
  }
}
