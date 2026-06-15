/**
 * Phase 250 — Public page keyboard focus polish (presentation / a11y only).
 * Documents interactive focus groups and CSS hook classes; does not alter DOM order,
 * handlers, tabindex roving, focus traps, or keyboard shortcuts.
 */

/** Typical keyboard focus styling groups on public MVP pages (presentation order). */
export const PUBLIC_KEYBOARD_FOCUS_INTERACTIVE_ORDER = [
  'skip-link',
  'primary-cta',
  'secondary-cta',
  'form-submit',
  'share-copy-button',
  'share-fallback-url',
  'destructive-action',
  'feedback-error-link',
];

/** Shared class hook for inline feedback / status regions (readability only). */
export const PUBLIC_KEYBOARD_FOCUS_FEEDBACK_REGION_CLASS = 'mvp-keyboard-focus-feedback';

/** Shared class hook for error / load-failure panels when child links receive focus. */
export const PUBLIC_KEYBOARD_FOCUS_ERROR_PANEL_CLASS = 'mvp-keyboard-focus-error-panel';

/**
 * Maps interactive groups to Phase 250 CSS selectors in `public-mvp.css`.
 * @type {Readonly<Record<string, readonly string[]>>}
 */
export const PUBLIC_KEYBOARD_FOCUS_SELECTOR_MAP = Object.freeze({
  'primary-cta': Object.freeze([
    '.mvp-btn-primary:focus-visible',
    '.mvp-cta:focus-visible',
    '#vote-submit:focus-visible',
    '#create-poll-submit:focus-visible',
  ]),
  'secondary-cta': Object.freeze([
    '.mvp-btn-secondary:focus-visible',
    '.mvp-btn-ghost:focus-visible',
    '.mvp-btn-accent-outline:focus-visible',
  ]),
  'form-submit': Object.freeze([
    '.mvp-form-actions .mvp-btn-primary:focus-visible',
    '.mvp-form-actions .mvp-btn-secondary:focus-visible',
  ]),
  'share-copy-button': Object.freeze([
    '.copy-link-button:focus-visible',
    '.mvp-public-share-link-row .copy-link-button:focus-visible',
  ]),
  'share-fallback-url': Object.freeze([
    '.mvp-public-share-link-row .share-url:focus',
    '.mvp-public-share-link-row .share-url:focus-visible',
  ]),
  'destructive-action': Object.freeze([
    '.my-polls-page .mvp-creator-owned-poll-destructive-toolbar .mvp-btn:focus-visible',
  ]),
  'feedback-error-link': Object.freeze([
    '#error-panel a:focus-visible',
    '.mvp-error-panel a:focus-visible',
    '.mvp-action-link:focus-visible',
    '.mvp-public-load-failure a:focus-visible',
  ]),
});
