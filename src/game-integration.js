/** Game Integration — wire engine, map, combat, and party modules. */

import { GameState, setGameState, getGameState, on, emit, initEngine, saveToSlot, loadFromSlot, getSaveSlots } from './engine.js';
import { createCombatState, calculateTurnOrder, executePlayerAction, getAbilitiesByClass } from './combat/index.js';
import { createCharacter, createParty, addMember, setActiveParty, getActiveMembers, gainXp, toCombatant } from './characters/index.js';
import { createMap, movePlayer, getCurrentRoom, getRoomExits } from './map.js';
import { useItem, getInventory, addItem, removeItem } from './items.js';
import { lootTables, getRandomLoot } from './data/items.js';

const RNG_MOD = 2147483647;
const RNG_MULT = 48271;
const ENEMY_POOL = [
  { name: 'Slime', hp: 20, maxHp: 20, mp: 0, maxMp: 0, atk: 5, def: 3, spd: 4, abilities: ['slime-splash'], element: 'earth', lootTable: 'goblin', xpReward: 15, goldReward: 8 },
  { name: 'Goblin', hp: 30, maxHp: 30, mp: 5, maxMp: 5, atk: 8, def: 4, spd: 7, abilities: ['backstab'], element: 'physical', lootTable: 'goblin', xpReward: 25, goldReward: 15 },
  { name: 'Fire Imp', hp: 25, maxHp: 25, mp: 15, maxMp: 15, atk: 10, def: 3, spd: 6, abilities: ['fire-breath'], element: 'fire', lootTable: 'banditCaptain', xpReward: 30, goldReward: 20 },
];

let hooksReady = false;
const abilityIndex = new Map();

function ensureEngineHooks() {
  if (hooksReady) return;
  hooksReady = true;
  on('game:stateChange', ({ newState }) => emit('game:phase', { phase: newState }));
}

function normalizeSeed(seed) {
  const base = Number.isFinite(seed) ? Math.abs(seed) : Date.now();
  return base % RNG_MOD;
}

function rollRng(gameState) {
  const next = (normalizeSeed(gameState.rngSeed) * RNG_MULT) % RNG_MOD;
  return { value: next / RNG_MOD, rngSeed: next };
}

function getAbilityIndex() {
  if (abilityIndex.size > 0) return abilityIndex;
  ['warrior', 'mage', 'rogue', 'cleric', 'monster'].forEach((classId) => {
    getAbilitiesByClass(classId).forEach((ability) => abilityIndex.set(ability.id, ability));
  });
  return abilityIndex;
}

function buildPartyStatus(party) {
  return party.members.map((member) => ({
    name: member.name,
    hp: member.stats.hp,
    maxHp: member.stats.maxHp,
    mp: member.stats.mp,
    maxMp: member.stats.maxMp,
    level: member.level,
    className: member.classId ? member.classId[0].toUpperCase() + member.classId.slice(1) : 'Unknown',
  }));
}

function summarizeRoom(mapState) {
  const room = getCurrentRoom(mapState);
  if (!room) return { name: 'Unknown', description: 'A quiet space with no clear path.', exits: [] };
  return { name: room.name ?? 'Unknown', description: room.description ?? 'A quiet stretch of the world.', exits: getRoomExits(mapState) };
}

function syncPartyFromCombat(party, combatState) {
  if (!combatState) return party;
  const allyMap = new Map(combatState.allCombatants.filter((c) => c.side === 'ally').map((c) => [c.id, c]));
  const nextMembers = party.members.map((member) => {
    const combatant = allyMap.get(member.id);
    if (!combatant) return member;
    return { ...member, stats: { ...member.stats, hp: combatant.hp, mp: combatant.mp } };
  });
  return { ...party, members: nextMembers };
}

