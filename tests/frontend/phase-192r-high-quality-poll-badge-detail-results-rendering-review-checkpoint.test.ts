import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const PHASE_192R_DOC =
  'docs/www-project-phase-192r-high-quality-poll-badge-detail-results-rendering-review-checkpoint-v1.md';
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
      hidden: false,
      children: [] as ReturnType<typeof createElement>[],
      append(child: ReturnType<typeof createElement>) {
        this.children.push(child);
      },
      replaceChildren() {
        this.children = [];
      },
    };
  }

  const title = createElement('h1');
  const parent = createElement('div');
  parent.children = [title];
  title.parentNode = parent;
  title.parentElement = parent;
  title.nextSibling = null;
  title.nextElementSibling = null;
  parent.insertBefore = (node: ReturnType<typeof createElement>) => {
    const index = parent.children.indexOf(title);
    parent.children.splice(index + 1, 0, node);
    return node;
  };

  return { createElement, title, parent };
}

describe('Phase 192-R high-quality poll badge detail results rendering review checkpoint', () => {
  it('documents Phase 192 runtime review and Phase 193 milestone checkpoint approval', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_192R_DOC), 'utf8');

    expect(doc).toContain('Phase 192-R');
    expect(doc).toContain('Phase 192');
    expect(doc).toContain('APPROVED — Phase 193 blockers: none identified.');
    expect(doc).toContain('Quality Badge Presentation Milestone Checkpoint');
    expect(doc).toContain('回饋良好');
    expect(doc).toContain('quality_badge');
    expect(doc).toContain('renderQualityFeedbackBadge()');
    expect(doc).toContain('mountQualityFeedbackBadgeNearTitle()');
  });

  it('shows 回饋良好 only for positive_feedback and silences null/missing/unexpected values', async () => {
    const { renderQualityFeedbackBadge, shouldRenderQualityFeedbackBadge } =
      await loadQualityFeedbackBadgeModule();
    const { createElement } = createDocumentStub();
    const documentObject = { createElement };

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

  it('confirms shared helpers on explore, vote, and results surfaces with title placement', async () => {
    const exploreSource = await readFile(
      join(process.cwd(), 'public/frontend/explore-page.js'),
      'utf8',
    );
    const voteSource = await readFile(
      join(process.cwd(), 'public/frontend/vote-page.js'),
      'utf8',
    );
    const resultSource = await readFile(
      join(process.cwd(), 'public/frontend/result-page.js'),
      'utf8',
    );
    const badgeSource = await readFile(
      join(process.cwd(), 'public/frontend/quality-feedback-badge.js'),
      'utf8',
    );

    expect(exploreSource).toContain('renderQualityFeedbackBadge');
    expect(voteSource).toContain('mountQualityFeedbackBadgeNearTitle');
    expect(resultSource).toContain('mountQualityFeedbackBadgeNearTitle');
    expect(badgeSource).toContain('renderQualityFeedbackBadge');
    expect(badgeSource).toContain('mountQualityFeedbackBadgeNearTitle');
    expect(badgeSource).not.toMatch(/function\s+renderQualityFeedbackBadgeAlt/i);

    expect(voteSource).toContain("getElementById('poll-title')");
    expect(resultSource).toContain("getElementById('page-title')");
    expect(voteSource).not.toContain('renderQualityFeedbackBadge(');
    expect(resultSource).not.toContain('renderQualityFeedbackBadge(');
  });

  it('keeps badge runtime within banned-copy and forbidden-detail boundaries', async () => {
    const jsFiles = (await listFilesRecursive(FRONTEND_DIR)).filter((path) =>
      path.endsWith('.js'),
    );

    for (const relativePath of jsFiles) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      const lower = source.toLowerCase();
      const normalizedPath = relativePath.replace(/\\/g, '/');

      if (BADGE_RUNTIME_FILES.has(normalizedPath)) {
        for (const copy of BANNED_ABSENCE_COPY) {
          expect(source, relativePath).not.toContain(copy);
        }
        for (const copy of BANNED_MISLEADING_COPY) {
          expect(source, relativePath).not.toContain(copy);
        }
        for (const pattern of TOOLTIP_DEBUG_PATTERNS) {
          expect(lower, relativePath).not.toContain(pattern.toLowerCase());
        }
        for (const forbidden of FORBIDDEN_DISPLAY_PATTERNS) {
          expect(lower, relativePath).not.toContain(forbidden.toLowerCase());
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
      } else if (!POLICY_EDUCATIONAL_COPY_FILES.has(normalizedPath)) {
        for (const copy of BADGE_RUNTIME_COPY) {
          expect(source, relativePath).not.toContain(copy);
        }
      }

      for (const behavior of BEHAVIOR_RUNTIME_PATTERNS) {
        expect(lower, relativePath).not.toContain(behavior.toLowerCase());
      }
    }
  });

  it('does not add badge copy to static HTML shells', async () => {
    const htmlFiles = (await listFilesRecursive(PUBLIC_DIR)).filter((path) =>
      path.endsWith('.html'),
    );
    for (const relativePath of htmlFiles) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('回饋良好');
      expect(source, relativePath).not.toContain('positive-feedback-badge');
    }
  });

  it('confirms vote CTA, eligibility, and results visibility runtime unchanged by quality badge', async () => {
    const voteSource = await readFile(
      join(process.cwd(), 'public/frontend/vote-page.js'),
      'utf8',
    );
    const resultSource = await readFile(
      join(process.cwd(), 'public/frontend/result-page.js'),
      'utf8',
    );

    expect(voteSource).toContain('applyVotePageVotingAvailability');
    expect(resultSource).toContain('resolveResultRenderMode');

    for (const [label, source] of [
      ['vote-page.js', voteSource],
      ['result-page.js', resultSource],
    ] as const) {
      expect(source, label).not.toMatch(
        /quality_badge[\s\S]{0,120}(eligib|cta|visible|visibility|gate|interpret)/i,
      );
    }
  });
});
