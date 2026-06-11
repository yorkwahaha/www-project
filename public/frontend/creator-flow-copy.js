/**
 * Phase 59 — live public MVP creator flow copy (Traditional Chinese).
 * No option_id, counters, or vote linkage in storage or DOM payloads.
 */

import { POLICY_UI_COPY } from './policy-ui-placeholders.js';
import {
  buildAbsoluteUrl,
  buildPublicResultPath,
  buildPublicVotePath,
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
  createSuccessLead:
    '問卷已建立。請先複製並分享「投票連結」給參與者；收集中不顯示票數或百分比。',
  createSuccessManage:
    '可在下方變更問卷狀態，或前往「我的問卷」與「結果頁（發起者）」繼續管理。',
  myPollsEmpty: PUBLIC_MY_POLLS_EMPTY_HEADLINE,
  myPollsLead:
    '以下為發起者工作階段可管理的問卷。可分享投票連結、查看結果，或變更公開狀態。',
  resultsCreatorLead:
    '發起者操作區：須先「結束收集並公開結果」後，上方才會顯示公開的區間化統計。',
  lifecycleLeadCollecting:
    '收集中不顯示票數。請分享投票連結邀請參與；若要公開統計，請使用「結束收集並公開結果」。',
  lifecycleLeadPostLock:
    '公開鎖定期已結束。若要讓訪客無法再查看公開結果，可使用「下架問卷」。',
  actionCancel:
    '取消問卷：停止收集，不產生公開彙總結果，且無法恢復為收集中。',
  actionClose:
    '結束收集並公開結果：顯示區間化統計，並進入公開鎖定期（鎖定期內不可下架、修改或刪除）。',
  actionUnpublish:
    '下架問卷：訪客將無法再查看公開結果頁（須已過公開鎖定期）。',
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
  voteUrlHint.textContent = `投票頁完整網址：${buildAbsoluteUrl(buildPublicVotePath(pollId), locationObject)}`;
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
