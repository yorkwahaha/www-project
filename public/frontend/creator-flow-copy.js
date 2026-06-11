/**
 * Phase 59 — live public MVP creator flow copy (Traditional Chinese).
 * No option_id, counters, or vote linkage in storage or DOM payloads.
 */

import { POLICY_UI_COPY } from './policy-ui-placeholders.js';
import {
  buildAbsoluteUrl,
  buildPublicResultPath,
  buildPublicVotePath,
  PUBLIC_CREATOR_ACTION_CANCEL_HINT,
  PUBLIC_CREATOR_ACTION_CLOSE_HINT,
  PUBLIC_CREATOR_ACTION_UNPUBLISH_HINT,
  PUBLIC_CREATOR_CREATE_SUCCESS_LEAD_HINT,
  PUBLIC_CREATOR_CREATE_SUCCESS_MANAGE_HINT,
  PUBLIC_CREATOR_LIFECYCLE_COLLECTING_LEAD_HINT,
  PUBLIC_CREATOR_LIFECYCLE_POST_LOCK_LEAD_HINT,
  PUBLIC_CREATOR_MY_POLLS_LEAD_HINT,
  PUBLIC_CREATOR_RESULTS_LEAD_HINT,
  PUBLIC_CREATOR_VOTE_URL_HINT_PREFIX,
  PUBLIC_CTA_CREATOR_RESULTS_LABEL,
  PUBLIC_CTA_MY_POLLS_LABEL,
  PUBLIC_CTA_VOTE_PAGE_SHORT_LABEL,
  PUBLIC_MY_POLLS_EMPTY_HEADLINE,
} from './public-mvp-ui.js';

/** @typedef {'create' | 'manage' | 'results'} CreatorFlowContext */

export const CREATOR_FLOW_VOTE_CTA_LABEL = PUBLIC_CTA_VOTE_PAGE_SHORT_LABEL;
export const CREATOR_FLOW_MY_POLLS_CTA_LABEL = PUBLIC_CTA_MY_POLLS_LABEL;
export const CREATOR_FLOW_RESULTS_CTA_LABEL = PUBLIC_CTA_CREATOR_RESULTS_LABEL;

export const CREATOR_FLOW_COPY = {
  createSuccessLead: PUBLIC_CREATOR_CREATE_SUCCESS_LEAD_HINT,
  createSuccessManage: PUBLIC_CREATOR_CREATE_SUCCESS_MANAGE_HINT,
  myPollsEmpty: PUBLIC_MY_POLLS_EMPTY_HEADLINE,
  myPollsLead: PUBLIC_CREATOR_MY_POLLS_LEAD_HINT,
  resultsCreatorLead: PUBLIC_CREATOR_RESULTS_LEAD_HINT,
  lifecycleLeadCollecting: PUBLIC_CREATOR_LIFECYCLE_COLLECTING_LEAD_HINT,
  lifecycleLeadPostLock: PUBLIC_CREATOR_LIFECYCLE_POST_LOCK_LEAD_HINT,
  actionCancel: PUBLIC_CREATOR_ACTION_CANCEL_HINT,
  actionClose: PUBLIC_CREATOR_ACTION_CLOSE_HINT,
  actionUnpublish: PUBLIC_CREATOR_ACTION_UNPUBLISH_HINT,
  whenResultsPublic: POLICY_UI_COPY.collectingRevealHint,
};

/**
 * @param {HTMLElement} parent
 * @param {string} tagName
 * @param {string} text
 * @param {string} className
 */
function appendText(parent, tagName, text, className) {
  const element = parent.ownerDocument.createElement(tagName);
  element.className = className;
  element.textContent = text;
  parent.append(element);
}

/**
 * @param {HTMLElement} host
 * @param {string} lifecycleState
 */
