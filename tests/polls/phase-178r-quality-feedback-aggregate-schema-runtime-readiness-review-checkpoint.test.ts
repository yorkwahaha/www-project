import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_177_MIGRATION =
  'migrations/012_phase177_quality_feedback_aggregate_foundation.sql';
const PHASE_178R_DOC =
  'docs/www-project-phase-178r-quality-feedback-aggregate-schema-runtime-readiness-review-checkpoint-v1.md';

const MVP_FEEDBACK_TAGS = [
  '表達清楚',
  '選項公平',
  '值得思考',
  '期待結果',
  '題目不優',
] as const;

const OFFICIAL_VOTE_MIGRATION = 'migrations/004_phase3_official_vote.sql';

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

function extractCreateTable(sql: string, tableName: string): string {
  const table = sql
    .toLowerCase()
    .match(new RegExp(`create\\s+table\\s+${tableName}\\s*\\(([\\s\\S]*?)\\);`))?.[1];

  expect(table).toBeTruthy();
  return table!;
}

describe('Phase 178-R quality feedback aggregate schema runtime readiness review checkpoint', () => {
  it('documents Phase 177 migration review and Phase 179 approval', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_178R_DOC), 'utf8');

    expect(doc).toContain('Phase 178-R');
    expect(doc).toContain('012_phase177_quality_feedback_aggregate_foundation.sql');
    expect(doc).toContain('**APPROVED**');
    expect(doc).toContain('Phase 179 aggregate write API/runtime planning');
    expect(doc).toContain('Phase 179 blockers: none identified');
  });

  it('confirms Phase 177 migration matches approved minimal aggregate shape', async () => {
    const migration = await readFile(join(process.cwd(), PHASE_177_MIGRATION), 'utf8');
    const lower = migration.toLowerCase();
    const table = extractCreateTable(migration, 'poll_quality_feedback_aggregate');

    expect(lower).toMatch(
      /create\s+table\s+poll_quality_feedback_aggregate\s*\(/,
    );
    expect(table).toMatch(
      /poll_id\s+uuid\s+not\s+null\s+references\s+polls\s*\(\s*id\s*\)/,
    );
    expect(table).toMatch(/feedback_tag\s+text\s+not\s+null/);
    expect(table).toMatch(/aggregate_count\s+bigint\s+not\s+null\s+default\s+0/);
    expect(table).toMatch(/updated_at\s+timestamptz\s+not\s+null\s+default\s+now\s*\(\s*\)/);
    expect(table).toMatch(/check\s*\(\s*aggregate_count\s*>=\s*0\s*\)/);
    expect(table).toMatch(/unique\s*\(\s*poll_id\s*,\s*feedback_tag\s*\)/);

    const feedbackTagCheck = table.match(/feedback_tag\s+in\s*\(([\s\S]*?)\)\s*\)/)?.[1];
    expect(feedbackTagCheck).toBeTruthy();
    const allowedTags = [...feedbackTagCheck!.matchAll(/'([^']+)'/g)].map(
      (match) => match[1],
    );
    expect(allowedTags).toEqual([...MVP_FEEDBACK_TAGS]);

    const createdTables = [...lower.matchAll(/create\s+table\s+(\w+)/g)].map(
      (match) => match[1],
    );
    expect(createdTables).toEqual(['poll_quality_feedback_aggregate']);
  });

  it('confirms Phase 177 migration has no forbidden linkage columns or tables', async () => {
    const migration = await readFile(join(process.cwd(), PHASE_177_MIGRATION), 'utf8');
    const table = extractCreateTable(migration, 'poll_quality_feedback_aggregate');
    const lower = migration.toLowerCase();

    for (const forbiddenReference of [
      'poll_options',
      'users',
      'user_sessions',
      'creator_sessions',
      'poll_vote_tokens',
      'poll_option_vote_counters',
    ]) {
      expect(table).not.toMatch(
        new RegExp(`references\\s+${forbiddenReference}\\b`),
      );
    }

    for (const forbidden of [
      'threshold_state',
      'bucket_state',
      'user_id',
      'session_id',
      'creator_session',
      'vote_token',
      'shard_id',
      'option_id',
      'option_index',
      'request_id',
      'trace_id',
      'metric_id',
      'error_id',
      'analytics_id',
      'ranking_id',
      'poll_quality_feedback_events',
      'poll_quality_feedback_event',
    ]) {
      expect(lower).not.toContain(forbidden);
    }
  });

  it('confirms no feedback runtime or API was added under src/', async () => {
    const srcFiles = await collectSourceFiles(join(process.cwd(), 'src'));
    const combined = await Promise.all(
      srcFiles.map((file) => readFile(file, 'utf8')),
    );
    const source = combined.join('\n').toLowerCase();

    expect(source).not.toContain('poll_quality_feedback_aggregate');
    expect(source).not.toContain('quality_feedback');
    expect(source).not.toMatch(/\bfeedback_tag\b/);
  });

  it('confirms protected vote, auth, result, and profile runtime files are feedback-free', async () => {
    for (const relativePath of PROTECTED_RUNTIME_PATHS) {
      const source = (await readFile(join(process.cwd(), relativePath), 'utf8')).toLowerCase();
      expect(source, relativePath).not.toContain('poll_quality_feedback_aggregate');
      expect(source, relativePath).not.toContain('quality_feedback');
      expect(source, relativePath).not.toMatch(/\bfeedback_tag\b/);
    }
  });

  it('confirms Official Vote migration was not modified by Phase 177', async () => {
    const officialVote = await readFile(
      join(process.cwd(), OFFICIAL_VOTE_MIGRATION),
      'utf8',
    );
    const table = officialVote.toLowerCase().match(
      /create\s+table\s+poll_vote_tokens\s*\(([\s\S]*?)\);/,
    )?.[1];

    expect(table).toBeTruthy();
    expect(table).toMatch(/unique\s*\(\s*user_id\s*,\s*poll_id\s*\)/);
    expect(officialVote.toLowerCase()).not.toContain('poll_quality_feedback_aggregate');
    expect(officialVote.toLowerCase()).not.toContain('feedback_tag');
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
