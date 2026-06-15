import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const PHASE_268_DOC =
  'docs/www-project-phase-268-public-mvp-manual-qa-runbook-execution-plan-v1.md';
const PHASE_270_DOC =
  'docs/www-project-phase-270-public-mvp-manual-qa-execution-record-v1.md';
const PHASE_271_DOC =
  'docs/www-project-phase-271-public-mvp-manual-qa-pass-review-freeze-candidate-checkpoint-v1.md';
const PHASE_291_DOC =
  'docs/www-project-phase-291-public-mvp-backlog-reprioritization-checkpoint-v1.md';
const PHASE_292_DOC =
  'docs/www-project-phase-292-public-mvp-manual-qa-follow-up-execution-record-v1.md';
const PHASE_293_DOC =
  'docs/www-project-phase-293-public-mvp-post-release-monitoring-notes-draft-v1.md';

const PUBLIC_HTML_SHELLS = [
  'public/index.html',
  'public/explore.html',
  'public/faq.html',
  'public/login.html',
  'public/registration.html',
  'public/profile.html',
  'public/create-poll.html',
  'public/my-polls.html',
  'public/vote.html',
  'public/results.html',
] as const;

const PROTECTED_BACKEND_PATHS = [
  'src/polls/repository.ts',
  'src/http/official-vote-routes.ts',
  'src/http/registration-routes.ts',
  'src/http/login-session-routes.ts',
  'src/http/user-profile-routes.ts',
  'src/auth/user-auth-resolver.ts',
] as const;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 293 public MVP post-release monitoring notes draft', () => {
  it('confirms monitoring draft exists with README index and prior QA context', async () => {
    const runbook = await readFile(join(process.cwd(), PHASE_268_DOC), 'utf8');
    const priorRecord = await readFile(join(process.cwd(), PHASE_270_DOC), 'utf8');
    const freezeCheckpoint = await readFile(join(process.cwd(), PHASE_271_DOC), 'utf8');
    const checkpoint291 = await readFile(join(process.cwd(), PHASE_291_DOC), 'utf8');
    const record292 = await readFile(join(process.cwd(), PHASE_292_DOC), 'utf8');
    const draft = await readFile(join(process.cwd(), PHASE_293_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(runbook).toContain('Manual QA Runbook');
    expect(priorRecord).toContain('Overall session result');
    expect(freezeCheckpoint).toContain('freeze candidate');
    expect(checkpoint291).toContain('BL-282-01');
    expect(record292).toContain('**Overall session result:** **PASS**');
    expect(draft).toContain('Phase 293');
    expect(draft).toContain('monitoring notes draft');
    expect(draft).toContain('does not execute release');
    expect(draft).toContain('does not deploy');
    expect(draft).toContain('74914b4');
    expect(readme).toContain('Phase 293');
    expect(readme).toContain(PHASE_293_DOC);
  });

  it('keeps Phase 293 as docs-only without runtime or HTML delivery markers', async () => {
    for (const relativePath of PUBLIC_HTML_SHELLS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 293');
      expect(source, relativePath).not.toContain('Phase 294');
    }

    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 293');
    }

    const migrationDir = join(process.cwd(), 'migrations');
    const migrationFiles = await readdir(migrationDir);
    for (const fileName of migrationFiles) {
      const source = await readFile(join(migrationDir, fileName), 'utf8');
      expect(source, `migrations/${fileName}`).not.toContain('Phase 293');
    }
  });

  it('aligns monitoring draft smoke routes with current public boundary modules', async () => {
    const draft = await readFile(join(process.cwd(), PHASE_293_DOC), 'utf8');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const resultPage = await loadModule('public/frontend/result-page.js');

    expect(draft).toContain('目前沒有可瀏覽的公開問卷。');
    expect(publicUi.PUBLIC_EXPLORE_EMPTY_MESSAGE).toBe('目前沒有可瀏覽的公開問卷。');
    expect(draft).toContain('本產品尚未正式對外上線');
    expect(draft).toContain('不代表一定可以完成投票');
    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);

    const collecting = resultPage.normalizeDisplaySafeResult({
      public_lifecycle_state: 'collecting',
      options: [{ display_label: 'A' }],
      total_votes_display: '總計 100 票',
    });
    expect(collecting?.mode).toBe('collecting');
  });

  it('records FU-292-01 optional spot-check and FU-292-02 no-merge policy in draft', async () => {
    const draft = await readFile(join(process.cwd(), PHASE_293_DOC), 'utf8');

    expect(draft).toContain('FU-292-01');
    expect(draft).toContain('375px');
    expect(draft).toContain('operator optional spot-check');
    expect(draft).toContain('FU-292-02');
    expect(draft).toContain('BL-286-02');
    expect(draft).toContain('public-page-copy.js');
    expect(draft).toContain('public-mvp-ui.js');
    expect(draft).toContain('no ad hoc constant merge');
    expect(draft).toContain('NOT EXECUTED');
    expect(draft).not.toContain('launch completed');
    expect(draft).not.toContain('deployment executed');
  });
});
