import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_196_DOC =
  'docs/www-project-phase-196-public-mvp-post-quality-badge-ux-polish-plan-v1.md';

describe('Phase 196 public MVP post-quality-badge UX polish plan doc', () => {
  it('documents plan-only polish scope, surfaces, candidates, and explicit non-goals', async () => {
    const source = await readFile(join(process.cwd(), PHASE_196_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 196');
    expect(source).toContain('Public MVP Post-Quality-Badge UX Polish Plan');
    expect(source).toContain('plan only');
    expect(source).toContain('19ed567');
    expect(source).toContain('Phase 195');

    for (const surface of [
      '/explore',
      '/vote/:pollId',
      '/results/:pollId',
      '/login',
      '/registration',
      '/profile',
      '/my-polls',
      'homepage',
    ]) {
      expect(source).toContain(surface);
    }

    for (const candidate of [
      'page title / subtitle hierarchy',
      'Badge / copy placement consistency',
      'Empty / loading / error copy consistency',
      'CTA wording consistency',
      'Mobile readability',
      'Profile / login / registration navigation clarity',
    ]) {
      expect(source).toContain(candidate);
    }

    expect(source).toContain('New privacy disclosures');
    expect(source).toContain('eligibility disclosure');
    expect(source).toContain('result counter leakage');
    expect(source).toContain('回饋良好');
    expect(source).toContain('expansion beyond');

    expect(source).toContain('Presentation-only');
    expect(source).toContain('not ranking');
    expect(source).toContain('positive_feedback');
    expect(source).toContain('completely not display badge');

    for (const nonGoal of [
      'DB / schema / migration',
      'API changes',
      'Auth / session changes',
      'Vote transaction changes',
      'Eligibility changes',
      'Result visibility changes',
      'Reference Answer changes',
      'Ranking / recommendation / personalization',
      'Quality score / trust score / creator score',
      'Option/user/session/device/request/log/trace/metric/error linkage',
    ]) {
      expect(source).toContain(nonGoal);
    }

    expect(source).toContain('renderQualityFeedbackBadge()');
    expect(source).toContain('mountQualityFeedbackBadgeNearTitle()');
    expect(source).toContain('Raw Option Linkage Ban');

    expect(source).toContain('Phase 196-R');
    expect(source).toContain('review checkpoint');

    expect(source).toContain(
      'phase-196-public-mvp-post-quality-badge-ux-polish-plan-doc.test.ts',
    );
    expect(source).toContain('design-drafts/');

    expect(readme).toContain('Phase 196');
    expect(readme).toContain(PHASE_196_DOC);
    expect(readme).toContain('Public MVP post-quality-badge UX polish plan');
  });
});
