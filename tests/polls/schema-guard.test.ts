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
  'vote_audit_events_with_option_id',
];

/** Tables that may reference poll_options.id as poll structure metadata (not user choice). */
const STRUCTURE_OPTION_ID_TABLES = [
  'poll_correction_requests',
  'poll_correction_logs',
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

  it('adds archived_at and tightens feed partial index predicate in phase 6A', async () => {
    const phase6a = await readFile(
      join(MIGRATIONS_DIR, '006_phase6a_poll_visibility_archive.sql'),
      'utf8',
    );
    const lower = phase6a.toLowerCase();

    expect(lower).toContain('add column archived_at');
    expect(lower).toContain('polls_archived_requires_publish_check');
    expect(lower).toContain('polls_archived_not_draft_check');
    expect(lower).toContain('drop index if exists idx_polls_public_feed_freshness');
    expect(lower).toContain('create index idx_polls_public_feed_freshness');
    expect(lower).toContain('archived_at is null');
    expect(lower).not.toMatch(/create\s+table/);
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

describe('Phase 6B.1 admin correction schema guard', () => {
  async function readPhase6bMigration(): Promise<string> {
    return readFile(
      join(MIGRATIONS_DIR, '007_phase6b_admin_correction_foundation.sql'),
      'utf8',
    );
  }

  function extractCreateTable(sql: string, tableName: string): string | undefined {
    return sql
      .toLowerCase()
      .match(new RegExp(`create\\s+table\\s+${tableName}\\s*\\(([\\s\\S]*?)\\);`))?.[1];
  }

  /** Voter identity column only — FK targets like admin_users(user_id) are allowed. */
  function assertNoVoterUserIdColumn(table: string): void {
    expect(table).not.toMatch(/(?:^|,|\n)\s*user_id\s+uuid/);
  }

  /** Raw Option Linkage Ban: same table must not store user_id + option_id vote choice pairing. */
  function assertNoUserOptionLinkageColumns(table: string): void {
    const hasUserIdColumn = /(?:^|,|\n)\s*user_id\s+uuid/.test(table);
    const hasOptionIdColumn = /(?:^|,|\n)\s*option_id\s+uuid/.test(table);
    expect(hasUserIdColumn && hasOptionIdColumn).toBe(false);
  }

  it('adds governance foundation tables only in phase 6B.1', async () => {
    const phase6b = await readPhase6bMigration();
    const creates = [
      ...phase6b.toLowerCase().matchAll(/create\s+table\s+(\w+)/g),
    ].map((match) => match[1]);

    expect(creates.sort()).toEqual([
      'admin_decision_logs',
      'admin_users',
      'poll_correction_logs',
      'poll_correction_requests',
      'public_notices',
    ]);
    expect(phase6b.toLowerCase()).not.toMatch(/\balter\s+table\s+polls\b/);
  });

  it('admin_users is separate from users.trust_level (no official-as-admin coupling)', async () => {
    const phase6b = (await readPhase6bMigration()).toLowerCase();
    const table = extractCreateTable(phase6b, 'admin_users');

    expect(table).toBeTruthy();
    expect(table).toContain('user_id');
    expect(table).toContain('role');
    expect(table).toContain('status');
    expect(table).toContain('revoked_at');
    expect(table).toMatch(/references\s+users\s*\(\s*id\s*\)/);
    expect(table).not.toContain('trust_level');
    expect(table).not.toContain('official');
  });

  it('poll_correction_requests stores governance fields without user-option linkage', async () => {
    const phase6b = (await readPhase6bMigration()).toLowerCase();
    const table = extractCreateTable(phase6b, 'poll_correction_requests');

    expect(table).toBeTruthy();
    expect(table).toContain('requester_admin_id');
    expect(table).toContain('correction_target_field');
    expect(table).toContain('correction_target_id');
    expect(table).toMatch(
      /correction_target_field\s+in\s*\(\s*'title'\s*,\s*'description'\s*,\s*'option_text'\s*\)/,
    );
    expect(table).toMatch(
      /status\s+in\s*\(\s*'pending'\s*,\s*'approved'\s*,\s*'rejected'\s*,\s*'expired'\s*,\s*'applied'\s*\)/,
    );
    expect(table).toContain('requires_dual_admin');
    expect(table).toContain('spread_score_at_submit');
    expect(table).toContain('spread_score_locked_until');
    expect(table).toContain('valid_until');
    assertNoVoterUserIdColumn(table!);
    assertNoUserOptionLinkageColumns(table!);
    expect(table).not.toMatch(/(?:^|,|\n)\s*option_text\s+text/);
    expect(table).not.toContain('selected_option_index');
  });

  it('documents correction_target_id as poll structure metadata only', async () => {
    const phase6b = (await readPhase6bMigration()).toLowerCase();

    for (const tableName of STRUCTURE_OPTION_ID_TABLES) {
      const table = extractCreateTable(phase6b, tableName);
      expect(table).toBeTruthy();
      expect(table).toContain('correction_target_id');
      expect(table).toMatch(/references\s+poll_options\s*\(\s*id\s*\)/);
      assertNoVoterUserIdColumn(table!);
      assertNoUserOptionLinkageColumns(table!);
    }
  });

  it('admin_decision_logs supports dual-admin decisions without vote-option columns', async () => {
    const phase6b = (await readPhase6bMigration()).toLowerCase();
    const table = extractCreateTable(phase6b, 'admin_decision_logs');

    expect(table).toBeTruthy();
    expect(table).toContain('metadata_json');
    expect(table).toMatch(/decision\s+in\s*\(\s*'approve'\s*,\s*'reject'\s*\)/);
    expect(table).toMatch(
      /unique\s*\(\s*target_type\s*,\s*target_id\s*,\s*admin_id\s*\)/,
    );
    expect(table).not.toContain('option_id');
    assertNoVoterUserIdColumn(table!);
    assertNoUserOptionLinkageColumns(table!);
    expect(table).not.toContain('voter');
    // metadata_json is allowed for governance; application must not store voter+option linkage.
  });

  it('poll_correction_logs and public_notices do not introduce voter identity', async () => {
    const phase6b = (await readPhase6bMigration()).toLowerCase();
    const logs = extractCreateTable(phase6b, 'poll_correction_logs');
    const notices = extractCreateTable(phase6b, 'public_notices');

    expect(logs).toBeTruthy();
    expect(logs).toContain('applied_by_admin_id');
    assertNoVoterUserIdColumn(logs!);
    assertNoUserOptionLinkageColumns(logs!);
    expect(logs).not.toContain('voter');

    expect(notices).toBeTruthy();
    expect(notices).toContain('created_by_admin_id');
    assertNoVoterUserIdColumn(notices!);
    assertNoUserOptionLinkageColumns(notices!);
  });

  it('phase 6B.1 migration does not create forbidden linkage or snapshot tables', async () => {
    const phase6b = (await readPhase6bMigration()).toLowerCase();

    for (const table of FORBIDDEN_TABLES) {
      expect(phase6b).not.toMatch(new RegExp(`create\\s+table\\s+${table}\\b`));
    }
  });

  it('adds poll_correction request indexes for poll/status and status/valid_until', async () => {
    const phase6b = (await readPhase6bMigration()).toLowerCase();

    expect(phase6b).toContain('idx_poll_correction_requests_poll_status');
    expect(phase6b).toContain('on poll_correction_requests (poll_id, status)');
    expect(phase6b).toContain('idx_poll_correction_requests_status_valid_until');
    expect(phase6b).toContain('on poll_correction_requests (status, valid_until)');
  });
});
