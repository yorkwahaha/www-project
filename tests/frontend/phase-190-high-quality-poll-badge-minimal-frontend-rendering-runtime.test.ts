import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const PHASE_190_DOC =
  'docs/www-project-phase-190-high-quality-poll-badge-minimal-frontend-rendering-runtime-v1.md';

async function loadQualityFeedbackBadgeModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/quality-feedback-badge.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function loadExplorePageModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/explore-page.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

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

const FORBIDDEN_DISPLAY_PATTERNS = [
  'aggregate_count',
  'tag_breakdown',
  'tag_counts',
  'quality_score',
  'creator_score',
  'threshold_state',
  'bucket_state',
] as const;

function createDocumentStub() {
  function createElement(tagName: string) {
    return {
      tagName,
      className: '',
      textContent: '',
      href: '',
      dataset: {} as Record<string, string>,
      children: [] as ReturnType<typeof createElement>[],
      append(...nodes: ReturnType<typeof createElement>[]) {
        this.children.push(...nodes);
      },
    };
  }
  return { createElement };
}

const basePoll = {
  poll_id: '11111111-1111-4111-8111-111111111111',
  title: '咖啡攝取調查',
  category: 'general',
  status: 'active' as const,
  published_display: '最近發布' as const,
  result_page_url: '/results/11111111-1111-4111-8111-111111111111',
};

describe('Phase 190 high-quality poll badge minimal frontend rendering runtime', () => {
  it('documents minimal frontend rendering runtime boundaries', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_190_DOC), 'utf8');
    expect(doc).toContain('Phase 190');
    expect(doc).toContain('minimal frontend rendering runtime');
    expect(doc).toContain('quality_badge');
    expect(doc).toContain('回饋良好');
    expect(doc).toContain('No API/backend/DB/schema/migration change');
    expect(doc).toContain('Raw Option Linkage Ban');
  });

  it('shows 回饋良好 only for positive_feedback', async () => {
    const { renderQualityFeedbackBadge, shouldRenderQualityFeedbackBadge } =
      await loadQualityFeedbackBadgeModule();
    const documentObject = createDocumentStub();

    const badge = renderQualityFeedbackBadge(documentObject, {
      ...basePoll,
      quality_badge: 'positive_feedback',
    });

    expect(shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    expect(badge).not.toBeNull();
    expect(badge!.textContent).toBe('回饋良好');
    expect(badge!.className).toContain('positive-feedback-badge');
    expect(badge!.className).not.toMatch(/rank|score|hot|trend/i);
  });

  it('does not render badge for null, missing field, or unexpected values', async () => {
    const { renderQualityFeedbackBadge, shouldRenderQualityFeedbackBadge } =
      await loadQualityFeedbackBadgeModule();
    const documentObject = createDocumentStub();

    for (const poll of [
      { ...basePoll, quality_badge: null },
      { ...basePoll },
      { ...basePoll, quality_badge: 'low_quality' },
      { ...basePoll, quality_badge: 'unknown' },
    ]) {
      expect(shouldRenderQualityFeedbackBadge(poll)).toBe(false);
      expect(renderQualityFeedbackBadge(documentObject, poll)).toBeNull();
    }
  });

  it('renders explore feed card with quality badge only for positive_feedback', async () => {
    const { renderExplorePollCard } = await loadExplorePageModule();
    const documentObject = createDocumentStub();

    const withoutBadge = renderExplorePollCard(documentObject, {
      ...basePoll,
      quality_badge: null,
    });
    const withBadge = renderExplorePollCard(documentObject, {
      ...basePoll,
      quality_badge: 'positive_feedback',
    });

    const withoutSerialized = JSON.stringify(withoutBadge);
    const withSerialized = JSON.stringify(withBadge);

    expect(withoutSerialized).not.toContain('回饋良好');
    expect(withoutSerialized).not.toContain('positive-feedback-badge');
    expect(withSerialized).toContain('回饋良好');
    expect(withSerialized).toContain('positive-feedback-badge');
    expect(withSerialized).toContain('收集中');
  });

  it('keeps badge helper free of banned copy and forbidden display fields', async () => {
    const source = await readFile(
      join(process.cwd(), 'public/frontend/quality-feedback-badge.js'),
      'utf8',
    );
    const exploreSource = await readFile(
      join(process.cwd(), 'public/frontend/explore-page.js'),
      'utf8',
    );
    const cssSource = await readFile(
      join(process.cwd(), 'public/frontend/public-mvp.css'),
      'utf8',
    );

    for (const copy of [...BANNED_ABSENCE_COPY, ...BANNED_MISLEADING_COPY]) {
      expect(source).not.toContain(copy);
      expect(exploreSource).not.toContain(copy);
      expect(cssSource).not.toContain(copy);
    }

    for (const forbidden of FORBIDDEN_DISPLAY_PATTERNS) {
      expect(source.toLowerCase()).not.toContain(forbidden);
      expect(exploreSource.toLowerCase()).not.toContain(forbidden);
    }

    expect(source).not.toMatch(/title\s*=|tooltip|data-count|data-score/i);
    expect(exploreSource).not.toMatch(
      /quality_badge[\s\S]{0,80}(sort|filter|order)/i,
    );
    expect(exploreSource).not.toMatch(
      /localStorage|sessionStorage|document\.cookie/i,
    );
  });

  it('keeps badge rendering in frontend-only modules without API changes', async () => {
    const badgeSource = await readFile(
      join(process.cwd(), 'public/frontend/quality-feedback-badge.js'),
      'utf8',
    );
    const exploreSource = await readFile(
      join(process.cwd(), 'public/frontend/explore-page.js'),
      'utf8',
    );

    expect(exploreSource).toContain("from './quality-feedback-badge.js'");
    expect(exploreSource).not.toMatch(/fetch\([^)]*quality_badge/i);
    expect(badgeSource).not.toMatch(/fetch\s*\(/);
    expect(badgeSource).not.toContain('aggregate_count');
  });
});
