import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

async function loadLayoutModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/public-mvp-layout.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

describe('public mvp layout demo nav', () => {
  it('parses only known nav query values', async () => {
    const { parseDemoNavMode, VALID_DEMO_NAV_MODES, resolveDemoNavMode } =
      await loadLayoutModule();

    expect(VALID_DEMO_NAV_MODES).toContain('logged-in-mock');
    expect(parseDemoNavMode('?nav=guest')).toBe('guest');
    expect(parseDemoNavMode('?nav=logged-in-mock')).toBe('logged-in-mock');
    expect(parseDemoNavMode('?nav=real-auth')).toBeNull();
    expect(parseDemoNavMode('')).toBeNull();
  });

  it('prefers URL nav over header data-nav', async () => {
    const { resolveDemoNavMode } = await loadLayoutModule();
    const header = { dataset: { nav: 'logged-in-mock' } };

    expect(resolveDemoNavMode(header, '?nav=guest')).toBe('guest');
    expect(resolveDemoNavMode(header, '')).toBe('logged-in-mock');
    expect(resolveDemoNavMode(null, '')).toBe('guest');
  });
});
