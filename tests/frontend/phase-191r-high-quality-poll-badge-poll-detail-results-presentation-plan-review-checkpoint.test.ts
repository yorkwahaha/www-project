import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const PHASE_191R_DOC =
  'docs/www-project-phase-191r-high-quality-poll-badge-poll-detail-results-presentation-plan-review-checkpoint-v1.md';
const FRONTEND_DIR = 'public/frontend';
const PUBLIC_DIR = 'public';

const BADGE_RUNTIME_COPY = ['回饋良好'] as const;

const BANNED_ABSENCE_COPY = [
  '尚未達標',
  '回饋不足',
  '品質不足',
  '未取得徽章',
] as const;

const BANNED_MISLEADING_COPY = [
  '優質題目',
  '高分題目',
  '熱門',
  '排名',
  '品質分數',
  '低品質',
] as const;

const TOOLTIP_DEBUG_PATTERNS = [
  'title=',
  'tooltip',
  'data-count',
  'data-score',
  'data-rank',
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

const BADGE_RUNTIME_FILES = new Set([
  'public/frontend/quality-feedback-badge.js',
  'public/frontend/explore-page.js',
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
]);

const POLICY_EDUCATIONAL_COPY_FILES = new Set([
  'public/frontend/policy-ui-placeholders.js',
  'public/frontend/public-mvp-ui.js',
  'public/frontend/public-mvp-layout.js',
]);

const DETAIL_RESULTS_SURFACE_FILES = new Set([
  'public/frontend/result-page.js',
  'public/frontend/vote-page.js',
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

async function loadQualityFeedbackBadgeModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/quality-feedback-badge.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

function createDocumentStub() {
  function createElement(tagName: string) {
    return {
      tagName,
      className: '',
      textContent: '',
      children: [] as ReturnType<typeof createElement>[],
    };
  }
  return { createElement };
}

describe('Phase 191-R high-quality poll badge poll detail results presentation plan review checkpoint', () => {
  it('documents Phase 191 plan review and Phase 192 minimal runtime approval', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_191R_DOC), 'utf8');

    expect(doc).toContain('Phase 191-R');
    expect(doc).toContain('Phase 191');
    expect(doc).toContain('APPROVED — Phase 192 blockers: none identified.');
    expect(doc).toContain(
      'High-quality Poll Badge Poll Detail / Results Minimal Frontend Rendering Runtime',
    );
    expect(doc).toContain('回饋良好');
    expect(doc).toContain('quality_badge');
    expect(doc).toContain('renderQualityFeedbackBadge()');
  });

  it('shows 回饋良好 only for positive_feedback and silences null/missing/unexpected values', async () => {
    const { renderQualityFeedbackBadge, shouldRenderQualityFeedbackBadge } =
      await loadQualityFeedbackBadgeModule();
    const documentObject = createDocumentStub();

    expect(shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    const badge = renderQualityFeedbackBadge(documentObject, {
      quality_badge: 'positive_feedback',
    });
    expect(badge).not.toBeNull();
    expect(badge!.textContent).toBe('回饋良好');

    for (const poll of [
      { quality_badge: null },
      {},
      { quality_badge: 'low_quality' },
      { quality_badge: 'unknown' },
    ]) {
      expect(shouldRenderQualityFeedbackBadge(poll)).toBe(false);
      expect(renderQualityFeedbackBadge(documentObject, poll)).toBeNull();
    }
  });

  it('confirms explore rendering exists and detail/results use shared quality feedback badge helper', async () => {
    const exploreSource = await readFile(
      join(process.cwd(), 'public/frontend/explore-page.js'),
      'utf8',
    );

    expect(exploreSource).toContain("from './quality-feedback-badge.js'");
    expect(exploreSource).toContain('renderQualityFeedbackBadge');

    for (const relativePath of DETAIL_RESULTS_SURFACE_FILES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).toContain("from './quality-feedback-badge.js'");
      expect(source, relativePath).toContain('mountQualityFeedbackBadgeNearTitle');
      expect(source, relativePath).not.toMatch(/quality_badge[\s\S]{0,120}render/i);
    }

    const htmlFiles = (await listFilesRecursive(PUBLIC_DIR)).filter((path) =>
      path.endsWith('.html'),
    );
    for (const relativePath of htmlFiles) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('回饋良好');
      expect(source, relativePath).not.toContain('positive-feedback-badge');
    }
  });

  it('keeps badge runtime within banned-copy and forbidden-detail boundaries', async () => {
    const jsFiles = (await listFilesRecursive(FRONTEND_DIR)).filter((path) =>
      path.endsWith('.js'),
    );

    for (const relativePath of jsFiles) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      const lower = source.toLowerCase();
      const normalizedPath = relativePath.replace(/\\/g, '/');

      if (!BADGE_RUNTIME_FILES.has(normalizedPath)) {
        for (const copy of BADGE_RUNTIME_COPY) {
          expect(source, relativePath).not.toContain(copy);
        }
      }

      if (BADGE_RUNTIME_FILES.has(normalizedPath)) {
        for (const copy of BANNED_ABSENCE_COPY) {
          expect(source, relativePath).not.toContain(copy);
        }
        for (const copy of BANNED_MISLEADING_COPY) {
          expect(source, relativePath).not.toContain(copy);
        }
      } else if (!POLICY_EDUCATIONAL_COPY_FILES.has(normalizedPath)) {
        for (const copy of [...BANNED_ABSENCE_COPY, ...BANNED_MISLEADING_COPY]) {
          expect(source, relativePath).not.toContain(copy);
        }
        expect(source, relativePath).not.toMatch(/優質題目|排名/);
      }

      if (BADGE_RUNTIME_FILES.has(normalizedPath)) {
        for (const pattern of TOOLTIP_DEBUG_PATTERNS) {
          expect(lower, relativePath).not.toContain(pattern.toLowerCase());
        }
        for (const forbidden of FORBIDDEN_DISPLAY_PATTERNS) {
          expect(lower, relativePath).not.toContain(forbidden.toLowerCase());
        }
      }

      for (const behavior of BEHAVIOR_RUNTIME_PATTERNS) {
        expect(lower, relativePath).not.toContain(behavior.toLowerCase());
      }

      if (BADGE_RUNTIME_FILES.has(normalizedPath)) {
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
    }
  });

  it('confirms vote CTA, eligibility, and results visibility runtime unchanged by quality badge', async () => {
    for (const relativePath of DETAIL_RESULTS_SURFACE_FILES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      const lower = source.toLowerCase();

      for (const behavior of BEHAVIOR_RUNTIME_PATTERNS) {
        expect(lower, relativePath).not.toContain(behavior.toLowerCase());
      }

      expect(source, relativePath).not.toMatch(
        /quality_badge[\s\S]{0,120}(eligib|cta|visible|visibility|gate)/i,
      );
    }
  });
});
