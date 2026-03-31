import { createKeyboardShortcuts } from "./keyboard-shortcuts.js";
import { loadSettings } from './settings.js';
import { applyTheme } from './data/themes.js';
import { applyReducedMotion } from './accessibility.js';

import { render } from './render.js';
import { keyToCardinalDirection } from './input.js';
import { loadKeybindings, getActionForKey } from './keybindings.js';
import { handleCombatAction, handleEnemyTurnLogic } from './handlers/combat-handler.js';
import { handleExplorationAction, handleFastTravelAction } from './handlers/exploration-handler.js';
import { handleEncounterAction } from './handlers/encounter-handler.js';
import { handleSystemAction } from './handlers/system-handler.js';
import { handleUIAction } from './handlers/ui-handler.js';
import { handleDungeonAction } from './handlers/dungeon-handler.js';
import { handleStateTransitions } from './state-transitions.js';
import { initAudio } from './audio-system.js';
import { createTutorialState } from './tutorial.js';
import { createEncounterState } from './random-encounter-system.js';
import {
  createDailyChallengeState,
  initializeDailyChallenges,
  updateChallengeProgress,
  claimChallengeReward,
} from './daily-challenge-system.js';
import { renderDailyChallengesUI } from './daily-challenge-system-ui.js';

const IS_BROWSER = typeof window !== 'undefined' && typeof document !== 'undefined';

