import {
  PUBLIC_CTA_CREATE_POLL_NAV_LABEL,
  PUBLIC_CTA_EXPLORE_LABEL,
  PUBLIC_CTA_REGISTER_LABEL,
  PUBLIC_CTA_SIGN_IN_LABEL,
  PUBLIC_HOME_ACCOUNT_FLOW_FORMAL_LEAD,
  PUBLIC_HOME_ACCOUNT_FLOW_LOGIN_NOTE,
  PUBLIC_HOME_ACCOUNT_FLOW_REGISTRATION_NOTE,
  PUBLIC_HOME_COLLECTING_CARD_TOOLTIP,
  PUBLIC_HOME_COLLECTING_HIDDEN_CARD_HEADING,
  PUBLIC_HOME_DEMO_CREATE_POLL_LINK_LABEL,
  PUBLIC_HOME_DEMO_CREATE_POLL_HREF,
  PUBLIC_HOME_PROFILE_HREF,
  PUBLIC_HOME_DEMO_CREATOR_SESSION_NOTE,
  PUBLIC_HOME_DEMO_FLOW_LEAD,
  PUBLIC_HOME_DEMO_PROFILE_VOTE_NOTE,
  PUBLIC_HOME_HERO_LEAD,
  PUBLIC_HOME_LOCK_PERIOD_CARD_HEADING,
  PUBLIC_HOME_MANUAL_QA_DOC_NOTE,
  PUBLIC_HOME_PAGE_TITLE,
  PUBLIC_HOME_QUALITY_FEEDBACK_CARD_HEADING,
  PUBLIC_HOME_SAMPLE_POLLS_EXPLORE_LINK_LABEL,
  PUBLIC_HOME_SAMPLE_POLLS_SECTION_NOTE,
  PUBLIC_HOME_SAMPLE_POLLS_SECTION_TITLE,
  PUBLIC_HOME_STATIC_EXAMPLES_FOOTER_NOTE,
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

/**
 * @param {Document} documentObject
 */
export function syncHomePageSamplePollsSectionNote(documentObject) {
  const note = documentObject.getElementById('home-sample-polls-section-note');
  if (!note || typeof note.replaceChildren !== 'function') {
    return;
  }
  note.replaceChildren();
  const exploreLink = documentObject.createElement('a');
  exploreLink.href = '/explore';
  exploreLink.textContent = PUBLIC_HOME_SAMPLE_POLLS_EXPLORE_LINK_LABEL;
  note.append(
    exploreLink,
    documentObject.createTextNode(PUBLIC_HOME_SAMPLE_POLLS_SECTION_NOTE),
  );
}

/**
 * @param {Document} documentObject
 */
export function syncHomePageStaticExamplesFooterNote(documentObject) {
  const note = documentObject.getElementById('home-static-examples-footer-note');
  if (!note || typeof note.replaceChildren !== 'function') {
    return;
  }
  note.replaceChildren();
  const lead = documentObject.createTextNode('想認識各種問卷狀態？可在');
  const resultsLink = documentObject.createElement('a');
  resultsLink.href = '/results/demo';
  resultsLink.textContent = '結果頁';
  const middle = documentObject.createTextNode(
    '切換「收集中」「公開鎖定期」「已取消」等範例，或查看',
  );
  const faqLink = documentObject.createElement('a');
  faqLink.href = '/faq';
  faqLink.textContent = '常見問題';
  const tail = documentObject.createTextNode('。');
  note.append(lead, resultsLink, middle, faqLink, tail);
}

/**
 * @param {Document} documentObject
 */
export function syncHomePageAccountFlowNote(documentObject) {
  const note = documentObject.getElementById('home-account-flow-note');
  if (!note || typeof note.replaceChildren !== 'function') {
    return;
  }
  note.replaceChildren();

  const registrationLink = documentObject.createElement('a');
  registrationLink.href = '/registration';
  registrationLink.textContent = PUBLIC_CTA_REGISTER_LABEL;

  const loginLink = documentObject.createElement('a');
  loginLink.href = '/login';
  loginLink.textContent = PUBLIC_CTA_SIGN_IN_LABEL;

  const createPollLink = documentObject.createElement('a');
  createPollLink.href = PUBLIC_HOME_DEMO_CREATE_POLL_HREF;
  createPollLink.textContent = PUBLIC_HOME_DEMO_CREATE_POLL_LINK_LABEL;

  const profileLink = documentObject.createElement('a');
  profileLink.href = PUBLIC_HOME_PROFILE_HREF;
  profileLink.textContent = '個人資料';

  const creatorSessionCode = documentObject.createElement('code');
  creatorSessionCode.textContent = 'creator_session';

  const userIdCode = documentObject.createElement('code');
  userIdCode.textContent = 'X-User-Id';

  note.append(
    documentObject.createTextNode(PUBLIC_HOME_ACCOUNT_FLOW_FORMAL_LEAD),
    registrationLink,
    documentObject.createTextNode(`（${PUBLIC_HOME_ACCOUNT_FLOW_REGISTRATION_NOTE}）· `),
    loginLink,
    documentObject.createTextNode(`（${PUBLIC_HOME_ACCOUNT_FLOW_LOGIN_NOTE}）。 `),
    documentObject.createTextNode(`${PUBLIC_HOME_DEMO_FLOW_LEAD}`),
    createPollLink,
    documentObject.createTextNode(' '),
    creatorSessionCode,
    documentObject.createTextNode(` ${PUBLIC_HOME_DEMO_CREATOR_SESSION_NOTE} `),
    profileLink,
    documentObject.createTextNode('／投票用 MVP '),
    userIdCode,
    documentObject.createTextNode(`。${PUBLIC_HOME_MANUAL_QA_DOC_NOTE}`),
  );
}

/**
 * @param {Document} documentObject
 */
export function syncHomePageOnboardingCopy(documentObject) {
  syncHomePageSectionHeadings(documentObject);
  syncHomePageLeadParagraphs(documentObject);
  syncHomePageSupportingNotes(documentObject);
  syncHomePageMicrocopy(documentObject);
  syncHomePageCtas(documentObject);
  syncHomePageSamplePollsSectionNote(documentObject);
  syncHomePageStaticExamplesFooterNote(documentObject);
  syncHomePageAccountFlowNote(documentObject);
}

if (typeof document !== 'undefined') {
  syncHomePageSectionHeadings(document);
  syncHomePageLeadParagraphs(document);
  syncHomePageSupportingNotes(document);
  syncHomePageMicrocopy(document);
  syncHomePageCtas(document);
  syncHomePageSamplePollsSectionNote(document);
  syncHomePageStaticExamplesFooterNote(document);
  syncHomePageAccountFlowNote(document);
}
