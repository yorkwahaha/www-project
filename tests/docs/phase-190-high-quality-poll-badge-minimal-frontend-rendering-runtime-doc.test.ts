import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_190_DOC =
  'docs/www-project-phase-190-high-quality-poll-badge-minimal-frontend-rendering-runtime-v1.md';

describe('Phase 190 high-quality poll badge minimal frontend rendering runtime doc', () => {
  it('documents minimal frontend rendering runtime boundaries and quality_badge consumption', async () => {
    const source = await readFile(join(process.cwd(), PHASE_190_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 190');
    expect(source).toContain(
      'High-quality Poll Badge Minimal Frontend Rendering Runtime',
    );
    expect(source).toContain('minimal frontend rendering runtime');
    expect(source).toContain('No API/backend/DB/schema/migration change');
    expect(source).toContain('回饋良好');
    expect(source).toContain('positive_feedback');

    for (const silentCase of ['null', 'missing', 'unexpected']) {
      expect(source.toLowerCase()).toContain(silentCase);
    }

    expect(source).toContain('{ "quality_badge": null }');
    expect(source).toContain('{ "quality_badge": "positive_feedback" }');

    for (const forbiddenOutput of [
      'aggregate_count',
      'tag_breakdown',
      'score',
      'rank',
      'creator_score',
    ]) {
      expect(source).toContain(forbiddenOutput);
    }

    for (const governanceBan of [
      '尚未達標',
      '回饋不足',
      '品質不足',
      '未取得徽章',
      '優質題目',
      '高分題目',
      '熱門',
      '排名',
      '品質分數',
      '低品質',
    ]) {
      expect(source).toContain(governanceBan);
    }

    expect(source).toContain('Tooltip / detail panel');
    expect(source).toContain('Feed ordering');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('localStorage');
    expect(source).toContain('sessionStorage');

    expect(source).toContain(
      'phase-190-high-quality-poll-badge-minimal-frontend-rendering-runtime-doc.test.ts',
    );
    expect(source).toContain(
      'phase-190-high-quality-poll-badge-minimal-frontend-rendering-runtime.test.ts',
    );

    expect(readme).toContain('Phase 190');
    expect(readme).toContain(PHASE_190_DOC);
    expect(readme).toContain(
      'High-quality poll badge minimal frontend rendering runtime',
    );
  });
});
