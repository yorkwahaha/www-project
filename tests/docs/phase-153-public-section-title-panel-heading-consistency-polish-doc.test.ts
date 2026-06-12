import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_153_DOC =
  'docs/www-project-phase-153-public-section-title-panel-heading-consistency-polish-v1.md';

describe('Phase 153 public section title panel heading consistency polish doc', () => {
  it('documents polish scope, heading rules, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_153_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 153');
    expect(source).toContain('Public Section Title / Panel Heading Consistency');
    expect(source).toContain('PUBLIC_SECTION_TITLES');
    expect(source).toContain('PUBLIC_PANEL_HEADINGS');
    expect(source).toContain('PUBLIC_CARD_HEADINGS');
    expect(source).toContain('PUBLIC_FORM_HEADINGS');
    expect(source).toContain('syncHomePageSectionHeadings');
    expect(source).toContain('syncExplorePageSectionHeadings');
    expect(source).toContain('syncLoginPageSectionHeadings');
    expect(source).toContain('syncRegistrationPageSectionHeadings');
    expect(source).toContain('syncProfilePageSectionHeadings');
    expect(source).toContain('syncCreatePollPageSectionHeadings');
    expect(source).toContain('syncVotePageSectionHeadings');
    expect(source).toContain('syncMyPollsPageSectionHeadings');
    expect(source).toContain('syncResultsPageSectionHeadings');
    expect(source).toContain('/');
    expect(source).toContain('/explore');
    expect(source).toContain('/results/:id');
    expect(source).toContain('/my-polls');
    expect(source).toContain('/polls/new');
    expect(source).toContain('/vote/:id');
    expect(source).toContain('/login');
    expect(source).toContain('/registration');
    expect(source).toContain('/profile');
    expect(source).toContain('No runtime API behavior');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain(
      'phase-153-public-section-title-panel-heading-consistency-polish.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 153');
    expect(readme).toContain(PHASE_153_DOC);
    expect(readme).toContain('Public section title / panel heading');
  });
});
