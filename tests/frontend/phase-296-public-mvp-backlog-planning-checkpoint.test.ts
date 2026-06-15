import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_291_DOC =
  'docs/www-project-phase-291-public-mvp-backlog-reprioritization-checkpoint-v1.md';
const PHASE_292_DOC =
  'docs/www-project-phase-292-public-mvp-manual-qa-follow-up-execution-record-v1.md';
const PHASE_293_DOC =
  'docs/www-project-phase-293-public-mvp-post-release-monitoring-notes-draft-v1.md';
const PHASE_294_DOC =
  'docs/www-project-phase-294-public-mvp-documentation-archive-phase-index-maintenance-v1.md';
const PHASE_295_DOC =
  'docs/www-project-phase-295-vote-page-error-ux-evaluation-plan-v1.md';
const PHASE_296_DOC =
  'docs/www-project-phase-296-public-mvp-backlog-planning-checkpoint-v1.md';

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

describe('Phase 296 public MVP backlog planning checkpoint', () => {
  it('confirms Phase 296 checkpoint consolidates Phase 291–295 with README index', async () => {
    const checkpoint291 = await readFile(join(process.cwd(), PHASE_291_DOC), 'utf8');
    const record292 = await readFile(join(process.cwd(), PHASE_292_DOC), 'utf8');
    const draft293 = await readFile(join(process.cwd(), PHASE_293_DOC), 'utf8');
    const maintenance294 = await readFile(join(process.cwd(), PHASE_294_DOC), 'utf8');
    const plan295 = await readFile(join(process.cwd(), PHASE_295_DOC), 'utf8');
    const checkpoint296 = await readFile(join(process.cwd(), PHASE_296_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(checkpoint291).toContain('backlog reprioritization checkpoint complete');
    expect(record292).toContain('**Overall session result:** **PASS**');
    expect(draft293).toContain('for use **after** W-1');
    expect(maintenance294).toContain('BL-282-08');
    expect(plan295).toContain('BL-282-06');
    expect(plan295).toContain('does not implement');
    expect(checkpoint296).toContain('Phase 296');
    expect(checkpoint296).toContain('2a40205');
    expect(checkpoint296).toContain('Phases 291–295 sealed');
    expect(readme).toContain('Phase 296');
    expect(readme).toContain(PHASE_296_DOC);
    expect(readme).toContain('Public MVP release documentation arcs (Phase 265–297)');
  });

  it('keeps Phase 296 as docs-only without runtime or HTML delivery markers', async () => {
    for (const relativePath of PUBLIC_HTML_SHELLS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 296');
      expect(source, relativePath).not.toContain('Phase 297');
    }

    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 296');
    }

    const migrationDir = join(process.cwd(), 'migrations');
    const migrationFiles = await readdir(migrationDir);
    for (const fileName of migrationFiles) {
      const source = await readFile(join(migrationDir, fileName), 'utf8');
      expect(source, `migrations/${fileName}`).not.toContain('Phase 296');
    }
  });

  it('records Phase 295 plan-only gate and next-phase risk tiers in checkpoint doc', async () => {
    const checkpoint296 = await readFile(join(process.cwd(), PHASE_296_DOC), 'utf8');

    expect(checkpoint296).toContain('plan-only — does not authorize runtime implementation');
    expect(checkpoint296).toContain('separate numbered high-risk implementation phase');
    expect(checkpoint296).toContain('L-296-01');
    expect(checkpoint296).toContain('M-296-01');
    expect(checkpoint296).toContain('H-296-01');
    expect(checkpoint296).toContain('FU-292-01');
    expect(checkpoint296).toContain('BL-286-02');
    expect(checkpoint296).toContain('NO — NOT EXECUTED');
    expect(checkpoint296).toContain('NO — NOT COMPLETED');
    expect(checkpoint296).not.toContain('deployment has been executed');
    expect(checkpoint296).not.toContain('formal launch has been completed');
  });

  it('indexes backlog planning arc topics in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    for (const topic of [
      'backlog planning arc',
      'Vote error UX evaluation (plan-only)',
      'Backlog planning checkpoint sealed',
      'vote-page error UX evaluation plan',
      'plan-only',
    ]) {
      expect(readme).toContain(topic);
    }

    expect(readme).toContain('NOT EXECUTED');
    expect(readme).toContain('NOT COMPLETED');
    expect(readme).not.toContain('launch completed');
    expect(readme).not.toContain('deployment executed');
  });
});
