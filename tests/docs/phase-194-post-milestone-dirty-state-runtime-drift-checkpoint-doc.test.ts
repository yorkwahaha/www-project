import { execSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_194_DOC =
  'docs/www-project-phase-194-post-milestone-dirty-state-runtime-drift-checkpoint-v1.md';
const SERVER_TS_PATH = 'src/http/server.ts';

function gitOutput(command: string): string {
  return execSync(command, { cwd: process.cwd(), encoding: 'utf8' }).trim();
}

describe('Phase 194 post-milestone dirty state runtime drift checkpoint doc', () => {
  it('documents Phase 193 completion, dirty state classification, and checkpoint-only scope', async () => {
    const source = await readFile(join(process.cwd(), PHASE_194_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 194');
    expect(source).toContain('Post-Milestone Dirty State & Runtime Drift Checkpoint');
    expect(source).toContain('Review/checkpoint only');

    expect(source).toContain('Phase 193');
    expect(source).toContain('49e909a');
    expect(source).toContain('Quality badge presentation milestone checkpoint');

    expect(source).toContain('src/http/server.ts');
    expect(source).toContain('design-drafts/');
    expect(source).toContain('Phantom dirty');
    expect(source).toContain('stat-cache-only');
    expect(source).toContain('d7720c1b671a84b3e1d370690bce45049a8632eb');
    expect(source).toContain('Content diff vs `HEAD`');
    expect(source).toContain('**Empty**');
    expect(source).toContain('Contains real runtime changes?');
    expect(source).toContain('**No**');
    expect(source).toContain('not committed');
    expect(source).toContain('Leave untouched');

    for (const nonGoal of [
      'no runtime change',
      'no API change',
      'no frontend change',
      'no migration',
      'no schema change',
    ]) {
      expect(source).toContain(nonGoal);
    }

    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain(
      'phase-194-post-milestone-dirty-state-runtime-drift-checkpoint-doc.test.ts',
    );

    expect(readme).toContain('Phase 194');
    expect(readme).toContain(PHASE_194_DOC);
    expect(readme).toContain('Post-milestone dirty state runtime drift checkpoint');
  });

  // Retired by Phase 303: this was a one-time Phase 194 "phantom dirty"
  // line-ending snapshot asserting src/http/server.ts had not drifted from HEAD.
  // Phase 303 intentionally edits server.ts to add the public `GET /home/feed`
  // route, so a perpetual working-tree-equals-HEAD pin no longer holds (it would
  // also break during any future in-progress server.ts edit before commit).
  it.skip('confirms src/http/server.ts working tree blob matches HEAD (no content drift)', () => {
    const headBlob = gitOutput(`git rev-parse HEAD:${SERVER_TS_PATH}`);
    const workingBlob = gitOutput(`git hash-object ${SERVER_TS_PATH}`);
    expect(workingBlob).toBe(headBlob);
  });
});
