import { PollValidationError } from './errors.js';

const MIN_OPTIONS = 2;
const BLOCKED_CATEGORIES = new Set(['high_sensitivity']);

export function validateCreatePollInput(input: {
  title: string;
  description: string;
  category: string;
  options: string[];
  closesAt: Date;
  publish: boolean;
}): void {
  if (!input.title.trim()) {
    throw new PollValidationError('title is required');
  }
  if (!input.category.trim()) {
    throw new PollValidationError('category is required');
  }
  if (BLOCKED_CATEGORIES.has(input.category.trim().toLowerCase())) {
    throw new PollValidationError('category is not allowed in MVP');
  }
  if (!Array.isArray(input.options) || input.options.length < MIN_OPTIONS) {
    throw new PollValidationError(`at least ${MIN_OPTIONS} options are required`);
  }
  for (const [index, option] of input.options.entries()) {
    if (!option.trim()) {
      throw new PollValidationError(`option at index ${index} must not be empty`);
    }
  }
  if (Number.isNaN(input.closesAt.getTime())) {
    throw new PollValidationError('closes_at must be a valid datetime');
  }
  if (input.publish && input.closesAt.getTime() <= Date.now()) {
    throw new PollValidationError('closes_at must be in the future when publishing');
  }
}