function applyRewards(party, inventory, rewards) {
  const messages = [];
  let nextParty = party;
  let nextInventory = { ...(inventory ?? {}) };
  const xpTotal = Math.max(0, Math.floor(rewards?.xp ?? 0));
  const activeMembers = getActiveMembers(party);
  const split = activeMembers.length > 0 ? Math.floor(xpTotal / activeMembers.length) : 0;
  if (split > 0) {
    const levelMessages = [];
    const nextMembers = party.members.map((member) => {
      if (!party.activePartyIds.includes(member.id)) return member;
      const result = gainXp(member, split);
      levelMessages.push(...result.messages);
      return result.character;
    });
    nextParty = { ...party, members: nextMembers };
    messages.push(...levelMessages);
  }
  const gold = Math.max(0, Math.floor(rewards?.gold ?? 0));
  if (gold > 0) {
    nextInventory = addItem(nextInventory, 'gold', gold);
    messages.push(`Gained ${gold} gold.`);
  }
  (rewards?.items ?? []).forEach((itemId) => {
    nextInventory = addItem(nextInventory, itemId, 1);
    messages.push(`Found ${itemId}.`);
  });
  return { party: nextParty, inventory: nextInventory, messages };
}

function resolveTargetId(combatState, action) {
  if (!combatState || !action) return null;
  const actor = combatState.allCombatants.find((c) => c.combatId === combatState.activeCombatantId);
  if (!actor) return null;
  const allies = combatState.allCombatants.filter((c) => c.side === 'ally' && c.hp > 0);
  const enemies = combatState.allCombatants.filter((c) => c.side === 'enemy' && c.hp > 0);
  if (action.type === 'defend' || action.type === 'flee') return null;
  let targetPool = enemies;
  let targetType = 'single-enemy';
  if (action.type === 'ability') {
    const ability = getAbilityIndex().get(action.abilityId);
    if (ability) targetType = ability.targetType;
    if (targetType === 'single-ally' || targetType === 'all-allies' || targetType === 'self') targetPool = allies;
  } else if (action.type === 'item') {
    targetPool = allies;
  }
  if (targetType === 'self') return actor.combatId;
  if (targetType === 'all-enemies' || targetType === 'all-allies') return null;
  if (targetPool.length === 0) return null;
  const index = Math.min(Math.max(0, action.targetIndex ?? 0), targetPool.length - 1);
  return targetPool[index].combatId;
}

function createEnemyGroup(gameState) {
  let working = { ...gameState };
  const countRoll = rollRng(working);
  working = { ...working, rngSeed: countRoll.rngSeed };
  const count = 1 + Math.floor(countRoll.value * 3);
  const enemies = [];
  for (let i = 0; i < count; i += 1) {
    const pickRoll = rollRng(working);
    working = { ...working, rngSeed: pickRoll.rngSeed };
    const choice = Math.floor(pickRoll.value * ENEMY_POOL.length);
    const base = ENEMY_POOL[Math.min(choice, ENEMY_POOL.length - 1)];
    enemies.push({ id: `enemy-${i}`, ...base });
  }
  return { enemies, state: working };
}

/** Start a new game with a default party and map. @returns {object} */
export function startNewGame() {
  ensureEngineHooks();
  initEngine();
  let party = createParty();
  const roster = [
    createCharacter({ name: 'Hero', classId: 'warrior', id: 'hero' }),
    createCharacter({ name: 'Sage', classId: 'mage', id: 'sage' }),
    createCharacter({ name: 'Shadow', classId: 'rogue', id: 'shadow' }),
    createCharacter({ name: 'Healer', classId: 'cleric', id: 'healer' }),
  ];
  roster.forEach((member) => {
    const result = addMember(party, member);
    party = result.party;
  });
  party = setActiveParty(party, roster.map((member) => member.id)).party;
  const map = createMap();
  const inventory = addItem(getInventory({}), 'potion', 2);
  const gamePhase = setGameState(GameState.EXPLORATION);
  const baseState = { party, map, gamePhase, combatState: null, inventory, turnCount: 0, messages: ['The journey begins.'], rngSeed: normalizeSeed(Date.now()) };
  emit('game:start', { state: baseState });
  return baseState;
}

/** Get a snapshot summary of the current game state. @param {object} gameState @returns {object} */
export function getGameStatus(gameState) {
  const inventory = getInventory(gameState.inventory);
  const inventoryCount = Object.values(inventory).reduce((sum, count) => sum + count, 0);
  return { phase: gameState.gamePhase ?? getGameState(), partyStatus: buildPartyStatus(gameState.party), currentRoom: summarizeRoom(gameState.map), turnCount: gameState.turnCount ?? 0, inventoryCount };
}

