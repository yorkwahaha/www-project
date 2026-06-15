import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_186R_DOC =
  'docs/www-project-phase-186r-high-quality-poll-badge-read-model-presentation-plan-review-checkpoint-v1.md';
const FRONTEND_DIR = 'public/frontend';
const PUBLIC_DIR = 'public';

const BADGE_RUNTIME_ID_CLASS_PATTERNS = [
  /id=["'][^"']*high-quality[^"']*["']/i,
  /class=["'][^"']*high-quality[^"']*["']/i,
  /id=["'][^"']*quality-badge[^"']*["']/i,
  /class=["'][^"']*quality-badge[^"']*["']/i,
] as const;

const BADGE_RUNTIME_COPY = [
  '回饋良好',
  '大家覺得題目清楚',
] as const;

const BADGE_RUNTIME_JS_PATTERNS = [
  'quality-badge',
  'high-quality-badge',
  'highQualityBadge',
  'mountHighQualityBadge',
  'mountQualityBadge',
  'renderQualityBadge',
  'qualityBadge',
  'quality_badge',
  'positive_feedback',
] as const;

const FORBIDDEN_DISPLAY_PATTERNS = [
  'aggregate_count',
  'tag_breakdown',
  'tagBreakdown',
  'quality_score',
  'qualityScore',
  'creator_score',
  'creatorScore',
] as const;

const RANKING_RUNTIME_PATTERNS = [
  'recommendationOrdering',
  'personalization',
  'hotness',
  'trendingPoll',
  'rankingBadge',
] as const;

async function listFilesRecursive(dir: string): Promise<string[]> {
  const entries = await readdir(join(process.cwd(), dir), {
    withFileTypes: true,
    recursive: true,
  });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => join(dir, entry.name.replace(/\\/g, '/')));
}

const FEED_PARSING_TOLERANCE_FILES = new Set(['public/frontend/explore-page.js']);

const POLICY_EDUCATIONAL_COPY_FILES = new Set([
  'public/frontend/policy-ui-placeholders.js',
  'public/frontend/public-mvp-ui.js',
  'public/frontend/public-mvp-layout.js',
  'public/frontend/public-page-copy.js',
  'public/frontend/creator-flow-copy.js',
]);

const FAQ_POLICY_EDUCATIONAL_HTML_FILES = new Set(['public/faq.html']);

const PHASE_190_BADGE_RUNTIME_FILES = new Set([
  'public/frontend/quality-feedback-badge.js',
]);

describe('Phase 186-R high-quality poll badge read-model presentation plan review checkpoint', () => {
  it('documents Phase 186 plan review and Phase 187 plan-only approval', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_186R_DOC), 'utf8');

    expect(doc).toContain('Phase 186-R');
    expect(doc).toContain('Phase 186');
    expect(doc).toContain('APPROVED — Phase 187 blockers: none identified.');
    expect(doc).toContain('High-quality Poll Badge Runtime Implementation Plan');
    expect(doc).toContain('No badge runtime implementation');
    expect(doc).toContain('quality_badge');
  });

  it('confirms public frontend JS has no quality_badge rendering or badge runtime hooks', async () => {
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

      for (const pattern of BADGE_RUNTIME_JS_PATTERNS) {
        if (
          FEED_PARSING_TOLERANCE_FILES.has(normalizedPath) &&
          (pattern === 'quality_badge' || pattern === 'positive_feedback')
        ) {
          continue;
        }
        expect(lower, relativePath).not.toContain(pattern.toLowerCase());
      }

      if (!POLICY_EDUCATIONAL_COPY_FILES.has(normalizedPath)) {
        for (const copy of BADGE_RUNTIME_COPY) {
          expect(source, relativePath).not.toContain(copy);
        }
      }

      for (const forbidden of FORBIDDEN_DISPLAY_PATTERNS) {
        expect(lower, relativePath).not.toContain(forbidden.toLowerCase());
      }

      for (const ranking of RANKING_RUNTIME_PATTERNS) {
        expect(lower, relativePath).not.toContain(ranking.toLowerCase());
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
    }
  });

  it('confirms public HTML has no quality_badge rendering or badge runtime id/class', async () => {
    const htmlFiles = (await listFilesRecursive(PUBLIC_DIR)).filter((path) =>
      path.endsWith('.html'),
    );

    for (const relativePath of htmlFiles) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      const normalizedHtmlPath = relativePath.replace(/\\/g, '/');
      const lower = source.toLowerCase();

      for (const pattern of BADGE_RUNTIME_ID_CLASS_PATTERNS) {
        expect(source, relativePath).not.toMatch(pattern);
      }

      if (!FAQ_POLICY_EDUCATIONAL_HTML_FILES.has(normalizedHtmlPath)) {
        for (const copy of BADGE_RUNTIME_COPY) {
          expect(source, relativePath).not.toContain(copy);
        }
      }

      for (const forbidden of FORBIDDEN_DISPLAY_PATTERNS) {
        expect(lower, relativePath).not.toContain(forbidden.toLowerCase());
      }

      expect(lower, relativePath).not.toContain('quality_badge');
      expect(lower, relativePath).not.toContain('positive_feedback');
    }
  });
});
