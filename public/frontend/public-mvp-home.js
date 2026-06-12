import {
  PUBLIC_HOME_COLLECTING_HIDDEN_CARD_HEADING,
  PUBLIC_HOME_HERO_LEAD,
  PUBLIC_HOME_LOCK_PERIOD_CARD_HEADING,
  PUBLIC_HOME_PAGE_TITLE,
  PUBLIC_HOME_QUALITY_FEEDBACK_CARD_HEADING,
  PUBLIC_HOME_SAMPLE_POLLS_SECTION_TITLE,
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

if (typeof document !== 'undefined') {
  syncHomePageSectionHeadings(document);
  syncHomePageLeadParagraphs(document);
}
