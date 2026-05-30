import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

async function loadSubmissionPrivacyModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/submission-privacy.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

function createWindowObject() {
  const listeners = new Map<string, Array<(event: { persisted?: boolean }) => void>>();
  return {
    location: { assign: vi.fn() },
    addEventListener(
      type: string,
      listener: (event: { persisted?: boolean }) => void,
    ) {
      listeners.set(type, [...(listeners.get(type) ?? []), listener]);
    },
    dispatch(type: string, event: { persisted?: boolean } = {}) {
      for (const listener of listeners.get(type) ?? []) {
        listener(event);
      }
    },
  };
}

describe('submission privacy controller', () => {
  it('clears selected option and request body after Official Vote success', async () => {
    const { createSubmissionPrivacyController } =
      await loadSubmissionPrivacyModule();
    const windowObject = createWindowObject();
    const resetSubmissionUi = vi.fn();
    const fetchImpl = vi.fn(async () => ({ ok: true }));
    const controller = createSubmissionPrivacyController({
      fetchImpl,
      windowObject,
      resetSubmissionUi,
    });

    controller.selectOption('internal-option-uuid');
    expect(controller.hasSensitiveRuntimeState()).toBe(true);
    await controller.submitOfficialVote('public-poll-id', 'user-id');

    expect(fetchImpl).toHaveBeenCalledWith('/polls/public-poll-id/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': 'user-id',
      },
      body: JSON.stringify({ option_id: 'internal-option-uuid' }),
      credentials: 'same-origin',
    });
    expect(controller.hasSensitiveRuntimeState()).toBe(false);
    expect(controller.getSubmissionState()).toBe('idle');
    expect(resetSubmissionUi).toHaveBeenCalled();
    expect(windowObject.location.assign).toHaveBeenCalledWith(
      '/results/public-poll-id',
    );
  });

  it('clears selected option and request body after submission error', async () => {
    const { createSubmissionPrivacyController } =
      await loadSubmissionPrivacyModule();
    const controller = createSubmissionPrivacyController({
      fetchImpl: vi.fn(async () => ({ ok: false })),
      windowObject: createWindowObject(),
    });

    controller.selectOption('internal-option-uuid');
    await expect(
      controller.submitReferenceAnswer('public-poll-id', 'user-id'),
    ).rejects.toThrow('Submission failed');

    expect(controller.hasSensitiveRuntimeState()).toBe(false);
    expect(controller.getSubmissionState()).toBe('idle');
  });

  it('clears runtime memory on pagehide', async () => {
    const { createSubmissionPrivacyController } =
      await loadSubmissionPrivacyModule();
    const windowObject = createWindowObject();
    const resetSubmissionUi = vi.fn();
    const controller = createSubmissionPrivacyController({
      windowObject,
      resetSubmissionUi,
    });

    controller.selectOption('internal-option-uuid');
    windowObject.dispatch('pagehide');

    expect(controller.hasSensitiveRuntimeState()).toBe(false);
    expect(resetSubmissionUi).toHaveBeenCalled();
  });

  it('clears runtime memory and resets UI only on persisted pageshow', async () => {
    const { createSubmissionPrivacyController } =
      await loadSubmissionPrivacyModule();
    const windowObject = createWindowObject();
    const resetSubmissionUi = vi.fn();
    const controller = createSubmissionPrivacyController({
      windowObject,
      resetSubmissionUi,
    });

    controller.selectOption('internal-option-uuid');
    windowObject.dispatch('pageshow', { persisted: false });
    expect(controller.hasSensitiveRuntimeState()).toBe(true);

    windowObject.dispatch('pageshow', { persisted: true });
    expect(controller.hasSensitiveRuntimeState()).toBe(false);
    expect(resetSubmissionUi).toHaveBeenCalled();
  });

  it('uses no persistent storage, URL selection state, analytics, or debug output', async () => {
    const source = await readFile(
      join(process.cwd(), 'public/frontend/submission-privacy.js'),
      'utf8',
    );

    expect(source).not.toMatch(
      /localStorage|sessionStorage|indexedDB|document\.cookie|pushState|replaceState|searchParams/,
    );
    expect(source).not.toMatch(/console\.|analytics|setInterval|setTimeout|WebSocket|EventSource/);
  });
});
