import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_185R_DOC =
  'docs/www-project-phase-185r-high-quality-poll-badge-eligibility-plan-review-checkpoint-v1.md';
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

const POLICY_EDUCATIONAL_COPY_FILES = new Set([
  'public/frontend/policy-ui-placeholders.js',
  'public/frontend/public-mvp-ui.js',
  'public/frontend/public-mvp-layout.js',
  'public/frontend/public-page-copy.js',
  'public/frontend/creator-flow-copy.js',
]);

const FAQ_POLICY_EDUCATIONAL_HTML_FILES = new Set(['public/faq.html', 'public/index.html']);

const PHASE_190_BADGE_RUNTIME_FILES = new Set([
  'public/frontend/quality-feedback-badge.js',
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

describe('Phase 185-R high-quality poll badge eligibility plan review checkpoint', () => {
  it('documents Phase 184 plan review and Phase 186 plan-only approval', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_185R_DOC), 'utf8');

    expect(doc).toContain('Phase 185-R');
    expect(doc).toContain('Phase 184');
    expect(doc).toContain('APPROVED — Phase 186 blockers: none identified.');
    expect(doc).toContain(
      'High-quality Poll Badge Read-model / Presentation Plan',
    );
    expect(doc).toContain('No badge runtime implementation');
  });

  it('confirms public frontend JS has no high-quality badge runtime hooks', async () => {
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

  it('confirms public HTML has no high-quality badge runtime id/class or planned badge copy', async () => {
    const htmlFiles = (await listFilesRecursive(PUBLIC_DIR)).filter((path) =>
      path.endsWith('.html'),
    );

    for (const relativePath of htmlFiles) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      const normalizedHtmlPath = relativePath.replace(/\\/g, '/');

      for (const pattern of BADGE_RUNTIME_ID_CLASS_PATTERNS) {
        expect(source, relativePath).not.toMatch(pattern);
      }

      if (!FAQ_POLICY_EDUCATIONAL_HTML_FILES.has(normalizedHtmlPath)) {
        for (const copy of BADGE_RUNTIME_COPY) {
          expect(source, relativePath).not.toContain(copy);
        }
      }

      for (const forbidden of FORBIDDEN_DISPLAY_PATTERNS) {
        expect(source.toLowerCase(), relativePath).not.toContain(
          forbidden.toLowerCase(),
        );
      }
    }
  });
});
