import { characters } from './data/characters.js';
import { createWorldState } from './map.js';

export function initialState() {
  const playerBase = characters.player;
  const enemyBase = characters.slime;

  return {
    version: 1,
    rngSeed: Date.now() % 2147483647,
    phase: 'player-turn', // player-turn | enemy-turn | victory | defeat
    turn: 1,
    player: {
      name: playerBase.name,
      hp: playerBase.maxHp,
      maxHp: playerBase.maxHp,
      atk: playerBase.atk,
      def: playerBase.def,
      defending: false,
      inventory: { potion: 2 },
    },
    enemy: {
      name: enemyBase.name,
      hp: enemyBase.maxHp,
      maxHp: enemyBase.maxHp,
      atk: enemyBase.atk,
      def: enemyBase.def,
      defending: false,
    },
    log: [
      `A wild ${enemyBase.name} appears.`,
      `Your turn.`,
    ],
        world: createWorldState(),
  };
}

export function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

export function pushLog(state, line) {
  // keep last 200 lines
  const log = [...state.log, line].slice(-200);
  return { ...state, log };
}

export function saveToLocalStorage(state) {
  const payload = JSON.stringify(state);
  localStorage.setItem('aiVillageRpgSave', payload);
}

export function loadFromLocalStorage() {
  const raw = localStorage.getItem('aiVillageRpgSave');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}
