import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const PHASE_110_DOC =
  'docs/www-project-phase-110-vote-ux-error-handling-polish-plan-v1.md';
const PHASE_112_DOC =
  'docs/www-project-phase-112-vote-ux-error-handling-runtime-review-checkpoint-v1.md';
const PHASE_295_DOC =
  'docs/www-project-phase-295-vote-page-error-ux-evaluation-plan-v1.md';

const VOTE_RUNTIME_MODULES = [
  'public/frontend/vote-page.js',
  'public/frontend/official-vote-pre-vote-hints.js',
  'public/frontend/public-mvp-ui.js',
] as const;

const PROTECTED_BACKEND_PATHS = [
  'src/polls/repository.ts',
  'src/http/official-vote-routes.ts',
  'src/auth/user-auth-resolver.ts',
] as const;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 295 vote-page error UX evaluation plan', () => {
  it('confirms evaluation plan exists with prior vote UX context and README index', async () => {
    const plan110 = await readFile(join(process.cwd(), PHASE_110_DOC), 'utf8');
    const checkpoint112 = await readFile(join(process.cwd(), PHASE_112_DOC), 'utf8');
    const evaluation = await readFile(join(process.cwd(), PHASE_295_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(plan110).toContain('Scenario Catalog');
    expect(checkpoint112).toContain('single neutral denial bucket');
    expect(evaluation).toContain('Phase 295');
    expect(evaluation).toContain('BL-282-06');
    expect(evaluation).toContain('plan-only');
    expect(evaluation).toContain('does not implement');
    expect(evaluation).toContain('62959e9');
    expect(readme).toContain('Phase 295');
    expect(readme).toContain(PHASE_295_DOC);
  });

  it('keeps Phase 295 as plan-only without runtime delivery markers', async () => {
    for (const relativePath of VOTE_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 295');
      expect(source, relativePath).not.toContain('Phase 296');
    }

    const voteHtml = await readFile(join(process.cwd(), 'public/vote.html'), 'utf8');
    expect(voteHtml).not.toContain('Phase 295');

    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 295');
    }

    const migrationDir = join(process.cwd(), 'migrations');
    const migrationFiles = await readdir(migrationDir);
    for (const fileName of migrationFiles) {
      const source = await readFile(join(migrationDir, fileName), 'utf8');
      expect(source, `migrations/${fileName}`).not.toContain('Phase 295');
    }
  });

  it('records current runtime neutral submit bucketing without changing behavior', async () => {
    const evaluation = await readFile(join(process.cwd(), PHASE_295_DOC), 'utf8');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const preVote = await loadModule('public/frontend/official-vote-pre-vote-hints.js');

    expect(evaluation).toContain('GENERIC_VOTE_SUBMIT_FAILURE');
    expect(evaluation).toContain('eligibility-before-option-resolve');
    expect(publicUi.messageForVoteSubmitFailure()).toBe(publicUi.GENERIC_VOTE_SUBMIT_FAILURE);
    expect(preVote.PRE_VOTE_HINT_COPY.anonymous).toBeTruthy();
    expect(preVote.PRE_VOTE_HINT_COPY.incompleteProfile).toBeTruthy();
    expect(preVote.PRE_VOTE_HINT_COPY.completeProfile).toContain('不代表一定可以完成投票');
  });

  it('documents ineligible vs invalid index indistinguishability and non-implementation deferral', async () => {
    const evaluation = await readFile(join(process.cwd(), PHASE_295_DOC), 'utf8');

    expect(evaluation).toContain('Must remain indistinguishable');
    expect(evaluation).toContain('FORBIDDEN');
    expect(evaluation).toContain('separate numbered phase');
    expect(evaluation).toContain('NOT EXECUTED');
    expect(evaluation).toContain('NOT COMPLETED');
    expect(evaluation).not.toContain('implementation complete');
    expect(evaluation).not.toContain('runtime polish applied');
  });
});
