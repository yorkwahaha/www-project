import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_265_DOC =
  'docs/www-project-phase-265-public-mvp-launch-readiness-checklist-plan-v1.md';
const PHASE_266_DOC =
  'docs/www-project-phase-266-public-mvp-launch-readiness-checklist-checkpoint-v1.md';

describe('Phase 266 public MVP launch readiness checklist checkpoint doc', () => {
  it('documents checkpoint scope, checklist inventory, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_266_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 266');
    expect(source).toContain('Public MVP Launch Readiness Checklist Checkpoint');
    expect(source).toContain('readiness checkpoint');
    expect(source).toContain('2e34887');
    expect(source).toContain('Phase 265');
    expect(source).toContain(PHASE_265_DOC.replace('docs/', './'));

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
      'Automated Readiness Gates Checklist',
      'Manual QA Checklist',
      'smoke:public:local',
      'test:integration:local',
      'separate numbered phase',
    ]) {
      expect(source).toContain(checklistArea);
    }

    expect(source).toContain('not launch approval');
    expect(source).toContain('not production approval');
    expect(source).toContain('APPROVED — readiness checklist established');
    expect(source).not.toContain('launch approved');
    expect(source).not.toContain('production approved');

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

    for (const nonGoal of [
      'no runtime change',
      'no API change',
      'no frontend behavior change',
      'no migration',
      'no schema change',
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

    expect(source).toContain('Phase 267 blockers: none identified');

    expect(source).toContain(
      'phase-266-public-mvp-launch-readiness-checklist-checkpoint-doc.test.ts',
    );
    expect(source).toContain(
      'phase-266-public-mvp-launch-readiness-checklist-checkpoint.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 266');
    expect(readme).toContain(PHASE_266_DOC);
    expect(readme).toContain('launch readiness');
    expect(readme).toContain('readiness checklist established');
    expect(readme).toContain('Phase 267 blockers: none identified');
  });

  it('confirms Phase 265 plan doc exists as prerequisite', async () => {
    const plan = await readFile(join(process.cwd(), PHASE_265_DOC), 'utf8');
    expect(plan).toContain('Phase 265');
    expect(plan).toContain('Public MVP Launch Readiness Checklist Plan');
  });
});
