import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const PHASE_192_DOC =
  'docs/www-project-phase-192-high-quality-poll-badge-detail-results-minimal-frontend-rendering-runtime-v1.md';
const FRONTEND_DIR = 'public/frontend';
const PUBLIC_DIR = 'public';

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
  'public/frontend/public-page-copy.js',
  'public/frontend/creator-flow-copy.js',
]);

const FAQ_POLICY_EDUCATIONAL_HTML_FILES = new Set(['public/faq.html', 'public/index.html']);

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

describe('Phase 192 high-quality poll badge detail results minimal frontend rendering runtime', () => {
  it('documents minimal frontend rendering runtime boundaries', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_192_DOC), 'utf8');
    expect(doc).toContain('Phase 192');
    expect(doc).toContain('minimal frontend rendering runtime');
    expect(doc).toContain('renderQualityFeedbackBadge()');
    expect(doc).toContain('No API/backend/DB/schema/migration change');
    expect(doc).toContain('Raw Option Linkage Ban');
  });

  it('mounts poll detail badge for positive_feedback only', async () => {
    const {
      mountQualityFeedbackBadgeNearTitle,
      renderQualityFeedbackBadge,
      QUALITY_FEEDBACK_BADGE_ROW_CLASS,
    } = await loadQualityFeedbackBadgeModule();
    const { createElement, title } = createDocumentStub();
    const documentObject = { createElement };

    const withBadge = mountQualityFeedbackBadgeNearTitle(documentObject, title, {
      quality_badge: 'positive_feedback',
    });
    expect(withBadge).not.toBeNull();
    expect(withBadge!.hidden).toBe(false);
    expect(withBadge!.className).toContain(QUALITY_FEEDBACK_BADGE_ROW_CLASS);
    expect(JSON.stringify(withBadge)).toContain('回饋良好');
    expect(JSON.stringify(withBadge)).toContain('positive-feedback-badge');

    for (const poll of [
      { quality_badge: null },
      {},
      { quality_badge: 'low_quality' },
      { quality_badge: 'unknown' },
    ]) {
      const row = mountQualityFeedbackBadgeNearTitle(documentObject, title, poll);
      expect(row).not.toBeNull();
      expect(row!.hidden).toBe(true);
      expect(renderQualityFeedbackBadge(documentObject, poll)).toBeNull();
    }
  });

  it('wires vote-page and result-page to shared quality feedback badge helper', async () => {
    const voteSource = await readFile(
      join(process.cwd(), 'public/frontend/vote-page.js'),
      'utf8',
    );
    const resultSource = await readFile(
      join(process.cwd(), 'public/frontend/result-page.js'),
      'utf8',
    );
    const exploreSource = await readFile(
      join(process.cwd(), 'public/frontend/explore-page.js'),
      'utf8',
    );

    for (const source of [voteSource, resultSource, exploreSource]) {
      expect(source).toContain("from './quality-feedback-badge.js'");
    }

    expect(voteSource).toContain('mountQualityFeedbackBadgeNearTitle');
    expect(resultSource).toContain('mountQualityFeedbackBadgeNearTitle');
    expect(exploreSource).toContain('renderQualityFeedbackBadge');
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
        expect(source, relativePath).not.toContain('回饋良好');
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
      const normalizedHtmlPath = relativePath.replace(/\\/g, '/');
      if (FAQ_POLICY_EDUCATIONAL_HTML_FILES.has(normalizedHtmlPath)) {
        continue;
      }
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('回饋良好');
      expect(source, relativePath).not.toContain('positive-feedback-badge');
    }
  });

  it('does not change vote CTA, eligibility, or results visibility logic', async () => {
    const voteSource = await readFile(
      join(process.cwd(), 'public/frontend/vote-page.js'),
      'utf8',
    );
    const resultSource = await readFile(
      join(process.cwd(), 'public/frontend/result-page.js'),
      'utf8',
    );

    expect(voteSource).toContain('applyVotePageVotingAvailability');
    expect(voteSource).toContain('SUBMIT_IDLE_LABEL');
    expect(resultSource).toContain('resolveResultRenderMode');
    expect(resultSource).toContain('isCollectingResult');

    for (const [label, source] of [
      ['vote-page.js', voteSource],
      ['result-page.js', resultSource],
    ] as const) {
      expect(source, label).not.toMatch(
        /quality_badge[\s\S]{0,120}(eligib|cta|visible|visibility|gate)/i,
      );
    }
  });

  it('keeps badge rendering in frontend-only modules without API changes', async () => {
    const badgeSource = await readFile(
      join(process.cwd(), 'public/frontend/quality-feedback-badge.js'),
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

    expect(badgeSource).not.toMatch(/fetch\s*\(/);
    expect(voteSource).not.toMatch(/fetch\([^)]*quality_badge/i);
    expect(resultSource).not.toMatch(/fetch\([^)]*quality_badge/i);
    expect(badgeSource).not.toContain('aggregate_count');
  });
});
