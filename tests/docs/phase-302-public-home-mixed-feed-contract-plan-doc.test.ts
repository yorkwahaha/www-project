import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_302_PLAN_DOC =
  'docs/www-project-phase-302-public-home-mixed-feed-contract-plan-v1.md';
const PHASE_301_DOC =
  'docs/www-project-phase-301-home-swipe-card-visual-shell-v1.md';
const PHASE_301R_DOC =
  'docs/www-project-phase-301r-home-swipe-card-visual-shell-runtime-review-checkpoint-v1.md';

describe('Phase 302 public home mixed feed contract plan doc', () => {
  it('documents the plan-only posture and prior context', async () => {
    const source = await readFile(join(process.cwd(), PHASE_302_PLAN_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 302');
    expect(source).toContain('Public Home Mixed Feed Contract Plan');
    expect(source).toContain('fa46df1');
    expect(source).toContain(PHASE_301_DOC);
    expect(source).toContain(PHASE_301R_DOC);

    // Plan-only, no runtime/backend/DB/schema/migration this phase.
    expect(source).toContain('No runtime');
    expect(source).toContain('No DB/schema/migration change required');
    expect(source).toMatch(/plan-only|design document only|design complete/i);
    expect(source).toContain('FU-301-01');

    // README index references the plan.
    expect(readme).toContain('Phase 302');
    expect(readme).toContain(PHASE_302_PLAN_DOC);
  });

  it('specifies the endpoint decision, payload states, and state-specific validators', async () => {
    const source = await readFile(join(process.cwd(), PHASE_302_PLAN_DOC), 'utf8');

    // Endpoint decision: new /home/feed, leave /polls/feed frozen.
    expect(source).toContain('GET /home/feed');
    expect(source).toContain('/polls/feed');
    expect(source).toMatch(/do \*\*not\*\* extend `\/polls\/feed`|leave `\/polls\/feed` unchanged|keep `\/polls\/feed` frozen/i);

    // Discriminated union states + validators.
    for (const token of [
      '"state": "collecting"',
      '"state": "revealed"',
      'isHomeCollectingFeedItemSafe',
      'isHomeRevealedFeedItemSafe',
      'isHomeFeedItemSafe',
      'isHomeFeedPayloadSafe',
      'fail closed',
      'exact key',
      'isPublicAggregateResultsReadable',
      'total_votes_display',
      'Raw Option Linkage Ban',
    ]) {
      expect(source, `plan should specify ${token}`).toContain(token);
    }
  });

  it('includes privacy invariants, allowed/forbidden examples, test plan, and approval checklist', async () => {
    const source = await readFile(join(process.cwd(), PHASE_302_PLAN_DOC), 'utf8');

    expect(source).toContain('Privacy invariants');
    expect(source).toContain('Allowed vs forbidden payload examples');
    expect(source).toContain('Test plan');
    expect(source).toContain('Approval / rejection checklist');

    // Forbidden-field coverage in the test plan / invariants.
    for (const token of [
      'percentage',
      'rank',
      'progress',
      'person-count',
      'option_id',
      'option_text',
      'user_id',
      'session',
      'token',
      'device',
    ]) {
      expect(source, `plan should cover forbidden field ${token}`).toContain(token);
    }

    // Out-of-scope guards.
    expect(source).toMatch(/no search box/i);
    expect(source).toMatch(/no category filter/i);
    expect(source).toMatch(/no popularity|ranking/i);
    expect(source).toMatch(/personalization/i);

    // Next implementation phase proposal + auth boundary.
    expect(source).toMatch(/Phase 303 \(proposed\)/);
    expect(source).toContain('public / no-login');
    expect(source).toMatch(/vote-time only/i);
  });
});
