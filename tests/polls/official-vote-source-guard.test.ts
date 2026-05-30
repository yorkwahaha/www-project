import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Official Vote source guard', () => {
  it('uses backend crypto.randomInt and no SQL random for shard selection', async () => {
    const service = await readFile(join(process.cwd(), 'src/polls/service.ts'), 'utf8');
    const repository = await readFile(join(process.cwd(), 'src/polls/repository.ts'), 'utf8');

    expect(service).toContain("import { randomInt } from 'node:crypto'");
    expect(service).toContain('randomInt(0, SHARD_COUNT)');
    expect(repository).toContain('const shardId = selectShardId();');
    expect(repository.toLowerCase()).not.toMatch(/\brandom\s*\(/);
  });
});
