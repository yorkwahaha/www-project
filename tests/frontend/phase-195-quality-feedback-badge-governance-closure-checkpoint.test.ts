import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_195_DOC =
  'docs/www-project-phase-195-quality-feedback-badge-governance-closure-checkpoint-v1.md';

const QUALITY_BADGE_SOURCE_FILES = [
  'src/polls/quality-badge.ts',
  'src/polls/service.ts',
  'src/polls/types.ts',
  'public/frontend/quality-feedback-badge.js',
  'public/frontend/explore-page.js',
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
] as const;

const GOVERNANCE_FORBIDDEN_PATTERNS = [
  'sortByQualityBadge',
  'filterByQualityBadge',
  'rankByQualityBadge',
  'orderByQualityBadge',
  'qualityBadgeRanking',
  'qualityBadgeRank',
  'quality_badge_rank',
  'qualityBadgeRecommendation',
  'recommendByQualityBadge',
  'qualityBadgePersonalization',
  'personalizeByQualityBadge',
  'qualityBadgeTrustScore',
  'trustScoreFromQualityBadge',
  'qualityBadgePollScore',
  'pollScoreFromQualityBadge',
  'qualityBadgeCreatorScore',
  'creatorScoreFromQualityBadge',
  'qualityBadgeReputation',
  'reputationScore',
  'qualityBadgeModeration',
  'moderationState',
  'qualityBadgeGovernanceState',
  'governanceState',
  'qualityBadgeThreshold',
  'qualityBadgeBucket',
  'qualityBadgeCta',
  'qualityBadgeEligibility',
  'qualityBadgeResultsVisibility',
  'qualityBadgeFilter',
  'qualityBadgeSort',
  'hotness',
  'trendingPoll',
  'rankingBadge',
] as const;

function linesWithQualityBadgeContext(source: string): string[] {
  const lines = source.split(/\r?\n/);
  return lines.filter((line) =>
    /quality_badge|positive_feedback|deriveQualityBadge|renderQualityFeedbackBadge|mountQualityFeedbackBadgeNearTitle/i.test(
      line,
    ),
  );
}

describe('Phase 195 quality feedback badge governance closure checkpoint', () => {
  it('documents governance closure and README index reference', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_195_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 195');
    expect(doc).toContain('Governance Closure Checkpoint');
    expect(doc).toContain('presentation-only');
    expect(doc).toContain('not** a ranking signal');
    expect(doc).toContain('poll_quality_feedback_aggregate');
    expect(doc).toContain('only durable source');

    expect(readme).toContain('Phase 195');
    expect(readme).toContain(PHASE_195_DOC);
    expect(readme).toContain('Quality feedback badge governance closure checkpoint');
  });

  it('keeps quality_badge context free of ranking/recommendation/personalization/score/trust/creator-score/bucket/threshold usage', async () => {
    for (const relativePath of QUALITY_BADGE_SOURCE_FILES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      const lower = source.toLowerCase();

      for (const pattern of GOVERNANCE_FORBIDDEN_PATTERNS) {
        expect(lower, relativePath).not.toContain(pattern.toLowerCase());
      }

      const contextualLines = linesWithQualityBadgeContext(source);
      for (const line of contextualLines) {
        const lowerLine = line.toLowerCase();
        expect(lowerLine, `${relativePath}: ${line}`).not.toMatch(
          /\b(sort|filter|order|rank|recommend|personaliz|trust|reputation|moderat|govern|threshold|bucket|score|hotness|trend)\b/,
        );
      }
    }
  });

  it('confirms public feed attaches quality_badge without ordering by it', async () => {
    const serviceSource = await readFile(
      join(process.cwd(), 'src/polls/service.ts'),
      'utf8',
    );
    const feedBlock =
      serviceSource.match(/async getPublicFeed[\s\S]*?^\s{4}\},/m)?.[0] ?? '';

    expect(feedBlock).toContain('listPublicFeedPolls');
    expect(feedBlock).toContain('deriveQualityBadge');
    expect(feedBlock).not.toMatch(/quality_badge[\s\S]{0,80}(sort|filter|order)/i);
    expect(feedBlock).not.toMatch(/(sort|filter|order)[\s\S]{0,80}quality_badge/i);
  });
});
