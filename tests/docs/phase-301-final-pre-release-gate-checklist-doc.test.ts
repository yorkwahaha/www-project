import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_273_DOC =
  'docs/www-project-phase-273-public-mvp-launch-approval-decision-record-v1.md';
const PHASE_278_DOC =
  'docs/www-project-phase-278-public-mvp-manual-release-execution-authorization-record-v1.md';
const PHASE_280_DOC =
  'docs/www-project-phase-280-public-mvp-release-authorization-not-executed-status-final-checkpoint-v1.md';
const PHASE_300_DOC =
  'docs/www-project-phase-300-demo-vs-live-boundary-final-review-v1.md';
const PHASE_301_DOC =
  'docs/www-project-phase-301-final-pre-release-gate-checklist-v1.md';

describe('Phase 301 final pre-release gate checklist doc', () => {
  it('documents gate checklist session, explicit gates, and PASS conclusion', async () => {
    const source = await readFile(join(process.cwd(), PHASE_301_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 301');
    expect(source).toContain('Final Pre-Release Gate Checklist');
    expect(source).toContain('pre-release gate checklist');
    expect(source).toContain('34eb3e6');
    expect(source).toContain(PHASE_273_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_278_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_280_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_300_DOC.replace('docs/', './'));

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
      'UserAuthResolver',
      'registration/login/session',
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
      'Phase 300',
      'demo vs live boundary',
      'BL-286-02',
      'dual copy source',
      'design-drafts/',
      'Raw Option Linkage Ban',
      'smoke:public:local',
    ]) {
      expect(source).toContain(gate);
    }

    for (const section of [
      'Checklist Session Metadata',
      'Pre-Checklist Automated Gates',
      'Final Pre-Release Gate Checklist',
      'Release state gates',
      'Auth / session gates',
      'Vote / result / privacy gates',
      'Session Summary',
      'Overall pre-release gate checklist result',
    ]) {
      expect(source).toContain(section);
    }

    expect(source).toContain('Manual release preparation approved | **YES**');
    expect(source).toContain('Operator release execution authorized | **YES**');
    expect(source).toContain('Actual deployment | **NOT EXECUTED**');
    expect(source).toContain('Formal launch | **NOT COMPLETED**');
    expect(source).toContain('**Overall pre-release gate checklist result** | **PASS**');
    expect(source).toContain('**FAIL** | 0');
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

    expect(source).toContain('Phase 302 blockers: none identified');
    expect(source).toContain(
      'phase-301-final-pre-release-gate-checklist-doc.test.ts',
    );
    expect(source).toContain(
      'phase-301-final-pre-release-gate-checklist.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 301');
    expect(readme).toContain(PHASE_301_DOC);
    expect(readme).toContain('pre-release gate');
    expect(readme).toContain('Phase 302 blockers: none identified');
  });
});
