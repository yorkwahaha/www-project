import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const PUBLIC_COPY_SURFACES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/public-mvp-home.js',
  'public/frontend/explore-page.js',
  'public/frontend/login-page.js',
  'public/frontend/registration-page.js',
  'public/frontend/profile-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/vote-page.js',
  'public/frontend/quality-feedback-badge.js',
];

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters|creator_token/i;

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 197 public MVP copy and layout consistency polish', () => {
  it('exports aligned CTA and page brand constants', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(publicUi.PUBLIC_CTA_GO_TO_REGISTER_FROM_PROFILE_LABEL).toBe(
      '尚未註冊？建立帳號',
    );
    expect(publicUi.PUBLIC_VOTE_PAGE_BRAND_LABEL).toBe('參與投票');
    expect(publicUi.PUBLIC_CTA_LINK_LABELS).toContain(
      publicUi.PUBLIC_CTA_GO_TO_REGISTER_FROM_PROFILE_LABEL,
    );
  });

  it('keeps syncLoginPageCtas and syncRegistrationPageCtas on shared constants', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const login = await loadModule('public/frontend/login-page.js');
    const registration = await loadModule('public/frontend/registration-page.js');

    const submit = { textContent: '' };
    const registerLink = { textContent: '' };
    const homeLink = { textContent: '' };

    login.syncLoginPageCtas({
      getElementById: (id: string) => {
        if (id === 'login-shell-submit') {
          return submit;
        }
        if (id === 'login-register-cta') {
          return registerLink;
        }
        if (id === 'login-home-cta') {
          return homeLink;
        }
        return null;
      },
    });
    expect(submit.textContent).toBe(publicUi.PUBLIC_CTA_SIGN_IN_LABEL);
    expect(registerLink.textContent).toBe(publicUi.PUBLIC_CTA_CREATE_ACCOUNT_LABEL);
    expect(homeLink.textContent).toBe(publicUi.PUBLIC_CTA_GO_HOME_LABEL);

    const regSubmit = { textContent: '' };
    const formLoginLink = { textContent: '' };
    const successLoginLink = { textContent: '' };
    const successHomeLink = { textContent: '' };
    registration.syncRegistrationPageCtas({
      getElementById: (id: string) => {
        if (id === 'registration-submit') {
          return regSubmit;
        }
        if (id === 'registration-login-cta') {
          return formLoginLink;
        }
        if (id === 'registration-success-login-cta') {
          return successLoginLink;
        }
        if (id === 'registration-success-home-cta') {
          return successHomeLink;
        }
        return null;
      },
    });
    expect(regSubmit.textContent).toBe(publicUi.PUBLIC_CTA_REGISTER_LABEL);
    expect(formLoginLink.textContent).toBe(
      publicUi.PUBLIC_CTA_GO_TO_LOGIN_FROM_REGISTRATION_LABEL,
    );
    expect(successLoginLink.textContent).toBe(publicUi.PUBLIC_CTA_GO_TO_LOGIN_LABEL);
    expect(successHomeLink.textContent).toBe(publicUi.PUBLIC_CTA_GO_HOME_LABEL);
  });

  it('keeps syncProfilePageCtas and syncExplorePageLeadLinks on shared constants', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const profile = await loadModule('public/frontend/profile-page.js');
    const explore = await loadModule('public/frontend/explore-page.js');

    const brand = { textContent: '' };
    const loginLink = { textContent: '' };
    const registerLink = { textContent: '' };
    profile.syncProfilePageCtas({
      getElementById: (id: string) => {
        if (id === 'profile-login-cta') {
          return loginLink;
        }
        if (id === 'profile-register-cta') {
          return registerLink;
        }
        return null;
      },
      querySelector: (selector: string) =>
        selector === '.mvp-profile-shell .mvp-brand' ? brand : null,
    });
    expect(brand.textContent).toBe(publicUi.PUBLIC_CTA_PROFILE_NAV_LABEL);
    expect(loginLink.textContent).toBe(publicUi.PUBLIC_CTA_GO_TO_LOGIN_LABEL);
    expect(registerLink.textContent).toBe(
      publicUi.PUBLIC_CTA_GO_TO_REGISTER_FROM_PROFILE_LABEL,
    );

    const homeLink = { textContent: '' };
    const statusRegion = { textContent: '' };
    explore.syncExplorePageLeadLinks({
      getElementById: (id: string) => (id === 'explore-home-cta' ? homeLink : null),
    });
    explore.syncExplorePageStatusCopy({
      getElementById: (id: string) => (id === 'explore-status' ? statusRegion : null),
    });
    expect(homeLink.textContent).toBe(publicUi.PUBLIC_CTA_GO_HOME_LABEL);
    expect(statusRegion.textContent).toBe(explore.EXPLORE_FEED_LOADING_MESSAGE);
  });

  it('keeps syncHomePageCtas and vote page brand sync on shared constants', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const home = await loadModule('public/frontend/public-mvp-home.js');
    const vote = await loadModule('public/frontend/vote-page.js');

    const exploreLink = { textContent: '' };
    const createLink = { textContent: '' };
    home.syncHomePageCtas({
      getElementById: (id: string) => {
        if (id === 'home-explore-cta') {
          return exploreLink;
        }
        if (id === 'home-create-cta') {
          return createLink;
        }
        return null;
      },
    });
    expect(exploreLink.textContent).toBe(publicUi.PUBLIC_CTA_EXPLORE_LABEL);
    expect(createLink.textContent).toBe(publicUi.PUBLIC_CTA_CREATE_POLL_NAV_LABEL);

    const pageBrand = { textContent: '' };
    vote.syncVotePageSectionHeadings({
      getElementById: () => null,
      querySelector: (selector: string) =>
        selector === '.mvp-vote-main > p.mvp-brand' ? pageBrand : null,
    });
    expect(pageBrand.textContent).toBe(publicUi.PUBLIC_VOTE_PAGE_BRAND_LABEL);
  });

  it('uses mvp-page-intro wrappers on explore and my-polls shells', async () => {
    const exploreHtml = await readFile(join(process.cwd(), 'public/explore.html'), 'utf8');
    const myPollsHtml = await readFile(join(process.cwd(), 'public/my-polls.html'), 'utf8');

    expect(exploreHtml).toContain('class="mvp-page-intro"');
    expect(exploreHtml).toContain('id="explore-heading"');
    expect(myPollsHtml).toContain('class="mvp-page-intro"');
    expect(myPollsHtml).toContain('id="my-polls-heading"');
  });

  it('preserves quality_badge behavior unchanged', async () => {
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');

    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    for (const poll of [
      { quality_badge: null },
      {},
      { quality_badge: 'low_quality' },
      { quality_badge: 'unknown' },
    ]) {
      expect(badge.shouldRenderQualityFeedbackBadge(poll)).toBe(false);
      expect(badge.renderQualityFeedbackBadge({ createElement: () => ({}) }, poll)).toBeNull();
    }
  });

  it('keeps polish surfaces free of forbidden internal or outcome copy', async () => {
    for (const relativePath of PUBLIC_COPY_SURFACES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      const stripped = source
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/.*$/gm, '$1');
      expect(stripped, relativePath).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(stripped, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }
  });
});
