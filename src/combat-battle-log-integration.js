import { battleLog } from './battle-log.js';

function toAmount(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export function initCombatBattleLog() {
  battleLog.clear();
  return logTurnStart(1, true);
}

export function logPlayerAttack(damage, enemyName) {
  const amount = toAmount(damage);
  const target = enemyName || 'Enemy';
  const message = `You strike ${target} for ${amount} damage.`;
  return battleLog.addEntry('attack', message, {
    damage: amount,
    target,
    source: 'player',
  });
}

export function logPlayerAbility(abilityName, damage, element, targetName) {
  const amount = toAmount(damage);
  const ability = abilityName || 'Ability';
  const target = targetName || 'enemy';
  const elementLabel = element ? ` (${element})` : '';
  const message = `You use ${ability}${elementLabel} on ${target} for ${amount} damage.`;
  return battleLog.addEntry('ability', message, {
    ability,
    damage: amount,
    element: element || null,
    target,
    source: 'player',
  });
}

export function logDamageDealt(amount, targetName, source) {
  const damage = toAmount(amount);
  const target = targetName || 'enemy';
  const via = source ? ` with ${source}` : '';
  const message = `Dealt ${damage} damage to ${target}${via}.`;
  return battleLog.addEntry('damage-dealt', message, {
    amount: damage,
    target,
    source: source || 'player',
  });
}

export function logDamageReceived(amount, sourceName) {
  const damage = toAmount(amount);
  const source = sourceName || 'enemy attack';
  const message = `You take ${damage} damage from ${source}.`;
  return battleLog.addEntry('damage-received', message, {
    amount: damage,
    source,
  });
}

export function logHealing(amount, sourceName) {
  const heal = toAmount(amount);
  const source = sourceName || 'unknown source';
  const message = `Restored ${heal} HP from ${source}.`;
  return battleLog.addEntry('heal', message, {
    amount: heal,
    source,
  });
}

export function logItemUsed(itemName, effect) {
  const item = itemName || 'Item';
  const effectText = effect ? `: ${effect}` : '';
  const message = `Used ${item}${effectText}.`;
  return battleLog.addEntry('item-used', message, {
    item,
    effect: effect || null,
  });
}

export function logStatusApplied(statusName, targetName, duration) {
  const status = statusName || 'Status';
  const target = targetName || 'target';
  const turns = Number.isFinite(duration) ? duration : null;
  const durationText = Number.isFinite(duration) ? ` for ${turns} turns` : '';
  const message = `${status} applied to ${target}${durationText}.`;
  return battleLog.addEntry('status-applied', message, {
    status,
    target,
    duration: turns,
  });
}

export function logStatusExpired(statusName, targetName) {
  const status = statusName || 'Status effect';
  const target = targetName || 'target';
  const message = `${status} on ${target} expired.`;
  return battleLog.addEntry('status-expired', message, {
    status,
    target,
  });
}

export function logTurnStart(turnNumber, isPlayerTurn) {
  const nextTurn = Number.isInteger(turnNumber) && turnNumber > 0
    ? turnNumber
    : battleLog.currentTurn + 1;
  battleLog.currentTurn = nextTurn;
  const isPlayer = isPlayerTurn !== false;
  const actor = isPlayer ? "Player's" : 'Enemy';
  const message = `${actor} turn begins (Turn ${nextTurn}).`;
  return battleLog.addEntry('turn-start', message, {
    turn: nextTurn,
    isPlayerTurn: isPlayer,
  });
}

export function logTurnEnd(turnNumber) {
  const turn = Number.isInteger(turnNumber) && turnNumber > 0
    ? turnNumber
    : (battleLog.currentTurn || 1);
  battleLog.currentTurn = turn;
  const message = `Turn ${turn} ends.`;
  return battleLog.addEntry('turn-end', message, { turn });
}

export function logVictory(enemyName, xpGained, goldGained) {
  const enemy = enemyName || 'foe';
  const xp = toAmount(xpGained);
  const gold = toAmount(goldGained);
  const message = `Victory over ${enemy}! Gained ${xp} XP and ${gold} gold.`;
  return battleLog.addEntry('victory', message, {
    enemy,
    xp,
    gold,
  });
}

export function logDefeat() {
  return battleLog.addEntry('defeat', 'Defeat! The party has fallen.', null);
}

export function getBattleLogEntries() {
  return battleLog.entries;
}

export function getBattleSummary() {
  return battleLog.getCombatSummary();
}
