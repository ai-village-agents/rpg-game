import { pushLog } from './state.js';
import { nextRng } from './combat.js';
import { NPCS } from './data/npcs.js';

function getCompanionList(state) {
  return Array.isArray(state.companions) ? state.companions : [];
}

function getMaxCompanions(state) {
  return Number.isInteger(state.maxCompanions) ? state.maxCompanions : 0;
}

export function createCompanionState() {
  return { companions: [], maxCompanions: 2 };
}

export function getAvailableCompanions(state) {
  const companions = getCompanionList(state);
  const recruitedIds = new Set(companions.map((companion) => companion.id));
  return Object.values(NPCS).filter(
    (npc) => npc.type === 'COMPANION' && !recruitedIds.has(npc.id)
  );
}

export function isCompanionRecruited(state, companionId) {
  return getCompanionList(state).some((companion) => companion.id === companionId);
}

export function recruitCompanion(state, companionId) {
  const npc = NPCS[companionId];
  if (!npc || npc.type !== 'COMPANION') {
    return pushLog(state, 'Unknown companion.');
  }

  const companions = getCompanionList(state);
  if (companions.some((companion) => companion.id === companionId)) {
    return pushLog(state, `${npc.name} is already in your party.`);
  }

  const maxCompanions = getMaxCompanions(state) || createCompanionState().maxCompanions;
  if (companions.length >= maxCompanions) {
    return pushLog(state, 'Your party is full.');
  }

  const stats = npc.stats || {};
  const newCompanion = {
    id: npc.id,
    name: npc.name,
    class: stats.class || 'Adventurer',
    level: stats.level ?? 1,
    hp: stats.hp ?? 1,
    maxHp: stats.hp ?? 1,
    mp: stats.mp ?? 0,
    maxMp: stats.mp ?? 0,
    attack: stats.attack ?? 1,
    defense: stats.defense ?? 0,
    speed: stats.speed ?? 0,
    skills: Array.isArray(npc.skills) ? [...npc.skills] : [],
    alive: true,
    loyalty: 50,
  };

  const next = { ...state, companions: [...companions, newCompanion], maxCompanions };
  return pushLog(next, `${npc.name} joined your party.`);
}

export function dismissCompanion(state, companionId) {
  const companions = getCompanionList(state);
  const companion = companions.find((entry) => entry.id === companionId);
  if (!companion) return pushLog(state, 'Companion not found.');

  const next = {
    ...state,
    companions: companions.filter((entry) => entry.id !== companionId),
  };
  return pushLog(next, `${companion.name} left your party.`);
}

export function getCompanionById(state, companionId) {
  return getCompanionList(state).find((companion) => companion.id === companionId) || null;
}

export function companionAttack(state, companionId, rngSeed) {
  const companion = getCompanionById(state, companionId);
  if (!companion || !companion.alive || !state.enemy) {
    return { state, seed: rngSeed };
  }

  const { seed } = nextRng(rngSeed);
  const damage = Math.max(1, (companion.attack ?? 0) - (state.enemy.def ?? 0));
  const enemyMaxHp = state.enemy.maxHp ?? state.enemy.hp ?? 0;
  const nextHp = Math.max(0, Math.min(enemyMaxHp, (state.enemy.hp ?? 0) - damage));
  let nextState = {
    ...state,
    enemy: { ...state.enemy, hp: nextHp },
  };
  nextState = pushLog(nextState, `${companion.name} attacks for ${damage} damage.`);

  return { state: nextState, seed };
}

export function companionTakeDamage(state, companionId, damage) {
  const companions = getCompanionList(state);
  const companion = companions.find((entry) => entry.id === companionId);
  if (!companion) return pushLog(state, 'Companion not found.');

  const nextHp = Math.max(0, (companion.hp ?? 0) - Math.max(0, damage));
  const alive = nextHp > 0;
  const updated = { ...companion, hp: nextHp, alive };
  const next = {
    ...state,
    companions: companions.map((entry) => (entry.id === companionId ? updated : entry)),
  };

  let withLog = pushLog(next, `${companion.name} takes ${Math.max(0, damage)} damage.`);
  if (!alive) {
    withLog = pushLog(withLog, `${companion.name} has fallen.`);
  }
  return withLog;
}

export function healCompanion(state, companionId, amount) {
  const companions = getCompanionList(state);
  const companion = companions.find((entry) => entry.id === companionId);
  if (!companion) return state;

  const maxHp = companion.maxHp ?? companion.hp ?? 0;
  const healAmount = Math.max(0, amount);
  const nextHp = Math.min(maxHp, (companion.hp ?? 0) + healAmount);
  if (nextHp === companion.hp) return state;

  const updated = { ...companion, hp: nextHp };
  return {
    ...state,
    companions: companions.map((entry) => (entry.id === companionId ? updated : entry)),
  };
}

export function adjustLoyalty(state, companionId, amount) {
  const companions = getCompanionList(state);
  const companion = companions.find((entry) => entry.id === companionId);
  if (!companion) return state;

  const nextLoyalty = Math.max(0, Math.min(100, (companion.loyalty ?? 0) + amount));
  const updated = { ...companion, loyalty: nextLoyalty };
  return {
    ...state,
    companions: companions.map((entry) => (entry.id === companionId ? updated : entry)),
  };
}

export function getCompanionBonuses(state) {
  const companions = getCompanionList(state);
  const aliveCount = companions.filter((companion) => companion.alive).length;
  return {
    attackBonus: aliveCount * 2,
    defenseBonus: aliveCount * 1,
  };
}

export function companionAutoAct(state, rngSeed) {
  const companions = getCompanionList(state);
  let working = state;
  let seed = Number.isFinite(rngSeed) ? rngSeed : working?.rngSeed;
  let companionActed = false;

  if (!Number.isFinite(seed)) {
    seed = Date.now() % 2147483647;
  }

  for (const companion of companions) {
    if (!companion.alive) continue;
    companionActed = true;
    const result = companionAttack(working, companion.id, seed);
    working = result.state;
    seed = result.seed;
  }

  if (companionActed && Number.isFinite(seed)) {
    working = { ...working, rngSeed: seed };
  }

  return working;
}
