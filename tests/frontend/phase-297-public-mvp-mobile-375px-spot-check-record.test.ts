import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_292_DOC =
  'docs/www-project-phase-292-public-mvp-manual-qa-follow-up-execution-record-v1.md';
const PHASE_296_DOC =
  'docs/www-project-phase-296-public-mvp-backlog-planning-checkpoint-v1.md';
const PHASE_297_DOC =
  'docs/www-project-phase-297-public-mvp-mobile-375px-spot-check-record-v1.md';

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
  'src/auth/user-auth-resolver.ts',
] as const;

describe('Phase 297 public MVP mobile 375px spot-check record', () => {
  it('confirms Phase 297 record exists with FU-292-01 closure and README index', async () => {
    const record292 = await readFile(join(process.cwd(), PHASE_292_DOC), 'utf8');
    const checkpoint296 = await readFile(join(process.cwd(), PHASE_296_DOC), 'utf8');
    const record297 = await readFile(join(process.cwd(), PHASE_297_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(record292).toContain('FU-292-01');
    expect(checkpoint296).toContain('M-296-01');
    expect(checkpoint296).toContain('FU-292-01');
    expect(record297).toContain('Phase 297');
    expect(record297).toContain('89f6c8d');
    expect(record297).toContain('CLOSED — spot-check PASS');
    expect(record297).toContain('Overall mobile 375px spot-check result');
    expect(readme).toContain('Phase 297');
    expect(readme).toContain(PHASE_297_DOC);
  });

  it('keeps Phase 297 as QA record only without runtime or HTML delivery markers', async () => {
    for (const relativePath of PUBLIC_HTML_SHELLS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 297');
      expect(source, relativePath).not.toContain('Phase 298');
    }

    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 297');
    }

    const migrationDir = join(process.cwd(), 'migrations');
    const migrationFiles = await readdir(migrationDir);
    for (const fileName of migrationFiles) {
      const source = await readFile(join(migrationDir, fileName), 'utf8');
      expect(source, `migrations/${fileName}`).not.toContain('Phase 297');
    }
  });

  it('records PASS per-route results and no layout/CSS changes in Phase 297 doc', async () => {
    const record297 = await readFile(join(process.cwd(), PHASE_297_DOC), 'utf8');

    expect(record297).toContain('no CSS / layout change');
    expect(record297).toContain('no copy change');
    expect(record297).toContain('demo:public:local');
    expect(record297).toContain('375px');
    expect(record297).toContain('Per-route section:** all **PASS**');
    expect(record297).toContain('hidden aggregate');
    expect(record297).toContain('quality_badge');
    expect(record297).toContain('NOT EXECUTED');
    expect(record297).toContain('NOT COMPLETED');
    expect(record297).not.toContain('layout fix applied');
    expect(record297).not.toContain('CSS changed');
  });

  it('indexes mobile spot-check in README without claiming deployment', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(readme).toContain('mobile 375px');
    expect(readme).toContain('FU-292-01');
    expect(readme).toContain('NOT EXECUTED');
    expect(readme).toContain('NOT COMPLETED');
    expect(readme).not.toContain('launch completed');
    expect(readme).not.toContain('deployment executed');
  });
});
