import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationPath = join(
  process.cwd(),
  'migrations',
  '011_phase78_production_user_session_foundation.sql',
);

describe('Phase 78 production user session migration schema guard', () => {
  it('adds only minimal digest-backed user session lifecycle fields', async () => {
    const sql = (await readFile(migrationPath, 'utf8')).toLowerCase();
    const table = sql.match(/create\s+table\s+user_sessions\s*\(([\s\S]*?)\);/)
      ?.[1];

    expect(table).toBeTruthy();
    for (const column of [
      'session_id',
      'token_sha256',
      'user_id',
      'created_at',
      'expires_at',
      'revoked_at',
      'last_used_at',
    ]) {
      expect(table).toContain(column);
    }
    expect(table).toContain('token_sha256 bytea not null unique');
    expect(table).toContain('octet_length(token_sha256) = 32');
    expect(table).toContain('expires_at > created_at');
    expect(table).toContain('revoked_at is null or revoked_at >= created_at');
    expect(table).toContain('last_used_at is null');
  });

  it('does not add option, request, device, profile, demographic, analytics, or raw-token linkage', async () => {
    const sql = (await readFile(migrationPath, 'utf8')).toLowerCase();
    const table =
      sql.match(/create\s+table\s+user_sessions\s*\(([\s\S]*?)\);/)?.[1] ??
      '';

    for (const forbidden of [
      'poll_id',
      'option_id',
      'option_text',
      'selected_option',
      'selected_option_index',
      'raw_token',
      'request_id',
      'trace_id',
      'ip_address',
      'user_agent',
      'device',
      'fingerprint',
      'profile',
      'eligibility',
      'demographic',
      'analytics',
      'ranking',
      'location',
      'audit',
    ]) {
      expect(table).not.toContain(forbidden);
    }
  });
});