if (IS_BROWSER) {
  // Initialize theme from settings
  const initialSettings = loadSettings();
  applyTheme(initialSettings.display?.theme || 'midnight');
  applyReducedMotion(initialSettings.display?.reducedMotion || false);
  let state = {
    phase: 'class-select',
    log: ['Welcome to AI Village RPG! Select your class.'],
    tutorialState: createTutorialState(),
    dailyChallengeState: initializeDailyChallenges(createDailyChallengeState()),
    showDailyChallenges: false,
    encounterState: createEncounterState(),
  };

  function appendLogLine(nextState, line) {
    const currentLog = Array.isArray(nextState.log) ? nextState.log : [];
    return { ...nextState, log: [...currentLog, line].slice(-200) };
  }

  function ensureDailyChallengeState(nextState) {
    if (!nextState || typeof nextState !== 'object') return nextState;
    const baseDailyState = nextState.dailyChallengeState || createDailyChallengeState();
    const initializedDailyState = initializeDailyChallenges(baseDailyState);
    if (nextState.dailyChallengeState !== initializedDailyState || nextState.showDailyChallenges === undefined) {
      return {
        ...nextState,
        dailyChallengeState: initializedDailyState,
        showDailyChallenges: Boolean(nextState.showDailyChallenges),
      };
    }
    return nextState;
  }

  function applyDailyProgressFromTransition(prevState, nextState, action) {
    const dailyState = nextState.dailyChallengeState;
    if (!dailyState) return nextState;

    let updatedDailyState = dailyState;
    const newlyCompleted = [];
    const applyProgress = (stat, amount = 1) => {
      const result = updateChallengeProgress(updatedDailyState, stat, amount);
      updatedDailyState = result.state;
      if (Array.isArray(result.newlyCompleted) && result.newlyCompleted.length > 0) {
        newlyCompleted.push(...result.newlyCompleted);
      }
    };

    const enteredBattleSummary = nextState.phase === 'battle-summary' && prevState.phase !== 'battle-summary';
    if (enteredBattleSummary) {
      applyProgress('battlesWon', 1);
      applyProgress('enemiesDefeated', 1);
      if (nextState.enemy?.isBoss) {
        applyProgress('bossesDefeated', 1);
      }
      if ((nextState.goldGained ?? 0) > 0) {
        applyProgress('goldCollected', nextState.goldGained);
      }
    }

    if (action?.type === 'PLAYER_POTION') {
      applyProgress('potionsUsed', 1);
    }
    if (action?.type === 'EXPLORE') {
      applyProgress('stepsTaken', 1);
    }

    if (updatedDailyState === dailyState && newlyCompleted.length === 0) {
      return nextState;
    }

    let withDaily = { ...nextState, dailyChallengeState: updatedDailyState };
    const uniqueCompleted = [...new Map(newlyCompleted.map((c) => [c.id, c])).values()];
    for (const challenge of uniqueCompleted) {
      withDaily = appendLogLine(withDaily, `Daily Challenge Complete: ${challenge.name}`);
    }
    return withDaily;
  }

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

  function setState(next, action = null) {
    // Apply automatic state transitions (Level Up, Battle Summary)
    // We pass (state, next) because some transitions depend on phase changes
    let transitionedState = handleStateTransitions(state, next);
    transitionedState = ensureDailyChallengeState(transitionedState);
    transitionedState = applyDailyProgressFromTransition(state, transitionedState, action);
    
    state = transitionedState;
    window.__state = state;
    render(state, dispatch);
    renderDailyChallengesUI(state, dispatch);

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
    console.log('[DISPATCH]', action.type, 'direction:', action.direction, 'phase:', state.phase);
    if (action.type === 'OPEN_DAILY_CHALLENGES') {
      setState({ ...state, showDailyChallenges: true }, action);
      return;
    }

    if (action.type === 'CLOSE_DAILY_CHALLENGES') {
      setState({ ...state, showDailyChallenges: false }, action);
      return;
    }

    if (action.type === 'CLAIM_DAILY_CHALLENGE') {
      const currentDailyState = state.dailyChallengeState || createDailyChallengeState();
      const claimResult = claimChallengeReward(currentDailyState, action.challengeId);

      if (claimResult.error) {
        setState(appendLogLine(state, `Daily Challenge: ${claimResult.error}.`), action);
        return;
      }

      let next = { ...state, dailyChallengeState: claimResult.state };

      if (claimResult.rewards && next.player) {
        const inventory = { ...(next.player.inventory || {}) };
        for (const itemId of claimResult.rewards.items || []) {
          inventory[itemId] = (inventory[itemId] || 0) + 1;
        }

        next = {
          ...next,
          player: {
            ...next.player,
            xp: (next.player.xp || 0) + (claimResult.rewards.xp || 0),
            gold: (next.player.gold || 0) + (claimResult.rewards.gold || 0),
            inventory,
          },
        };
      }

      const rewardXp = claimResult.rewards?.xp || 0;
      const rewardGold = claimResult.rewards?.gold || 0;
      next = appendLogLine(next, `Claimed daily reward: +${rewardXp} XP, +${rewardGold} gold.`);
      setState(next, action);
      return;
    }

    // Try each handler in order
    console.log('[DISPATCH] Trying handlers... phase:', state.phase, 'action:', JSON.stringify(action));
    const combatResult = handleCombatAction(state, action);
    console.log('[DISPATCH] handleCombatAction returned:', combatResult !== null ? 'non-null' : 'null');
    const dungeonResult = !combatResult && handleDungeonAction(state, action);
    console.log('[DISPATCH] handleDungeonAction returned:', dungeonResult !== null && dungeonResult !== false ? 'non-null' : 'null/false');
    const encounterResult = !combatResult && !dungeonResult && handleEncounterAction(state, action);
    console.log('[DISPATCH] handleEncounterAction returned:', encounterResult !== null && encounterResult !== false ? 'non-null' : 'null/false');
    const explorationResult = !combatResult && !dungeonResult && !encounterResult && handleExplorationAction(state, action);
    console.log('[DISPATCH] handleExplorationAction returned:', explorationResult !== null && explorationResult !== false ? 'non-null' : 'null/false');
    const next = combatResult || dungeonResult || encounterResult || explorationResult ||
                 handleFastTravelAction(state, action) ||
                 handleSystemAction(state, action) ||
                 handleUIAction(state, action);

    if (next) {
      setState(next, action);
    } else {
      // No-op or unknown action
      // console.warn('Unhandled action:', action);
      // Render current state to maintain consistency
      render(state, dispatch);
      renderDailyChallengesUI(state, dispatch);
    }
  }

  // Initial Render
  render(state, dispatch);
  renderDailyChallengesUI(state, dispatch);

  // Initialize context-sensitive keyboard shortcuts (combat 1-4, exploration menus, etc.)
  createKeyboardShortcuts(() => state, dispatch);

  // Keyboard shortcuts: WASD/arrow keys to explore
  window.addEventListener('keydown', (event) => {
    const target = event.target;
    const tag = target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;

    const key = event.key;
    if (getActionForKey(key, loadKeybindings()) === 'openHelp') {
      event.preventDefault();
      dispatch({ type: 'TOGGLE_HELP' });
      return;
    }

    if (getActionForKey(key, loadKeybindings()) === 'openBestiary') {
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
