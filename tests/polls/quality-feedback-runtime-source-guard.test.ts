import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

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

describe('Quality feedback runtime source guard', () => {
  it('does not introduce feedback event table concepts in src', async () => {
    const sources = await Promise.all([
      readFile(join(process.cwd(), 'src/http/quality-feedback-routes.ts'), 'utf8'),
      readFile(join(process.cwd(), 'src/polls/service.ts'), 'utf8'),
      readFile(join(process.cwd(), 'src/polls/repository.ts'), 'utf8'),
      readFile(join(process.cwd(), 'src/polls/in-memory-repository.ts'), 'utf8'),
    ]);
    const combined = sources.join('\n').toLowerCase();

    for (const forbidden of [
      'quality_feedback_event',
      'quality_feedback_events',
      'feedback_event_table',
      'per_user_feedback',
      'feedback_dedup',
    ]) {
      expect(combined).not.toContain(forbidden);
    }
  });

  it('keeps the feedback HTTP handler free of forbidden linkage fields', async () => {
    const source = (await readFile(
      join(process.cwd(), 'src/http/quality-feedback-routes.ts'),
      'utf8',
    )).toLowerCase();

    for (const forbidden of FORBIDDEN_FEEDBACK_RUNTIME_PATTERNS) {
      expect(source).not.toContain(forbidden);
    }
    expect(source).toContain('feedback_tag');
    expect(source).toContain('submitqualityfeedback');
  });

  it('keeps the service feedback block poll-and-tag scoped only', async () => {
    const source = await readFile(join(process.cwd(), 'src/polls/service.ts'), 'utf8');
    const block = source.match(
      /async submitQualityFeedback\([\s\S]*?\n    },/,
    )?.[0].toLowerCase();

    expect(block).toBeTruthy();
    for (const forbidden of FORBIDDEN_FEEDBACK_RUNTIME_PATTERNS) {
      expect(block!).not.toContain(forbidden);
    }
    expect(block).toContain('findpollbyid');
    expect(block).toContain('incrementqualityfeedbackaggregate');
  });

  it('keeps the PostgreSQL aggregate write free of vote, option, and identity linkage', async () => {
    const source = await readFile(join(process.cwd(), 'src/polls/repository.ts'), 'utf8');
    const block = source.match(
      /async function incrementQualityFeedbackAggregate[\s\S]*?\n}/,
    )?.[0].toLowerCase();

    expect(block).toBeTruthy();
    for (const forbidden of FORBIDDEN_FEEDBACK_RUNTIME_PATTERNS) {
      expect(block!).not.toContain(forbidden);
    }
    expect(block).toContain('poll_quality_feedback_aggregate');
    expect(block).toContain('aggregate_count');
    expect(block).toContain('updated_at');
  });

  it('does not wire quality feedback into protected vote, auth, profile, or Reference Answer files', async () => {
    for (const relativePath of PROTECTED_RUNTIME_PATHS) {
      const source = (await readFile(join(process.cwd(), relativePath), 'utf8')).toLowerCase();
      expect(source, relativePath).not.toContain('quality-feedback');
      expect(source, relativePath).not.toContain('quality_feedback');
      expect(source, relativePath).not.toContain('submitqualityfeedback');
    }
  });
});
