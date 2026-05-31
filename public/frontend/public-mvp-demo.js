/**
 * Phase 43 — shared public MVP demo/static helpers (no API, no persistence).
 */

/** Fixed UUID for create-poll demo success links only. */
export const DEMO_MOCK_POLL_ID = '00000000-0000-4000-8000-000000000099';

export function parseLiveApiMode(search = '') {
  const rawSearch =
    typeof search === 'string' && search.length > 0
      ? search.startsWith('?')
        ? search
        : `?${search}`
      : '';
  return new URLSearchParams(rawSearch).get('live') === '1';
}

export function buildExploreStateHref(path, uiState) {
  const base = path.includes('?') ? path : `${path}?ui_state=${encodeURIComponent(uiState)}`;
  return base.includes('ui_state=')
    ? path
    : `${path}?ui_state=${encodeURIComponent(uiState)}`;
}
