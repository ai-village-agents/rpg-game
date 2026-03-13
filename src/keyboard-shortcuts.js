/**
 * Keyboard Shortcuts Controller
 * 
 * Provides context-sensitive keyboard shortcuts for the RPG game.
 * Combat keys (1-4), exploration menu keys, and universal shortcuts.
 */

const COMBAT_KEYS = {
  '1': { type: 'PLAYER_ATTACK' },
  '2': { type: 'PLAYER_DEFEND' },
  '3': { type: 'PLAYER_POTION' },
  '4': { type: 'PLAYER_FLEE' },
};

const EXPLORATION_KEYS = {
  'i': { type: 'VIEW_INVENTORY' },
  'I': { type: 'VIEW_INVENTORY' },
  'j': { type: 'OPEN_JOURNAL' },
  'J': { type: 'OPEN_JOURNAL' },
  'c': { type: 'VIEW_CRAFTING' },
  'C': { type: 'VIEW_CRAFTING' },
  't': { type: 'VIEW_TALENTS' },
  'T': { type: 'VIEW_TALENTS' },
  'q': { type: 'VIEW_QUESTS' },
  'Q': { type: 'VIEW_QUESTS' },
  'p': { type: 'OPEN_PROVISIONS' },
  'P': { type: 'OPEN_PROVISIONS' },
  'f': { type: 'OPEN_FAST_TRAVEL' },
  'F': { type: 'OPEN_FAST_TRAVEL' },
  'k': { type: 'OPEN_COMPANIONS' },
  'K': { type: 'OPEN_COMPANIONS' },
  'n': { type: 'OPEN_FACTIONS' },
  'N': { type: 'OPEN_FACTIONS' },
};

/** Phases that are considered "sub-menus" where Escape returns to exploration */
const SUB_MENU_PHASES = new Set([
  'inventory', 'quests', 'journal', 'crafting', 'talents', 'shop',
  'settings', 'save-slots', 'stats', 'achievements', 'companions',
  'factions', 'guilds', 'sporeling', 'provisions', 'dialog',
  'arena', 'bestiary', 'tavern',
]);

const HELP_OVERLAY_ID = 'keyboard-shortcuts-overlay';
const STYLE_ID = 'keyboard-shortcuts-styles';

/**
 * @typedef {function(): object} GetStateFn
 * @typedef {function(object): void} DispatchFn
 */

export class KeyboardShortcuts {
  /**
   * @param {GetStateFn} getState - Returns the current game state
   * @param {DispatchFn} dispatch - Dispatches game actions
   */
  constructor(getState, dispatch) {
    this._getState = getState;
    this._dispatch = dispatch;
    this._handler = this._handleKey.bind(this);
    this._overlayVisible = false;
  }

  /** Register keydown listener and inject styles */
  init() {
    this._injectStyles();
    window.addEventListener('keydown', this._handler);
  }

  /** Remove keydown listener and clean up */
  destroy() {
    window.removeEventListener('keydown', this._handler);
    this._hideHelpOverlay();
    const styleEl = document.getElementById(STYLE_ID);
    if (styleEl) styleEl.remove();
  }

  /** @param {KeyboardEvent} event */
  _handleKey(event) {
    const target = event.target;
    const tag = target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;

    const key = event.key;

    // Toggle shortcut help overlay with /
    if (key === '/') {
      event.preventDefault();
      if (this._overlayVisible) {
        this._hideHelpOverlay();
      } else {
        this._showHelpOverlay();
      }
      return;
    }

    // Close overlay with Escape if open
    if (key === 'Escape' && this._overlayVisible) {
      event.preventDefault();
      this._hideHelpOverlay();
      return;
    }

    const state = this._getState();
    if (!state) return;

    const phase = state.phase;

    // Combat shortcuts (only during player's turn)
    if (phase === 'player-turn') {
      const combatAction = COMBAT_KEYS[key];
      if (combatAction) {
        event.preventDefault();
        this._dispatch(combatAction);
        return;
      }
    }

    // Exploration shortcuts
    if (phase === 'exploration') {
      const explorationAction = EXPLORATION_KEYS[key];
      if (explorationAction) {
        event.preventDefault();
        this._dispatch(explorationAction);
        return;
      }
    }

    // Escape to go back from sub-menus
    if (key === 'Escape' && SUB_MENU_PHASES.has(phase)) {
      event.preventDefault();
      this._dispatch({ type: 'GO_BACK' });
      return;
    }

    // Enter to continue on summary/victory/defeat screens
    if (key === 'Enter') {
      if (phase === 'battle-summary') {
        event.preventDefault();
        this._dispatch({ type: 'CONTINUE' });
        return;
      }
      if (phase === 'victory') {
        event.preventDefault();
        this._dispatch({ type: 'CONTINUE_VICTORY' });
        return;
      }
      if (phase === 'defeat') {
        event.preventDefault();
        this._dispatch({ type: 'RESTART' });
        return;
      }
      if (phase === 'fled') {
        event.preventDefault();
        this._dispatch({ type: 'CONTINUE_AFTER_FLEE' });
        return;
      }
      if (phase === 'level-up' && state.levelUpState) {
        event.preventDefault();
        this._dispatch({ type: 'CONTINUE_LEVEL_UP' });
        return;
      }
    }
  }

