import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_284_DOC =
  'docs/www-project-phase-284-public-mvp-documentation-cleanup-release-docs-cross-link-implementation-v1.md';
const PHASE_291_DOC =
  'docs/www-project-phase-291-public-mvp-backlog-reprioritization-checkpoint-v1.md';
const PHASE_292_DOC =
  'docs/www-project-phase-292-public-mvp-manual-qa-follow-up-execution-record-v1.md';
const PHASE_293_DOC =
  'docs/www-project-phase-293-public-mvp-post-release-monitoring-notes-draft-v1.md';
const PHASE_294_DOC =
  'docs/www-project-phase-294-public-mvp-documentation-archive-phase-index-maintenance-v1.md';

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

const README_ARC_MARKERS = [
  'readiness arc',
  'manual QA arc',
  'launch decision arc',
  'operator release arc',
  'post-authorization backlog/docs arc',
  'post-copy polish arc',
  'backlog planning arc',
  'manual QA follow-up arc',
  'post-release monitoring arc',
] as const;

describe('Phase 294 public MVP documentation archive phase index maintenance', () => {
  it('confirms Phase 294 maintenance record exists with README arc extensions', async () => {
    const crossLink = await readFile(join(process.cwd(), PHASE_284_DOC), 'utf8');
    const checkpoint291 = await readFile(join(process.cwd(), PHASE_291_DOC), 'utf8');
    const record292 = await readFile(join(process.cwd(), PHASE_292_DOC), 'utf8');
    const draft293 = await readFile(join(process.cwd(), PHASE_293_DOC), 'utf8');
    const maintenance = await readFile(join(process.cwd(), PHASE_294_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(crossLink).toContain('readiness arc');
    expect(checkpoint291).toContain('BL-282-08');
    expect(record292).toContain('**Overall session result:** **PASS**');
    expect(draft293).toContain('monitoring notes draft');
    expect(maintenance).toContain('Phase 294');
    expect(maintenance).toContain('BL-282-08');
    expect(maintenance).toContain('does not execute release');
    expect(maintenance).toContain('does not deploy');
    expect(maintenance).toContain('1913ee0');
    expect(readme).toContain('Phase 294');
    expect(readme).toContain(PHASE_294_DOC);
    expect(readme).toContain('Public MVP release documentation arcs (Phase 265–299)');
    expect(readme).toContain('Post-authorization extension arcs (Phase 285–299)');
  });

  it('keeps Phase 294 as docs-only without runtime or HTML delivery markers', async () => {
    for (const relativePath of PUBLIC_HTML_SHELLS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 294');
      expect(source, relativePath).not.toContain('Phase 295');
    }

    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 294');
    }

    const migrationDir = join(process.cwd(), 'migrations');
    const migrationFiles = await readdir(migrationDir);
    for (const fileName of migrationFiles) {
      const source = await readFile(join(migrationDir, fileName), 'utf8');
      expect(source, `migrations/${fileName}`).not.toContain('Phase 294');
    }
  });

  it('indexes all required Phase 265–293 arcs in README topic lookup', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    for (const topic of [
      'Launch readiness',
      'Manual QA (initial **PASS**)',
      'Launch decision / approval',
      'Operator release / **NOT EXECUTED**',
      'Post-authorization backlog / docs cleanup',
      'Post-copy polish sealed',
      'Backlog reprioritization',
      'Manual QA follow-up **PASS**',
      'Post-release monitoring draft',
      'Full archive index',
    ]) {
      expect(readme).toContain(topic);
    }

    for (const marker of README_ARC_MARKERS) {
      expect(readme).toContain(marker);
    }

    expect(readme).toContain('NOT EXECUTED');
    expect(readme).toContain('NOT COMPLETED');
    expect(readme).not.toContain('launch completed');
    expect(readme).not.toContain('deployment executed');
  });

  it('records authoritative status and no delete/rename in Phase 294 doc', async () => {
    const maintenance = await readFile(join(process.cwd(), PHASE_294_DOC), 'utf8');

    expect(maintenance).toContain('No historical docs were deleted or renamed');
    expect(maintenance).toContain('Formal launch NOT COMPLETED');
    expect(maintenance).toContain('Phases 285–289 sealed');
    expect(maintenance).toContain('overall PASS');
    expect(maintenance).toContain('for use **after W-1**');
    expect(maintenance).toContain('Phase 295 blockers: none identified');
  });
});
