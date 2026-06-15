import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { readdir } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const PHASE_188_DOC =
  'docs/www-project-phase-188-high-quality-poll-badge-minimal-public-read-runtime-v1.md';
const FRONTEND_DIR = 'public/frontend';
const PUBLIC_DIR = 'public';

const BADGE_RUNTIME_ID_CLASS_PATTERNS = [
  /id=["'][^"']*high-quality[^"']*["']/i,
  /class=["'][^"']*high-quality[^"']*["']/i,
  /id=["'][^"']*quality-badge[^"']*["']/i,
  /class=["'][^"']*quality-badge[^"']*["']/i,
] as const;

const BADGE_RENDERING_COPY = ['回饋良好', '大家覺得題目清楚'] as const;

const BADGE_RENDERING_JS_PATTERNS = [
  'quality-badge',
  'high-quality-badge',
  'highQualityBadge',
  'mountHighQualityBadge',
  'mountQualityBadge',
  'renderQualityBadge',
  'qualityBadge',
] as const;

const FEED_PARSING_TOLERANCE_FILES = new Set(['public/frontend/explore-page.js']);

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

describe('Phase 188 high-quality poll badge minimal public read runtime', () => {
  it('documents minimal public read runtime without frontend badge presentation', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_188_DOC), 'utf8');
    expect(doc).toContain('Phase 188');
    expect(doc).toContain('minimal public read runtime');
    expect(doc).toContain('quality_badge');
    expect(doc).toContain('No schema/migration');
    expect(doc).toContain('No frontend badge presentation');
    expect(doc).toContain('poll_quality_feedback_aggregate');
    expect(doc).toContain('Raw Option Linkage Ban');
  });

  it('confirms public frontend JS has no badge rendering hooks', async () => {
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

      if (!POLICY_EDUCATIONAL_COPY_FILES.has(normalizedPath)) {
        for (const copy of BADGE_RENDERING_COPY) {
          expect(source, relativePath).not.toContain(copy);
        }
      }

      if (!FEED_PARSING_TOLERANCE_FILES.has(normalizedPath)) {
        expect(lower, relativePath).not.toContain('quality_badge');
        expect(lower, relativePath).not.toContain('positive_feedback');
      }
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
  });

  it('confirms public HTML has no quality badge runtime id/class or rendering copy', async () => {
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
        for (const copy of BADGE_RENDERING_COPY) {
          expect(source, relativePath).not.toContain(copy);
        }
        expect(lower, relativePath).not.toContain('quality_badge');
        expect(lower, relativePath).not.toContain('positive_feedback');
      }
    }
  });

  it('keeps quality badge read SQL poll-scoped without identity linkage', async () => {
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
    ]) {
      expect(readBlock!.toLowerCase()).not.toContain(forbidden);
    }
  });
});
