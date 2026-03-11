/**
 * Status Effects Module — AI Village RPG
 * Owner: Claude Opus 4.6
 *
 * Handles all status effects:
 * - Damage-over-time: poison, burn, bleed
 * - Control: stun, sleep, freeze, blind, silence
 * - Buffs: atk-up, def-up, spd-up
 * - Debuffs: atk-down, def-down, spd-down, curse
 * - Regen: heal-over-time
 */

// ── Status Effect Class ──────────────────────────────────────────────

export class StatusEffect {
  /**
   * @param {Object} config
   * @param {string} config.type - Effect type (poison, stun, atk-up, etc.)
   * @param {string} config.name - Display name
   * @param {number} config.duration - Turns remaining
   * @param {number} [config.power] - Effect power (damage per tick, etc.)
   * @param {string} [config.source] - Who inflicted this effect
   */
  constructor({ type, name, duration, power = 0, source = '' }) {
    this.type = type;
    this.name = name ?? type;
    this.duration = duration;
    this.power = power;
    this.source = source;
  }
}

// ── Status Effect Definitions ────────────────────────────────────────

export const STATUS_TEMPLATES = {
  poison: { type: 'poison', name: 'Poison', duration: 3, power: 5 },
  burn: { type: 'burn', name: 'Burn', duration: 3, power: 4 },
  stun: { type: 'stun', name: 'Stun', duration: 1, power: 0 },
  sleep: { type: 'sleep', name: 'Sleep', duration: 2, power: 0 },
  regen: { type: 'regen', name: 'Regen', duration: 3, power: 5 },
  'atk-up': { type: 'atk-up', name: 'ATK Up', duration: 3, power: 0 },
  'atk-down': { type: 'atk-down', name: 'ATK Down', duration: 3, power: 0 },
  'def-up': { type: 'def-up', name: 'DEF Up', duration: 3, power: 0 },
  'def-down': { type: 'def-down', name: 'DEF Down', duration: 3, power: 0 },
  'spd-up': { type: 'spd-up', name: 'SPD Up', duration: 3, power: 0 },
  'spd-down': { type: 'spd-down', name: 'SPD Down', duration: 3, power: 0 },
  freeze: { type: 'freeze', name: 'Freeze', duration: 1, power: 0 },
  bleed: { type: 'bleed', name: 'Bleed', duration: 4, power: 3 },
  blind: { type: 'blind', name: 'Blind', duration: 2, power: 0 },
  silence: { type: 'silence', name: 'Silence', duration: 2, power: 0 },
  curse: { type: 'curse', name: 'Curse', duration: 3, power: 0 },
};

/**
 * Create a status effect from a template, with optional overrides.
 * @param {string} templateId - Key from STATUS_TEMPLATES
 * @param {Object} [overrides] - Optional overrides
 * @returns {StatusEffect}
 */
export function createStatusEffect(templateId, overrides = {}) {
  const template = STATUS_TEMPLATES[templateId];
  if (!template) return null;
  return new StatusEffect({ ...template, ...overrides });
}

// ── Apply Status Effects (start of turn) ─────────────────────────────

/**
 * Process all status effects on a combatant at the given timing.
 * @param {Object} state - combat state
 * @param {string} combatId - combatant ID
 * @param {string} timing - 'turn-start' or 'turn-end'
 * @returns {Object} updated state
 */
export function applyStatusEffects(state, combatId, timing = 'turn-start') {
  const combatant = state.allCombatants.find(c => c.combatId === combatId);
  if (!combatant) return state;

  const effects = combatant.statusEffects ?? [];
  let currentHp = combatant.hp;
  const log = [];

  for (const eff of effects) {
    if (timing === 'turn-start') {
      // Damage-over-time effects
      if (eff.type === 'poison') {
        const dmg = eff.power;
        currentHp = Math.max(0, currentHp - dmg);
        log.push(`${combatant.name} takes ${dmg} poison damage!`);
      }
      if (eff.type === 'burn') {
        const dmg = eff.power;
        currentHp = Math.max(0, currentHp - dmg);
        log.push(`${combatant.name} takes ${dmg} burn damage!`);
      }
      if (eff.type === 'bleed') {
        const dmg = eff.power;
        currentHp = Math.max(0, currentHp - dmg);
        log.push(`${combatant.name} is bleeding for ${dmg} damage!`);
      }
      // Regen
      if (eff.type === 'regen') {
        const heal = eff.power;
        currentHp = Math.min(combatant.maxHp, currentHp + heal);
        log.push(`${combatant.name} regenerates ${heal} HP!`);
      }

      // Decrement duration
      eff.duration = Math.max(0, eff.duration - 1);
    }
  }

  // Update HP
  state = {
    ...state,
    allCombatants: state.allCombatants.map(c =>
      c.combatId === combatId
        ? { ...c, hp: currentHp, statusEffects: effects }
        : c
    ),
  };

  // Add log messages
  for (const msg of log) {
    state = { ...state, log: [...state.log, msg].slice(-300) };
  }

  return state;
}

// ── Remove Expired Effects ───────────────────────────────────────────

export function removeExpiredEffects(state, combatId) {
  const combatant = state.allCombatants.find(c => c.combatId === combatId);
  if (!combatant) return state;

  const before = combatant.statusEffects ?? [];
  const after = before.filter(eff => eff.duration > 0);

  // Log removed effects
  const removed = before.filter(eff => eff.duration <= 0);
  for (const eff of removed) {
    state = { ...state, log: [...state.log, `${combatant.name}'s ${eff.name} wore off.`].slice(-300) };
  }

  return {
    ...state,
    allCombatants: state.allCombatants.map(c =>
      c.combatId === combatId ? { ...c, statusEffects: after } : c
    ),
  };
}

// ── Status Checks ────────────────────────────────────────────────────

export function isStunned(combatant) {
  return (combatant.statusEffects ?? []).some(e => e.type === 'stun');
}

export function isSleeping(combatant) {
  return (combatant.statusEffects ?? []).some(e => e.type === 'sleep');
}

export function isFrozen(combatant) {
  return (combatant.statusEffects ?? []).some(e => e.type === 'freeze');
}

export function isBlinded(combatant) {
  return (combatant.statusEffects ?? []).some(e => e.type === 'blind');
}

export function isSilenced(combatant) {
  return (combatant.statusEffects ?? []).some(e => e.type === 'silence');
}

export function isCursed(combatant) {
  return (combatant.statusEffects ?? []).some(e => e.type === 'curse');
}

export function hasEffect(combatant, effectType) {
  return (combatant.statusEffects ?? []).some(e => e.type === effectType);
}

/**
 * Get all active status effect names for display.
 */
export function getActiveEffectNames(combatant) {
  return (combatant.statusEffects ?? []).map(e => e.name);
}
