import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const PHASE_300_DOC =
  'docs/www-project-phase-300-demo-vs-live-boundary-final-review-v1.md';
const PHASE_301_DOC =
  'docs/www-project-phase-301-final-pre-release-gate-checklist-v1.md';

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

describe('Phase 301 final pre-release gate checklist', () => {
  it('confirms Phase 301 record exists with PASS conclusion and README index', async () => {
    const review300 = await readFile(join(process.cwd(), PHASE_300_DOC), 'utf8');
    const checklist301 = await readFile(join(process.cwd(), PHASE_301_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(review300).toContain('Phase 301 blockers: none identified');
    expect(review300).toContain('Overall boundary review result');
    expect(checklist301).toContain('Phase 301');
    expect(checklist301).toContain('34eb3e6');
    expect(checklist301).toContain('Overall pre-release gate checklist result');
    expect(checklist301).toContain('Phase 300 demo vs live boundary');
    expect(readme).toContain('Phase 301');
    expect(readme).toContain(PHASE_301_DOC);
    expect(readme).toContain('final pre-release gate arc');
  });

  it('keeps Phase 301 as review-only without runtime or HTML delivery markers', async () => {
    for (const relativePath of PUBLIC_HTML_SHELLS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 301');
      expect(source, relativePath).not.toContain('Phase 302');
    }

    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 301');
    }

    const migrationDir = join(process.cwd(), 'migrations');
    const migrationFiles = await readdir(migrationDir);
    for (const fileName of migrationFiles) {
      const source = await readFile(join(migrationDir, fileName), 'utf8');
      expect(source, `migrations/${fileName}`).not.toContain('Phase 301');
    }
  });

  it('reaffirms README release-state wording without deployment or launch claims', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    const checklist301 = await readFile(join(process.cwd(), PHASE_301_DOC), 'utf8');

    expect(readme).toContain('launch approved for manual release preparation');
    expect(readme).toContain('operator release execution **authorized**');
    expect(readme).toContain('actual deployment **NOT EXECUTED**');
    expect(readme).toContain('formal launch **NOT COMPLETED**');
    expect(readme).toContain('no deploy scripts added');
    expect(readme).toContain('no production configuration changed');
    expect(readme).not.toContain('deployment executed');
    expect(readme).not.toContain('launch completed');
    expect(readme).not.toContain('formal launch completed');

    expect(checklist301).toContain('Manual release preparation approved | **YES**');
    expect(checklist301).toContain('Operator release execution authorized | **YES**');
    expect(checklist301).toContain('Actual deployment | **NOT EXECUTED**');
    expect(checklist301).toContain('Formal launch | **NOT COMPLETED**');
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
        display_name: 'Gate Checklist User',
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

  it('keeps hidden aggregate and quality_badge gates unchanged', async () => {
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

  it('records PASS checklist without deploy scripts in scripts directory', async () => {
    const checklist301 = await readFile(join(process.cwd(), PHASE_301_DOC), 'utf8');
    const scriptsDir = join(process.cwd(), 'scripts');
    const scriptFiles = await readdir(scriptsDir);

    expect(checklist301).toContain('BL-286-02');
    expect(checklist301).toContain('dual copy source');
    expect(checklist301).toContain('design-drafts/');
    expect(checklist301).toContain('no runtime change');
    expect(checklist301).not.toContain('deployment executed');
    expect(checklist301).not.toContain('formal launch completed');

    for (const fileName of scriptFiles) {
      expect(fileName, `scripts/${fileName}`).not.toMatch(/deploy/i);
    }
  });
});
