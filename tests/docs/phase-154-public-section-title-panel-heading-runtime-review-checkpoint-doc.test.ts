import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_154_DOC =
  'docs/www-project-phase-154-public-section-title-panel-heading-runtime-review-checkpoint-v1.md';

describe('Phase 154 public section title panel heading runtime review checkpoint doc', () => {
  it('documents Phase 153 runtime review conclusions and fixed boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_154_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 154');
    expect(source).toContain('Public Section Title / Panel Heading Runtime Review Checkpoint');
    expect(source).toContain('No runtime, frontend behavior, API behavior');
    expect(source).toContain('Phase 153');

    expect(source).toContain('PUBLIC_SECTION_TITLES');
    expect(source).toContain('PUBLIC_PANEL_HEADINGS');
    expect(source).toContain('PUBLIC_CARD_HEADINGS');
    expect(source).toContain('PUBLIC_FORM_HEADINGS');
    expect(source).toContain('Heading copy is frontend-owned only');
    expect(source).toContain('Homepage `public-mvp-home.js` load is safe');
    expect(source).toContain('Results option list headings are fixed titles only');
    expect(source).toContain('Vote / results dynamic poll titles stay outside static allowlists');

    expect(source).toContain('syncHomePageSectionHeadings');
    expect(source).toContain('syncExplorePageSectionHeadings');
    expect(source).toContain('syncLoginPageSectionHeadings');
    expect(source).toContain('syncRegistrationPageSectionHeadings');
    expect(source).toContain('syncProfilePageSectionHeadings');
    expect(source).toContain('syncCreatePollPageSectionHeadings');
    expect(source).toContain('syncVotePageSectionHeadings');
    expect(source).toContain('syncMyPollsPageSectionHeadings');
    expect(source).toContain('syncResultsPageSectionHeadings');
    expect(source).toContain('public-mvp-home.js');
    expect(source).toContain('public/index.html');
    expect(source).toContain('renderOptionLabelsList');
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
      'phase-154-public-section-title-panel-heading-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 154');
    expect(readme).toContain(PHASE_154_DOC);
    expect(readme).toContain(
      'Public section title / panel heading runtime review checkpoint',
    );
  });
});
