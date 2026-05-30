import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const MIGRATIONS_DIR = join(process.cwd(), 'migrations');

const FORBIDDEN_TABLES = [
  'vote_events',
  'raw_vote_events',
  'poll_status_snapshot',
  'reference_answer_option_counters',
  'reference_answer_events',
  'user_poll_option_links',
  'poll_vote_snapshots',
];

const FORBIDDEN_POLL_COLUMNS = [
  'current_result_snapshot',
  'current_vote_ratio_snapshot',
  'status_snapshot',
  'last_vote_option_id',
];

describe('Phase 3 migration schema guard', () => {
  it('does not introduce forbidden vote/counter/event tables', async () => {
    const files = (await readdir(MIGRATIONS_DIR)).filter((name) => name.endsWith('.sql'));
    const combined = await Promise.all(
      files.map((file) => readFile(join(MIGRATIONS_DIR, file), 'utf8')),
    );
    const sql = combined.join('\n').toLowerCase();

    for (const table of FORBIDDEN_TABLES) {
      expect(sql).not.toMatch(new RegExp(`create\\s+table\\s+${table}\\b`));
    }
  });

  it('official vote token stores participation metadata only', async () => {
    const phase3 = await readFile(
      join(MIGRATIONS_DIR, '004_phase3_official_vote.sql'),
      'utf8',
    );
    const table = phase3.toLowerCase().match(
      /create\s+table\s+poll_vote_tokens\s*\(([\s\S]*?)\);/,
    )?.[1];

    expect(table).toBeTruthy();
    expect(table).toMatch(/unique\s*\(\s*user_id\s*,\s*poll_id\s*\)/);
    expect(table).toContain("voted_at_minute = date_trunc('minute', voted_at_minute)");
    for (const forbidden of [
      'option_id',
      'encrypted_option_id',
      'option_text',
      'selected_option_index',
      'vote_snapshot',
      'result_snapshot',
      'eligibility_snapshot',
    ]) {
      expect(table).not.toContain(forbidden);
    }
  });

  it('official counter is aggregate-only and uses no SQL random shard selection', async () => {
    const phase3 = await readFile(
      join(MIGRATIONS_DIR, '004_phase3_official_vote.sql'),
      'utf8',
    );
    const lower = phase3.toLowerCase();
    const table = lower.match(
      /create\s+table\s+poll_option_vote_counters\s*\(([\s\S]*?)\);/,
    )?.[1];

    expect(table).toBeTruthy();
    expect(table).toMatch(
      /primary\s+key\s*\(\s*poll_id\s*,\s*option_id\s*,\s*shard_id\s*\)/,
    );
    expect(table).not.toContain('user_id');
    expect(table).not.toContain('session');
    expect(table).not.toContain('device');
    expect(lower).not.toMatch(/\brandom\s*\(/);
    expect(lower).not.toContain('vote_events');
  });

  it('reference answer token stores participation metadata only', async () => {
    const phase2 = await readFile(
      join(MIGRATIONS_DIR, '003_phase2_reference_answer_tokens.sql'),
      'utf8',
    );
    const lower = phase2.toLowerCase();
    const table = lower.match(
      /create\s+table\s+poll_reference_answer_tokens\s*\(([\s\S]*?)\);/,
    )?.[1];

    expect(table).toBeTruthy();
    expect(table).toContain('user_id');
    expect(table).toContain('poll_id');
    expect(table).toContain('answered_at');
    expect(table).toContain('expires_at');
    expect(table).toContain('created_at');
    expect(table).toMatch(/unique\s*\(\s*user_id\s*,\s*poll_id\s*\)/);
    expect(table).toContain("answered_at = date_trunc('minute', answered_at)");

    for (const forbidden of [
      'option_id',
      'encrypted_option_id',
      'option_text',
      'selected_option_index',
      'answer_payload',
      'answer_snapshot',
    ]) {
      expect(table).not.toContain(forbidden);
    }
  });

  it('does not add forbidden result snapshot columns on polls', async () => {
    const phase1 = await readFile(
      join(MIGRATIONS_DIR, '002_phase1_poll_core.sql'),
      'utf8',
    );
    const lower = phase1.toLowerCase();
    for (const column of FORBIDDEN_POLL_COLUMNS) {
      expect(lower).not.toContain(column);
    }
  });

  it('adds public feed freshness partial index on polls', async () => {
    const phase5c = await readFile(
      join(MIGRATIONS_DIR, '005_phase5c_public_feed_index.sql'),
      'utf8',
    );
    const lower = phase5c.toLowerCase();

    expect(lower).toContain('create index idx_polls_public_feed_freshness');
    expect(lower).toContain('on polls (published_at desc, id asc)');
    expect(lower).toContain("where status = 'active' and published_at is not null");
    expect(lower).not.toMatch(/create\s+table|alter\s+table/);
  });

  it('phase 1 migration only adds users, polls, and poll_options', async () => {
    const phase1 = await readFile(
      join(MIGRATIONS_DIR, '002_phase1_poll_core.sql'),
      'utf8',
    );
    const creates = [...phase1.toLowerCase().matchAll(/create\s+table\s+(\w+)/g)].map(
      (match) => match[1],
    );
    expect(creates.sort()).toEqual(['poll_options', 'polls', 'users']);
  });
});
