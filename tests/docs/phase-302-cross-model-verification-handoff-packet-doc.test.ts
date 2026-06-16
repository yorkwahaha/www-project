import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_273_DOC =
  'docs/www-project-phase-273-public-mvp-launch-approval-decision-record-v1.md';
const PHASE_278_DOC =
  'docs/www-project-phase-278-public-mvp-manual-release-execution-authorization-record-v1.md';
const PHASE_280_DOC =
  'docs/www-project-phase-280-public-mvp-release-authorization-not-executed-status-final-checkpoint-v1.md';
const PHASE_297_DOC =
  'docs/www-project-phase-297-public-mvp-mobile-375px-spot-check-record-v1.md';
const PHASE_298_DOC =
  'docs/www-project-phase-298-public-mvp-share-keyboard-reduced-motion-regression-review-v1.md';
const PHASE_299_DOC =
  'docs/www-project-phase-299-static-html-fallback-vs-runtime-copy-drift-review-v1.md';
const PHASE_300_DOC =
  'docs/www-project-phase-300-demo-vs-live-boundary-final-review-v1.md';
const PHASE_301_DOC =
  'docs/www-project-phase-301-final-pre-release-gate-checklist-v1.md';
const PHASE_302_DOC =
  'docs/www-project-phase-302-cross-model-verification-handoff-packet-v1.md';

describe('Phase 302 cross-model verification handoff packet doc', () => {
  it('documents handoff session, release state, arc summary, and stop condition', async () => {
    const source = await readFile(join(process.cwd(), PHASE_302_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 302');
    expect(source).toContain('Cross-Model Verification Handoff Packet');
    expect(source).toContain('cross-model verification handoff');
    expect(source).toContain('18c57846c92f5a3f0fb16b01604c7cc3ba83e546');
    expect(source).toContain(PHASE_273_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_278_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_280_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_297_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_298_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_299_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_300_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_301_DOC.replace('docs/', './'));

    for (const gate of [
      'Manual release preparation approved',
      'Operator release execution authorized',
      'Actual deployment',
      'Formal launch',
      'NOT EXECUTED',
      'NOT COMPLETED',
      'No deploy scripts added',
      'No production configuration changed',
      'No runtime/API/DB/migration changes',
      'Phase 265–301',
      'Phase 297',
      'mobile 375px spot-check PASS',
      'Phase 298',
      'share/keyboard/reduced-motion regression PASS',
      'Phase 299',
      'static fallback vs runtime copy drift PASS',
      'Phase 300',
      'demo vs live boundary PASS',
      'Phase 301',
      'final pre-release gate checklist PASS',
      'BL-286-02',
      'dual copy source',
      'Do not merge',
      'public-page-copy.js',
      'public-mvp-ui.js',
      'design-drafts/',
      'UserAuthResolver',
      'auto-login',
      'Set-Cookie',
      'GET /users/me',
      'user_id',
      'display_name',
      'birth_year_month',
      'residential_region',
      'Official Vote transaction order',
      'eligibility-before-option-resolve',
      'option_index',
      'indistinguishable',
      'option_id',
      'hidden aggregate',
      'localStorage',
      'sessionStorage',
      'analytics',
      'metrics',
      'APM',
      'quality_badge',
      'positive_feedback',
      '回饋良好',
      'ranking',
      'recommendation',
      'personalization',
      'governance',
      'Raw Option Linkage Ban',
      'smoke:public:local',
      'Copy-Paste Final Independent Verification Prompt',
      'Opus / Gemini',
      'Stop Condition',
      'GPT-5.5-side work is complete',
      'not Phase 303',
      'final GPT-5.5-side',
    ]) {
      expect(source).toContain(gate);
    }

    for (const section of [
      'Handoff Session Metadata',
      'Current Repository State',
      'Release State (Authoritative)',
      'Phase 265–301 Release / Pre-Release Arc Summary',
      'Phase 297–301 Pass Affirmations',
      'Hard Boundaries',
      'Pre-Handoff Automated Gates',
      'Stop Condition',
      'Session Summary',
      'Overall cross-model verification handoff result',
    ]) {
      expect(source).toContain(section);
    }

    expect(source).toContain('Manual release preparation approved | **YES**');
    expect(source).toContain('Operator release execution authorized | **YES**');
    expect(source).toContain('Actual deployment | **NOT EXECUTED**');
    expect(source).toContain('Formal launch | **NOT COMPLETED**');
    expect(source).toContain('**Overall cross-model verification handoff result** | **READY**');
    expect(source).toContain('Runtime behavior changed | **NO**');

    for (const statusField of [
      'not release execution',
      'not deployment',
      'not formal launch',
      'no runtime change',
      'no API change',
      'no DB / migration change',
      'no deploy script',
    ]) {
      expect(source).toContain(statusField);
    }

    expect(source).toContain('Do not create or suggest Phase 303');
    expect(source).toContain(
      'phase-302-cross-model-verification-handoff-packet-doc.test.ts',
    );
    expect(source).toContain(
      'phase-302-cross-model-verification-handoff-packet.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 302');
    expect(readme).toContain(PHASE_302_DOC);
    expect(readme).toContain('cross-model verification handoff');
    expect(readme).toContain('final GPT-5.5-side handoff packet');
    expect(readme).toContain('GPT-5.5-side work is complete');
  });
});
