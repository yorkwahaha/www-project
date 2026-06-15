import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_260_DOC =
  'docs/www-project-phase-260-public-static-html-shell-copy-alignment-v1.md';

describe('Phase 260 public static HTML shell copy alignment doc', () => {
  it('documents delivery scope, allowlist, checklist, and explicit non-goals', async () => {
    const source = await readFile(join(process.cwd(), PHASE_260_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 260');
    expect(source).toContain('Public Static HTML Shell Copy Alignment');
    expect(source).toContain('Phase 259');
    expect(source).toContain('Phase 257');
    expect(source).toContain('public-page-copy.js');

    for (const shell of [
      'index.html',
      'login.html',
      'vote.html',
      'results.html',
      'create-poll.html',
      'my-polls.html',
      'registration.html',
      'profile.html',
      'explore.html',
      'trust-levels.html',
      'faq.html',
    ]) {
      expect(source).toContain(shell);
    }

    for (const item of [
      'minimal static HTML shell fallback copy alignment',
      '優質題目',
      'X-User-Id',
      'creator_session',
      'PUBLIC_HOME_HERO_LEAD',
      'PUBLIC_LOGIN_PAGE_LEAD_SECONDARY',
      'PUBLIC_VOTE_POLICY_QUALITY_FEEDBACK_TEXT',
      'PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD',
      'option_index',
      'eligibility-before-option-resolve',
      'Raw Option Linkage Ban',
      'quality_badge',
      'positive_feedback',
      '回饋良好',
      'does not call `GET /users/me` after success',
      'birth_year_month',
      'residential_region',
      'Validation Checklist',
    ]) {
      expect(source).toContain(item);
    }

    for (const nonGoal of [
      'public/frontend/*.js',
      'public-mvp.css',
      'API / DB / backend',
      'localStorage',
      'sessionStorage',
      'analytics / APM / debug tracking',
      'Option choice + user/session/device/request/log/trace/metric/error linkage',
      'design-drafts/',
    ]) {
      expect(source).toContain(nonGoal);
    }

    expect(source).toContain(
      'phase-260-public-static-html-shell-copy-alignment-doc.test.ts',
    );
    expect(source).toContain('phase-260-public-static-html-shell-copy-alignment.test.ts');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 260');
    expect(readme).toContain(PHASE_260_DOC);
    expect(readme).toContain('static HTML shell');
  });
});
