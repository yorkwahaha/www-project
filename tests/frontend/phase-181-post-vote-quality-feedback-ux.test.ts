import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_181_FRONTEND_FILES = [
  'public/frontend/post-vote-quality-feedback.js',
  'public/frontend/vote-page.js',
];

const MVP_TAGS = [
  '表達清楚',
  '選項公平',
  '值得思考',
  '期待結果',
  '題目不優',
];

const FORBIDDEN_PAYLOAD_FIELDS = [
  'option_id',
  'option_index',
  'selected_option',
  'user_id',
  'session_id',
  'request_id',
  'device',
  'trace',
  'vote_token',
  'shard_id',
];

async function loadPostVoteQualityFeedbackModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/post-vote-quality-feedback.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function loadVotePageModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/vote-page.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

function createDocumentObject() {
  function createElement(tagName: string) {
    const element = {
      tagName: tagName.toUpperCase(),
      ownerDocument: null as unknown,
      className: '',
      textContent: '',
      hidden: false,
      disabled: false,
      dataset: {} as Record<string, string>,
      attributes: new Map<string, string>(),
      children: [] as ReturnType<typeof createElement>[],
      listeners: new Map<string, Array<(...args: unknown[]) => void>>(),
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      },
      removeAttribute(name: string) {
        this.attributes.delete(name);
      },
      addEventListener(type: string, listener: (...args: unknown[]) => void) {
        const existing = this.listeners.get(type) ?? [];
        this.listeners.set(type, [...existing, listener]);
      },
      append(child: ReturnType<typeof createElement>) {
        this.children.push(child);
      },
      replaceChildren() {
        this.children = [];
      },
    };
    element.ownerDocument = documentObject;
    return element;
  }
  const documentObject = { createElement };
  return documentObject;
}

function collectText(element: {
  textContent: string;
  children: { textContent: string; children: unknown[] }[];
}): string[] {
  return [
    element.textContent,
    ...element.children.flatMap((child) => collectText(child)),
  ].filter(Boolean);
}

function findFeedbackAside(root: {
  children: {
    attributes?: Map<string, string>;
    className?: string;
    children: unknown[];
  }[];
}) {
  return root.children.find(
    (child) =>
      child.attributes?.get('data-quality-feedback') === 'post-vote' ||
      child.className === 'mvp-quality-feedback',
  );
}

