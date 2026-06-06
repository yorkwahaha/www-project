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
      expect(pageBody).toContain('href="/registration"');
      expect(pageBody).toContain('href="/login"');
      expect(pageBody).toContain('不會自動登入');
      expect(pageBody).toContain('登入後頁首才顯示帳號名稱');
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

  it('serves the public explore feed page and explore-page script', async () => {
    const server = createHttpServer({
      pollService: createPollService(createInMemoryPollRepository()),
    });

    await withServer(server, async (baseUrl) => {
      const page = await fetch(`${baseUrl}/explore`);
      const pageBody = await page.text();
      const script = await fetch(`${baseUrl}/frontend/explore-page.js`);

      expect(page.status).toBe(200);
      expect(page.headers.get('content-type')).toContain('text/html');
      expect(page.headers.get('cache-control')).toBe('no-store');
      expect(pageBody).toContain('explore-feed');
      expect(pageBody).toContain('data-explore-feed="freshness-only"');
      expect(pageBody).toContain('/frontend/public-mvp.css');
      expect(pageBody).toContain('/frontend/explore-page.js');
      expect(pageBody).toContain('id="explore-feed-list"');
      expect(pageBody).toContain('票數或結果百分比');
      expect(pageBody).not.toMatch(/option_id|shard_id|vote_token|personalization|mvp-result-preview/i);
      expect(script.status).toBe(200);
      expect(script.headers.get('content-type')).toContain('text/javascript');
    });
  });

  it('serves the registration page and registration-page script without requiring registration API wiring', async () => {
    const server = createHttpServer({
      pollService: createPollService(createInMemoryPollRepository()),
    });

    await withServer(server, async (baseUrl) => {
      const page = await fetch(`${baseUrl}/registration`);
      const pageBody = await page.text();
      const script = await fetch(`${baseUrl}/frontend/registration-page.js`);

      expect(page.status).toBe(200);
      expect(page.headers.get('content-type')).toContain('text/html');
      expect(page.headers.get('cache-control')).toBe('no-store');
      expect(pageBody).toContain('registration-form');
      expect(pageBody).toContain('name="display_name"');
      expect(pageBody).toContain('name="birth_year_month"');
      expect(pageBody).toContain('name="residential_region"');
      expect(pageBody).toContain('name="credential"');
      expect(pageBody).toContain('data-login-state-read="disabled"');
      expect(pageBody).toContain('/frontend/registration-page.js');
      expect(pageBody).toContain('href="/login"');
      expect(pageBody).toMatch(/不會.*自動登入/);
      expect(pageBody).toContain('前往登入');
      expect(pageBody).not.toMatch(/credential_proof|option_id|selected_option_index|token_sha256|www_session/i);
      expect(script.status).toBe(200);
      expect(script.headers.get('content-type')).toContain('text/javascript');
      expect(await script.text()).not.toMatch(/\/users\/me|\/login\/session|mountLoginStateRead/);
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

  it('serves the production login form page and login-page script', async () => {
    const server = createHttpServer({
      pollService: createPollService(createInMemoryPollRepository()),
    });

    await withServer(server, async (baseUrl) => {
      const page = await fetch(`${baseUrl}/login`);
      const pageBody = await page.text();
      const script = await fetch(`${baseUrl}/frontend/login-page.js`);

      expect(page.status).toBe(200);
      expect(page.headers.get('content-type')).toContain('text/html');
      expect(page.headers.get('cache-control')).toBe('no-store');
      expect(pageBody).toContain('正式登入表單基礎已開放');
      expect(pageBody).toContain('fail closed');
      expect(pageBody).toContain('login-shell-form');
      expect(pageBody).toContain('name="credential"');
      expect(pageBody).toContain('href="/registration"');
      expect(pageBody).toContain('註冊不會自動登入');
      expect(pageBody).toContain('/frontend/login-page.js');
      expect(pageBody).not.toMatch(/localStorage|sessionStorage/i);
      expect(script.status).toBe(200);
      expect(script.headers.get('content-type')).toContain('text/javascript');
      const scriptBody = await script.text();
      expect(scriptBody).toContain('submitProductionLoginCredential');
      expect(scriptBody).toContain('mountLoginStateRead');
      expect(scriptBody).toContain('/login/session');
      expect(scriptBody).not.toMatch(/birth_year_month|residential_region|option_id|option_text|option_index/);
    });
  });

  it('serves the profile page and profile-page script', async () => {
    const server = createHttpServer({
      pollService: createPollService(createInMemoryPollRepository()),
    });

    await withServer(server, async (baseUrl) => {
      const page = await fetch(`${baseUrl}/profile`, {
        headers: { Cookie: 'creator_session=ignored-static-cookie' },
      });
      const pageBody = await page.text();
      const script = await fetch(`${baseUrl}/frontend/profile-page.js`);

      expect(page.status).toBe(200);
      expect(page.headers.get('content-type')).toContain('text/html');
      expect(page.headers.get('cache-control')).toBe('no-store');
      expect(pageBody).toContain('投票資格資料');
      expect(pageBody).toContain('name="birth_year_month"');
      expect(pageBody).toContain('name="residential_region"');
      expect(pageBody).toContain('/frontend/profile-page.js');
      expect(pageBody).not.toMatch(
        /gender|性別|birthday|生日|address|地址|GPS|geocode|precise location|精準位置|option_id|option_text|option_index/i,
      );
      expect(script.status).toBe(200);
      expect(script.headers.get('content-type')).toContain('text/javascript');
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
      expect(faqBody).toContain('收集中');
      expect(faqBody).toContain('此問卷已結束公開鎖定期，並由發起者下架。');
      expect(faqBody).toContain('href="/trust-levels"');
      expect(faqBody).not.toMatch(/option_id|shard_id|vote_token/i);

      expect(trust.status).toBe(200);
      expect(trustBody).toContain('mvp-permission-matrix');
      expect(trustBody).toContain('Lv.0');
      expect(trustBody).toContain('Lv.4');
      expect(trustBody).toContain('高信任分用戶');
      expect(trustBody).toContain('所有等級皆不得使用的功能');
      expect(trustBody).toContain('查看計票期間數據');
      expect(trustBody).not.toContain('優質用戶');
      expect(trustBody).not.toContain('繞過投票資格限制');
      expect(trustBody).toContain('每日 2 則');
      expect(trustBody).toContain('政治／高風險');
      expect(trustBody).toContain('如何提升等級');
      expect(trustBody).not.toContain('mvp-trust-level-stack');
      expect(trustBody).toContain('href="/faq"');
      expect(trustBody).not.toMatch(/option_id|shard_id|vote_token/i);
    });
  });
});
