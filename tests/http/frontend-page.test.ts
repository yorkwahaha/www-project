import type { Server } from 'node:http';
import { describe, expect, it } from 'vitest';
import { createHttpServer } from '../../src/http/server.js';
import { createInMemoryPollRepository } from '../../src/polls/in-memory-repository.js';
import { createPollService } from '../../src/polls/service.js';

async function withServer<T>(
  server: Server,
  run: (baseUrl: string) => Promise<T>,
): Promise<T> {
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('failed to bind test server');
  }
  try {
    return await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

describe('frontend static routes', () => {
  it('serves the public landing page with a link to create a poll', async () => {
    const server = createHttpServer({
      pollService: createPollService(createInMemoryPollRepository()),
    });

    await withServer(server, async (baseUrl) => {
      const page = await fetch(`${baseUrl}/`);
      const pageBody = await page.text();

      expect(page.status).toBe(200);
      expect(page.headers.get('content-type')).toContain('text/html');
      expect(page.headers.get('cache-control')).toBe('no-store');
      expect(page.headers.get('content-security-policy')).toContain("style-src 'self'");
      expect(pageBody).toContain('What We Wonder');
      expect(pageBody).toContain('href="/polls/new"');
      expect(pageBody).toContain('href="/explore"');
      expect(pageBody).toContain('href="/faq"');
      expect(pageBody).toContain('/frontend/public-mvp.css');
      expect(pageBody).toContain('class="mvp-body"');
      expect(pageBody).not.toMatch(/localStorage|sessionStorage|feed|ranking|option_id/i);

      const stylesheet = await fetch(`${baseUrl}/frontend/public-mvp.css`);
      expect(stylesheet.status).toBe(200);
      expect(stylesheet.headers.get('content-type')).toContain('text/css');
      expect(await stylesheet.text()).toContain('.mvp-shell');
    });
  });

  it('serves a public result page and named frontend assets only', async () => {
    const server = createHttpServer({
      pollService: createPollService(createInMemoryPollRepository()),
    });
    const pollId = '11111111-1111-4111-8111-111111111111';

    await withServer(server, async (baseUrl) => {
      const page = await fetch(`${baseUrl}/results/${pollId}`, {
        headers: { 'X-User-Id': 'ignored-user-id' },
      });
      const pageBody = await page.text();
      const resultScript = await fetch(`${baseUrl}/frontend/result-page.js`);
      const privacyScript = await fetch(
        `${baseUrl}/frontend/submission-privacy.js`,
      );

      expect(page.status).toBe(200);
      expect(page.headers.get('content-type')).toContain('text/html');
      expect(page.headers.get('cache-control')).toBe('no-store');
      expect(pageBody).toContain('/frontend/result-page.js');
      expect(pageBody).toContain('/frontend/public-mvp.css');
      expect(pageBody).toContain('id="site-header"');
      expect(pageBody).toContain('results-intro');
      expect(pageBody).toContain('公開結果（唯讀）');
      expect(pageBody).not.toContain('ignored-user-id');
      expect(resultScript.status).toBe(200);
      expect(privacyScript.status).toBe(200);
    });
  });

  it('returns a safe 400 for an invalid public result page poll id', async () => {
    const server = createHttpServer({
      pollService: createPollService(createInMemoryPollRepository()),
    });

    await withServer(server, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/results/not-a-uuid`);

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: 'INVALID_POLL_ID',
        message: 'Invalid poll id',
      });
    });
  });

  it('serves the public poll creation page and its named frontend asset', async () => {
    const server = createHttpServer({
      pollService: createPollService(createInMemoryPollRepository()),
    });

    await withServer(server, async (baseUrl) => {
      const page = await fetch(`${baseUrl}/polls/new`);
      const pageBody = await page.text();
      const script = await fetch(`${baseUrl}/frontend/create-poll-page.js`);

      expect(page.status).toBe(200);
      expect(page.headers.get('content-type')).toContain('text/html');
      expect(page.headers.get('cache-control')).toBe('no-store');
      expect(pageBody).toContain('建立問卷');
      expect(pageBody).toContain('id="site-header"');
      expect(pageBody).toContain('/frontend/public-mvp-layout.js');
      expect(pageBody).toContain('/frontend/create-poll-page.js');
      expect(pageBody).toContain('/frontend/public-mvp.css');
      expect(pageBody).toContain('aria-live');
      expect(pageBody).not.toContain('option_id');
      expect(script.status).toBe(200);
      expect(script.headers.get('content-type')).toContain('text/javascript');
    });
  });

  it('serves demo slug vote and result pages without treating them as API ids', async () => {
    const server = createHttpServer({
      pollService: createPollService(createInMemoryPollRepository()),
    });

    await withServer(server, async (baseUrl) => {
      const votePage = await fetch(`${baseUrl}/vote/demo`);
      const resultPage = await fetch(`${baseUrl}/results/demo`);

      expect(votePage.status).toBe(200);
      expect(resultPage.status).toBe(200);
      expect(await votePage.text()).toContain('vote-page.js');
      expect(await resultPage.text()).toContain('result-page.js');
    });
  });

  it('serves the public voting page and its named frontend asset', async () => {
    const server = createHttpServer({
      pollService: createPollService(createInMemoryPollRepository()),
    });
    const pollId = '11111111-1111-4111-8111-111111111111';

    await withServer(server, async (baseUrl) => {
      const page = await fetch(`${baseUrl}/vote/${pollId}`);
      const pageBody = await page.text();
      const script = await fetch(`${baseUrl}/frontend/vote-page.js`);

      expect(page.status).toBe(200);
      expect(page.headers.get('content-type')).toContain('text/html');
      expect(page.headers.get('cache-control')).toBe('no-store');
      expect(pageBody).toContain('參與投票');
      expect(pageBody).toContain('id="site-header"');
      expect(pageBody).toContain('/frontend/vote-page.js');
      expect(pageBody).toContain('/frontend/public-mvp.css');
      expect(pageBody).toContain('role="alert"');
      expect(script.status).toBe(200);
      expect(script.headers.get('content-type')).toContain('text/javascript');
    });
  });

  it('serves the public explore placeholder without listing polls', async () => {
    const server = createHttpServer({
      pollService: createPollService(createInMemoryPollRepository()),
    });

    await withServer(server, async (baseUrl) => {
      const page = await fetch(`${baseUrl}/explore`);
      const pageBody = await page.text();

      expect(page.status).toBe(200);
      expect(page.headers.get('content-type')).toContain('text/html');
      expect(page.headers.get('cache-control')).toBe('no-store');
      expect(pageBody).toContain('explore-placeholder');
      expect(pageBody).toContain('/frontend/public-mvp.css');
      expect(pageBody).toContain('id="site-header"');
      expect(pageBody).toContain('href="/polls/new"');
      expect(pageBody).not.toMatch(/option_id|shard_id|vote_token|personalization/i);
    });
  });

  it('serves the shared public MVP stylesheet', async () => {
    const server = createHttpServer({
      pollService: createPollService(createInMemoryPollRepository()),
    });

    await withServer(server, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/frontend/public-mvp.css`);
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/css');
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(body).toContain('.mvp-body');
      expect(body).toContain('.vote-option');
      expect(body).toContain('.mvp-site-header');
    });
  });

  it('serves my-polls mock page and layout script', async () => {
    const server = createHttpServer({
      pollService: createPollService(createInMemoryPollRepository()),
    });

    await withServer(server, async (baseUrl) => {
      const page = await fetch(`${baseUrl}/my-polls`);
      const layout = await fetch(`${baseUrl}/frontend/public-mvp-layout.js`);

      expect(page.status).toBe(200);
      expect(await page.text()).toContain('我的問卷');
      expect(layout.status).toBe(200);
    });
  });

  it('serves public FAQ and trust-level policy pages', async () => {
    const server = createHttpServer({
      pollService: createPollService(createInMemoryPollRepository()),
    });

    await withServer(server, async (baseUrl) => {
      const faq = await fetch(`${baseUrl}/faq`);
      const faqBody = await faq.text();
      const trust = await fetch(`${baseUrl}/trust-levels`);
      const trustBody = await trust.text();

      expect(faq.status).toBe(200);
      expect(faq.headers.get('content-type')).toContain('text/html');
      expect(faqBody).toContain('mvp-info-page');
      expect(faqBody).toContain('收票中');
      expect(faqBody).toContain('此問卷已結束公開鎖定期，並由發起者下架。');
      expect(faqBody).toContain('href="/trust-levels"');
      expect(faqBody).not.toMatch(/option_id|shard_id|vote_token/i);

      expect(trust.status).toBe(200);
      expect(trustBody).toContain('Lv.0');
      expect(trustBody).toContain('Lv.4');
      expect(trustBody).toContain('政治／高風險');
      expect(trustBody).toContain('href="/faq"');
      expect(trustBody).not.toMatch(/option_id|shard_id|vote_token/i);
    });
  });
});
