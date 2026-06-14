import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const PHASE_197_CTA_BINDINGS = [
  {
    shell: 'public/login.html',
    id: 'login-shell-submit',
    module: 'public/frontend/login-page.js',
    syncFn: 'syncLoginPageCtas',
    constant: 'PUBLIC_CTA_SIGN_IN_LABEL',
    expectedLabel: '登入',
  },
  {
    shell: 'public/login.html',
    id: 'login-register-cta',
    module: 'public/frontend/login-page.js',
    syncFn: 'syncLoginPageCtas',
    constant: 'PUBLIC_CTA_CREATE_ACCOUNT_LABEL',
  },
  {
    shell: 'public/login.html',
    id: 'login-home-cta',
    module: 'public/frontend/login-page.js',
    syncFn: 'syncLoginPageCtas',
    constant: 'PUBLIC_CTA_GO_HOME_LABEL',
  },
  {
    shell: 'public/registration.html',
    id: 'registration-submit',
    module: 'public/frontend/registration-page.js',
    syncFn: 'syncRegistrationPageCtas',
    constant: 'PUBLIC_CTA_REGISTER_LABEL',
    expectedLabel: '註冊',
  },
  {
    shell: 'public/registration.html',
    id: 'registration-login-cta',
    module: 'public/frontend/registration-page.js',
    syncFn: 'syncRegistrationPageCtas',
    constant: 'PUBLIC_CTA_GO_TO_LOGIN_FROM_REGISTRATION_LABEL',
  },
  {
    shell: 'public/registration.html',
    id: 'registration-success-login-cta',
    module: 'public/frontend/registration-page.js',
    syncFn: 'syncRegistrationPageCtas',
    constant: 'PUBLIC_CTA_GO_TO_LOGIN_LABEL',
  },
  {
    shell: 'public/registration.html',
    id: 'registration-success-home-cta',
    module: 'public/frontend/registration-page.js',
    syncFn: 'syncRegistrationPageCtas',
    constant: 'PUBLIC_CTA_GO_HOME_LABEL',
  },
  {
    shell: 'public/profile.html',
    id: 'profile-login-cta',
    module: 'public/frontend/profile-page.js',
    syncFn: 'syncProfilePageCtas',
    constant: 'PUBLIC_CTA_GO_TO_LOGIN_LABEL',
  },
  {
    shell: 'public/profile.html',
    id: 'profile-register-cta',
    module: 'public/frontend/profile-page.js',
    syncFn: 'syncProfilePageCtas',
    constant: 'PUBLIC_CTA_GO_TO_REGISTER_FROM_PROFILE_LABEL',
  },
  {
    shell: 'public/index.html',
    id: 'home-explore-cta',
    module: 'public/frontend/public-mvp-home.js',
    syncFn: 'syncHomePageCtas',
    constant: 'PUBLIC_CTA_EXPLORE_LABEL',
  },
  {
    shell: 'public/index.html',
    id: 'home-create-cta',
    module: 'public/frontend/public-mvp-home.js',
    syncFn: 'syncHomePageCtas',
    constant: 'PUBLIC_CTA_CREATE_POLL_NAV_LABEL',
  },
  {
    shell: 'public/explore.html',
    id: 'explore-home-cta',
    module: 'public/frontend/explore-page.js',
    syncFn: 'syncExplorePageLeadLinks',
    constant: 'PUBLIC_CTA_GO_HOME_LABEL',
  },
  {
    shell: 'public/my-polls.html',
    id: 'my-polls-heading',
    module: 'public/frontend/my-polls-page.js',
    syncFn: 'syncMyPollsPageSectionHeadings',
    constant: 'PUBLIC_MY_POLLS_PAGE_TITLE',
  },
] as const;

