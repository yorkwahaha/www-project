import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const PHASE_301_DOC =
  'docs/www-project-phase-301-final-pre-release-gate-checklist-v1.md';
const PHASE_302_DOC =
  'docs/www-project-phase-302-cross-model-verification-handoff-packet-v1.md';

const PUBLIC_HTML_SHELLS = [
  'public/index.html',
  'public/explore.html',
  'public/faq.html',
  'public/login.html',
  'public/registration.html',
  'public/profile.html',
  'public/create-poll.html',
  'public/my-polls.html',
  'public/vote.html',
  'public/results.html',
] as const;

const PROTECTED_BACKEND_PATHS = [
  'src/auth/user-auth-resolver.ts',
  'src/http/official-vote-routes.ts',
  'src/http/registration-routes.ts',
  'src/http/login-session-routes.ts',
  'src/http/user-profile-routes.ts',
] as const;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|indexedDB|document\.cookie/i;
const FORBIDDEN_TRACKING =
  /analytics|datadog|sentry|apm|trackEvent|gtag\(|debug\.track/i;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 302 cross-model verification handoff packet', () => {
  it('confirms Phase 302 handoff packet exists with READY conclusion and README index', async () => {
    const checklist301 = await readFile(join(process.cwd(), PHASE_301_DOC), 'utf8');
    const handoff302 = await readFile(join(process.cwd(), PHASE_302_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(checklist301).toContain('Phase 302 blockers: none identified');
    expect(checklist301).toContain('Overall pre-release gate checklist result');
    expect(handoff302).toContain('Phase 302');
    expect(handoff302).toContain('18c57846c92f5a3f0fb16b01604c7cc3ba83e546');
    expect(handoff302).toContain('Overall cross-model verification handoff result');
    expect(handoff302).toContain('Phase 297–301 Pass Affirmations');
    expect(handoff302).toContain('GPT-5.5-side work is complete');
    expect(readme).toContain('Phase 302');
    expect(readme).toContain(PHASE_302_DOC);
    expect(readme).toContain('final GPT-5.5-side handoff packet');
  });

  it('keeps Phase 302 as review-only without runtime or HTML delivery markers', async () => {
    for (const relativePath of PUBLIC_HTML_SHELLS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 302');
      expect(source, relativePath).not.toContain('Phase 303');
    }

    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 302');
    }

    const migrationDir = join(process.cwd(), 'migrations');
    const migrationFiles = await readdir(migrationDir);
    for (const fileName of migrationFiles) {
      const source = await readFile(join(migrationDir, fileName), 'utf8');
      expect(source, `migrations/${fileName}`).not.toContain('Phase 302');
    }
  });

  it('reaffirms README and handoff release-state wording without deployment or launch claims', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    const handoff302 = await readFile(join(process.cwd(), PHASE_302_DOC), 'utf8');

    expect(readme).toContain('launch approved for manual release preparation');
    expect(readme).toContain('operator release execution **authorized**');
    expect(readme).toContain('actual deployment **NOT EXECUTED**');
    expect(readme).toContain('formal launch **NOT COMPLETED**');
    expect(readme).toContain('no deploy scripts added');
    expect(readme).toContain('no production configuration changed');
    expect(readme).not.toContain('deployment executed');
    expect(readme).not.toContain('launch completed');
    expect(readme).not.toContain('formal launch completed');

    expect(handoff302).toContain('Manual release preparation approved | **YES**');
    expect(handoff302).toContain('Operator release execution authorized | **YES**');
    expect(handoff302).toContain('Actual deployment | **NOT EXECUTED**');
    expect(handoff302).toContain('Formal launch | **NOT COMPLETED**');
    expect(handoff302).toContain('not Phase 303');
  });

  it('keeps registration and profile auth boundaries unchanged', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const registrationSource = await readFile(
      join(process.cwd(), 'public/frontend/registration-page.js'),
      'utf8',
    );
    const profileSource = await readFile(
      join(process.cwd(), 'public/frontend/profile-page.js'),
      'utf8',
    );
    const userProfileRoutes = await readFile(
      join(process.cwd(), 'src/http/user-profile-routes.ts'),
      'utf8',
    );
    const fetchCalls: string[] = [];

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'Handoff Packet User',
        birth_year_month: '1994-04',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl: async (url: string) => {
        fetchCalls.push(String(url));
        return { status: 201 };
      },
    });

    expect(fetchCalls).toEqual(['/registration']);
    expect(registrationSource).not.toContain("fetchImpl('/users/me'");
    expect(registrationSource).not.toMatch(FORBIDDEN_STORAGE);
    expect(profileSource).toContain('birth_year_month');
    expect(profileSource).toContain('residential_region');
    expect(userProfileRoutes).toContain('birth_year_month');
    expect(userProfileRoutes).toContain('residential_region');
  });

  it('keeps vote-by-index eligibility-before-resolve and indistinguishable index handling', async () => {
    const officialVoteSource = await readFile(
      join(process.cwd(), 'src/http/official-vote-routes.ts'),
      'utf8',
    );
    const repositorySource = await readFile(
      join(process.cwd(), 'src/polls/repository.ts'),
      'utf8',
    );
    const voteByIndexTest = await readFile(
      join(process.cwd(), 'tests/http/vote-by-index.test.ts'),
      'utf8',
    );

    expect(officialVoteSource).toContain('option_index');
    expect(officialVoteSource).toContain('castOfficialVoteByIndex');
    expect(repositorySource).toContain('isProfileEligibleForOfficialVote');
    expect(repositorySource).toContain('resolveOfficialVoteOptionIdWithClient');
    expect(repositorySource.indexOf('isProfileEligibleForOfficialVote')).toBeLessThan(
      repositorySource.indexOf('resolveOfficialVoteOptionIdWithClient'),
    );
    expect(voteByIndexTest).toContain('indistinguishable');
    expect(voteByIndexTest).toContain('nonexistent indexes');
  });

  it('keeps hidden aggregate, quality_badge, and BL-286-02 dual copy source unchanged', async () => {
    const { resolveResultRenderMode } = await loadModule('public/frontend/result-page.js');
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const pageCopySource = await readFile(
      join(process.cwd(), 'public/frontend/public-page-copy.js'),
      'utf8',
    );
    const publicUiSource = await readFile(
      join(process.cwd(), 'public/frontend/public-mvp-ui.js'),
      'utf8',
    );
    const handoff302 = await readFile(join(process.cwd(), PHASE_302_DOC), 'utf8');

    for (const lifecycle of ['collecting', 'cancelled', 'unpublished'] as const) {
      expect(
        resolveResultRenderMode({ public_lifecycle_state: lifecycle, options: [] }),
      ).not.toBe('aggregate');
    }

    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
    expect(pageCopySource).toContain('export const PUBLIC_LOGIN_ACCOUNT_FLOW_CARD_BODY');
    expect(publicUiSource).toContain("export * from './public-page-copy.js'");
    expect(publicUiSource).toContain('PUBLIC_EXPLORE_EMPTY_MESSAGE');
    expect(handoff302).toContain('Do not merge');
    expect(handoff302).toContain('BL-286-02');
  });

  it('keeps public frontend free of forbidden storage and tracking', async () => {
    const frontendDir = join(process.cwd(), 'public/frontend');
    const entries = await readdir(frontendDir);
    const jsFiles = entries.filter((name) => name.endsWith('.js'));

    for (const fileName of jsFiles) {
      const source = await readFile(join(frontendDir, fileName), 'utf8');
      expect(source, `public/frontend/${fileName}`).not.toMatch(FORBIDDEN_STORAGE);
      expect(source, `public/frontend/${fileName}`).not.toMatch(FORBIDDEN_TRACKING);
    }
  });

  it('records handoff stop condition without deploy scripts in scripts directory', async () => {
    const handoff302 = await readFile(join(process.cwd(), PHASE_302_DOC), 'utf8');
    const scriptsDir = join(process.cwd(), 'scripts');
    const scriptFiles = await readdir(scriptsDir);

    expect(handoff302).toContain('design-drafts/');
    expect(handoff302).toContain('no runtime change');
    expect(handoff302).toContain('Copy-Paste Final Independent Verification Prompt');
    expect(handoff302).toContain('Actual deployment | **NOT EXECUTED**');
    expect(handoff302).not.toContain('Actual deployment | **EXECUTED**');
    expect(handoff302).toContain('Formal launch | **NOT COMPLETED**');
    expect(handoff302).not.toContain('Formal launch | **COMPLETED**');

    for (const fileName of scriptFiles) {
      expect(fileName, `scripts/${fileName}`).not.toMatch(/deploy/i);
    }
  });
});
