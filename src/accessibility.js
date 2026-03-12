/**
 * Accessibility helpers (browser-only effects).
 */

const IS_BROWSER = typeof window !== 'undefined' && typeof document !== 'undefined';

/**
 * Apply reduced-motion preference by toggling a class on <html>.
 * This is safe to call in Node; it will no-op outside the browser.
 *
 * @param {boolean} enabled
 */
export function applyReducedMotion(enabled) {
  if (!IS_BROWSER) return;
  document.documentElement.classList.toggle('reduced-motion', !!enabled);
}
