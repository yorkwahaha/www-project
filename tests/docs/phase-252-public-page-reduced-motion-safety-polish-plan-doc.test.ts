import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_252_DOC =
  'docs/www-project-phase-252-public-page-reduced-motion-safety-polish-plan-v1.md';

describe('Phase 252 public page reduced motion / motion safety polish plan doc', () => {
  it('documents plan-only reduced motion scope, inventory, checklist, and explicit non-goals', async () => {
    const source = await readFile(join(process.cwd(), PHASE_252_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 252');
    expect(source).toContain('Reduced Motion / Motion Safety Polish Plan');
    expect(source).toContain('plan only');
    expect(source).toContain('e05b114');
    expect(source).toContain('Phase 251');

    for (const motionTerm of [
      'transition',
      'animation',
      'transform',
      'scroll-behavior',
      '@media (prefers-reduced-motion: reduce)',
    ]) {
      expect(source).toContain(motionTerm);
    }

    for (const inventoryItem of [
      '.mvp-help-tip',
      '.mvp-faq-question::before',
      '@keyframes',
    ]) {
      expect(source).toContain(inventoryItem);
    }

    expect(source).toContain('Allowed Files for Future Implementation Phase');
    expect(source).toContain('Phase 253');
    expect(source).toContain('public/frontend/public-mvp.css');
    expect(source).toContain('CSS-only');
    expect(source).toContain('option_index');
    expect(source).toContain('eligibility-before-option-resolve');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('quality_badge');
    expect(source).toContain('positive_feedback');
    expect(source).toContain('回饋良好');
    expect(source).toContain('Validation Checklist');
    expect(source).toContain('Suggested Guard Tests for Future Implementation Phase');

    for (const nonGoal of [
      'DB / schema / migration',
      'API contract / payload changes',
      'Auth / session / `UserAuthResolver` changes',
      'Vote transaction / eligibility evaluator changes',
      'Result visibility / result evaluator changes',
      'Ranking / recommendation / personalization',
      'Trust / score / governance UI',
      'Keyboard shortcuts / focus trap / roving tabindex / auto focus',
      'localStorage',
      'sessionStorage',
      'analytics / APM / debug tracking',
      'Option/user/session/device/request/log/trace/metric/error linkage',
      'design-drafts/',
    ]) {
      expect(source).toContain(nonGoal);
    }

    expect(source).toContain(
      'phase-252-public-page-reduced-motion-safety-polish-plan-doc.test.ts',
    );
    expect(source).toContain(
      'phase-252-public-page-reduced-motion-safety-polish-plan.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 252');
    expect(readme).toContain(PHASE_252_DOC);
    expect(readme).toContain('reduced motion');
  });
});
