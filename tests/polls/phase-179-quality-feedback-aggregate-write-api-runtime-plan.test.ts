import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_179_DOC =
  'docs/www-project-phase-179-quality-feedback-aggregate-write-api-runtime-plan-v1.md';

const PROTECTED_RUNTIME_PATHS = [
  'src/http/official-vote-routes.ts',
  'src/http/reference-answer-routes.ts',
  'src/http/poll-routes.ts',
  'src/http/login-session-routes.ts',
  'src/http/user-profile-routes.ts',
  'src/auth/user-auth-resolver.ts',
  'src/polls/service.ts',
  'src/polls/repository.ts',
] as const;

describe('Phase 179 quality feedback aggregate write API runtime plan guard', () => {
  it('documents future write API as feedback_tag-only body and aggregate-only increment', async () => {
    const source = await readFile(join(process.cwd(), PHASE_179_DOC), 'utf8');

    expect(source).toContain('POST /polls/:pollId/quality-feedback');
    expect(source).toContain('body must be limited to exactly one field');
    expect(source).toContain('{ "feedback_tag": "表達清楚" }');
    expect(source).toContain('validate only `pollId` and `feedback_tag`');
    expect(source).toContain('increment only `(poll_id, feedback_tag)`');
    expect(source).toContain('poll_quality_feedback_aggregate');
  });

  it('documents forbidden request, linkage, duplicate-prevention, and response surfaces', async () => {
    const source = await readFile(join(process.cwd(), PHASE_179_DOC), 'utf8');

    for (const requiredBoundary of [
      'option_id',
      'option_index',
      'user_id',
      'session_id',
      'creator_session',
      'vote_token',
      'request_id',
      'device / IP / UA',
      'trace / metric / error / analytics id',
      'selected option',
      'not create a per-user feedback event table',
      'not do user/session/device/request dedup',
      'must not secretly add user/session/device/request linkage',
      'response must not include',
      'aggregate_count',
      'threshold_state',
      'bucket_state',
      'ranking signal',
      'creator score',
    ]) {
      expect(source).toContain(requiredBoundary);
    }
  });

  it('confirms Phase 179 does not add migration or runtime implementation files', async () => {
    const migrationFiles = await readdir(join(process.cwd(), 'migrations'));
    expect(migrationFiles).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/phase179/i)]),
    );

    const srcFiles = await collectSourceFiles(join(process.cwd(), 'src'));
    const combined = await Promise.all(
      srcFiles.map((file) => readFile(file, 'utf8')),
    );
    const source = combined.join('\n').toLowerCase();

    expect(source).not.toContain('/quality-feedback');
    expect(source).not.toContain('quality-feedback');
    expect(source).not.toContain('quality_feedback');
    expect(source).not.toMatch(/\bfeedback_tag\b/);
  });

  it('confirms protected vote, auth, result, profile, and Reference Answer files remain feedback-free', async () => {
    for (const relativePath of PROTECTED_RUNTIME_PATHS) {
      const source = (await readFile(join(process.cwd(), relativePath), 'utf8')).toLowerCase();
      expect(source, relativePath).not.toContain('/quality-feedback');
      expect(source, relativePath).not.toContain('quality-feedback');
      expect(source, relativePath).not.toContain('quality_feedback');
      expect(source, relativePath).not.toMatch(/\bfeedback_tag\b/);
    }
  });

  it('documents preserved vote, auth, result, eligibility, Reference Answer, and profile boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_179_DOC), 'utf8');

    for (const preserved of [
      'Official Vote transaction order',
      '`vote-by-index` body `{ option_index }`',
      'eligibility-before-option-resolve',
      'vote token schema `user_id + poll_id`',
      'counter schema `poll_id + option_id + shard_id`',
      'result visibility',
      'auth',
      'profile fields',
      'Reference Answer',
      'UserAuthResolver',
    ]) {
      expect(source).toContain(preserved);
    }
  });
});

async function collectSourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(fullPath)));
      continue;
    }
    if (/\.(ts|js|mjs)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}
