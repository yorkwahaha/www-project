import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Phase 71 production credential verifier plan doc', () => {
  it('locks docs-only production verifier, session UX, and privacy boundaries', async () => {
    const source = await readFile(
      join(
        process.cwd(),
        'docs/www-project-phase-71-production-credential-verifier-plan-v1.md',
      ),
      'utf8',
    );
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('docs/spec only');
    expect(source).toContain('No src runtime change, public frontend change, migration, DB schema change, API behavior change');
    expect(source).toContain('trustedCredentialVerifier');
    expect(source).toContain('Production Credential Verifier');
    expect(source).toContain('formal user session');
    expect(source).toContain('credential source');
    expect(source).toContain('expiry');
    expect(source).toContain('revocation');
    expect(source).toContain('logout');
    expect(source).toContain('frontend production login UX');
    expect(source).toContain('MVP demo-style `X-User-Id` remains a non-production compatibility path only');
    expect(source).toContain('Raw `X-User-Id` is not production identity');
    expect(source).toContain('creator_session` remains a local/demo/test creator convenience and is not production public identity');
    expect(source).toContain('Reference Answer is not cut over to `UserAuthResolver` in this phase');
    expect(source).toContain('Any future Reference Answer `UserAuthResolver` cutover requires a separate approved phase');
    expect(source).toContain('No selected option, resolved `option_id`, raw option text, selected option index');
    expect(source).toContain('Do not persist durable linkage between a credential, session, request, traceable actor, or user and a selected poll option');
    expect(source).toContain('Vote token schema remains `user_id + poll_id`');
    expect(source).toContain('Counter schema remains `poll_id + option_id + shard_id`');
    expect(source).toContain('Official Vote transaction order remains');
    expect(source).toContain('Eligibility must remain before option resolve');
    expect(source).toContain('demographic breakdown');
    expect(source).toContain('ranking personalization');
    expect(source).toContain('precise location');
    expect(source).toContain('extra profile fields');
    expect(source).toContain('Production missing verifier is not a degraded demo mode. It must fail closed.');
    expect(source).toContain('No fallback to raw `X-User-Id`');
    expect(source).toContain('No fallback to `creator_session`');
    expect(source).toContain('I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.');
    expect(source).toContain('git diff --check');
    expect(source).toContain('npm run typecheck');
    expect(source).toContain('npm test');
    expect(source).toContain('npm run build');

    expect(readme).toContain('Phase 71');
    expect(readme).toContain(
      'docs/www-project-phase-71-production-credential-verifier-plan-v1.md',
    );
    expect(readme).toContain('trustedCredentialVerifier');
    expect(readme).toContain('formal session lifecycle');
    expect(readme).toContain('production-deploy-ready');
  });
});
