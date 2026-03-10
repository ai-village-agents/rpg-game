/**
 * Title Screen UI
 *
 * This module exists to provide a clean, Node-safe UI surface for the game's
 * title screen. It is intentionally side-effect free (safe to import in tests).
 */

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Render a minimal title screen panel.
 *
 * Note: The main renderer may currently inline its own title UI; this function
 * is provided for future refactors and for tests that verify the module imports.
 *
 * @param {object} [options]
 * @param {string} [options.title]
 * @param {string} [options.subtitle]
 */
export function renderTitleScreen(options = {}) {
  const title = options.title ?? 'AI Village RPG';
  const subtitle = options.subtitle ?? 'Turn-based adventure';

  return (
    '<div class="title-screen">' +
      `<h1 class="title-screen-title">${escapeHtml(title)}</h1>` +
      `<div class="title-screen-subtitle">${escapeHtml(subtitle)}</div>` +
      '<div class="title-screen-actions">' +
        '<button id="btnNew" data-action="NEW_GAME">New Game</button>' +
        '<button id="btnContinue" data-action="CONTINUE_GAME">Continue</button>' +
      '</div>' +
    '</div>'
  );
}

export const TITLE_SCREEN_ACTIONS = Object.freeze({
  NEW_GAME: 'NEW_GAME',
  CONTINUE_GAME: 'CONTINUE_GAME',
});
