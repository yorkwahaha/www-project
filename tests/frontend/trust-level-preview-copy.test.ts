import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

async function loadPolicyModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/policy-ui-placeholders.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

describe('trust level preview copy (phase 45)', () => {
  it('exports policy-aligned preview leads', async () => {
    const { TRUST_LEVEL_PREVIEW_COPY } = await loadPolicyModule();
    expect(TRUST_LEVEL_PREVIEW_COPY.createLead).toMatch(/Lv\.1/);
    expect(TRUST_LEVEL_PREVIEW_COPY.createLead).toMatch(/不會儲存/);
    expect(TRUST_LEVEL_PREVIEW_COPY.voteLead).toMatch(/正式投票可能需要登入/);
    expect(TRUST_LEVEL_PREVIEW_COPY.voteLead).toMatch(/送出當下系統判定/);
    expect(TRUST_LEVEL_PREVIEW_COPY.myPollsLead).toMatch(/不是單純按讚/);
  });

  it('exports quality feedback preview tags without hostile negative labels', async () => {
    const { QUALITY_FEEDBACK_PREVIEW } = await loadPolicyModule();
    expect(QUALITY_FEEDBACK_PREVIEW.prompt).toMatch(/你覺得這個問題如何/);
    expect(QUALITY_FEEDBACK_PREVIEW.positiveTags.length).toBeGreaterThanOrEqual(5);
    expect(QUALITY_FEEDBACK_PREVIEW.softNeutralTag).toBe(
      '有點無言／不知道該怎麼說',
    );
    expect(QUALITY_FEEDBACK_PREVIEW.footnote).toMatch(/不是單純按讚/);
    const allLabels = [
      ...QUALITY_FEEDBACK_PREVIEW.positiveTags,
      QUALITY_FEEDBACK_PREVIEW.softNeutralTag,
    ].join(' ');
    expect(allLabels).not.toMatch(/爛題|垃圾題|故意引戰/);
  });

  it('trust level policy doc defines post-vote feedback and not likes-only quality', async () => {
    const doc = await readFile(
      join(process.cwd(), 'docs/www-project-trust-level-policy-draft-v1.md'),
      'utf8',
    );
    expect(doc).toMatch(/投票後品質回饋問卷/);
    expect(doc).toMatch(/有點無言／不知道該怎麼說/);
    expect(doc).toMatch(/不是.*按讚|不可.*按讚/s);
    expect(doc).toMatch(/多數.*不得.*優質題目/s);
  });

  it('create poll page shows trust policy and honest preview boundaries', async () => {
    const html = await readFile(join(process.cwd(), 'public/create-poll.html'), 'utf8');
    expect(html).toMatch(/發起須知/);
    expect(html).toMatch(/Lv\.1 註冊用戶/);
    expect(html).toMatch(/政治／高風險/);
    expect(html).toMatch(/展示模式/);
    expect(html).toMatch(/不儲存|不會儲存/);
    expect(html).not.toMatch(/尚未連線 API|demo only|靜態示意/i);
  });

  it('vote page shows trust policy and collecting privacy', async () => {
    const html = await readFile(join(process.cwd(), 'public/vote.html'), 'utf8');
    expect(html).toMatch(/投票須知/);
    expect(html).toMatch(/正式投票可能需要登入/);
    expect(html).toMatch(/不顯示.*票數、百分比、總計、排名、趨勢或進度/s);
    expect(html).toMatch(/關注結果/);
    expect(html).toMatch(/不是按讚|不是單純按讚|非單純按讚/);
    expect(html).toMatch(/投票提醒/);
    expect(html).not.toMatch(/尚未連線|不呼叫 API/i);
  });

  it('my polls page marks quota as policy preview not real values', async () => {
    const html = await readFile(join(process.cwd(), 'public/my-polls.html'), 'utf8');
    expect(html).toMatch(/額度與操作說明/);
    expect(html).toMatch(/正式上線後計算/);
    expect(html).toMatch(/範例/);
    expect(html).toMatch(/公開鎖定期/);
    expect(html).not.toMatch(/未連線後端/);
  });

  it('collecting-state pages do not expose interim vote counts in policy copy', async () => {
    const voteHtml = await readFile(join(process.cwd(), 'public/vote.html'), 'utf8');
    const resultsHtml = await readFile(
      join(process.cwd(), 'public/results.html'),
      'utf8',
    );
    expect(voteHtml).toMatch(/收集中.*不顯示/s);
    expect(resultsHtml).toMatch(/收集中不顯示票數/);
    expect(voteHtml).not.toMatch(/總票數|0\s*%|排名第/);
  });
});
