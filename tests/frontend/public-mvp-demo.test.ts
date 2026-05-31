import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

async function loadDemoModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/public-mvp-demo.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

describe('public mvp demo helpers', () => {
  it('parses live API mode only when live=1', async () => {
    const { parseLiveApiMode } = await loadDemoModule();
    expect(parseLiveApiMode('?live=1')).toBe(true);
    expect(parseLiveApiMode('?live=0')).toBe(false);
    expect(parseLiveApiMode('')).toBe(false);
  });

  it('uses a stable demo poll id for static create success', async () => {
    const { DEMO_MOCK_POLL_ID } = await loadDemoModule();
    expect(DEMO_MOCK_POLL_ID).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});
