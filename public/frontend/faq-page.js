import {
  PUBLIC_FAQ_ACCOUNT_FLOW_INTRO,
  PUBLIC_FAQ_ACCOUNT_FLOW_LOGIN_STEP,
  PUBLIC_FAQ_ACCOUNT_FLOW_PROFILE_STEP,
  PUBLIC_FAQ_COLLECTING_HIDDEN_LEAD,
  PUBLIC_FAQ_COLLECTING_HIDDEN_PURPOSE,
  PUBLIC_FAQ_CREATOR_FLOW_DEMO_STEP,
  PUBLIC_FAQ_CREATOR_FLOW_LIVE_STEP,
  PUBLIC_FAQ_CREATOR_FLOW_MY_POLLS_STEP,
  PUBLIC_FAQ_ELIGIBILITY_FAILURE_REFERENCE_NOTE,
  PUBLIC_FAQ_PAGE_HERO_LEAD,
  PUBLIC_FAQ_PARTICIPANT_COLLECTING_STEP,
  PUBLIC_FAQ_PARTICIPANT_DEMO_STEP,
  PUBLIC_FAQ_PARTICIPANT_RESULTS_STEP,
  PUBLIC_FAQ_PARTICIPANT_VOTE_STEP,
  PUBLIC_FAQ_PROFILE_DEMO_BOUNDARY_NOTE,
  PUBLIC_FAQ_PROFILE_ELIGIBILITY_HINT,
  PUBLIC_FAQ_PROFILE_FIELDS_PURPOSE_BODY,
  PUBLIC_FAQ_PROFILE_FIELDS_PURPOSE_LEAD,
} from './public-mvp-ui.js';

function syncTextContent(documentObject, elementId, text) {
  const element = documentObject.getElementById(elementId);
  if (element) {
    element.textContent = text;
  }
}

export function syncFaqPageOnboardingCopy(documentObject) {
  syncTextContent(documentObject, 'faq-page-hero-lead', PUBLIC_FAQ_PAGE_HERO_LEAD);
  syncTextContent(documentObject, 'faq-account-flow-intro', PUBLIC_FAQ_ACCOUNT_FLOW_INTRO);
  syncTextContent(documentObject, 'faq-account-flow-login-step', PUBLIC_FAQ_ACCOUNT_FLOW_LOGIN_STEP);
  syncTextContent(
    documentObject,
    'faq-account-flow-profile-step',
    PUBLIC_FAQ_ACCOUNT_FLOW_PROFILE_STEP,
  );
  syncTextContent(documentObject, 'faq-creator-flow-demo-step', PUBLIC_FAQ_CREATOR_FLOW_DEMO_STEP);
  syncTextContent(documentObject, 'faq-creator-flow-live-step', PUBLIC_FAQ_CREATOR_FLOW_LIVE_STEP);
  syncTextContent(
    documentObject,
    'faq-creator-flow-my-polls-step',
    PUBLIC_FAQ_CREATOR_FLOW_MY_POLLS_STEP,
  );
  syncTextContent(documentObject, 'faq-participant-vote-step', PUBLIC_FAQ_PARTICIPANT_VOTE_STEP);
  syncTextContent(documentObject, 'faq-participant-demo-step', PUBLIC_FAQ_PARTICIPANT_DEMO_STEP);
  syncTextContent(
    documentObject,
    'faq-participant-results-step',
    PUBLIC_FAQ_PARTICIPANT_RESULTS_STEP,
  );
  syncTextContent(
    documentObject,
    'faq-participant-collecting-step',
    PUBLIC_FAQ_PARTICIPANT_COLLECTING_STEP,
  );
  syncTextContent(
    documentObject,
    'faq-profile-fields-purpose-lead',
    PUBLIC_FAQ_PROFILE_FIELDS_PURPOSE_LEAD,
  );
  syncTextContent(
    documentObject,
    'faq-profile-fields-purpose-body',
    PUBLIC_FAQ_PROFILE_FIELDS_PURPOSE_BODY,
  );
  syncTextContent(
    documentObject,
    'faq-profile-eligibility-hint',
    PUBLIC_FAQ_PROFILE_ELIGIBILITY_HINT,
  );
  syncTextContent(
    documentObject,
    'faq-profile-demo-boundary-note',
    PUBLIC_FAQ_PROFILE_DEMO_BOUNDARY_NOTE,
  );
  syncTextContent(documentObject, 'faq-collecting-hidden-lead', PUBLIC_FAQ_COLLECTING_HIDDEN_LEAD);
  syncTextContent(
    documentObject,
    'faq-collecting-hidden-purpose',
    PUBLIC_FAQ_COLLECTING_HIDDEN_PURPOSE,
  );
  syncTextContent(
    documentObject,
    'faq-eligibility-failure-reference-tail',
    PUBLIC_FAQ_ELIGIBILITY_FAILURE_REFERENCE_NOTE,
  );
}

export function bootstrapFaqPage({ documentObject = globalThis.document } = {}) {
  syncFaqPageOnboardingCopy(documentObject);
}

if (typeof document !== 'undefined') {
  bootstrapFaqPage();
}
