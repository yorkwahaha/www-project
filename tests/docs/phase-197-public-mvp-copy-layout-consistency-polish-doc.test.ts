import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_197_DOC =
  'docs/www-project-phase-197-public-mvp-copy-layout-consistency-polish-v1.md';

describe('Phase 197 public MVP copy and layout consistency polish doc', () => {
  it('documents polish scope, surfaces, rules, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_197_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 197');
    expect(source).toContain('Public MVP Copy & Layout Consistency Polish');
    expect(source).toContain('2ff2bf7');
    expect(source).toContain('Phase 196');

    for (const surface of [
      '/',
      '/explore',
      '/vote/:pollId',
      '/results/:pollId',
      '/login',
      '/registration',
      '/profile',
      '/my-polls',
    ]) {
      expect(source).toContain(surface);
    }

    expect(source).toContain('mvp-page-intro');
    expect(source).toContain('syncLoginPageCtas');
    expect(source).toContain('syncRegistrationPageCtas');
    expect(source).toContain('syncProfilePageCtas');
    expect(source).toContain('syncExplorePageLeadLinks');
    expect(source).toContain('syncHomePageCtas');
    expect(source).toContain('PUBLIC_VOTE_PAGE_BRAND_LABEL');
    expect(source).toContain('回饋良好');
    expect(source).toContain('renderQualityFeedbackBadge()');
    expect(source).toContain('No runtime API behavior');
    expect(source).toContain('quality_badge');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'phase-197-public-mvp-copy-layout-consistency-polish.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 197');
    expect(readme).toContain(PHASE_197_DOC);
    expect(readme).toContain('Public MVP copy and layout consistency polish');
  });
});
