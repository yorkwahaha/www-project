import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Phase 60 lifecycle manual QA handoff doc', () => {
  it('documents live creator routes and lifecycle checklist', async () => {
    const source = await readFile(
      join(
        process.cwd(),
        'docs/www-project-phase-60-public-mvp-lifecycle-manual-qa-handoff-v1.md',
      ),
      'utf8',
    );

    expect(source).toContain('/polls/new?live=1');
    expect(source).toContain('/my-polls?live=1');
    expect(source).toContain('?creator=1');
    expect(source).toContain('取消問卷');
    expect(source).toContain('結束收集並公開結果');
    expect(source).toContain('下架問卷');
    expect(source).toContain('counter-free');
    expect(source).toContain('revealed');
    expect(source).toContain('58A');
    expect(source).toContain('尚未部署 cron');
    expect(source).toContain('前端顯示**不是**授權');
    expect(source).toContain('design-drafts/');
    expect(source).not.toMatch(/option_id.*sessionStorage/i);
  });
});
