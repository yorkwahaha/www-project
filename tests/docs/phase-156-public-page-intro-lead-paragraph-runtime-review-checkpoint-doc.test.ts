import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_156_DOC =
  'docs/www-project-phase-156-public-page-intro-lead-paragraph-runtime-review-checkpoint-v1.md';

describe('Phase 156 public page intro lead paragraph runtime review checkpoint doc', () => {
  it('documents Phase 155 runtime review conclusions and fixed boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_156_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 156');
    expect(source).toContain('Public Page Intro / Lead Paragraph Runtime Review Checkpoint');
    expect(source).toContain('No runtime, frontend behavior, API behavior');
    expect(source).toContain('Phase 155');

    expect(source).toContain('PUBLIC_PAGE_LEAD_PARAGRAPHS');
    expect(source).toContain('PUBLIC_PAGE_LEADS');
    expect(source).toContain('PUBLIC_PAGE_INTRO_TEXTS');
    expect(source).toContain('PUBLIC_EXPLORE_PAGE_LEAD_HINT');
    expect(source).toContain('Intro / lead copy is frontend-owned only');
    expect(source).toContain('`PUBLIC_EXPLORE_PAGE_LEAD_HINT` alias is safe');
    expect(source).toContain('Homepage `public-mvp-home.js` lead sync is safe');
    expect(source).toContain('Results intro and creator section intro avoid collecting preview');
    expect(source).toContain('Vote poll content stays outside static lead allowlists');

    expect(source).toContain('syncHomePageLeadParagraphs');
    expect(source).toContain('syncExplorePageLeadParagraphs');
    expect(source).toContain('syncLoginPageLeadParagraphs');
    expect(source).toContain('syncRegistrationPageLeadParagraphs');
    expect(source).toContain('syncProfilePageLeadParagraphs');
    expect(source).toContain('syncCreatePollPageLeadParagraphs');
    expect(source).toContain('syncVotePageLeadParagraphs');
    expect(source).toContain('syncMyPollsPageLeadParagraphs');
    expect(source).toContain('syncResultsPageLeadParagraphs');
    expect(source).toContain('renderResultsReadOnlyIntro');
    expect(source).toContain('creator-flow-copy.js');
    expect(source).toContain('/');
    expect(source).toContain('/explore');
    expect(source).toContain('/results/:id');
    expect(source).toContain('/my-polls');
    expect(source).toContain('/polls/new');
    expect(source).toContain('/vote/:id');
    expect(source).toContain('/login');
    expect(source).toContain('/registration');
    expect(source).toContain('/profile');

    expect(source).toContain('does not auto-login');
    expect(source).toContain('does not Set-Cookie');
    expect(source).toContain('does not read `/users/me`');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('No new profile fields added');
    expect(source).toContain('creator_session` remains non-production identity');
    expect(source).toContain('Official Vote transaction order unchanged');
    expect(source).toContain('eligibility-before-option-resolve unchanged');
    expect(source).toContain('Vote-by-index body remains `{ option_index }` only');
    expect(source).toContain('Reference Answer remains disconnected');
    expect(source).toContain('Raw Option Linkage Ban preserved');
    expect(source).toContain('X-User-Id` remains explicit non-production compatibility only');
    expect(source).toContain('No new observability or analytics linkage');

    expect(source).toContain(
      'phase-156-public-page-intro-lead-paragraph-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 156');
    expect(readme).toContain(PHASE_156_DOC);
    expect(readme).toContain(
      'Public page intro / lead paragraph runtime review checkpoint',
    );
  });
});
