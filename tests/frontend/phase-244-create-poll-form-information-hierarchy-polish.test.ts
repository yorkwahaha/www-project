import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_244_DOC =
  'docs/www-project-phase-244-create-poll-form-information-hierarchy-polish-v1.md';

const TOUCHED_MODULES = [
  'public/frontend/public-create-poll-form-layout.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/public-mvp.css',
  'public/create-poll.html',
] as const;

const FORBIDDEN_BACKEND_ECHO =
  /error\.message|body\.message|apiError\.message|response\.text\(\)|JSON\.stringify\(error/i;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|indexedDB|document\.cookie/i;

const FORBIDDEN_AGGREGATE =
  /raw_count|poll_option_vote_counters|hidden aggregate|option breakdown/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

function indexOfRegion(html: string, marker: string) {
  const index = html.indexOf(marker);
  expect(index).toBeGreaterThanOrEqual(0);
  return index;
}

describe('Phase 244 create poll form information hierarchy polish', () => {
  it('documents Phase 244 in README and phase doc', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_244_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 244');
    expect(readme).toContain('Phase 244');
    expect(readme).toContain(PHASE_244_DOC);
  });

  it('exports shared create poll form layout helpers', async () => {
    const layout = await loadModule('public/frontend/public-create-poll-form-layout.js');

    expect(layout.PUBLIC_CREATE_POLL_FORM_LAYOUT_ORDER).toEqual([
      'page-title',
      'creator-guidance',
      'form-sections',
      'option-inputs',
      'schedule-lifecycle-hints',
      'preview-help',
      'submit-area',
      'inline-feedback',
    ]);

    expect(layout.PUBLIC_CREATE_POLL_PAGE_TITLE_REGION_ID).toBe('create-poll-page-title');
    expect(layout.PUBLIC_CREATE_POLL_CREATOR_GUIDANCE_REGION_ID).toBe(
      'create-poll-creator-guidance',
    );
    expect(layout.PUBLIC_CREATE_POLL_FORM_SECTIONS_REGION_ID).toBe('create-poll-form-sections');
    expect(layout.PUBLIC_CREATE_POLL_OPTION_INPUTS_REGION_ID).toBe('create-poll-option-inputs');
    expect(layout.PUBLIC_CREATE_POLL_SCHEDULE_LIFECYCLE_HINTS_REGION_ID).toBe(
      'create-poll-schedule-lifecycle-hints',
    );
    expect(layout.PUBLIC_CREATE_POLL_PREVIEW_HELP_REGION_ID).toBe('create-poll-preview-help');
    expect(layout.PUBLIC_CREATE_POLL_SUBMIT_AREA_REGION_ID).toBe('create-poll-submit-area');
    expect(layout.PUBLIC_CREATE_POLL_INLINE_FEEDBACK_REGION_ID).toBe('form-message');
  });

  it('keeps create-poll.html regions in hierarchy order', async () => {
    const html = await readFile(join(process.cwd(), 'public/create-poll.html'), 'utf8');

    expect(html).toContain('id="create-poll-page-title"');
    expect(html).toContain('id="create-poll-creator-guidance"');
    expect(html).toContain('id="create-poll-form-sections"');
    expect(html).toContain('id="create-poll-option-inputs"');
    expect(html).toContain('id="create-poll-schedule-lifecycle-hints"');
    expect(html).toContain('id="create-poll-preview-help"');
    expect(html).toContain('id="create-poll-submit-area"');
    expect(html).toContain('id="form-message"');
    expect(html).toContain('id="create-poll-form"');
    expect(html).toContain('id="create-poll-submit"');
    expect(html).toContain('name="option"');

    const titleIndex = indexOfRegion(html, 'id="create-poll-page-title"');
    const guidanceIndex = indexOfRegion(html, 'id="create-poll-creator-guidance"');
    const formSectionsIndex = indexOfRegion(html, 'id="create-poll-form-sections"');
    const optionsIndex = indexOfRegion(html, 'id="create-poll-option-inputs"');
    const scheduleIndex = indexOfRegion(html, 'id="create-poll-schedule-lifecycle-hints"');
    const previewIndex = indexOfRegion(html, 'id="create-poll-preview-help"');
    const submitIndex = indexOfRegion(html, 'id="create-poll-submit-area"');
    const feedbackIndex = indexOfRegion(html, 'id="form-message"');

    expect(titleIndex).toBeLessThan(guidanceIndex);
    expect(guidanceIndex).toBeLessThan(formSectionsIndex);
    expect(formSectionsIndex).toBeLessThan(optionsIndex);
    expect(optionsIndex).toBeLessThan(scheduleIndex);
    expect(scheduleIndex).toBeLessThan(previewIndex);
    expect(previewIndex).toBeLessThan(submitIndex);
    expect(submitIndex).toBeLessThan(feedbackIndex);
  });

  it('wires create-poll-page.js to shared layout region ids', async () => {
    const source = await readFile(
      join(process.cwd(), 'public/frontend/create-poll-page.js'),
      'utf8',
    );

    expect(source).toContain("from './public-create-poll-form-layout.js'");
    expect(source).toContain('PUBLIC_CREATE_POLL_PAGE_TITLE_REGION_ID');
    expect(source).toContain('PUBLIC_CREATE_POLL_OPTION_INPUTS_REGION_ID');
    expect(source).toContain('PUBLIC_CREATE_POLL_PREVIEW_HELP_REGION_ID');
    expect(source).toContain('submitCreatePoll');
    expect(source).toContain("fetchImpl('/creator/polls'");
    expect(source).toContain('credentials:');
    expect(source).not.toMatch(FORBIDDEN_STORAGE);
    expect(source).not.toMatch(FORBIDDEN_AGGREGATE);
  });

  it('keeps submitCreatePoll payload and validation unchanged', async () => {
    const { submitCreatePoll, normalizeCreatePollForm } = await loadModule(
      'public/frontend/create-poll-page.js',
    );
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        poll_id: '22222222-2222-4222-8222-222222222222',
        status: 'active',
        created_at: '2026-05-31T12:00:00.000Z',
      }),
    }));

    await submitCreatePoll({
      formValues: {
        title: '  午餐想吃什麼？ ',
        description: '  今天的選擇 ',
        options: ['  飯  ', ' 麵 ', '', '   '],
      },
      fetchImpl,
      now: () => new Date('2026-05-31T12:00:00.000Z'),
    });

    expect(fetchImpl).toHaveBeenCalledWith('/creator/polls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: '午餐想吃什麼？',
        description: '今天的選擇',
        options: ['飯', '麵'],
        category: 'general',
        eligible_rule_id: null,
        closes_at: '2026-06-07T12:00:00.000Z',
        publish: true,
      }),
      credentials: 'same-origin',
    });

    expect(() =>
      normalizeCreatePollForm({ title: ' ', options: ['One', 'Two'] }),
    ).toThrow('請填寫問卷標題。');
    expect(() =>
      normalizeCreatePollForm({ title: 'Question', options: ['One', '  '] }),
    ).toThrow('請至少填寫兩個選項。');
  });

  it('keeps touched runtime modules free of backend echo patterns', async () => {
    for (const relativePath of TOUCHED_MODULES) {
      if (!relativePath.endsWith('.js')) {
        continue;
      }
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_BACKEND_ECHO);
      expect(source, relativePath).not.toMatch(FORBIDDEN_AGGREGATE);
      expect(source, relativePath).not.toMatch(FORBIDDEN_STORAGE);
    }
  });

  it('keeps Official Vote transaction order unchanged in backend source', async () => {
    const repository = await readFile(join(process.cwd(), 'src/polls/repository.ts'), 'utf8');
    const transactionStart = repository.indexOf('async function castOfficialVote(');
    const transactionEnd = repository.indexOf('async function resolveOfficialVoteOptionIdWithClient');
    const transactionBody = repository.slice(transactionStart, transactionEnd);
    expect(transactionBody.indexOf('isProfileEligibleForOfficialVote')).toBeGreaterThan(-1);
    expect(transactionBody.indexOf('insertVoteToken')).toBeGreaterThan(
      transactionBody.indexOf('resolveOfficialVoteOptionIdWithClient'),
    );
    expect(repository).not.toContain('Phase 244');
  });
});
