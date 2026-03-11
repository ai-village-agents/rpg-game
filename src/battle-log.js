/**
 * Battle Log
 * Tracks combat events with turn context and provides summary stats.
 */

const ENTRY_TYPES = new Set([
  'attack',
  'ability',
  'damage-dealt',
  'damage-received',
  'status-applied',
  'status-expired',
  'heal',
  'item-used',
  'turn-start',
  'turn-end',
  'victory',
  'defeat',
]);

function asNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value && typeof value === 'object') {
    if (typeof value.amount === 'number') return value.amount;
    if (typeof value.damage === 'number') return value.damage;
    if (typeof value.value === 'number') return value.value;
  }
  return 0;
}

function extractName(details, fallbackKey) {
  if (!details) return null;
  if (typeof details === 'string') return details;
  if (typeof details.name === 'string') return details.name;
  if (fallbackKey && typeof details[fallbackKey] === 'string') return details[fallbackKey];
  return null;
}

function pushUnique(list, value) {
  if (!value) return;
  if (!list.includes(value)) list.push(value);
}

export class BattleLog {
  constructor() {
    this.entries = [];
    this.currentTurn = 0;
  }

  startTurn(turnNumber) {
    const nextTurn = Number.isInteger(turnNumber) && turnNumber > 0
      ? turnNumber
      : this.currentTurn + 1;
    this.currentTurn = nextTurn;
    this.addEntry('turn-start', `Turn ${nextTurn} begins`, { turn: nextTurn });
    return nextTurn;
  }

  endTurn() {
    if (this.currentTurn <= 0) {
      this.currentTurn = 1;
    }
    this.addEntry('turn-end', `Turn ${this.currentTurn} ends`, { turn: this.currentTurn });
    return this.currentTurn;
  }

  addEntry(type, message, details = null) {
    if (!ENTRY_TYPES.has(type)) {
      throw new Error(`Invalid battle log entry type: ${type}`);
    }

    const entry = {
      timestamp: Date.now(),
      turn: this.currentTurn,
      type,
      message: message ?? '',
      details: details ?? null,
    };

    this.entries.push(entry);
    return entry;
  }

  getCombatSummary() {
    const summary = {
      totalTurns: this.#getTotalTurns(),
      totalDamageDealt: 0,
      totalDamageReceived: 0,
      totalHealingDone: 0,
      statusEffectsApplied: [],
      abilitiesUsed: [],
      itemsUsed: [],
    };

    for (const entry of this.entries) {
      switch (entry.type) {
        case 'attack':
        case 'damage-dealt':
          summary.totalDamageDealt += asNumber(entry.details);
          break;
        case 'damage-received':
          summary.totalDamageReceived += asNumber(entry.details);
          break;
        case 'heal':
          summary.totalHealingDone += asNumber(entry.details);
          break;
        case 'status-applied':
          pushUnique(summary.statusEffectsApplied, extractName(entry.details, 'status'));
          break;
        case 'ability':
          pushUnique(summary.abilitiesUsed, extractName(entry.details, 'ability'));
          break;
        case 'item-used':
          pushUnique(summary.itemsUsed, extractName(entry.details, 'item'));
          break;
        default:
          break;
      }
    }

    return summary;
  }

  clear() {
    this.entries = [];
    this.currentTurn = 0;
  }

  #getTotalTurns() {
    if (this.entries.length === 0) return this.currentTurn;
    const turnEntries = this.entries.filter((e) => e.type === 'turn-start' || e.type === 'turn-end');
    if (turnEntries.length === 0) return this.currentTurn;
    return Math.max(this.currentTurn, ...turnEntries.map((e) => e.turn || 0));
  }
}

export const battleLog = new BattleLog();
