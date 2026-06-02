import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationPath = join(
  process.cwd(),
  'migrations',
  '009_phase65a_creator_session_foundation.sql',
);

describe('Phase 65A creator session migration schema guard', () => {
  it('adds only minimal digest-backed creator session fields', async () => {
    const sql = (await readFile(migrationPath, 'utf8')).toLowerCase();
    const table = sql.match(
      /create\s+table\s+creator_sessions\s*\(([\s\S]*?)\);/,
    )?.[1];

    expect(table).toBeTruthy();
    for (const column of [
      'token_sha256',
      'user_id',
      'created_at',
      'expires_at',
      'revoked_at',
    ]) {
      expect(table).toContain(column);
    }
    expect(table).toContain('octet_length(token_sha256) = 32');
    expect(table).toContain('expires_at > created_at');
    expect(table).toContain('revoked_at is null or revoked_at >= created_at');
  });

  it('does not add poll, option, raw token, request, device, profile, or audit linkage', async () => {
    const sql = (await readFile(migrationPath, 'utf8')).toLowerCase();
    const table = sql.match(
      /create\s+table\s+creator_sessions\s*\(([\s\S]*?)\);/,
    )?.[1] ?? '';

    for (const forbidden of [
      'poll_id',
      'option_id',
      'raw_token',
      'request_id',
      'ip_address',
      'user_agent',
      'device',
      'fingerprint',
      'profile',
      'eligibility',
      'analytics',
      'audit',
    ]) {
      expect(table).not.toContain(forbidden);
    }
  });
});