export function renderCreatorActionGuide(host, lifecycleState) {
  const lines = [];
  if (lifecycleState === 'collecting') {
    lines.push(CREATOR_FLOW_COPY.actionCancel, CREATOR_FLOW_COPY.actionClose);
    lines.push(CREATOR_FLOW_COPY.whenResultsPublic);
  } else if (lifecycleState === 'post_lock') {
    lines.push(CREATOR_FLOW_COPY.actionUnpublish);
  }
  if (lines.length === 0) {
    return;
  }

  const guide = host.ownerDocument.createElement('div');
  guide.className = 'mvp-creator-flow-guide';
  guide.setAttribute('role', 'note');
  guide.setAttribute('aria-label', '發起者操作說明');

  appendText(guide, 'h3', '操作說明', 'mvp-creator-flow-guide-title');
  const list = host.ownerDocument.createElement('ul');
  list.className = 'mvp-creator-flow-guide-list';
  for (const line of lines) {
    const item = host.ownerDocument.createElement('li');
    item.className = 'mvp-meta';
    item.textContent = line;
    list.append(item);
  }
  guide.append(list);
  host.append(guide);
}

/**
 * @param {HTMLElement} host
 * @param {CreatorFlowContext} flowContext
 */
export function lifecycleLeadForContext(flowContext, lifecycleState) {
  if (flowContext === 'create') {
    return CREATOR_FLOW_COPY.lifecycleLeadCollecting;
  }
  if (flowContext === 'results') {
    return CREATOR_FLOW_COPY.resultsCreatorLead;
  }
  if (lifecycleState === 'post_lock') {
    return CREATOR_FLOW_COPY.lifecycleLeadPostLock;
  }
  return CREATOR_FLOW_COPY.lifecycleLeadCollecting;
}

/**
 * @param {HTMLElement} host
 * @param {{ pollId: string; locationObject?: Location }} options
 */
export function renderCreatorManageLinks(host, { pollId, locationObject = globalThis.location }) {
  const links = host.ownerDocument.createElement('p');
  links.className = 'mvp-meta mvp-creator-flow-links';

  const vote = host.ownerDocument.createElement('a');
  vote.className = 'mvp-action-link mvp-creator-flow-link';
  vote.href = buildPublicVotePath(pollId);
  vote.textContent = PUBLIC_CTA_VOTE_PAGE_SHORT_LABEL;

  const myPolls = host.ownerDocument.createElement('a');
  myPolls.className = 'mvp-action-link mvp-creator-flow-link';
  myPolls.href = '/my-polls?live=1';
  myPolls.textContent = PUBLIC_CTA_MY_POLLS_LABEL;

  const results = host.ownerDocument.createElement('a');
  results.className = 'mvp-action-link mvp-action-link-muted';
  results.href = `${buildPublicResultPath(pollId)}?creator=1`;
  results.textContent = PUBLIC_CTA_CREATOR_RESULTS_LABEL;

  links.append(vote);
  links.append(myPolls);
  links.append(results);
  host.append(links);

  const voteUrlHint = host.ownerDocument.createElement('p');
  voteUrlHint.className = 'mvp-meta mvp-creator-flow-vote-url';
  voteUrlHint.textContent = `${PUBLIC_CREATOR_VOTE_URL_HINT_PREFIX}${buildAbsoluteUrl(buildPublicVotePath(pollId), locationObject)}`;
  host.append(voteUrlHint);
}

/**
 * @param {HTMLElement} host
 */
export function renderCreateSuccessFlowGuide(host) {
  const block = host.ownerDocument.createElement('section');
  block.className = 'mvp-creator-flow-next-steps';
  block.setAttribute('role', 'note');
  block.setAttribute('aria-label', '建立成功後的下一步');

  appendText(block, 'h3', '下一步', 'mvp-creator-flow-next-steps-title');
  appendText(block, 'p', CREATOR_FLOW_COPY.createSuccessLead, 'mvp-meta');
  appendText(block, 'p', CREATOR_FLOW_COPY.createSuccessManage, 'mvp-meta');

  host.append(block);
}
