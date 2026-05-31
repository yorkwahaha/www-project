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
      expect(pageBody).toContain('What We Wonder');
      expect(pageBody).toContain('href="/polls/new"');
      expect(pageBody).toContain('/frontend/public-mvp.css');
      expect(pageBody).toContain('class="mvp-body"');
      expect(pageBody).not.toMatch(/localStorage|sessionStorage|feed|ranking|option_id/i);
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
      expect(pageBody).toContain('href="/"');
      expect(pageBody).toContain('/polls/new');
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
      expect(pageBody).toContain('href="/"');
      expect(pageBody).toContain('/frontend/create-poll-page.js');
      expect(pageBody).toContain('/frontend/public-mvp.css');
      expect(pageBody).toContain('aria-live');
      expect(pageBody).not.toContain('option_id');
      expect(script.status).toBe(200);
      expect(script.headers.get('content-type')).toContain('text/javascript');
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
      expect(pageBody).toContain('href="/"');
      expect(pageBody).toContain('/polls/new');
      expect(pageBody).toContain('/frontend/vote-page.js');
      expect(pageBody).toContain('/frontend/public-mvp.css');
      expect(pageBody).toContain('role="alert"');
      expect(script.status).toBe(200);
      expect(script.headers.get('content-type')).toContain('text/javascript');
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
    });
  });
});