/** Handle exploration movement and random encounters. @param {object} gameState @param {string} direction @returns {object} */
export function handleExplore(gameState, direction) {
  if (gameState.gamePhase !== GameState.EXPLORATION) return gameState;
  const moveResult = movePlayer(gameState.map.worldState, direction, gameState.map.worldData);
  let updated = { ...gameState, map: { ...gameState.map, worldState: moveResult.worldState }, turnCount: (gameState.turnCount ?? 0) + 1 };
  const messages = [...(updated.messages ?? [])];
  if (!moveResult.moved) {
    messages.push('Movement blocked.');
    return { ...updated, messages };
  }
  const encounterRoll = rollRng(updated);
  updated = { ...updated, rngSeed: encounterRoll.rngSeed };
  if (encounterRoll.value < 0.3) {
    const { enemies, state } = createEnemyGroup(updated);
    updated = state;
    const partyCombatants = getActiveMembers(updated.party).map((member) => toCombatant(member));
    let combatState = createCombatState(partyCombatants, enemies, updated.rngSeed);
    combatState = calculateTurnOrder(combatState);
    const gamePhase = setGameState(GameState.COMBAT);
    messages.push(`Encountered ${enemies.map((enemy) => enemy.name).join(', ')}.`);
    emit('combat:start', { combatState });
    return { ...updated, gamePhase, combatState, messages };
  }
  messages.push('The path stays clear.');
  return { ...updated, messages };
}

/** Handle a combat action and resolve outcomes. @param {object} gameState @param {object} action @returns {object} */
export function handleCombatAction(gameState, action) {
  if (gameState.gamePhase !== GameState.COMBAT || !gameState.combatState) return gameState;
  let updated = { ...gameState, turnCount: (gameState.turnCount ?? 0) + 1 };
  let inventory = getInventory(updated.inventory);
  const messages = [...(updated.messages ?? [])];
  if (action.type === 'item') {
    const actor = updated.combatState.allCombatants.find((combatant) => combatant.combatId === updated.combatState.activeCombatantId);
    const validation = actor ? useItem(action.itemId, { ...actor, inventory }, {}) : { success: false, message: 'No active combatant.' };
    if (!validation.success) {
      messages.push(validation.message);
      return { ...updated, messages };
    }
    inventory = removeItem(inventory, action.itemId, 1);
  }
  const targetId = resolveTargetId(updated.combatState, action);
  const normalizedAction = { ...action, targetId };
  let combatState = executePlayerAction(updated.combatState, normalizedAction);
  let party = syncPartyFromCombat(updated.party, combatState);
  updated = { ...updated, combatState, party, inventory };
  if (combatState.phase === 'victory') {
    const rewards = { ...(combatState.rewards ?? {}) };
    const rewardItems = [...(rewards.items ?? [])];
    combatState.allCombatants
      .filter((combatant) => combatant.side === 'enemy')
      .forEach((enemy) => {
        const lootTableId = enemy.lootTable;
        if (!lootTableId) return;
        const lootTable = lootTables[lootTableId];
        if (!lootTable) return;
        const loot = getRandomLoot(lootTable.rarityWeights);
        if (loot) rewardItems.push(loot.id);
      });
    rewards.items = rewardItems;
    combatState = { ...combatState, rewards };
    const rewardResult = applyRewards(party, inventory, rewards);
    messages.push(...rewardResult.messages);
    updated = { ...updated, party: rewardResult.party, inventory: rewardResult.inventory, combatState: null, gamePhase: setGameState(GameState.EXPLORATION) };
    emit('combat:win', { rewards: combatState.rewards });
  } else if (combatState.phase === 'defeat') {
    updated = { ...updated, gamePhase: setGameState(GameState.GAME_OVER) };
    emit('combat:defeat', {});
  } else if (combatState.phase === 'fled') {
    updated = { ...updated, combatState: null, gamePhase: setGameState(GameState.EXPLORATION) };
    emit('combat:fled', {});
  }
  return { ...updated, messages };
}

/** Save the current game state to a slot. @param {object} gameState @param {number} slot @returns {boolean} */
export function handleSave(gameState, slot) {
  const slots = getSaveSlots();
  if (!slots.some((entry) => entry.index === slot)) return false;
  return saveToSlot(gameState, slot);
}

/** Load game state from a slot. @param {number} slot @returns {object|null} */
export function handleLoad(slot) {
  const loaded = loadFromSlot(slot);
  if (!loaded) return null;
  setGameState(loaded.gamePhase ?? GameState.MENU);
  emit('game:loaded-state', { state: loaded });
  return loaded;
}
