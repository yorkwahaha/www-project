import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_247_DOC =
  'docs/www-project-phase-247-public-share-link-runtime-review-checkpoint-v1.md';

const SHARE_LAYOUT_MODULE = 'public/frontend/public-share-link-layout.js';

const SHARE_WIRED_MODULES = [
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/public-mvp-ui.js',
] as const;

const PROTECTED_BACKEND_PATHS = [
  'src/http/official-vote-routes.ts',
  'src/http/creator-poll-routes.ts',
  'src/http/creator-session-routes.ts',
  'src/http/poll-routes.ts',
  'src/auth/user-auth-resolver.ts',
  'migrations',
] as const;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|indexedDB|document\.cookie/i;

const FORBIDDEN_TRACKING =
  /share_token|short_link|qr_code|utm_|analytics|datadog|sentry|apm|trackEvent|gtag\(/i;

const FORBIDDEN_BACKEND_ECHO =
  /error\.message|body\.message|apiError\.message|response\.text\(\)|JSON\.stringify\(error/i;

const FORBIDDEN_OBSERVABILITY = /console\.(log|info|warn|error|debug)/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 247 public share link runtime review checkpoint', () => {
  it('documents Phase 247 review checkpoint in README with APPROVED conclusion', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_247_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 247');
    expect(doc).toContain('Public Share Link Runtime Review Checkpoint');
    expect(doc).toContain('7138b6a');
    expect(doc).toContain('Phase 246');
    expect(doc).toContain('review checkpoint');
    expect(doc).toContain('No runtime change');
    expect(doc).toContain('APPROVED');
    expect(doc).toContain('no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift');

    expect(readme).toContain('Phase 247');
    expect(readme).toContain(PHASE_247_DOC);
    expect(readme).toContain('Public share link runtime review checkpoint');
  });

  it('keeps share layout helper presentation-only without fetch or storage', async () => {
    const layout = await loadModule(SHARE_LAYOUT_MODULE);
    const layoutSource = stripJsComments(
      await readFile(join(process.cwd(), SHARE_LAYOUT_MODULE), 'utf8'),
    );

    expect(layout.PUBLIC_SHARE_LINK_ROW_LAYOUT_ORDER).toEqual([
      'link-label',
      'copy-button',
      'inline-feedback',
      'fallback-url',
    ]);
    expect(layout.PUBLIC_SHARE_LINK_SECTION_LAYOUT_ORDER).toEqual([
      'section-title',
      'share-rows',
    ]);

    expect(layoutSource).not.toMatch(/\bfetch\s*\(/);
    expect(layoutSource).not.toMatch(FORBIDDEN_STORAGE);
    expect(layoutSource).not.toMatch(FORBIDDEN_TRACKING);
    expect(layoutSource).not.toMatch(FORBIDDEN_BACKEND_ECHO);
    expect(layoutSource).not.toMatch(FORBIDDEN_OBSERVABILITY);
    expect(layoutSource).toContain('buildPublicVotePath');
    expect(layoutSource).toContain('buildPublicResultPath');
    expect(layoutSource).toContain('/vote/');
    expect(layoutSource).toContain('/results/');
    expect(layoutSource).not.toContain('option_id');
  });

  it('builds share URLs from pollId and origin only', async () => {
    const layout = await loadModule(SHARE_LAYOUT_MODULE);
    const pollId = '22222222-2222-4222-8222-222222222222';
    const locationObject = { origin: 'https://example.test' };
    const host = {
      hidden: true,
      className: '',
      classList: { add() {} },
      children: [] as unknown[],
      replaceChildren() {
        this.children = [];
      },
      append(child: unknown) {
        this.children.push(child);
      },
    };
    const documentObject = {
      createElement(tagName: string) {
        return {
          tagName,
          className: '',
          textContent: '',
          children: [] as unknown[],
          append(child: unknown) {
            this.children.push(child);
          },
          setAttribute() {},
          addEventListener() {},
        };
      },
      getElementById(id: string) {
        return id === 'vote-detail-share-links' ? host : null;
      },
    };

    layout.syncVotePageShareLinks(documentObject, { pollId, locationObject });

    const serialized = JSON.stringify(host.children);
    expect(serialized).toContain(`https://example.test/vote/${pollId}`);
    expect(serialized).not.toMatch(/utm_|share_token|option_id|user_id/i);
  });

  it('keeps copyTextToClipboard without storage, tracking, or backend echo', async () => {
    const layout = await loadModule(SHARE_LAYOUT_MODULE);
    const writeText = vi.fn(async () => undefined);

    const result = await layout.copyTextToClipboard('https://example.test/vote/demo', {
      clipboard: { writeText },
    });

    expect(result.ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith('https://example.test/vote/demo');
    expect(writeText.mock.calls[0]?.[0]).not.toMatch(/option_id|user_id|session/i);
  });

  it('keeps vote and results html share hosts as static shells', async () => {
    const voteHtml = await readFile(join(process.cwd(), 'public/vote.html'), 'utf8');
    const resultsHtml = await readFile(join(process.cwd(), 'public/results.html'), 'utf8');

    expect(voteHtml).toContain('id="vote-detail-share-links"');
    expect(voteHtml).toContain('aria-label="分享連結"');
    expect(resultsHtml).toContain('id="results-detail-share-links"');
    expect(resultsHtml).toContain('aria-label="分享連結"');
    expect(voteHtml).not.toContain('Phase 246');
    expect(resultsHtml).not.toContain('Phase 247');
  });

  it('wires share helpers on vote, results, my-polls, and create poll without vote flow drift', async () => {
    const voteSource = await readFile(join(process.cwd(), 'public/frontend/vote-page.js'), 'utf8');
    const resultSource = await readFile(
      join(process.cwd(), 'public/frontend/result-page.js'),
      'utf8',
    );
    const myPollsSource = await readFile(
      join(process.cwd(), 'public/frontend/my-polls-page.js'),
      'utf8',
    );
    const createPollSource = await readFile(
      join(process.cwd(), 'public/frontend/create-poll-page.js'),
      'utf8',
    );
    const mvpUiSource = await readFile(
      join(process.cwd(), 'public/frontend/public-mvp-ui.js'),
      'utf8',
    );

    expect(voteSource).toContain('syncVotePageShareLinks');
    expect(voteSource).toContain("from './public-share-link-layout.js'");
    expect(voteSource).toContain('vote-by-index');
    expect(voteSource).toContain('option_index: optionIndex');

    expect(resultSource).toContain('syncResultsPageShareLinks');
    expect(myPollsSource).toContain('mountCreatorOwnedPollShareLinks');
    expect(myPollsSource).toContain('mvp-creator-owned-poll-share-links');
    expect(createPollSource).toContain('renderPollSharePanel');
    expect(mvpUiSource).toContain("from './public-share-link-layout.js'");
  });

  it('limits server.ts change to static ES module route for share layout', async () => {
    const serverSource = await readFile(join(process.cwd(), 'src/http/server.ts'), 'utf8');
    const matches = serverSource.match(/public-share-link-layout\.js/g) ?? [];

    expect(matches.length).toBe(2);
    expect(serverSource).toContain("path === '/frontend/public-share-link-layout.js'");
    expect(serverSource).toContain("sendPublicFile(");
    expect(serverSource).not.toContain("path === '/api/share");
  });

  it('extends smoke-public-local coverage for layout module only', async () => {
    const smokeSource = await readFile(
      join(process.cwd(), 'scripts/smoke-public-local.mjs'),
      'utf8',
    );

    expect(smokeSource).toContain('/frontend/public-share-link-layout.js');
    expect(smokeSource).toContain('renderPollSharePanel');
    expect(smokeSource).toContain('PUBLIC_JSON_DENYLIST');
    expect(smokeSource).not.toMatch(/share_token|short_link|qr_code/i);
  });

  it('keeps wired share modules free of forbidden storage and tracking', async () => {
    for (const relativePath of [...SHARE_WIRED_MODULES, SHARE_LAYOUT_MODULE]) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_STORAGE);
      expect(source, relativePath).not.toMatch(FORBIDDEN_TRACKING);
    }
  });

  it('does not mark Phase 247 changes on protected backend paths in this checkpoint', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      if (relativePath === 'migrations') {
        continue;
      }
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 247');
    }
  });
});
