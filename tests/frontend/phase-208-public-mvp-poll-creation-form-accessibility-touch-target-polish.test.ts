import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PUBLIC_MVP_CSS = 'public/frontend/public-mvp.css';

const PROTECTED_BACKEND_PATHS = [
  'src/polls/repository.ts',
  'src/http/creator-poll-routes.ts',
  'src/http/official-vote-routes.ts',
  'src/auth/user-auth-resolver.ts',
  'migrations',
];

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

const FORBIDDEN_LEAKAGE_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters|creator_token|error\.message|JSON\.stringify\(error/i;

const FORBIDDEN_OBSERVABILITY =
  /console\.(log|info|warn|error|debug)|analytics|datadog|sentry|apm|trackEvent|gtag\(/i;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 208 public MVP poll creation form accessibility / touch target polish', () => {
  it('documents Phase 208 accessibility rules in public-mvp.css', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');

    expect(css).toContain('Phase 208');
    expect(css).toContain('.create-poll-page #create-poll-form');
    expect(css).toContain('.create-poll-page #create-poll-submit');
    expect(css).toContain('.create-poll-page #form-message');
    expect(css).toContain('.create-poll-page #success-panel');
    expect(css).toContain('min-height: var(--mvp-tap-min)');
    expect(css).toMatch(
      /@media \(max-width: 640px\)[\s\S]*\.create-poll-page \.mvp-form-card/,
    );
    expect(css).toMatch(
      /@media \(max-width: 640px\)[\s\S]*\.create-poll-page #create-poll-form textarea/,
    );
  });

  it('keeps create-poll HTML shell on create-poll-page class wrapper without runtime module churn', async () => {
    const createPollHtml = await readFile(join(process.cwd(), 'public/create-poll.html'), 'utf8');

    expect(createPollHtml).toContain(
      '<main id="main-content" class="mvp-page mvp-shell create-poll-page">',
    );
    expect(createPollHtml).toContain('id="create-poll-form"');
    expect(createPollHtml).toContain('id="create-poll-submit"');
    expect(createPollHtml).toContain('id="form-message"');
    expect(createPollHtml).toContain('id="success-panel"');
    expect(createPollHtml).not.toContain('Phase 208');
  });

  it('does not mark Phase 208 create-poll runtime module or protected backend paths', async () => {
    const createPollSource = await readFile(
      join(process.cwd(), 'public/frontend/create-poll-page.js'),
      'utf8',
    );
    expect(createPollSource).not.toContain('Phase 208');

    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8').catch(() => '');
      if (!source) {
        continue;
      }
      expect(source, relativePath).not.toContain('Phase 208');
    }
  });

  it('does not introduce linkage or observability leakage in Phase 208 CSS', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');
    const phase208Start = css.indexOf('Phase 208');
    const phase208Css = css.slice(phase208Start);

    expect(phase208Css).not.toMatch(FORBIDDEN_LEAKAGE_COPY);
    expect(phase208Css).not.toMatch(FORBIDDEN_OBSERVABILITY);
    expect(phase208Css).not.toMatch(/\bfetch\b|addEventListener|localStorage|sessionStorage/);
  });

  it('keeps submitCreatePollDemo off creator APIs with demo poll id', async () => {
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const createPollSource = await readFile(
      join(process.cwd(), 'public/frontend/create-poll-page.js'),
      'utf8',
    );

    const created = createPoll.submitCreatePollDemo({
      formValues: {
        title: '示範標題',
        description: '',
        options: ['A', 'B'],
      },
    });

    expect(created.poll_id).toBe('demo');
    expect(created.status).toBe('demo_static');
    expect(createPollSource).toContain('submitCreatePollDemo');
    expect(createPollSource).not.toMatch(FORBIDDEN_STORAGE);
  });

  it('keeps live POST /creator/polls boundary with poll-definition body', async () => {
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      fetchCalls.push({ url: String(url), init });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          poll_id: '11111111-1111-4111-8111-111111111111',
          status: 'collecting',
        }),
      };
    });

    await createPoll.submitCreatePoll({
      formValues: {
        title: '正式標題',
        description: '說明',
        options: ['是', '否'],
      },
      fetchImpl,
      now: () => new Date('2026-06-14T12:00:00.000Z'),
    });

    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0]?.url).toBe('/creator/polls');
    expect(fetchCalls[0]?.init?.method).toBe('POST');
    const body = JSON.parse(String(fetchCalls[0]?.init?.body));
    expect(body).toMatchObject({
      title: '正式標題',
      description: '說明',
      options: ['是', '否'],
      category: 'general',
      eligible_rule_id: null,
      publish: true,
    });
    expect(body).toHaveProperty('closes_at');
    expect(body).not.toHaveProperty('option_id');
    expect(body).not.toHaveProperty('option_index');
  });

  it('keeps vote-by-index body unchanged as regression guard', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({}),
    }));

    await votePage.submitVoteByIndex({
      pollId: '11111111-1111-4111-8111-111111111111',
      optionIndex: 0,
      userId: '44444444-4444-4444-8444-444444444444',
      fetchImpl,
    });

    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ option_index: 0 });
    expect(body).not.toHaveProperty('option_id');
  });
});
