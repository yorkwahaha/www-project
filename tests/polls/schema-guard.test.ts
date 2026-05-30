import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const MIGRATIONS_DIR = join(process.cwd(), 'migrations');

const FORBIDDEN_TABLES = [
  'vote_events',
  'raw_vote_events',
  'poll_status_snapshot',
  'poll_reference_answer_tokens',
  'poll_vote_tokens',
  'poll_option_vote_counters',
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

describe('Phase 1 migration schema guard', () => {
  it('does not introduce forbidden vote/reference/counter tables', async () => {
    const files = (await readdir(MIGRATIONS_DIR)).filter((name) => name.endsWith('.sql'));
    const combined = await Promise.all(
      files.map((file) => readFile(join(MIGRATIONS_DIR, file), 'utf8')),
    );
    const sql = combined.join('\n').toLowerCase();

    for (const table of FORBIDDEN_TABLES) {
      expect(sql).not.toMatch(new RegExp(`create\\s+table\\s+${table}\\b`));
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
