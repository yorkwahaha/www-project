import {
  PUBLIC_CTA_CREATE_POLL_NAV_LABEL,
  PUBLIC_CTA_EXPLORE_LABEL,
  PUBLIC_HOME_COLLECTING_CARD_TOOLTIP,
  PUBLIC_HOME_COLLECTING_HIDDEN_CARD_HEADING,
  PUBLIC_HOME_HERO_LEAD,
  PUBLIC_HOME_LOCK_PERIOD_CARD_HEADING,
  PUBLIC_HOME_PAGE_TITLE,
  PUBLIC_HOME_QUALITY_FEEDBACK_CARD_HEADING,
  PUBLIC_HOME_SAMPLE_POLLS_SECTION_TITLE,
  PUBLIC_HOME_TRUST_COLLECTING_HIDDEN_ITEM,
  PUBLIC_HOME_TRUST_DEADLINE_REVEAL_ITEM,
  PUBLIC_HOME_TRUST_LOCK_PERIOD_ITEM,
  PUBLIC_HOME_VALUE_COLLECTING_HIDDEN_BODY,
  PUBLIC_HOME_VALUE_LOCK_PERIOD_BODY,
  PUBLIC_HOME_VALUE_QUALITY_FEEDBACK_BODY,
} from './public-mvp-ui.js';

export const HOME_PAGE_TITLE = PUBLIC_HOME_PAGE_TITLE;
export const HOME_HERO_LEAD = PUBLIC_HOME_HERO_LEAD;
export const HOME_SAMPLE_POLLS_SECTION_TITLE = PUBLIC_HOME_SAMPLE_POLLS_SECTION_TITLE;
export const HOME_COLLECTING_HIDDEN_CARD_HEADING = PUBLIC_HOME_COLLECTING_HIDDEN_CARD_HEADING;
export const HOME_LOCK_PERIOD_CARD_HEADING = PUBLIC_HOME_LOCK_PERIOD_CARD_HEADING;
export const HOME_QUALITY_FEEDBACK_CARD_HEADING = PUBLIC_HOME_QUALITY_FEEDBACK_CARD_HEADING;

/**
 * @param {Document} documentObject
 */
export function syncHomePageSectionHeadings(documentObject) {
  if (typeof documentObject.getElementById !== 'function') {
    return;
  }
  const homeHeading = documentObject.getElementById('home-heading');
  if (homeHeading) {
    homeHeading.textContent = PUBLIC_HOME_PAGE_TITLE;
  }
  const sampleSection = documentObject.querySelector('.mvp-section-title');
  if (sampleSection) {
    sampleSection.textContent = PUBLIC_HOME_SAMPLE_POLLS_SECTION_TITLE;
  }
  const valueCards = documentObject.querySelectorAll('.mvp-value-grid .mvp-value-card h3');
  if (valueCards[0]) {
    valueCards[0].textContent = PUBLIC_HOME_COLLECTING_HIDDEN_CARD_HEADING;
  }
  if (valueCards[1]) {
    valueCards[1].textContent = PUBLIC_HOME_LOCK_PERIOD_CARD_HEADING;
  }
  if (valueCards[2]) {
    valueCards[2].textContent = PUBLIC_HOME_QUALITY_FEEDBACK_CARD_HEADING;
  }
}

/**
 * @param {Document} documentObject
 */
export function syncHomePageLeadParagraphs(documentObject) {
  if (typeof documentObject.getElementById !== 'function') {
    return;
  }
  const heroLead = documentObject.getElementById('home-hero-lead');
  if (heroLead) {
    heroLead.textContent = PUBLIC_HOME_HERO_LEAD;
  }
}

/**
 * @param {Document} documentObject
 */
export function syncHomePageSupportingNotes(documentObject) {
  if (typeof documentObject.querySelector !== 'function') {
    return;
  }
  const valueBodies = documentObject.querySelectorAll('.mvp-value-grid .mvp-value-card p');
  if (valueBodies[0]) {
    valueBodies[0].textContent = PUBLIC_HOME_VALUE_COLLECTING_HIDDEN_BODY;
  }
  if (valueBodies[1]) {
    valueBodies[1].textContent = PUBLIC_HOME_VALUE_LOCK_PERIOD_BODY;
  }
  if (valueBodies[2]) {
    valueBodies[2].textContent = PUBLIC_HOME_VALUE_QUALITY_FEEDBACK_BODY;
  }
}

/**
 * @param {Document} documentObject
 */
export function syncHomePageMicrocopy(documentObject) {
  if (typeof documentObject.querySelector !== 'function') {
    return;
  }
  const trustItems = documentObject.querySelectorAll('.mvp-trust-row li');
  if (trustItems[0]) {
    trustItems[0].textContent = PUBLIC_HOME_TRUST_COLLECTING_HIDDEN_ITEM;
  }
  if (trustItems[1]) {
    trustItems[1].textContent = PUBLIC_HOME_TRUST_DEADLINE_REVEAL_ITEM;
  }
  if (trustItems[2]) {
    trustItems[2].textContent = PUBLIC_HOME_TRUST_LOCK_PERIOD_ITEM;
  }
  const collectingTip = documentObject.querySelector('.mvp-help-tip');
  if (collectingTip) {
    collectingTip.textContent = PUBLIC_HOME_COLLECTING_CARD_TOOLTIP;
  }
}

/**
 * @param {Document} documentObject
 */
export function syncHomePageCtas(documentObject) {
  if (typeof documentObject.getElementById !== 'function') {
    return;
  }
  const exploreLink = documentObject.getElementById('home-explore-cta');
  if (exploreLink) {
    exploreLink.textContent = PUBLIC_CTA_EXPLORE_LABEL;
  }
  const createLink = documentObject.getElementById('home-create-cta');
  if (createLink) {
    createLink.textContent = PUBLIC_CTA_CREATE_POLL_NAV_LABEL;
  }
}

if (typeof document !== 'undefined') {
  syncHomePageSectionHeadings(document);
  syncHomePageLeadParagraphs(document);
  syncHomePageSupportingNotes(document);
  syncHomePageMicrocopy(document);
  syncHomePageCtas(document);
}
