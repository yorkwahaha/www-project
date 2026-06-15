import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_265_DOC =
  'docs/www-project-phase-265-public-mvp-launch-readiness-checklist-plan-v1.md';

describe('Phase 265 public MVP launch readiness checklist plan doc', () => {
  it('documents plan-only launch readiness scope, inventory, Phase 266 directions, and non-goals', async () => {
    const source = await readFile(join(process.cwd(), PHASE_265_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 265');
    expect(source).toContain('Public MVP Launch Readiness Checklist Plan');
    expect(source).toContain('plan only');
    expect(source).toContain('f758805');
    expect(source).toContain('Phase 264');
    expect(source).toContain('Phase 266');

    for (const route of [
      '/',
      '/explore',
      '/faq',
      '/trust-levels',
      '/registration',
      '/login',
      '/profile',
      '/vote',
      '/results',
      '/my-polls',
      '/polls/new',
    ]) {
      expect(source).toContain(route);
    }

    for (const checklistArea of [
      'Public page navigation checklist',
      'Demo / live mode consistency checklist',
      'Registration → login → `/users/me` → profile prompt flow',
      'Official Vote pre-vote UX',
      'vote-by-index body `{ option_index }` only',
      'eligibility-before-option-resolve',
      'Results visibility checklist',
      'collecting',
      'cancelled',
      'unpublished',
      'hidden aggregate',
      'Creator my-polls / create-poll / lifecycle ownership checklist',
      'Share link',
      'Copy feedback a11y',
      'Keyboard focus',
      'Reduced motion',
      'Static HTML fallback',
      'quality_badge',
      'smoke:public:local',
      'test:integration:local',
      'Manual QA Still Required Before Launch',
      'public-page-copy.js',
    ]) {
      expect(source).toContain(checklistArea);
    }

    expect(source).toContain('Option A');
    expect(source).toContain('Option B');
    expect(source).toContain('Option C');
    expect(source).toContain('docs + guard tests only');
    expect(source).toContain('separate numbered phase');
    expect(source).toContain('approve launch');
    expect(source).toContain('does **not** approve Phase 266 implementation automatically');

    expect(source).toContain('option_index');
    expect(source).toContain('eligibility-before-option-resolve');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('quality_badge');
    expect(source).toContain('positive_feedback');
    expect(source).toContain('回饋良好');
    expect(source).toContain('does not call `GET /users/me` after success');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('UserAuthResolver');
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
      'phase-265-public-mvp-launch-readiness-checklist-plan-doc.test.ts',
    );
    expect(source).toContain(
      'phase-265-public-mvp-launch-readiness-checklist-plan.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(source).toContain('Phase 265 is plan-only');

    expect(readme).toContain('Phase 265');
    expect(readme).toContain(PHASE_265_DOC);
    expect(readme).toContain('launch readiness');
  });
});
