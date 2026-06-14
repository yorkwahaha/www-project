import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

const PHASE_236_DOC =
  'docs/www-project-phase-236-faq-onboarding-help-copy-runtime-v1.md';

describe('Phase 236 faq onboarding help copy runtime doc', () => {
  it('documents runtime scope, copy changes, boundaries, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_236_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 236');
    expect(source).toContain('FAQ Onboarding / Help Copy Minimal Runtime Patch');
    expect(source).toContain('64e6ca2');
    expect(source).toContain('Phase 235-R');
    expect(source).toContain('copy-only');

    for (const surface of [
      'faq.html',
      'faq-page.js',
      'public-mvp-ui.js',
      '/faq',
      'registration → login → profile',
      'create poll → my-polls',
      'vote → results',
    ]) {
      expect(source).toContain(surface);
    }

    for (const token of [
      'PUBLIC_FAQ_ONBOARDING_MESSAGES',
      'PUBLIC_FAQ_PAGE_HERO_LEAD',
      'PUBLIC_FAQ_ACCOUNT_FLOW_INTRO',
      'PUBLIC_FAQ_CREATOR_FLOW_DEMO_STEP',
      'PUBLIC_FAQ_PARTICIPANT_VOTE_STEP',
      'PUBLIC_FAQ_PROFILE_DEMO_BOUNDARY_NOTE',
      'PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES',
      'PUBLIC_CREATOR_ONBOARDING_MESSAGES',
      'PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES',
      'syncFaqPageOnboardingCopy',
      'X-User-Id',
      'creator_session',
      'production user-auth wiring later',
      'Official Vote',
      'Reference Answer',
      'submitVoteByIndex',
      'option_index',
      'eligibility-before-option-resolve',
      'Official Vote transaction order',
      'Raw Option Linkage Ban',
      'quality_badge',
      '回饋良好',
      'positive_feedback',
      'migrate:check',
      'smoke:public:local',
      'phase-236-faq-onboarding-help-copy-runtime.test.ts',
    ]) {
      expect(source).toContain(token);
    }

    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 236');
    expect(readme).toContain(PHASE_236_DOC);
    expect(readme).toContain('FAQ onboarding / help copy minimal runtime patch');
  });
});
