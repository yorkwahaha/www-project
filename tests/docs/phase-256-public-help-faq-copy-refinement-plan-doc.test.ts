import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_256_DOC =
  'docs/www-project-phase-256-public-help-faq-copy-refinement-plan-v1.md';

describe('Phase 256 public help / FAQ copy refinement plan doc', () => {
  it('documents plan-only help/FAQ copy scope, inventory, checklist, and explicit non-goals', async () => {
    const source = await readFile(join(process.cwd(), PHASE_256_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 256');
    expect(source).toContain('Public Help / FAQ Copy Refinement Plan');
    expect(source).toContain('plan only');
    expect(source).toContain('ef9e9bb');
    expect(source).toContain('Phase 255');
    expect(source).toContain('Phase 238');

    for (const surface of [
      '/faq',
      '/login',
      '/registration',
      '/profile',
      '/vote',
      '/results',
      '/my-polls',
      '/polls/new',
      '/explore',
      '/trust-levels',
    ]) {
      expect(source).toContain(surface);
    }

    for (const inventoryItem of [
      'PUBLIC_FAQ_ONBOARDING_MESSAGES',
      'PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES',
      'PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES',
      'PUBLIC_CREATOR_ONBOARDING_MESSAGES',
      'PUBLIC_HOME_HERO_LEAD',
      'PUBLIC_VOTE_POLICY_QUALITY_FEEDBACK_TEXT',
      'QUALITY_FEEDBACK_BADGE_LABEL',
    ]) {
      expect(source).toContain(inventoryItem);
    }

    expect(source).toContain('Current Copy Inventory');
    expect(source).toContain('Allowed Files for Future Implementation Phase');
    expect(source).toContain('Phase 257');
    expect(source).toContain('minimal public help / FAQ copy refinement');
    expect(source).toContain('static text replacement only');
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
    expect(source).toContain('Suggested Guard Tests for Future Implementation Phase');

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
      'Option/user/session/device/request/log/trace/metric/error linkage',
      'New features, new API calls',
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
      'phase-256-public-help-faq-copy-refinement-plan-doc.test.ts',
    );
    expect(source).toContain(
      'phase-256-public-help-faq-copy-refinement-plan.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(source).toContain('Phase 256 is plan-only');
    expect(source).toContain('Phase 257');
    expect(source).toContain('does **not** approve Phase 257 implementation automatically');

    expect(readme).toContain('Phase 256');
    expect(readme).toContain(PHASE_256_DOC);
    expect(readme).toContain('help');
  });
});
