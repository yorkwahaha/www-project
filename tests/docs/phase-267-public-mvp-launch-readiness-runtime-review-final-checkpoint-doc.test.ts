import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_265_DOC =
  'docs/www-project-phase-265-public-mvp-launch-readiness-checklist-plan-v1.md';
const PHASE_266_DOC =
  'docs/www-project-phase-266-public-mvp-launch-readiness-checklist-checkpoint-v1.md';
const PHASE_267_DOC =
  'docs/www-project-phase-267-public-mvp-launch-readiness-runtime-review-final-checkpoint-v1.md';

describe('Phase 267 public MVP launch readiness runtime review final checkpoint doc', () => {
  it('documents review scope, Phase 265-266 arc, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_267_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 267');
    expect(source).toContain('Public MVP Launch Readiness Runtime Review / Final Checkpoint');
    expect(source).toContain('final readiness review checkpoint');
    expect(source).toContain('bb616af');
    expect(source).toContain('Phase 265');
    expect(source).toContain('Phase 266');
    expect(source).toContain(PHASE_265_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_266_DOC.replace('docs/', './'));

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

    for (const reviewArea of [
      'plan-only',
      'does not approve launch',
      'not launch approval',
      'not production approval',
      'readiness checklist checkpoint',
      'Demo / live mode consistency',
      'Registration → login → `/users/me` → profile prompt flow',
      'Official Vote pre-vote UX',
      'vote-by-index',
      'eligibility-before-option-resolve',
      'collecting',
      'cancelled',
      'unpublished',
      'hidden aggregate',
      'Creator my-polls / create-poll / lifecycle ownership',
      'Share link',
      'Keyboard focus',
      'Reduced motion',
      'Static HTML fallback',
      'quality_badge',
      'Automated Readiness Gates Checklist',
      'Manual QA Checklist',
      'smoke:public:local',
      'separate numbered phase',
      'ready for manual QA / freeze candidate',
    ]) {
      expect(source).toContain(reviewArea);
    }

    expect(source).toContain('APPROVED — launch readiness final checkpoint complete');
    expect(source).not.toContain('launch approved');
    expect(source).not.toContain('production approved');
    expect(source).toContain('Runtime bugs require a separate numbered phase');

    expect(source).toContain('option_index');
    expect(source).toContain('eligibility-before-option-resolve');
    expect(source).toContain('Raw Option Linkage Ban');
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
      'localStorage',
      'sessionStorage',
      'analytics / metrics / APM / debug tracking',
      'option choice + user/session/device/request/log/trace/metric/error linkage',
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

    expect(source).toContain('Phase 268 blockers: none identified');

    expect(source).toContain(
      'phase-267-public-mvp-launch-readiness-runtime-review-final-checkpoint-doc.test.ts',
    );
    expect(source).toContain(
      'phase-267-public-mvp-launch-readiness-runtime-review-final-checkpoint.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 267');
    expect(readme).toContain(PHASE_267_DOC);
    expect(readme).toContain('launch readiness final checkpoint complete');
    expect(readme).toContain('ready for manual QA / freeze candidate');
    expect(readme).toContain('Phase 268 blockers: none identified');
  });

  it('confirms Phase 265 and Phase 266 prerequisite docs exist', async () => {
    const plan = await readFile(join(process.cwd(), PHASE_265_DOC), 'utf8');
    const checkpoint = await readFile(join(process.cwd(), PHASE_266_DOC), 'utf8');

    expect(plan).toContain('Public MVP Launch Readiness Checklist Plan');
    expect(plan).toContain('plan only');
    expect(checkpoint).toContain('Public MVP Launch Readiness Checklist Checkpoint');
    expect(checkpoint).toContain('readiness checklist established');
  });
});
