import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_155_DOC =
  'docs/www-project-phase-155-public-page-intro-lead-paragraph-consistency-polish-v1.md';

describe('Phase 155 public page intro lead paragraph consistency polish doc', () => {
  it('documents polish scope, intro rules, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_155_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 155');
    expect(source).toContain('Public Page Intro / Lead Paragraph Consistency');
    expect(source).toContain('PUBLIC_PAGE_LEAD_PARAGRAPHS');
    expect(source).toContain('PUBLIC_PAGE_LEADS');
    expect(source).toContain('PUBLIC_PAGE_INTRO_TEXTS');
    expect(source).toContain('syncHomePageLeadParagraphs');
    expect(source).toContain('syncExplorePageLeadParagraphs');
    expect(source).toContain('syncLoginPageLeadParagraphs');
    expect(source).toContain('syncRegistrationPageLeadParagraphs');
    expect(source).toContain('syncProfilePageLeadParagraphs');
    expect(source).toContain('syncCreatePollPageLeadParagraphs');
    expect(source).toContain('syncVotePageLeadParagraphs');
    expect(source).toContain('syncMyPollsPageLeadParagraphs');
    expect(source).toContain('syncResultsPageLeadParagraphs');
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
      'phase-155-public-page-intro-lead-paragraph-consistency-polish.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 155');
    expect(readme).toContain(PHASE_155_DOC);
    expect(readme).toContain('Public page intro / lead paragraph consistency polish');
  });
});
