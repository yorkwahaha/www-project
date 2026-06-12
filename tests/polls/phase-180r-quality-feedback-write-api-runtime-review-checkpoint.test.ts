import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_180R_DOC =
  'docs/www-project-phase-180r-quality-feedback-write-api-runtime-review-checkpoint-v1.md';
const QUALITY_FEEDBACK_ROUTES = 'src/http/quality-feedback-routes.ts';
const REPOSITORY = 'src/polls/repository.ts';
const SERVICE = 'src/polls/service.ts';
const TYPES = 'src/polls/types.ts';
const SERVER = 'src/http/server.ts';

const MVP_FEEDBACK_TAGS = [
  '表達清楚',
  '選項公平',
  '值得思考',
  '期待結果',
  '題目不優',
] as const;

const FORBIDDEN_FEEDBACK_RUNTIME_PATTERNS = [
  'option_id',
  'option_index',
  'selected_option',
  'user_id',
  'session_id',
  'creator_session',
  'vote_token',
  'request_id',
  'device',
  'ip_address',
  'user_agent',
  'trace_id',
  'metric_id',
  'error_id',
  'analytics_id',
  'shard_id',
  'threshold_state',
  'bucket_state',
  'ranking',
  'creator_score',
  'creator_punishment',
] as const;

const PROTECTED_RUNTIME_PATHS = [
  'src/http/official-vote-routes.ts',
  'src/http/reference-answer-routes.ts',
  'src/http/user-profile-routes.ts',
  'src/auth/user-auth-resolver.ts',
] as const;

describe('Phase 180-R quality feedback write API runtime review checkpoint', () => {
  it('documents Phase 180 runtime review and Phase 181 approval', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_180R_DOC), 'utf8');

    expect(doc).toContain('Phase 180-R');
    expect(doc).toContain('quality-feedback-routes.ts');
    expect(doc).toContain('**APPROVED**');
    expect(doc).toContain('Phase 181 post-vote quality feedback frontend UX');
    expect(doc).toContain('Phase 181 blockers: none identified');
  });

  it('confirms request body accepts only feedback_tag and success response is ok only', async () => {
    const routes = await readFile(join(process.cwd(), QUALITY_FEEDBACK_ROUTES), 'utf8');
    const service = await readFile(join(process.cwd(), SERVICE), 'utf8');
    const lowerRoutes = routes.toLowerCase();

    expect(routes).toContain("keys[0] !== 'feedback_tag'");
    expect(routes).toContain('keys.length !== 1');
    expect(routes).toContain('FEEDBACK_TAG_SET');
    expect(service).toMatch(/return\s*\{\s*ok:\s*true\s*\}/);

    for (const forbidden of FORBIDDEN_FEEDBACK_RUNTIME_PATTERNS) {
      expect(lowerRoutes).not.toContain(forbidden);
    }
  });

  it('confirms five MVP tags are defined once and used by the route allowlist', async () => {
    const types = await readFile(join(process.cwd(), TYPES), 'utf8');
    const routes = await readFile(join(process.cwd(), QUALITY_FEEDBACK_ROUTES), 'utf8');

    expect(types).toContain('export const QUALITY_FEEDBACK_TAGS = [');
    for (const tag of MVP_FEEDBACK_TAGS) {
      expect(types).toContain(`'${tag}'`);
    }
    expect(routes).toContain('QUALITY_FEEDBACK_TAGS');
  });

  it('confirms PostgreSQL aggregate upsert uses poll_id + feedback_tag only', async () => {
    const repository = await readFile(join(process.cwd(), REPOSITORY), 'utf8');
    const block = repository.match(
      /async function incrementQualityFeedbackAggregate[\s\S]*?\n}/,
    )?.[0];

    expect(block).toBeTruthy();
    expect(block).toContain('poll_quality_feedback_aggregate');
    expect(block).toContain('VALUES ($1, $2, 1, NOW())');
    expect(block).toContain('ON CONFLICT (poll_id, feedback_tag)');
    expect(block).toContain(
      'aggregate_count = poll_quality_feedback_aggregate.aggregate_count + 1',
    );
    expect(block).toContain('updated_at = NOW()');

    const lower = block!.toLowerCase();
    for (const forbidden of FORBIDDEN_FEEDBACK_RUNTIME_PATTERNS) {
      expect(lower).not.toContain(forbidden);
    }
  });

  it('confirms server routes POST quality-feedback separately from vote routes', async () => {
    const server = await readFile(join(process.cwd(), SERVER), 'utf8');

    expect(server).toContain('/quality-feedback');
    expect(server).toContain('handlePostQualityFeedback');
    expect(server).not.toMatch(
      /quality-feedback[\s\S]*official-vote|official-vote[\s\S]*quality-feedback/i,
    );
  });

  it('confirms Phase 180 added no new feedback migration files', async () => {
    const migrationFiles = (await readdir(join(process.cwd(), 'migrations'))).filter((name) =>
      name.endsWith('.sql'),
    );

    expect(migrationFiles).toContain('012_phase177_quality_feedback_aggregate_foundation.sql');
    expect(
      migrationFiles.filter((name) => /quality.?feedback/i.test(name)),
    ).toEqual(['012_phase177_quality_feedback_aggregate_foundation.sql']);
  });

  it('confirms protected vote, auth, profile, and Reference Answer files remain feedback-free', async () => {
    for (const relativePath of PROTECTED_RUNTIME_PATHS) {
      const source = (await readFile(join(process.cwd(), relativePath), 'utf8')).toLowerCase();
      expect(source, relativePath).not.toContain('quality-feedback');
      expect(source, relativePath).not.toContain('quality_feedback');
      expect(source, relativePath).not.toContain('submitqualityfeedback');
    }
  });
});
