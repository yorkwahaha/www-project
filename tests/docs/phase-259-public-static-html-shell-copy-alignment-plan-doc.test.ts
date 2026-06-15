import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_259_DOC =
  'docs/www-project-phase-259-public-static-html-shell-copy-alignment-plan-v1.md';

describe('Phase 259 public static HTML shell copy alignment plan doc', () => {
  it('documents plan-only shell copy scope, inventory, checklist, and explicit non-goals', async () => {
    const source = await readFile(join(process.cwd(), PHASE_259_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 259');
    expect(source).toContain('Public Static HTML Shell Copy Alignment Plan');
    expect(source).toContain('plan only');
    expect(source).toContain('2655540');
    expect(source).toContain('Phase 258');
    expect(source).toContain('Phase 257');
    expect(source).toContain('public-page-copy.js');

    for (const shell of [
      'index.html',
      'login.html',
      'registration.html',
      'profile.html',
      'vote.html',
      'results.html',
      'my-polls.html',
      'create-poll.html',
      '/polls/new',
      'explore.html',
      'trust-levels.html',
      'faq.html',
    ]) {
      expect(source).toContain(shell);
    }

    for (const inventoryItem of [
      'Runtime Sync vs Static Fallback',
      'public-page-copy.js',
      'PAGE_COPY',
      'syncHomePageOnboardingCopy',
      'syncLoginPageOnboardingCopy',
      'syncVotePageOnboardingCopy',
      'syncResultsPageOnboardingCopy',
      'syncCreatePollPageOnboardingCopy',
      'syncMyPollsPageOnboardingCopy',
      '優質題目',
      'PUBLIC_HOME_VALUE_QUALITY_FEEDBACK_BODY',
      'PUBLIC_VOTE_POLICY_QUALITY_FEEDBACK_TEXT',
      'PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD',
      'X-User-Id',
      'creator_session',
    ]) {
      expect(source).toContain(inventoryItem);
    }

    expect(source).toContain('Current Shell Inventory');
    expect(source).toContain('Allowed Files for Future Implementation Phase (Phase 260)');
    expect(source).toContain('Phase 260');
    expect(source).toContain('minimal static HTML shell fallback copy alignment');
    expect(source).toContain('static text');
    expect(source).toContain('option_index');
    expect(source).toContain('eligibility-before-option-resolve');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('quality_badge');
    expect(source).toContain('positive_feedback');
    expect(source).toContain('回饋良好');
    expect(source).toContain('does not call `GET /users/me` after success');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('Validation Checklist');

    for (const nonGoal of [
      'API / DB / backend / migration changes',
      'Auth / session / `UserAuthResolver` changes',
      'Vote transaction / eligibility evaluator changes',
      'Result visibility / result evaluator',
      'Ranking / recommendation / personalization',
      'Trust / score / governance',
      'localStorage',
      'sessionStorage',
      'analytics / APM / debug tracking',
      'Option choice + user/session/device/request/log/trace/metric/error linkage',
      'public/frontend/*.js',
      'public-mvp.css',
      'design-drafts/',
    ]) {
      expect(source).toContain(nonGoal);
    }

    for (const qualityBoundary of [
      'tooltip',
      'debug',
      'explanation',
      'counts',
      'score',
      'rank',
      'hidden aggregate',
    ]) {
      expect(source).toContain(qualityBoundary);
    }

    expect(source).toContain(
      'phase-259-public-static-html-shell-copy-alignment-plan-doc.test.ts',
    );
    expect(source).toContain(
      'phase-259-public-static-html-shell-copy-alignment-plan.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(source).toContain('Phase 259 is plan-only');
    expect(source).toContain('Phase 260');
    expect(source).toContain('does **not** approve Phase 260 implementation automatically');

    expect(readme).toContain('Phase 259');
    expect(readme).toContain(PHASE_259_DOC);
    expect(readme).toContain('static HTML shell');
  });
});
