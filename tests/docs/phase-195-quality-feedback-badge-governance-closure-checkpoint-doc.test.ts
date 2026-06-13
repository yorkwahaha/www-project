import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_195_DOC =
  'docs/www-project-phase-195-quality-feedback-badge-governance-closure-checkpoint-v1.md';

describe('Phase 195 quality feedback badge governance closure checkpoint doc', () => {
  it('documents governance closure confirmations, non-goals, and fixed boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_195_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 195');
    expect(source).toContain('Quality Feedback / Badge Governance Closure Checkpoint');
    expect(source).toContain('Docs/checkpoint only');
    expect(source).toContain('063d4b0');
    expect(source).toContain('Phase 193');
    expect(source).toContain('Phase 194');

    expect(source).toContain('presentation-only');
    expect(source).toContain('not** a ranking signal');
    expect(source).toContain('not** a recommendation signal');
    expect(source).toContain('not** a personalization signal');
    expect(source).toContain('not** a trust score');
    expect(source).toContain('not** a poll score');
    expect(source).toContain('not** a creator score');
    expect(source).toContain('not** a reputation score');
    expect(source).toContain('not** a moderation state');
    expect(source).toContain('not** a governance state');
    expect(source).toContain('not** a threshold state');
    expect(source).toContain('not** a bucket state');

    for (const behavior of [
      'ordering',
      'filtering',
      'CTA',
      'eligibility',
      'result visibility',
      'result interpretation',
    ]) {
      expect(source).toContain(behavior);
    }

    expect(source).toContain('quality_badge: null | "positive_feedback"');
    expect(source).toContain('回饋良好');
    expect(source).toContain('completely not display badge');
    expect(source).toContain('Missing field');
    expect(source).toContain('Unexpected value');

    for (const forbiddenDetail of [
      'tooltip',
      'debug',
      'explanation',
      'counts',
      'score',
      'rank',
      'tag breakdown',
    ]) {
      expect(source).toContain(forbiddenDetail);
    }

    expect(source).toContain('poll_quality_feedback_aggregate');
    expect(source).toContain('only durable source');
    expect(source).toContain('Durable badge table');
    expect(source).toContain('New schema / migration for badge');
    expect(source).toContain('no migration');

    expect(source).toContain('localStorage');
    expect(source).toContain('sessionStorage');
    expect(source).toContain('cookie');

    expect(source).toContain('/explore');
    expect(source).toContain('/vote/:pollId');
    expect(source).toContain('/results/:pollId');

    for (const nonGoal of [
      'no runtime change',
      'no API change',
      'no frontend change',
      'no migration',
      'no schema change',
    ]) {
      expect(source).toContain(nonGoal);
    }

    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain(
      'Option choice + user/session/device/request/log/trace/metric/error payload linkage',
    );
    expect(source).toContain('design-drafts/');
    expect(source).toContain('src/http/server.ts');

    expect(source).toContain(
      'phase-195-quality-feedback-badge-governance-closure-checkpoint-doc.test.ts',
    );
    expect(source).toContain(
      'phase-195-quality-feedback-badge-governance-closure-checkpoint.test.ts',
    );

    expect(readme).toContain('Phase 195');
    expect(readme).toContain(PHASE_195_DOC);
    expect(readme).toContain('Quality feedback badge governance closure checkpoint');
  });
});
