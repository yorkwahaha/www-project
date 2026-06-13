import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { deriveQualityBadge } from '../../src/polls/quality-badge.js';

const PHASE_188R_DOC =
  'docs/www-project-phase-188r-high-quality-poll-badge-minimal-public-read-runtime-review-checkpoint-v1.md';
const MIGRATIONS_DIR = 'migrations';

const FORBIDDEN_PUBLIC_RESPONSE_FIELDS = [
  'aggregate_count',
  'tag_counts',
  'tag_breakdown',
  'raw_feedback_total',
  'quality_score',
  'creator_score',
  'rank',
  'percentile',
  'threshold_state',
  'bucket_state',
  'reason_code',
  'eligibility_status',
] as const;

const FORBIDDEN_DERIVE_EXPORTS = [
  'reason',
  'reason_code',
  'threshold_state',
  'bucket_state',
  'score',
  'rank',
  'percentile',
  'aggregate_count',
  'tag_counts',
  'tag_breakdown',
  'raw_feedback_total',
  'creator_score',
] as const;

async function listSqlMigrations(): Promise<string[]> {
  const entries = await readdir(join(process.cwd(), MIGRATIONS_DIR));
  return entries.filter((name) => name.endsWith('.sql'));
}

describe('Phase 188-R high-quality poll badge minimal public read runtime review checkpoint', () => {
  it('documents Phase 188 runtime review and Phase 189 frontend presentation plan approval', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_188R_DOC), 'utf8');

    expect(doc).toContain('Phase 188-R');
    expect(doc).toContain('Phase 188');
    expect(doc).toContain('APPROVED — Phase 189 blockers: none identified.');
    expect(doc).toContain('High-quality Poll Badge Frontend Presentation Plan');
    expect(doc).toContain('Plan-only');
  });

  it('keeps QualityBadge type limited to null | positive_feedback', async () => {
    const source = await readFile(join(process.cwd(), 'src/polls/types.ts'), 'utf8');
    expect(source).toMatch(/export type QualityBadge = null \| 'positive_feedback'/);
    expect(source).not.toMatch(/QualityBadge\s*=\s*null\s*\|[^;]*'low_quality'/);
    expect(source).not.toMatch(/QualityBadge\s*=\s*null\s*\|[^;]*'negative_feedback'/);
  });

  it('keeps deriveQualityBadge from exposing reason, score, count, bucket, or threshold', async () => {
    const source = await readFile(join(process.cwd(), 'src/polls/quality-badge.ts'), 'utf8');

    expect(source).toContain('export function deriveQualityBadge');
    expect(source).toContain('): QualityBadge');

    for (const forbidden of FORBIDDEN_DERIVE_EXPORTS) {
      expect(source).not.toMatch(new RegExp(`return\\s*\\{[^}]*${forbidden}`, 'i'));
      expect(source).not.toMatch(new RegExp(`export\\s+function\\s+\\w*${forbidden}`, 'i'));
    }

    const result = deriveQualityBadge([]);
    expect(result === null || result === 'positive_feedback').toBe(true);
  });

  it('keeps public service mappers from echoing forbidden badge diagnostics', async () => {
    const source = await readFile(join(process.cwd(), 'src/polls/service.ts'), 'utf8');

    expect(source).toContain('quality_badge: qualityBadge');
    expect(source).toContain('deriveQualityBadge');

    const mapperBlocks = [
      source.match(/function toPollDetail[\s\S]*?^}/m)?.[0] ?? '',
      source.match(/function toPollResultDisplay[\s\S]*?^}/m)?.[0] ?? '',
      source.match(/async getPublicFeed[\s\S]*?^    },/m)?.[0] ?? '',
    ].join('\n');

    for (const forbidden of FORBIDDEN_PUBLIC_RESPONSE_FIELDS) {
      expect(mapperBlocks).not.toContain(`${forbidden}:`);
    }
  });

  it('keeps aggregate read SQL poll-scoped without identity or option joins', async () => {
    const source = await readFile(join(process.cwd(), 'src/polls/repository.ts'), 'utf8');
    const readBlock = source.match(
      /async function listQualityFeedbackAggregatesByPollId[\s\S]*?async function findUserById/,
    )?.[0];

    expect(readBlock).toBeTruthy();
    expect(readBlock).toContain('poll_quality_feedback_aggregate');
    expect(readBlock).toContain('WHERE poll_id');

    for (const forbidden of [
      'option_id',
      'user_id',
      'session_id',
      'request_id',
      'device',
      'JOIN users',
      'JOIN poll_options',
      'JOIN sessions',
    ]) {
      expect(readBlock!.toLowerCase()).not.toContain(forbidden);
    }
  });

  it('keeps feed ordering independent of quality_badge and aggregate counts', async () => {
    const repositorySource = await readFile(join(process.cwd(), 'src/polls/repository.ts'), 'utf8');
    const serviceSource = await readFile(join(process.cwd(), 'src/polls/service.ts'), 'utf8');

    const feedSql = repositorySource.match(
      /async function listPublicFeedPolls[\s\S]*?^}/m,
    )?.[0];
    expect(feedSql).toBeTruthy();
    expect(feedSql).toContain('ORDER BY published_at DESC, id ASC');
    expect(feedSql!.toLowerCase()).not.toContain('quality_badge');
    expect(feedSql!.toLowerCase()).not.toContain('poll_quality_feedback_aggregate');

    const feedService = serviceSource.match(/async getPublicFeed[\s\S]*?^    },/m)?.[0];
    expect(feedService).toBeTruthy();
    expect(feedService).toContain('listPublicFeedPolls');
    expect(feedService).toContain('deriveQualityBadge');
    expect(feedService!.indexOf('listPublicFeedPolls')).toBeLessThan(
      feedService!.indexOf('deriveQualityBadge'),
    );
  });

  it('does not add durable badge table migrations', async () => {
    const migrations = await listSqlMigrations();
    expect(migrations.length).toBeGreaterThan(0);

    for (const migration of migrations) {
      const source = await readFile(join(process.cwd(), MIGRATIONS_DIR, migration), 'utf8');
      const lower = source.toLowerCase();
      expect(lower, migration).not.toMatch(/create\s+table\s+.*quality_badge/);
      expect(lower, migration).not.toMatch(/create\s+table\s+.*poll_quality_badge/);
    }
  });
});
