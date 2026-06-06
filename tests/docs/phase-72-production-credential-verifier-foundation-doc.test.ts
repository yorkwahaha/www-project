import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Phase 72 production credential verifier foundation doc', () => {
  it('locks the verifier foundation scope and auth/privacy boundaries', async () => {
    const source = await readFile(
      join(
        process.cwd(),
        'docs/www-project-phase-72-production-credential-verifier-foundation-v1.md',
      ),
      'utf8',
    );
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Production Credential Verifier Foundation');
    expect(source).toContain('runtime foundation + tests + docs checkpoint');
    expect(source).toContain('No login UX');
    expect(source).toContain('No login UX, public frontend change, migration, DB schema change, API behavior change');
    expect(source).toContain('USER_AUTH_CREDENTIALS_JSON');
    expect(source).toContain('createProductionCredentialVerifier');
    expect(source).toContain('createProductionCredentialVerifierFromEnv');
    expect(source).toContain('sha256UserCredentialToken');
    expect(source).toContain('Authorization: Bearer <token>');
    expect(source).toContain('token_sha256');
    expect(source).toContain('expires_at');
    expect(source).toContain('revoked_at');
    expect(source).toContain('Missing `USER_AUTH_CREDENTIALS_JSON` in production means no verifier is configured');
    expect(source).toContain('raw `X-User-Id`');
    expect(source).toContain('creator_session');
    expect(source).toContain('Local/demo/test retain explicit MVP `X-User-Id` compatibility');
    expect(source).toContain('Vote token schema: `user_id + poll_id`');
    expect(source).toContain('Counter schema: `poll_id + option_id + shard_id`');
    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('Reference Answer behavior or auth source');
    expect(source).toContain('demographic breakdown');
    expect(source).toContain('ranking / Wonder Flow');
    expect(source).toContain('precise location');
    expect(source).toContain('extra profile fields');
    expect(source).toContain('The production verifier does not read or receive `option_id`, `option_index`, `option_text`');
    expect(source).toContain('I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.');
    expect(source).toContain('npm run migrate:check');
    expect(readme).toContain('Phase 72');
    expect(readme).toContain(
      'docs/www-project-phase-72-production-credential-verifier-foundation-v1.md',
    );
    expect(readme).toContain('USER_AUTH_CREDENTIALS_JSON');
    expect(readme).toContain('production-deploy-ready');
  });
});
