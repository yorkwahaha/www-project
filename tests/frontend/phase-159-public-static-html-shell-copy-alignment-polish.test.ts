import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const ALIGNED_HTML_SHELLS = [
  'public/index.html',
  'public/explore.html',
  'public/login.html',
  'public/registration.html',
  'public/profile.html',
  'public/create-poll.html',
  'public/my-polls.html',
  'public/vote.html',
  'public/results.html',
  'public/faq.html',
  'public/trust-levels.html',
];

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters|creator_token/i;

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 159 public static HTML shell copy alignment polish', () => {
  it('aligns login shell form ready hint with PUBLIC_LOGIN_FORM_READY_HINT', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const login = await loadModule('public/frontend/login-page.js');
    const loginHtml = await readFile(join(process.cwd(), 'public/login.html'), 'utf8');

    expect(loginHtml).toContain('id="login-form-ready-hint"');

    const formReadyHint = { textContent: '' };
    login.syncLoginFormFieldCopy({
      getElementById: (id: string) => (id === 'login-form-ready-hint' ? formReadyHint : null),
      querySelector: () => null,
    });
    expect(formReadyHint.textContent).toBe(publicUi.PUBLIC_LOGIN_FORM_READY_HINT);
  });

  it('aligns registration success shell with PUBLIC_REGISTRATION_SUCCESS_MESSAGE', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const registration = await loadModule('public/frontend/registration-page.js');
    const registrationHtml = await readFile(
      join(process.cwd(), 'public/registration.html'),
      'utf8',
    );

    expect(registrationHtml).toContain('id="registration-success-message"');
    expect(registrationHtml).toContain(publicUi.PUBLIC_REGISTRATION_SUCCESS_MESSAGE);

    const successMessage = { textContent: '' };
    registration.syncRegistrationSuccessCopy({
      getElementById: (id: string) =>
        id === 'registration-success-message' ? successMessage : null,
    });
    expect(successMessage.textContent).toBe(publicUi.PUBLIC_REGISTRATION_SUCCESS_MESSAGE);
  });

  it('aligns profile unauthenticated shell with PUBLIC_PROFILE_VIEW_SIGN_IN_REQUIRED_MESSAGE', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const profile = await loadModule('public/frontend/profile-page.js');
    const profileHtml = await readFile(join(process.cwd(), 'public/profile.html'), 'utf8');

    expect(profileHtml).toContain('id="profile-unauth-message"');
    expect(profileHtml).toContain(publicUi.PUBLIC_PROFILE_VIEW_SIGN_IN_REQUIRED_MESSAGE);

    const unauthMessage = { textContent: '' };
    profile.syncProfilePageLeadParagraphs({
      getElementById: (id: string) => {
        if (id === 'profile-unauth-message') return unauthMessage;
        return null;
      },
    });
    expect(unauthMessage.textContent).toBe(publicUi.PUBLIC_PROFILE_VIEW_SIGN_IN_REQUIRED_MESSAGE);
  });

  it('aligns my-polls demo locked row and creator side note with shared constants', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const myPollsHtml = await readFile(join(process.cwd(), 'public/my-polls.html'), 'utf8');

    expect(myPollsHtml).toContain(publicUi.PUBLIC_MY_POLLS_LOCKED_ROW_INLINE_NOTE);
    expect(myPollsHtml).toContain('id="my-polls-creator-side-note"');

    const sidePanelNote = { textContent: '' };
    myPolls.syncMyPollsPageSectionHeadings({
      querySelector: () => null,
      getElementById: (id: string) =>
        id === 'my-polls-creator-side-note' ? sidePanelNote : null,
    });
    expect(sidePanelNote.textContent).toBe(publicUi.PUBLIC_HOME_VALUE_COLLECTING_HIDDEN_BODY);
  });

  it('aligns create-poll policy list with PUBLIC_CREATE_POLL_PAGE_LEAD wording', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const createPollHtml = await readFile(join(process.cwd(), 'public/create-poll.html'), 'utf8');

    expect(publicUi.PUBLIC_CREATE_POLL_PAGE_LEAD).toContain('收集中看不到期中票數或百分比');
    expect(createPollHtml).toContain('id="create-poll-page-lead"');
  });

  it('aligns vote collecting notice with PUBLIC_HOME_VALUE_COLLECTING_HIDDEN_BODY', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const votePage = await loadModule('public/frontend/vote-page.js');
    const voteHtml = await readFile(join(process.cwd(), 'public/vote.html'), 'utf8');

    expect(voteHtml).toContain('id="vote-collecting-notice-body"');
    expect(voteHtml).toContain('發起者也看不到期中統計');
    expect(voteHtml).not.toContain('發起者亦同');

    const collectingBody = { textContent: '' };
    votePage.syncVotePageSectionHeadings({
      querySelector: () => null,
      getElementById: (id: string) =>
        id === 'vote-collecting-notice-body' ? collectingBody : null,
    });
    expect(collectingBody.textContent).toBe(publicUi.PUBLIC_HOME_VALUE_COLLECTING_HIDDEN_BODY);
  });

  it('aligns results demo readonly title in shell sync for /results/demo', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const results = await loadModule('public/frontend/result-page.js');

    const pageTitle = { textContent: '', getAttribute: () => null };
    const brand = { textContent: '' };
    results.syncResultsPageSectionHeadings(
      {
        getElementById: (id: string) => (id === 'page-title' ? pageTitle : null),
        querySelector: (selector: string) =>
          selector === '#main-content > p.mvp-brand' ? brand : null,
      },
      { location: { pathname: '/results/demo' } },
    );
    expect(pageTitle.textContent).toBe(publicUi.PUBLIC_RESULTS_DEMO_READONLY_TITLE);
    expect(brand.textContent).toBe(publicUi.PUBLIC_RESULTS_DEMO_READONLY_TITLE);
  });

  it('aligns faq and trust-levels summary copy with homepage PUBLIC_* headings', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const faqHtml = await readFile(join(process.cwd(), 'public/faq.html'), 'utf8');
    const trustHtml = await readFile(join(process.cwd(), 'public/trust-levels.html'), 'utf8');

    expect(faqHtml).toContain(publicUi.PUBLIC_HOME_COLLECTING_HIDDEN_CARD_HEADING);
    expect(faqHtml).not.toContain('<h3>收集中不顯示結果</h3>');
    expect(trustHtml).toContain('發起者也看不到期中統計');
    expect(trustHtml).not.toContain('發起者亦同');
  });

  for (const relativePath of ALIGNED_HTML_SHELLS) {
    it(`keeps aligned static shell copy neutral in ${relativePath}`, async () => {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    });
  }
});
