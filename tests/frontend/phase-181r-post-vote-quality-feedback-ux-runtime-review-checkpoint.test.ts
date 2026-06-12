import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_181R_DOC =
  'docs/www-project-phase-181r-post-vote-quality-feedback-ux-runtime-review-checkpoint-v1.md';
const POST_VOTE_FEEDBACK = 'public/frontend/post-vote-quality-feedback.js';
const VOTE_PAGE = 'public/frontend/vote-page.js';

const MVP_FEEDBACK_TAGS = [
  '表達清楚',
  '選項公平',
  '值得思考',
  '期待結果',
  '題目不優',
] as const;

const FORBIDDEN_PAYLOAD_PATTERNS = [
  'option_id',
  'option_index',
  'selected_option',
  'user_id',
  'session_id',
  'request_id',
  'vote_token',
  'shard_id',
  'device',
  'trace_id',
  'metric_id',
  'analytics_id',
] as const;

const PROTECTED_BACKEND_PATHS = [
  'src/http/official-vote-routes.ts',
  'src/http/reference-answer-routes.ts',
  'src/http/user-profile-routes.ts',
  'src/auth/user-auth-resolver.ts',
] as const;

describe('Phase 181-R post-vote quality feedback UX runtime review checkpoint', () => {
  it('documents Phase 181 frontend review and Phase 182 approval', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_181R_DOC), 'utf8');

    expect(doc).toContain('Phase 181-R');
    expect(doc).toContain('post-vote-quality-feedback.js');
    expect(doc).toContain('**APPROVED**');
    expect(doc).toContain('Phase 182 is approved');
    expect(doc).toContain('Phase 182 blockers: none identified');
  });

  it('confirms feedback submit uses feedback_tag only with credentials omit', async () => {
    const source = await readFile(join(process.cwd(), POST_VOTE_FEEDBACK), 'utf8');
    const lower = source.toLowerCase();

    expect(source).toContain('/quality-feedback');
    expect(source).toContain("JSON.stringify({ feedback_tag: feedbackTag })");
    expect(source).toContain("credentials: 'omit'");

    for (const forbidden of FORBIDDEN_PAYLOAD_PATTERNS) {
      expect(lower).not.toContain(`${forbidden}:`);
    }
  });

  it('confirms success and failure copy are frontend-owned without response parsing', async () => {
    const source = await readFile(join(process.cwd(), POST_VOTE_FEEDBACK), 'utf8');

    expect(source).toContain('已收到，謝謝你的回饋。');
    expect(source).toContain('目前無法送出回饋，稍後可再試一次。');
    expect(source).not.toContain('response.json');
    expect(source).not.toMatch(/aggregate_count|threshold_state|bucket_state/);
  });

  it('confirms five MVP tags are the only rendered feedback chips', async () => {
    const source = await readFile(join(process.cwd(), POST_VOTE_FEEDBACK), 'utf8');

    expect(source).toContain('export const QUALITY_FEEDBACK_MVP_TAGS = [');
    for (const tag of MVP_FEEDBACK_TAGS) {
      expect(source).toContain(`'${tag}'`);
    }
    expect(source).toContain('for (const label of QUALITY_FEEDBACK_MVP_TAGS)');
  });

  it('confirms vote-page mounts live feedback only after success and keeps demo preview', async () => {
    const source = await readFile(join(process.cwd(), VOTE_PAGE), 'utf8');

    expect(source).toMatch(/function renderVoteSuccess[\s\S]*mountPostVoteQualityFeedback/);
    expect(source).toContain('renderVoteQualityFeedbackPreview(root)');
    expect(source).toMatch(/if \(demoOnly\)[\s\S]*renderVoteQualityFeedbackPreview/);
    expect(source).not.toMatch(
      /form\.addEventListener\('submit'[\s\S]*mountPostVoteQualityFeedback/,
    );
    expect(source).toContain('JSON.stringify({ option_index: optionIndex })');
  });

  it('confirms page-local soft lock without durable storage', async () => {
    const source = await readFile(join(process.cwd(), POST_VOTE_FEEDBACK), 'utf8');

    expect(source).toContain('let submitSucceeded = false');
    expect(source).toContain('submitSucceeded = true');
    expect(source).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie/);
    expect(source).not.toMatch(/console\.|analytics|websocket|eventsource/i);
  });

  it('confirms protected backend files remain free of Phase 181 frontend wiring', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = (await readFile(join(process.cwd(), relativePath), 'utf8')).toLowerCase();
      expect(source, relativePath).not.toContain('post-vote-quality-feedback');
      expect(source, relativePath).not.toContain('mountpostvotequalityfeedback');
    }
  });
});