describe('Phase 181 post-vote quality feedback UX', () => {
  it('submits only feedback_tag in the quality feedback API body', async () => {
    const { submitQualityFeedback } = await loadPostVoteQualityFeedbackModule();
    const fetchImpl = vi.fn(async () => ({ ok: true }));

    await submitQualityFeedback({
      pollId: '11111111-1111-4111-8111-111111111111',
      feedbackTag: '表達清楚',
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      '/polls/11111111-1111-4111-8111-111111111111/quality-feedback',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback_tag: '表達清楚' }),
        credentials: 'omit',
      },
    );
    const body = JSON.parse(
      (fetchImpl.mock.calls[0]![1] as { body: string }).body,
    ) as Record<string, unknown>;
    expect(Object.keys(body)).toEqual(['feedback_tag']);
    for (const field of FORBIDDEN_PAYLOAD_FIELDS) {
      expect(body).not.toHaveProperty(field);
    }
  });

  it('shows success copy and disables chips after a successful tag submit', async () => {
    const { mountPostVoteQualityFeedback } = await loadPostVoteQualityFeedbackModule();
    const fetchImpl = vi.fn(async () => ({ ok: true }));
    const doc = createDocumentObject();
    const root = doc.createElement('div');

    mountPostVoteQualityFeedback(root, {
      pollId: '11111111-1111-4111-8111-111111111111',
      fetchImpl,
    });

    const aside = findFeedbackAside(root);
    expect(aside).toBeTruthy();
    const chipsWrap = aside!.children.find(
      (child: { className?: string }) => child.className === 'mvp-quality-feedback-chips',
    ) as { children: ReturnType<typeof doc.createElement>[] };
    const firstChip = chipsWrap.children[0]!;
    await firstChip.listeners.get('click')![0]!();

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(collectText(root).join(' ')).toContain('已收到，謝謝你的回饋。');
    for (const chip of chipsWrap.children) {
      expect(chip.disabled).toBe(true);
    }
  });

  it('shows neutral failure copy and re-enables chips on API failure', async () => {
    const { mountPostVoteQualityFeedback } = await loadPostVoteQualityFeedbackModule();
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'INTERNAL_ERROR',
        message: 'private aggregate_count threshold_state bucket_state',
      }),
    }));
    const doc = createDocumentObject();
    const root = doc.createElement('div');

    mountPostVoteQualityFeedback(root, {
      pollId: '11111111-1111-4111-8111-111111111111',
      fetchImpl,
    });

    const aside = findFeedbackAside(root);
    const chipsWrap = aside!.children.find(
      (child: { className?: string }) => child.className === 'mvp-quality-feedback-chips',
    ) as { children: ReturnType<typeof doc.createElement>[] };
    await chipsWrap.children[0]!.listeners.get('click')![0]!();

    const text = collectText(root).join(' ');
    expect(text).toContain('目前無法送出回饋，稍後可再試一次。');
    expect(text).not.toMatch(/aggregate_count|threshold_state|bucket_state|INTERNAL_ERROR/i);
    for (const chip of chipsWrap.children) {
      expect(chip.disabled).toBe(false);
    }
  });

  it('renders post-vote feedback only in non-demo success panel', async () => {
    const { renderVoteSuccess } = await loadVotePageModule();
    const doc = createDocumentObject();
    const root = doc.createElement('div');

    renderVoteSuccess(root, '11111111-1111-4111-8111-111111111111', {
      demoOnly: false,
      fetchImpl: vi.fn(),
    });

    const text = collectText(root).join(' ');
    expect(text).toContain('這題給你的感覺是？');
    expect(text).toContain('回饋只用來累計題目品質，不會記錄你選了哪個選項。');
    for (const tag of MVP_TAGS) {
      expect(text).toContain(tag);
    }
    expect(findFeedbackAside(root)).toBeTruthy();
  });

  it('keeps demo success on preview-only feedback placeholder', async () => {
    const { renderVoteSuccess } = await loadVotePageModule();
    const doc = createDocumentObject();
    const root = doc.createElement('div');

    renderVoteSuccess(root, 'demo', { demoOnly: true });

    const text = collectText(root).join(' ');
    expect(text).toMatch(/投票後可協助回饋題目品質/);
    expect(findFeedbackAside(root)).toBeUndefined();
  });

  it('does not mount post-vote feedback before vote success in vote-page source', async () => {
    const votePageSource = await readFile(
      join(process.cwd(), 'public/frontend/vote-page.js'),
      'utf8',
    );
    const voteHtml = await readFile(join(process.cwd(), 'public/vote.html'), 'utf8');

    expect(votePageSource).toContain('mountPostVoteQualityFeedback');
    expect(votePageSource).toMatch(
      /renderVoteSuccess[\s\S]*mountPostVoteQualityFeedback/,
    );
    expect(votePageSource).not.toMatch(
      /bootstrapVotePage[\s\S]*mountPostVoteQualityFeedback/,
    );
    expect(voteHtml).toContain('id="success-panel"');
    expect(voteHtml).toMatch(/success-panel[\s\S]*hidden/);
  });

  it('preserves vote-by-index body and pre-vote hint boundaries', async () => {
    const votePageSource = await readFile(
      join(process.cwd(), 'public/frontend/vote-page.js'),
      'utf8',
    );
    const hintsSource = await readFile(
      join(process.cwd(), 'public/frontend/official-vote-pre-vote-hints.js'),
      'utf8',
    );

    expect(votePageSource).toContain('JSON.stringify({ option_index: optionIndex })');
    expect(votePageSource).toContain(
      'void mountOfficialVotePreVoteHint(documentObject',
    );
    expect(votePageSource).toMatch(
      /function renderVoteSuccess[\s\S]*mountPostVoteQualityFeedback/,
    );
    expect(votePageSource).not.toMatch(
      /form\.addEventListener\('submit'[\s\S]*mountPostVoteQualityFeedback/,
    );
    expect(hintsSource).not.toContain('quality-feedback');
    expect(hintsSource).not.toContain('post-vote-quality-feedback');
  });

  it('uses no durable storage or analytics in Phase 181 frontend files', async () => {
    for (const relativePath of PHASE_181_FRONTEND_FILES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toMatch(
        /localStorage|sessionStorage|indexedDB|document\.cookie/,
      );
      expect(source, relativePath).not.toMatch(/console\.|analytics|WebSocket|EventSource/);
    }

    const feedbackSource = await readFile(
      join(process.cwd(), 'public/frontend/post-vote-quality-feedback.js'),
      'utf8',
    );
    for (const field of FORBIDDEN_PAYLOAD_FIELDS) {
      expect(feedbackSource).not.toContain(`${field}:`);
    }
    expect(feedbackSource).not.toMatch(/aggregate_count|threshold_state|bucket_state/);
  });
});
