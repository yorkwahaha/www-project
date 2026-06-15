import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_292_DOC =
  'docs/www-project-phase-292-public-mvp-manual-qa-follow-up-execution-record-v1.md';
const PHASE_293_DOC =
  'docs/www-project-phase-293-public-mvp-post-release-monitoring-notes-draft-v1.md';
const PHASE_296_DOC =
  'docs/www-project-phase-296-public-mvp-backlog-planning-checkpoint-v1.md';
const PHASE_297_DOC =
  'docs/www-project-phase-297-public-mvp-mobile-375px-spot-check-record-v1.md';

describe('Phase 297 public MVP mobile 375px spot-check record doc', () => {
  it('documents spot-check session, routes, FU-292-01 closure, and conclusion', async () => {
    const source = await readFile(join(process.cwd(), PHASE_297_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 297');
    expect(source).toContain('Mobile 375px Spot-Check Record');
    expect(source).toContain('QA record / review-only');
    expect(source).toContain('89f6c8d');
    expect(source).toContain(PHASE_292_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_293_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_296_DOC.replace('docs/', './'));
    expect(source).toContain('FU-292-01');
    expect(source).toContain('M-296-01');

    for (const route of [
      '/',
      '/explore',
      '/faq',
      '/login',
      '/registration',
      '/profile',
      '/polls/new',
      '/my-polls',
      '/vote/demo',
      '/results/demo',
    ]) {
      expect(source).toContain(route);
    }

    for (const section of [
      'Spot-Check Session Metadata',
      'Pre-Spot-Check Automated Gates',
      'Per-Route Spot-Check Results',
      'FU-292-01 Resolution',
      'Cross-Cutting Privacy / Integrity Checks',
      'Overall mobile 375px spot-check result',
    ]) {
      expect(source).toContain(section);
    }

    for (const focus of [
      'Header / CTA',
      'Form fields',
      'empty state',
      'FAQ',
      'hidden aggregate',
      'quality_badge',
      '375px',
    ]) {
      expect(source).toContain(focus);
    }

    expect(source).toContain('CLOSED — spot-check PASS');
    expect(source).toContain('**Overall mobile 375px spot-check result** | **PASS**');
    expect(source).toContain('**FAIL** | 0');
    expect(source).toContain('**NEEDS FOLLOW-UP** | 0');

    for (const statusField of [
      'not release execution',
      'not deployment',
      'not formal launch',
      'NOT EXECUTED',
      'NOT COMPLETED',
      'no runtime change',
      'no CSS / layout change',
      'no copy change',
    ]) {
      expect(source).toContain(statusField);
    }

    for (const rule of [
      'eligibility-before-option-resolve',
      'option_index',
      'Raw Option Linkage Ban',
      'hidden aggregate',
      'UserAuthResolver',
      'positive_feedback',
      '回饋良好',
      'smoke:public:local',
      'demo:public:local',
      'design-drafts/',
    ]) {
      expect(source).toContain(rule);
    }

    expect(source).toContain('Phase 298 blockers: none identified');
    expect(source).toContain(
      'phase-297-public-mvp-mobile-375px-spot-check-record-doc.test.ts',
    );
    expect(source).toContain(
      'phase-297-public-mvp-mobile-375px-spot-check-record.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 297');
    expect(readme).toContain(PHASE_297_DOC);
    expect(readme).toContain('375px');
    expect(readme).toContain('Phase 298 blockers: none identified');
  });
});
