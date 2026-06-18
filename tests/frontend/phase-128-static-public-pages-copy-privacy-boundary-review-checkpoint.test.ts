import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const REVIEWED_STATIC_COPY_FILES = [
  'public/faq.html',
  'public/trust-levels.html',
  'public/index.html',
  'public/explore.html',
  'public/registration.html',
  'public/login.html',
  'public/vote.html',
  'public/results.html',
  'public/my-polls.html',
];

const FORBIDDEN_GUARANTEE_COPY =
  /你符合資格|你一定符合|一定能投票|保證可以投票|can_vote|age_passed|region_passed|trust_passed|role_passed/i;

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|raw_count|poll_option_vote_counters|\buser_id\b/i;

const FORBIDDEN_EXTRA_PROFILE_FIELDS =
  /gender|性別|exact birthday|精確生日|full date of birth|完整出生日|\baddress\b|GPS|geocode|precise location|精準位置|demographic breakdown/i;

const FORBIDDEN_ANALYTICS_COPY =
  /analytics linkage|personalized ranking|ranking personalization|個人化推薦已開放|demographic breakdown dashboard/i;

describe('Phase 128 static public pages copy privacy boundary review checkpoint', () => {
  it('keeps FAQ from implying creator per-vote choice visibility or collecting counts', async () => {
    const faq = await readFile(join(process.cwd(), 'public/faq.html'), 'utf8');

    expect(faq).toContain('發起者也不例外，無法查看中途統計');
    expect(faq).toContain('收集中完全不顯示票數、百分比、總計、排名、趨勢或進度');
    expect(faq).toContain('不對外公開個人投票紀錄');
    expect(faq).toContain('不做公開統計分群展示');
    expect(faq).not.toMatch(/發起者.*可.*查看.*個別|creator.*see.*individual.*choice/i);
    expect(faq).not.toMatch(FORBIDDEN_ANALYTICS_COPY);
  });

  it('keeps FAQ on revealed/locked/post-lock aggregate result boundaries', async () => {
    const faq = await readFile(join(process.cwd(), 'public/faq.html'), 'utf8');

    expect(faq).toContain('截止時間到，彙總同步公開');
    expect(faq).toContain('公開鎖定期（約 5 天）');
    expect(faq).toContain('取消');
    expect(faq).toContain('下架');
    expect(faq).toContain('「截止」不等於「鎖定期結束」');
    expect(faq).not.toMatch(/收集中.*可.*查看.*結果|collecting.*preview.*result/i);
  });

  it('keeps Trust Levels page in draft/not-open posture for credit, points, and paid features', async () => {
    const trust = await readFile(join(process.cwd(), 'public/trust-levels.html'), 'utf8');

    expect(trust).toContain('草案');
    expect(trust).toContain('尚未開放');
    expect(trust).toContain('規劃中');
    expect(trust).toContain('信用點數累積');
    expect(trust).toContain('尚未計分');
    expect(trust).toContain('額外點數功能');
    expect(trust).toContain('正式上線後開放（草案）');
    expect(trust).toContain('登入、註冊與信任計算將陸續開放');
    expect(trust).not.toMatch(/信用分已啟用|points runtime is live|付費推廣已上線/i);
  });

  it('keeps homepage and showcase copy honest about demo separation and no vote guarantee', async () => {
    const index = await readFile(join(process.cwd(), 'public/index.html'), 'utf8');

    // Phase 301 superseded the content-rich homepage with an ultra-minimal
    // collecting-only swipe feed. The account/demo/static-example boundary copy
    // now lives on the FAQ/login/registration pages (asserted elsewhere). The
    // privacy-relevant negative guards below remain enforced on the new home:
    // it must never promise outcomes or expose live counts, and being
    // collecting-only it shows no aggregate result signals at all.
    expect(index).toContain('data-home-swipe-feed="mixed"');
    expect(index).not.toMatch(FORBIDDEN_GUARANTEE_COPY);
    expect(index).not.toMatch(/真實即時票數|live vote count/i);
    expect(index).not.toMatch(/%|票數|百分比|排名|趨勢|進度/);
  });

  it('keeps registration and login static copy on session boundaries', async () => {
    const registration = await readFile(
      join(process.cwd(), 'public/registration.html'),
      'utf8',
    );
    const login = await readFile(join(process.cwd(), 'public/login.html'), 'utf8');

    expect(registration).toMatch(/不會<\/strong>自動登入|不會自動登入/);
    expect(registration).toContain('不會自動建立瀏覽器工作階段');
    expect(registration).toContain('data-login-state-read="disabled"');

    expect(login).toContain('登入會建立瀏覽器工作階段');
    expect(login).toContain('註冊不會自動登入');
    expect(login).toContain('測試身份');
    expect(login).toContain('即時模式');
    expect(login).toContain('個人資料頁');
    expect(login).not.toMatch(/POST \/login\/session/);
    expect(login).not.toMatch(FORBIDDEN_GUARANTEE_COPY);
  });

  it('keeps Explore/My Polls/Results/Vote public copy free of public vote-status leakage', async () => {
    const explore = await readFile(join(process.cwd(), 'public/explore.html'), 'utf8');
    const myPolls = await readFile(join(process.cwd(), 'public/my-polls.html'), 'utf8');
    const results = await readFile(join(process.cwd(), 'public/results.html'), 'utf8');
    const vote = await readFile(join(process.cwd(), 'public/vote.html'), 'utf8');

    expect(explore).toContain('不顯示');
    expect(explore).toContain('票數或結果百分比');
    expect(explore).toContain('不提供熱門、票數、個人化或榜單排序');

    expect(myPolls).toContain('收集中看不到票數');
    expect(myPolls).toContain('範例');
    expect(myPolls).toContain('?live=1');
    expect(myPolls).not.toContain('creator_session');

    expect(results).toContain('收集中不顯示票數');
    expect(results).toContain('範例展示');

    expect(vote).toContain('送出當下由系統判定');
    expect(vote).toContain('不顯示');
    expect(vote).toContain('票數、百分比、總計、排名、趨勢或進度');
    expect(vote).toContain('/vote/demo');
    expect(vote).toContain('不儲存票數');

    for (const source of [explore, myPolls, results, vote]) {
      expect(source).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(source).not.toMatch(FORBIDDEN_GUARANTEE_COPY);
    }
  });

  it('keeps creator_session marked as non-production identity in static auth copy', async () => {
    const authCopy = await readFile(
      join(process.cwd(), 'public/frontend/auth-state-copy.js'),
      'utf8',
    );

    expect(authCopy).toContain('creator_session');
    expect(authCopy).toContain('非正式登入');
    expect(authCopy).toContain('僅 /creator/*');
    expect(authCopy).not.toMatch(FORBIDDEN_INTERNAL_COPY);
  });

  for (const relativePath of REVIEWED_STATIC_COPY_FILES) {
    it(`keeps reviewed static public copy neutral in ${relativePath}`, async () => {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');

      expect(source, relativePath).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(source, relativePath).not.toMatch(FORBIDDEN_EXTRA_PROFILE_FIELDS);
      if (relativePath !== 'public/trust-levels.html') {
        expect(source, relativePath).not.toMatch(FORBIDDEN_GUARANTEE_COPY);
      }
      expect(source, relativePath).not.toMatch(FORBIDDEN_ANALYTICS_COPY);
      expect(source, relativePath).not.toMatch(/\boption_id\b|\boption_index\b/);
    });
  }
});
