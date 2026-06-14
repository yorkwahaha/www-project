import { appendPublicPollCardStatusRow } from './public-poll-card.js';

export const PUBLIC_CREATOR_OWNED_POLL_ACTION_LAYOUT_ORDER = [
  'title-status-meta',
  'lifecycle-hint',
  'primary-actions',
  'secondary-actions',
  'destructive-actions',
  'nav-links',
  'inline-feedback',
];

export const PUBLIC_CREATOR_OWNED_POLL_HEADER_CLASS = 'mvp-creator-owned-poll-header';
export const PUBLIC_CREATOR_OWNED_POLL_ACTION_AREA_CLASS =
  'mvp-creator-owned-poll-action-area';
export const PUBLIC_CREATOR_OWNED_POLL_LIFECYCLE_HINT_CLASS =
  'mvp-creator-owned-poll-lifecycle-hint';
export const PUBLIC_CREATOR_OWNED_POLL_PRIMARY_ACTIONS_CLASS =
  'mvp-creator-owned-poll-primary-actions';
export const PUBLIC_CREATOR_OWNED_POLL_SECONDARY_ACTIONS_CLASS =
  'mvp-creator-owned-poll-secondary-actions';
export const PUBLIC_CREATOR_OWNED_POLL_DESTRUCTIVE_ACTIONS_CLASS =
  'mvp-creator-owned-poll-destructive-actions';
export const PUBLIC_CREATOR_OWNED_POLL_NAV_LINKS_CLASS =
  'mvp-creator-owned-poll-nav-links';
export const PUBLIC_CREATOR_OWNED_POLL_FEEDBACK_CLASS =
  'mvp-creator-owned-poll-feedback';

/** @typedef {'primary' | 'secondary' | 'destructive'} CreatorLifecycleActionGroup */

/**
 * @param {'cancel' | 'close' | 'unpublish'} action
 * @returns {CreatorLifecycleActionGroup}
 */
export function lifecycleActionGroupForTransition(action) {
  if (action === 'close') {
    return 'primary';
  }
  if (action === 'cancel' || action === 'unpublish') {
    return 'destructive';
  }
  return 'secondary';
}

/**
 * @param {Document} documentObject
 */
export function createCreatorOwnedPollActionArea(documentObject) {
  const area = documentObject.createElement('section');
  area.className = PUBLIC_CREATOR_OWNED_POLL_ACTION_AREA_CLASS;
  area.setAttribute('role', 'region');
  area.setAttribute('aria-label', '問卷操作');

  const hint = documentObject.createElement('div');
  hint.className = PUBLIC_CREATOR_OWNED_POLL_LIFECYCLE_HINT_CLASS;

  const primary = documentObject.createElement('div');
  primary.className = `${PUBLIC_CREATOR_OWNED_POLL_PRIMARY_ACTIONS_CLASS} mvp-creator-lifecycle-toolbar`;
  primary.setAttribute('data-demo-feedback-host', 'true');

  const secondary = documentObject.createElement('div');
  secondary.className = `${PUBLIC_CREATOR_OWNED_POLL_SECONDARY_ACTIONS_CLASS} mvp-creator-lifecycle-toolbar`;
  secondary.setAttribute('data-demo-feedback-host', 'true');

  const destructive = documentObject.createElement('div');
  destructive.className = `${PUBLIC_CREATOR_OWNED_POLL_DESTRUCTIVE_ACTIONS_CLASS} mvp-creator-lifecycle-toolbar mvp-creator-owned-poll-destructive-toolbar`;
  destructive.setAttribute('data-demo-feedback-host', 'true');

  const navLinks = documentObject.createElement('div');
  navLinks.className = PUBLIC_CREATOR_OWNED_POLL_NAV_LINKS_CLASS;

  const feedback = documentObject.createElement('p');
  feedback.className = `mvp-demo-action-feedback ${PUBLIC_CREATOR_OWNED_POLL_FEEDBACK_CLASS}`;
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-live', 'polite');

  area.append(hint);
  area.append(primary);
  area.append(secondary);
  area.append(destructive);
  area.append(navLinks);
  area.append(feedback);

  return {
    area,
    hint,
    primary,
    secondary,
    destructive,
    navLinks,
    feedback,
  };
}

/**
 * @param {Document} documentObject
 * @param {{
 *   title: string;
 *   statusElement: HTMLElement;
 *   metaElement?: HTMLElement | null;
 * }} options
 */
export function buildCreatorOwnedPollHeader(documentObject, { title, statusElement, metaElement }) {
  const header = documentObject.createElement('header');
  header.className = PUBLIC_CREATOR_OWNED_POLL_HEADER_CLASS;

  const heading = documentObject.createElement('h3');
  heading.className = 'mvp-creator-lifecycle-title';
  heading.textContent = title;
  header.append(heading);

  appendPublicPollCardStatusRow(documentObject, header, {
    statusElement,
  });

  if (metaElement) {
    header.append(metaElement);
  }

  return header;
}

/**
 * @param {{
 *   hint?: HTMLElement | null;
 *   primary?: HTMLElement | null;
 *   secondary?: HTMLElement | null;
 *   destructive?: HTMLElement | null;
 *   navLinks?: HTMLElement | null;
 *   feedback?: HTMLElement | null;
 * }} hosts
 */
export function clearCreatorOwnedPollActionHosts(hosts) {
  for (const host of [
    hosts.hint,
    hosts.primary,
    hosts.secondary,
    hosts.destructive,
    hosts.navLinks,
  ]) {
    if (host && typeof host.replaceChildren === 'function') {
      host.replaceChildren();
    }
  }
  if (hosts.feedback) {
    hosts.feedback.textContent = '';
  }
}
