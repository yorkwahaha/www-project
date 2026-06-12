import type { IncomingMessage, ServerResponse } from 'node:http';
import { PollError, PollValidationError } from '../polls/errors.js';
import type { PollService } from '../polls/service.js';
import {
  QUALITY_FEEDBACK_TAGS,
  type QualityFeedbackTag,
} from '../polls/types.js';
import { readJsonBody, sendJson } from './json.js';

type QualityFeedbackBody = {
  feedback_tag?: unknown;
};

const FEEDBACK_TAG_SET = new Set<string>(QUALITY_FEEDBACK_TAGS);
const INVALID_BODY_MESSAGE = 'Quality feedback body must contain only feedback_tag';
const INVALID_TAG_MESSAGE = 'Quality feedback tag is invalid';

export async function handlePostQualityFeedback(
  req: IncomingMessage,
  res: ServerResponse,
  pollId: string,
  pollService: PollService,
): Promise<void> {
  try {
    const body = await readJsonBody<QualityFeedbackBody>(req);
    const feedbackTag = parseQualityFeedbackTag(body);
    const result = await pollService.submitQualityFeedback(pollId, feedbackTag);
    sendJson(res, 201, result);
  } catch (err) {
    handleQualityFeedbackRouteError(res, err);
  }
}

function parseQualityFeedbackTag(body: QualityFeedbackBody): QualityFeedbackTag {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new PollValidationError(INVALID_BODY_MESSAGE);
  }
  const keys = Object.keys(body);
  if (keys.length !== 1 || keys[0] !== 'feedback_tag') {
    throw new PollValidationError(INVALID_BODY_MESSAGE);
  }
  const value = body.feedback_tag;
  if (typeof value !== 'string' || value.trim() === '') {
    throw new PollValidationError(INVALID_TAG_MESSAGE);
  }
  if (!FEEDBACK_TAG_SET.has(value)) {
    throw new PollValidationError(INVALID_TAG_MESSAGE);
  }
  return value as QualityFeedbackTag;
}

function handleQualityFeedbackRouteError(res: ServerResponse, err: unknown): void {
  if (err instanceof PollError) {
    sendJson(res, err.statusCode, { error: err.code, message: err.message });
    return;
  }
  if (err instanceof SyntaxError) {
    sendJson(res, 400, { error: 'INVALID_JSON', message: 'Invalid JSON body' });
    return;
  }
  sendJson(res, 500, { error: 'INTERNAL_ERROR', message: 'Internal server error' });
}
