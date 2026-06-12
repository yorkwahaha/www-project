import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_177_MIGRATION =
  'migrations/012_phase177_quality_feedback_aggregate_foundation.sql';

const MVP_FEEDBACK_TAGS = [
  '表達清楚',
  '選項公平',
  '值得思考',
  '期待結果',
  '題目不優',
] as const;

async function readPhase177Migration(): Promise<string> {
  return readFile(join(process.cwd(), PHASE_177_MIGRATION), 'utf8');
}

function extractCreateTable(sql: string, tableName: string): string {
  const table = sql
    .toLowerCase()
    .match(new RegExp(`create\\s+table\\s+${tableName}\\s*\\(([\\s\\S]*?)\\);`))?.[1];

  expect(table).toBeTruthy();
  return table!;
}

describe('Phase 177 quality feedback aggregate schema guard', () => {
  it('creates the minimal poll-level aggregate table with DB constraints', async () => {
    const migration = await readPhase177Migration();
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
    expect(table).toMatch(/updated_at\s+timestamptz\s+not\s+null/);
    expect(table).toMatch(/updated_at\s+timestamptz\s+not\s+null\s+default\s+now\s*\(\s*\)/);
    expect(table).toContain('poll_quality_feedback_aggregate_feedback_tag_check');
    expect(table).toContain('poll_quality_feedback_aggregate_count_check');
    expect(table).toMatch(/check\s*\(\s*aggregate_count\s*>=\s*0\s*\)/);
    expect(table).toMatch(/unique\s*\(\s*poll_id\s*,\s*feedback_tag\s*\)/);
  });

  it('references poll identity only and has no forbidden linkage columns', async () => {
    const migration = await readPhase177Migration();
    const table = extractCreateTable(migration, 'poll_quality_feedback_aggregate');

    expect(table).toMatch(/references\s+polls\s*\(\s*id\s*\)/);
    for (const forbiddenReference of [
      'poll_options',
      'users',
      'user_sessions',
      'creator_sessions',
      'poll_vote_tokens',
      'poll_option_vote_counters',
      'logs',
      'traces',
      'metrics',
      'errors',
      'analytics',
    ]) {
      expect(table).not.toMatch(
        new RegExp(`references\\s+${forbiddenReference}\\b`),
      );
    }

    for (const forbiddenColumn of [
      'threshold_state',
      'bucket_state',
      'user_id',
      'session_id',
      'creator_session',
      'vote_token',
      'shard_id',
      'option_id',
      'option_index',
      'selected_option',
      'request_id',
      'device',
      'ip_address',
      'user_agent',
      'trace_id',
      'metric_id',
      'error_id',
      'analytics_id',
      'ranking_id',
      'creator_punishment_score',
    ]) {
      expect(table).not.toContain(forbiddenColumn);
    }
  });

  it('allows only the five MVP quality feedback tags at DB level', async () => {
    const migration = await readPhase177Migration();
    const table = extractCreateTable(migration, 'poll_quality_feedback_aggregate');
    const feedbackTagCheck = table.match(
      /feedback_tag\s+in\s*\(([\s\S]*?)\)\s*\)/,
    )?.[1];

    expect(feedbackTagCheck).toBeTruthy();
    const allowedTags = [...feedbackTagCheck!.matchAll(/'([^']+)'/g)].map(
      (match) => match[1],
    );
    expect(allowedTags).toEqual([...MVP_FEEDBACK_TAGS]);
  });

  it('does not introduce deferred state, event tables, or runtime-adjacent schema', async () => {
    const lower = (await readPhase177Migration()).toLowerCase();
    const createdTables = [...lower.matchAll(/create\s+table\s+(\w+)/g)].map(
      (match) => match[1],
    );

    expect(createdTables).toEqual(['poll_quality_feedback_aggregate']);
    for (const forbidden of [
      'threshold_state',
      'bucket_state',
      'poll_quality_feedback_events',
      'poll_quality_feedback_event',
      'quality_feedback_events',
      'quality_feedback_event',
      'feedback_logs',
      'feedback_metrics',
      'feedback_analytics',
      'feedback_dashboard',
      'ranking_personalization',
      'creator_punishment',
    ]) {
      expect(lower).not.toContain(forbidden);
    }
  });
});
