/**
 * Phase 303 — public home mixed feed client (`GET /home/feed`).
 *
 * Fetches and strictly validates the discriminated-union home feed used by the
 * Phase 301 swipe homepage. Items are either `collecting` (question-only) or
 * `revealed` (display-safe bucketed result summary). Validators are
 * exact-key-set and fail closed: unknown/missing `state`, extra keys, raw
 * counts, option linkage, or identity fields all reject. `/polls/feed` and the
 * explore client are untouched.
 */
import { PUBLIC_HOME_SWIPE_ERROR_MESSAGE } from './public-mvp-ui.js';

export const HOME_FEED_PATH = '/home/feed';
export const HOME_FEED_DEFAULT_LIMIT = 20;
export const HOME_FEED_LOAD_FAILURE_MESSAGE = PUBLIC_HOME_SWIPE_ERROR_MESSAGE;

const COLLECTING_ITEM_KEYS = [
  'state',
  'poll_id',
  'title',
  'category',
  'lifecycle_label',
  'published_display',
  'vote_page_url',
];

const REVEALED_ITEM_KEYS = [
  'state',
  'poll_id',
  'title',
  'category',
  'lifecycle_label',
  'published_display',
  'result_page_url',
  'result_summary',
  'quality_badge',
];

const RESULT_SUMMARY_KEYS = ['display_mode', 'total_votes_display', 'leading_option'];
const LEADING_OPTION_KEYS = ['display_label', 'display_percentage'];

const REVEALED_LIFECYCLE_LABELS = new Set(['已公開', '公開鎖定期', '鎖定期已結束']);
const RESULT_DISPLAY_MODES = new Set([
  'bucketed_percentage',
  'rounded_with_bucketed_votes',
  'precise',
]);
const RESULT_TOTAL_DISPLAYS = new Set(['30–99', '100–499', '500+']);

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** Exact key-set equality — extra or missing keys both fail. */
function hasExactKeys(object, keys) {
  const objectKeys = Object.keys(object);
  return (
    objectKeys.length === keys.length &&
    keys.every((key) => Object.prototype.hasOwnProperty.call(object, key))
  );
}

export function isHomeCollectingFeedItemSafe(item) {
  if (!isPlainObject(item) || !hasExactKeys(item, COLLECTING_ITEM_KEYS)) {
    return false;
  }
  return (
    item.state === 'collecting' &&
    typeof item.poll_id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.category === 'string' &&
    item.lifecycle_label === '收集中' &&
    item.published_display === '最近發布' &&
    typeof item.vote_page_url === 'string' &&
    item.vote_page_url === `/vote/${item.poll_id}`
  );
}

function isHomeResultSummarySafe(summary) {
  if (!isPlainObject(summary) || !hasExactKeys(summary, RESULT_SUMMARY_KEYS)) {
    return false;
  }
  if (!RESULT_DISPLAY_MODES.has(summary.display_mode)) {
    return false;
  }
  if (!RESULT_TOTAL_DISPLAYS.has(summary.total_votes_display)) {
    return false;
  }
  const leading = summary.leading_option;
  if (leading === null) {
    return true;
  }
  if (!isPlainObject(leading) || !hasExactKeys(leading, LEADING_OPTION_KEYS)) {
    return false;
  }
  return (
    typeof leading.display_label === 'string' &&
    typeof leading.display_percentage === 'string'
  );
}

export function isHomeRevealedFeedItemSafe(item) {
  if (!isPlainObject(item) || !hasExactKeys(item, REVEALED_ITEM_KEYS)) {
    return false;
  }
  return (
    item.state === 'revealed' &&
    typeof item.poll_id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.category === 'string' &&
    REVEALED_LIFECYCLE_LABELS.has(item.lifecycle_label) &&
    item.published_display === '最近發布' &&
    typeof item.result_page_url === 'string' &&
    item.result_page_url === `/results/${item.poll_id}` &&
    isHomeResultSummarySafe(item.result_summary) &&
    (item.quality_badge === null || item.quality_badge === 'positive_feedback')
  );
}

/** Shared discriminated-union dispatcher; fails closed on unknown/missing state. */
export function isHomeFeedItemSafe(item) {
  if (!isPlainObject(item)) {
    return false;
  }
  if (item.state === 'collecting') {
    return isHomeCollectingFeedItemSafe(item);
  }
  if (item.state === 'revealed') {
    return isHomeRevealedFeedItemSafe(item);
  }
  return false;
}

export function isHomeFeedPayloadSafe(body) {
  if (!isPlainObject(body) || !Array.isArray(body.items)) {
    return false;
  }
  if (body.next_cursor !== null && typeof body.next_cursor !== 'string') {
    return false;
  }
  return body.items.every((item) => isHomeFeedItemSafe(item));
}

export function buildHomeFeedRequestUrl({
  origin = 'http://127.0.0.1',
  limit = HOME_FEED_DEFAULT_LIMIT,
  cursor = null,
} = {}) {
  const url = new URL(HOME_FEED_PATH, origin);
  url.searchParams.set('limit', String(limit));
  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }
  return url;
}

export async function fetchHomeFeedPage({
  fetchImpl = globalThis.fetch,
  origin = globalThis.location?.origin ?? 'http://127.0.0.1',
  limit = HOME_FEED_DEFAULT_LIMIT,
  cursor = null,
} = {}) {
  const response = await fetchImpl(
    buildHomeFeedRequestUrl({ origin, limit, cursor }).toString(),
    {
      method: 'GET',
      credentials: 'omit',
      cache: 'no-store',
    },
  );
  if (!response.ok) {
    throw new Error(HOME_FEED_LOAD_FAILURE_MESSAGE);
  }
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(HOME_FEED_LOAD_FAILURE_MESSAGE);
  }
  if (!isHomeFeedPayloadSafe(body)) {
    throw new Error(HOME_FEED_LOAD_FAILURE_MESSAGE);
  }
  return body;
}