  /** Show keyboard shortcuts help overlay */
  _showHelpOverlay() {
    if (document.getElementById(HELP_OVERLAY_ID)) return;

    const overlay = document.createElement('div');
    overlay.id = HELP_OVERLAY_ID;
    overlay.innerHTML = `
      <div class="ks-overlay-backdrop"></div>
      <div class="ks-overlay-content">
        <h2>Keyboard Shortcuts</h2>
        <div class="ks-columns">
          <div class="ks-section">
            <h3>Combat (Your Turn)</h3>
            <table>
              <tr><td class="ks-key">1</td><td>Attack</td></tr>
              <tr><td class="ks-key">2</td><td>Defend</td></tr>
              <tr><td class="ks-key">3</td><td>Use Potion</td></tr>
              <tr><td class="ks-key">4</td><td>Flee</td></tr>
            </table>
          </div>
          <div class="ks-section">
            <h3>Exploration</h3>
            <table>
              <tr><td class="ks-key">W/A/S/D</td><td>Move (or Arrow Keys)</td></tr>
              <tr><td class="ks-key">I</td><td>Inventory</td></tr>
              <tr><td class="ks-key">Q</td><td>Quests</td></tr>
              <tr><td class="ks-key">J</td><td>Journal</td></tr>
              <tr><td class="ks-key">C</td><td>Crafting</td></tr>
              <tr><td class="ks-key">T</td><td>Talents</td></tr>
              <tr><td class="ks-key">P</td><td>Provisions</td></tr>
              <tr><td class="ks-key">F</td><td>Fast Travel</td></tr>
              <tr><td class="ks-key">K</td><td>Companions</td></tr>
              <tr><td class="ks-key">N</td><td>Factions</td></tr>
            </table>
          </div>
          <div class="ks-section">
            <h3>Universal</h3>
            <table>
              <tr><td class="ks-key">Esc</td><td>Go Back / Close Menu</td></tr>
              <tr><td class="ks-key">Enter</td><td>Continue / Confirm</td></tr>
              <tr><td class="ks-key">?</td><td>Toggle Game Help</td></tr>
              <tr><td class="ks-key">/</td><td>This Shortcut Guide</td></tr>
              <tr><td class="ks-key">B</td><td>Bestiary</td></tr>
              <tr><td class="ks-key">H</td><td>Help</td></tr>
            </table>
          </div>
        </div>
        <p class="ks-footer">Press <span class="ks-key">/</span> or <span class="ks-key">Esc</span> to close</p>
      </div>
    `;
    document.body.appendChild(overlay);
    this._overlayVisible = true;
  }

  /** Hide the keyboard shortcuts help overlay */
  _hideHelpOverlay() {
    const overlay = document.getElementById(HELP_OVERLAY_ID);
    if (overlay) overlay.remove();
    this._overlayVisible = false;
  }

  /** Inject CSS styles for the overlay */
  _injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${HELP_OVERLAY_ID} {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .ks-overlay-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.75);
      }
      .ks-overlay-content {
        position: relative;
        background: #1a1a2e;
        color: #e0e0e0;
        border: 2px solid #4a4a6a;
        border-radius: 12px;
        padding: 24px 32px;
        max-width: 720px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      }
      .ks-overlay-content h2 {
        text-align: center;
        margin: 0 0 16px 0;
        color: #f0c040;
        font-size: 1.4em;
      }
      .ks-overlay-content h3 {
        margin: 0 0 8px 0;
        color: #80c0ff;
        font-size: 1em;
        border-bottom: 1px solid #4a4a6a;
        padding-bottom: 4px;
      }
      .ks-columns {
        display: flex;
        gap: 24px;
        flex-wrap: wrap;
      }
      .ks-section {
        flex: 1;
        min-width: 180px;
      }
      .ks-section table {
        width: 100%;
        border-collapse: collapse;
      }
      .ks-section td {
        padding: 3px 6px;
        font-size: 0.9em;
      }
      .ks-key {
        display: inline-block;
        background: #2a2a4a;
        border: 1px solid #5a5a7a;
        border-radius: 4px;
        padding: 1px 6px;
        font-family: monospace;
        font-size: 0.85em;
        color: #f0c040;
        min-width: 20px;
        text-align: center;
      }
      td.ks-key {
        width: 70px;
      }
      .ks-footer {
        text-align: center;
        margin: 16px 0 0 0;
        font-size: 0.85em;
        color: #888;
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Factory function: create and initialize a KeyboardShortcuts instance.
 * @param {GetStateFn} getState
 * @param {DispatchFn} dispatch
 * @returns {KeyboardShortcuts}
 */
export function createKeyboardShortcuts(getState, dispatch) {
  const ks = new KeyboardShortcuts(getState, dispatch);
  ks.init();
  return ks;
}

// For testing: export the key maps
export { COMBAT_KEYS, EXPLORATION_KEYS, SUB_MENU_PHASES };
