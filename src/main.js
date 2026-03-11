import { loadSettings } from './settings.js';
import { applyTheme } from './data/themes.js';

import { render } from './render.js';
import { keyToCardinalDirection } from './input.js';
import { handleCombatAction, handleEnemyTurnLogic } from './handlers/combat-handler.js';
import { handleExplorationAction } from './handlers/exploration-handler.js';
import { handleSystemAction } from './handlers/system-handler.js';
import { handleUIAction } from './handlers/ui-handler.js';
import { handleDungeonAction } from './handlers/dungeon-handler.js';
import { handleStateTransitions } from './state-transitions.js';
import { initAudio } from './audio-system.js';

const IS_BROWSER = typeof window !== 'undefined' && typeof document !== 'undefined';

if (IS_BROWSER) {
  // Initialize theme from settings
  const initialSettings = loadSettings();
  applyTheme(initialSettings.display?.theme || 'midnight');
  let state = { phase: 'class-select', log: ['Welcome to AI Village RPG! Select your class.'] };

  // Initialize audio system on first interaction
  const startAudio = async () => {
    try {
      await initAudio();
      // Remove listener after success
      window.removeEventListener('click', startAudio);
      window.removeEventListener('keydown', startAudio);
    } catch (e) {
      console.warn('Audio init failed (likely autoplay policy):', e);
    }
  };
  window.addEventListener('click', startAudio, { once: true });
  window.addEventListener('keydown', startAudio, { once: true });

  function setState(next) {
    // Apply automatic state transitions (Level Up, Battle Summary)
    // We pass (state, next) because some transitions depend on phase changes
    const transitionedState = handleStateTransitions(state, next);
    
    state = transitionedState;
    render(state, dispatch);

    // If it became enemy turn, resolve after a short pause.
    if (state.phase === 'enemy-turn') {
      window.setTimeout(() => {
        // Execute enemy turn logic
        const afterEnemyTurn = handleEnemyTurnLogic(state);
        
        // We must call setState to trigger render and potential further transitions (e.g. defeat)
        // But avoid infinite loop - handleEnemyTurnLogic should change phase to player-turn or defeat
        setState(afterEnemyTurn);
      }, 450);
    }
  }

  function dispatch(action) {
    // Try each handler in order
    const next = handleCombatAction(state, action) ||
                 handleDungeonAction(state, action) ||
                 handleExplorationAction(state, action) ||
                 handleSystemAction(state, action) ||
                 handleUIAction(state, action);

    if (next) {
      setState(next);
    } else {
      // No-op or unknown action
      // console.warn('Unhandled action:', action);
      // Render current state to maintain consistency
      render(state, dispatch);
    }
  }

  // Initial Render
  render(state, dispatch);

  // Keyboard shortcuts: WASD/arrow keys to explore
  window.addEventListener('keydown', (event) => {
    const target = event.target;
    const tag = target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;

    const key = event.key;
    if (key === '?' || key?.toLowerCase() === 'h') {
      event.preventDefault();
      dispatch({ type: 'TOGGLE_HELP' });
      return;
    }

    if (key === 'b' || key === 'B') {
      event.preventDefault();
      dispatch({ type: 'VIEW_BESTIARY' });
      return;
    }

    const direction = keyToCardinalDirection(key);
    if (!direction) return;

    event.preventDefault();
    dispatch({ type: 'EXPLORE', direction });
  });
}