const PHASE_197_REVIEW_MODULES = [
  'public/frontend/explore-page.js',
  'public/frontend/login-page.js',
  'public/frontend/registration-page.js',
  'public/frontend/profile-page.js',
  'public/frontend/public-mvp-home.js',
  'public/frontend/vote-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/public-mvp-ui.js',
] as const;

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters|creator_token/i;

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_STORAGE =
  /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 198 public MVP copy layout runtime review checkpoint', () => {
  it('documents Phase 198 review checkpoint in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 198');
    expect(readme).toContain(
      'docs/www-project-phase-198-public-mvp-copy-layout-runtime-review-checkpoint-v1.md',
    );
  });

  it('keeps Phase 197 CTA ids in HTML shells wired to sync helpers via getElementById', async () => {
    for (const binding of PHASE_197_CTA_BINDINGS) {
      const shellHtml = await readFile(join(process.cwd(), binding.shell), 'utf8');
      const moduleSource = await readFile(join(process.cwd(), binding.module), 'utf8');

      expect(shellHtml, binding.shell).toContain(`id="${binding.id}"`);
      expect(moduleSource, binding.module).toContain(binding.syncFn);
      expect(moduleSource, binding.module).toContain(`getElementById('${binding.id}')`);
      expect(moduleSource, binding.module).toContain(binding.constant);
    }
  });

  it('keeps login and registration submit labels on shared constants', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(publicUi.PUBLIC_CTA_SIGN_IN_LABEL).toBe('登入');
    expect(publicUi.PUBLIC_CTA_REGISTER_LABEL).toBe('註冊');
    expect(publicUi.PUBLIC_CTA_GO_TO_LOGIN_LABEL).toBe('前往登入');
    expect(publicUi.PUBLIC_CTA_CREATE_ACCOUNT_LABEL).toBe('建立帳號');
    expect(publicUi.PUBLIC_CTA_GO_TO_REGISTER_FROM_PROFILE_LABEL).toBe(
      '尚未註冊？建立帳號',
    );
    expect(publicUi.PUBLIC_CTA_GO_TO_LOGIN_FROM_REGISTRATION_LABEL).toBe(
      '已有帳號，前往登入',
    );
    expect(publicUi.PUBLIC_CTA_LINK_LABELS).toContain(publicUi.PUBLIC_CTA_SIGN_IN_LABEL);
    expect(publicUi.PUBLIC_CTA_LINK_LABELS).toContain(publicUi.PUBLIC_CTA_REGISTER_LABEL);
  });

  it('keeps explore page intro wrapper separate from feed fetch runtime', async () => {
    const exploreHtml = await readFile(join(process.cwd(), 'public/explore.html'), 'utf8');
    const exploreSource = await readFile(
      join(process.cwd(), 'public/frontend/explore-page.js'),
      'utf8',
    );

    expect(exploreHtml).toContain('class="mvp-page-intro"');
    expect(exploreHtml).toContain('id="explore-feed-list"');
    expect(exploreSource).toContain('fetchExploreFeedPage');
    expect(exploreSource).toContain('syncExplorePageStatusCopy');
    expect(exploreSource).toMatch(/function mountExplorePage[\s\S]*syncExplorePageStatusCopy/);
    expect(exploreSource).toMatch(/const loadPage[\s\S]*fetchExploreFeedPage/);
    expect(exploreSource).not.toMatch(/mvp-page-intro/);
  });

  it('keeps explore status copy on safe pending messages without counters', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const explore = await loadModule('public/frontend/explore-page.js');

    expect(explore.EXPLORE_FEED_LOADING_MESSAGE).toBe('載入探索列表中，請稍候。');
    expect(publicUi.PUBLIC_PENDING_USER_MESSAGES).toContain(
      explore.EXPLORE_FEED_LOADING_MESSAGE,
    );
    expect(explore.EXPLORE_FEED_LOADING_MESSAGE).not.toMatch(/\d+%|票數|排名|趨勢/);

    const statusRegion = { textContent: '' };
    explore.syncExplorePageStatusCopy({
      getElementById: (id: string) => (id === 'explore-status' ? statusRegion : null),
    });
    expect(statusRegion.textContent).toBe(explore.EXPLORE_FEED_LOADING_MESSAGE);
  });

  it('keeps vote page brand sync label-only at 參與投票', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const vote = await loadModule('public/frontend/vote-page.js');

    expect(publicUi.PUBLIC_VOTE_PAGE_BRAND_LABEL).toBe('參與投票');

    const pageBrand = { textContent: '' };
    vote.syncVotePageSectionHeadings({
      getElementById: () => null,
      querySelector: (selector: string) =>
        selector === '.mvp-vote-main > p.mvp-brand' ? pageBrand : null,
    });
    expect(pageBrand.textContent).toBe('參與投票');

    const voteSource = await readFile(
      join(process.cwd(), 'public/frontend/vote-page.js'),
      'utf8',
    );
    expect(voteSource).toContain('PUBLIC_VOTE_PAGE_BRAND_LABEL');
    expect(voteSource).toContain("getElementById('poll-title')");
    expect(voteSource).not.toMatch(
      /pageBrand\.textContent[\s\S]{0,120}getElementById\('poll-title'\)/,
    );
  });

  it('keeps quality_badge presentation unchanged after Phase 197', async () => {
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const badgeSource = await readFile(
      join(process.cwd(), 'public/frontend/quality-feedback-badge.js'),
      'utf8',
    );

    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badgeSource).not.toMatch(/tooltip|title\s*=|aria-describedby|debug|score|rank/i);
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
    }
  });

  it('keeps my-polls page intro wrapper without new fetch paths', async () => {
    const myPollsHtml = await readFile(join(process.cwd(), 'public/my-polls.html'), 'utf8');
    const myPollsSource = await readFile(
      join(process.cwd(), 'public/frontend/my-polls-page.js'),
      'utf8',
    );

    expect(myPollsHtml).toContain('class="mvp-page-intro"');
    expect(myPollsHtml).toContain('id="my-polls-heading"');
    expect(myPollsSource).toContain("getElementById('my-polls-heading')");
    expect(myPollsSource).not.toMatch(/mvp-page-intro/);
  });

  it('keeps Phase 197 review modules free of client storage and forbidden linkage copy', async () => {
    for (const relativePath of PHASE_197_REVIEW_MODULES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_STORAGE);
      expect(source, relativePath).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }
  });

  it('mount helpers invoke Phase 197 CTA sync on page load', async () => {
    const loginSource = await readFile(
      join(process.cwd(), 'public/frontend/login-page.js'),
      'utf8',
    );
    const registrationSource = await readFile(
      join(process.cwd(), 'public/frontend/registration-page.js'),
      'utf8',
    );
    const profileSource = await readFile(
      join(process.cwd(), 'public/frontend/profile-page.js'),
      'utf8',
    );
    const homeSource = await readFile(
      join(process.cwd(), 'public/frontend/public-mvp-home.js'),
      'utf8',
    );
    const exploreSource = await readFile(
      join(process.cwd(), 'public/frontend/explore-page.js'),
      'utf8',
    );

    expect(loginSource).toMatch(/mountLoginShellPage[\s\S]*syncLoginPageOnboardingCopy/);
    expect(registrationSource).toMatch(/mountRegistrationPage[\s\S]*syncRegistrationPageOnboardingCopy/);
    expect(profileSource).toMatch(/mountProfilePage[\s\S]*syncProfilePageOnboardingCopy/);
    expect(homeSource).toMatch(/syncHomePageCtas\(document\)/);
    expect(exploreSource).toMatch(/mountExplorePage[\s\S]*syncExplorePageLeadLinks/);
    expect(exploreSource).toMatch(/mountExplorePage[\s\S]*syncExplorePageStatusCopy/);
  });
});
