import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Production credential verifier source guard', () => {
  it('keeps verifier independent from poll options, profiles, diagnostics, and creator sessions', async () => {
    const source = await readFile(
      join(process.cwd(), 'src/auth/production-credential-verifier.ts'),
      'utf8',
    );

    expect(source).toContain('authorization');
    expect(source).not.toMatch(/option_id|option_index|option_text|selected_option/i);
    expect(source).not.toMatch(/poll_id|birth_year_month|residential_region/i);
    expect(source).not.toMatch(/creator_session|x-user-id|console\.|diagnostic|analytics|metric|trace/i);
  });
});
