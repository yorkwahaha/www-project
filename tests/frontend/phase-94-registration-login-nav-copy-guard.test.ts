import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_94_FILES = [
  'public/frontend/auth-state-copy.js',
  'public/frontend/public-mvp-layout.js',
  'public/index.html',
  'public/login.html',
  'public/registration.html',
];

const FORBIDDEN_COPY =
  /name="user_id"|\buser_id\b|token_sha256|www_session|session_id|vote history|option_id|option_index|option_text|localStorage|sessionStorage|IndexedDB/i;

describe('Phase 94 registration/login navigation copy guard', () => {
  for (const relativePath of PHASE_94_FILES) {
    it(`keeps sensitive session/profile fields out of ${relativePath}`, async () => {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toMatch(FORBIDDEN_COPY);
    });
  }
});
