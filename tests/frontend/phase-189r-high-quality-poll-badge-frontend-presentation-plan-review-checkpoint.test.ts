import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_189R_DOC =
  'docs/www-project-phase-189r-high-quality-poll-badge-frontend-presentation-plan-review-checkpoint-v1.md';
const FRONTEND_DIR = 'public/frontend';
const PUBLIC_DIR = 'public';

const BADGE_RUNTIME_ID_CLASS_PATTERNS = [
  /id=["'][^"']*high-quality[^"']*["']/i,
  /class=["'][^"']*high-quality[^"']*["']/i,
  /id=["'][^"']*quality-badge[^"']*["']/i,
  /class=["'][^"']*quality-badge[^"']*["']/i,
] as const;

const BADGE_RUNTIME_COPY = ['回饋良好'] as const;

const BANNED_ABSENCE_COPY = [
  '尚未達標',
  '回饋不足',
  '品質不足',
  '未取得徽章',
] as const;

const BANNED_MISLEADING_COPY = [
  '高分題目',
  '熱門',
  '品質分數',
  '低品質',
] as const;

const BADGE_RENDERING_JS_PATTERNS = [
  'quality-badge',
  'high-quality-badge',
  'highQualityBadge',
  'mountHighQualityBadge',
  'mountQualityBadge',
  'renderQualityBadge',
  'qualityBadge',
  'renderQualityChip',
  'qualityBadgeChip',
] as const;

const TOOLTIP_DEBUG_PATTERNS = [
  'qualitybadgetooltip',
  'quality-badge-tooltip',
  'qualityBadgeDetail',
  'qualityBadgeExplanation',
  'qualityBadgeDebug',
  'showQualityBadgeReason',
] as const;

const FORBIDDEN_DISPLAY_PATTERNS = [
  'aggregate_count',
  'tag_breakdown',
  'tagBreakdown',
  'tag_counts',
  'quality_score',
  'qualityScore',
  'creator_score',
  'creatorScore',
  'threshold_state',
  'bucket_state',
] as const;

const BEHAVIOR_RUNTIME_PATTERNS = [
  'sortByQualityBadge',
  'filterByQualityBadge',
  'qualityBadgeCta',
  'qualityBadgeEligibility',
  'qualityBadgeResultsVisibility',
  'recommendationOrdering',
  'personalization',
  'hotness',
  'trendingPoll',
  'rankingBadge',
] as const;

const FEED_PARSING_TOLERANCE_FILES = new Set(['public/frontend/explore-page.js']);

const PHASE_190_BADGE_RUNTIME_FILES = new Set([
  'public/frontend/quality-feedback-badge.js',
]);

const POLICY_EDUCATIONAL_COPY_FILES = new Set([
  'public/frontend/policy-ui-placeholders.js',
  'public/frontend/public-mvp-ui.js',
  'public/frontend/public-mvp-layout.js',
]);

async function listFilesRecursive(dir: string): Promise<string[]> {
  const entries = await readdir(join(process.cwd(), dir), {
    withFileTypes: true,
    recursive: true,
  });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => join(dir, entry.name.replace(/\\/g, '/')));
}

describe('Phase 189-R high-quality poll badge frontend presentation plan review checkpoint', () => {
  it('documents Phase 189 plan review and Phase 190 minimal frontend rendering approval', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_189R_DOC), 'utf8');

    expect(doc).toContain('Phase 189-R');
    expect(doc).toContain('Phase 189');
    expect(doc).toContain('APPROVED — Phase 190 blockers: none identified.');
    expect(doc).toContain('High-quality Poll Badge Minimal Frontend Rendering Runtime');
    expect(doc).toContain('回饋良好');
    expect(doc).toContain('quality_badge');
  });

  it('confirms public frontend JS has no badge rendering DOM hooks or runtime copy', async () => {
    const jsFiles = (await listFilesRecursive(FRONTEND_DIR)).filter((path) =>
      path.endsWith('.js'),
    );

    for (const relativePath of jsFiles) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      const lower = source.toLowerCase();
      const normalizedPath = relativePath.replace(/\\/g, '/');

      if (PHASE_190_BADGE_RUNTIME_FILES.has(normalizedPath)) {
        continue;
      }

      for (const pattern of BADGE_RENDERING_JS_PATTERNS) {
        expect(lower, relativePath).not.toContain(pattern.toLowerCase());
      }

      for (const copy of BADGE_RUNTIME_COPY) {
        expect(source, relativePath).not.toContain(copy);
      }

      for (const copy of BANNED_ABSENCE_COPY) {
        expect(source, relativePath).not.toContain(copy);
      }

      if (!POLICY_EDUCATIONAL_COPY_FILES.has(normalizedPath)) {
        for (const copy of BANNED_MISLEADING_COPY) {
          expect(source, relativePath).not.toContain(copy);
        }
        expect(source, relativePath).not.toMatch(/優質題目|排名/);
      }

      for (const pattern of TOOLTIP_DEBUG_PATTERNS) {
        expect(lower, relativePath).not.toContain(pattern.toLowerCase());
      }

      for (const forbidden of FORBIDDEN_DISPLAY_PATTERNS) {
        expect(lower, relativePath).not.toContain(forbidden.toLowerCase());
      }

      for (const behavior of BEHAVIOR_RUNTIME_PATTERNS) {
        expect(lower, relativePath).not.toContain(behavior.toLowerCase());
      }

      if (!FEED_PARSING_TOLERANCE_FILES.has(normalizedPath)) {
        expect(lower, relativePath).not.toContain('quality_badge');
        expect(lower, relativePath).not.toContain('positive_feedback');
      }

      expect(source, relativePath).not.toMatch(
        /localStorage[\s\S]{0,120}(quality|badge|feedback)/i,
      );
      expect(source, relativePath).not.toMatch(
        /sessionStorage[\s\S]{0,120}(quality|badge|feedback)/i,
      );
      expect(source, relativePath).not.toMatch(
        /document\.cookie[\s\S]{0,120}(quality|badge|feedback)/i,
      );

      expect(source, relativePath).not.toMatch(
        /quality_badge[\s\S]{0,80}(sort|filter|order)/i,
      );
    }
  });

  it('confirms explore feed parsing tolerates quality_badge without rendering it', async () => {
    const source = await readFile(
      join(process.cwd(), 'public/frontend/explore-page.js'),
      'utf8',
    );

    expect(source).toContain('quality_badge');
    expect(source).not.toContain('回饋良好');
    expect(source).not.toMatch(/renderQualityBadge|quality-badge|high-quality-badge/i);
    expect(source).not.toMatch(/createElement[\s\S]{0,200}quality_badge/i);
    expect(source).not.toMatch(/sort[\s\S]{0,120}quality_badge/i);
    expect(source).not.toMatch(/filter[\s\S]{0,120}quality_badge/i);
  });

  it('confirms public HTML has no badge rendering id/class or runtime copy', async () => {
    const htmlFiles = (await listFilesRecursive(PUBLIC_DIR)).filter((path) =>
      path.endsWith('.html'),
    );

    for (const relativePath of htmlFiles) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      const lower = source.toLowerCase();

      for (const pattern of BADGE_RUNTIME_ID_CLASS_PATTERNS) {
        expect(source, relativePath).not.toMatch(pattern);
      }

      for (const copy of BADGE_RUNTIME_COPY) {
        expect(source, relativePath).not.toContain(copy);
      }

      for (const copy of BANNED_ABSENCE_COPY) {
        expect(source, relativePath).not.toContain(copy);
      }

      for (const forbidden of FORBIDDEN_DISPLAY_PATTERNS) {
        expect(lower, relativePath).not.toContain(forbidden.toLowerCase());
      }

      for (const pattern of TOOLTIP_DEBUG_PATTERNS) {
        expect(lower, relativePath).not.toContain(pattern.toLowerCase());
      }

      expect(lower, relativePath).not.toContain('quality_badge');
      expect(lower, relativePath).not.toContain('positive_feedback');
    }
  });
});
