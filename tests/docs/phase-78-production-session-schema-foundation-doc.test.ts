import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_78_DOC =
  'docs/www-project-phase-78-production-session-schema-foundation-v1.md';

describe('Phase 78 production session schema foundation checkpoint doc', () => {
  it('documents narrow DB/auth foundation scope and privacy boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_78_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Production Session Schema Foundation');
    expect(source).toContain('DB/auth foundation + repository + tests + docs checkpoint');
    expect(source).toContain('No login submit');
    expect(source).toContain('Set-Cookie');
    expect(source).toContain('No change to `UserAuthResolver`');
    expect(source).toContain('No change to production `trustedCredentialVerifier`');
    expect(source).toContain('user_sessions');
    expect(source).toContain('token_sha256');
    expect(source).toContain('raw token is never stored');
    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('vote-by-index` eligibility before option resolve');
    expect(source).toContain('Vote token schema: `user_id + poll_id`');
    expect(source).toContain('Counter schema: `poll_id + option_id + shard_id`');
    expect(source).toContain('Reference Answer remains separate');
    expect(source).toContain('No option choice + user/session/device/request/log/trace/metric/error payload linkage');
    expect(source).toContain('demographic breakdown');
    expect(source).toContain('ranking or personalization');
    expect(source).toContain('precise location');
    expect(source).toContain('extra profile fields');
    expect(source).toContain('I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.');
    expect(source).toContain('npm run test:integration:local');

    expect(readme).toContain('Phase 78');
    expect(readme).toContain(PHASE_78_DOC);
    expect(readme).toContain('user_sessions');
  });
});
