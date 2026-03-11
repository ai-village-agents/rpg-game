/**
 * Status Effect UI Display — AI Village RPG
 * Owner: Claude Sonnet 4.6
 *
 * Provides visual badge/icon rendering for active status effects
 * in the combat HUD. Works for both player and enemy combatants.
 *
 * Supports all effect types from src/combat/status-effects.js:
 *   Damage-over-time: poison, burn
 *   Control:          stun, sleep
 *   Heals:            regen
 *   Buffs:            atk-up, def-up, spd-up
 *   Debuffs:          atk-down, def-down, spd-down
 */

// ── Effect metadata: icon (emoji), CSS class, display label ──────────

export const STATUS_EFFECT_META = {
  poison:    { icon: '☠',  cssClass: 'se-poison',   label: 'Poison',   category: 'debuff-dot' },
  burn:      { icon: '🔥', cssClass: 'se-burn',     label: 'Burn',     category: 'debuff-dot' },
  stun:      { icon: '💫', cssClass: 'se-stun',     label: 'Stun',     category: 'debuff-ctrl' },
  sleep:     { icon: '💤', cssClass: 'se-sleep',    label: 'Sleep',    category: 'debuff-ctrl' },
  regen:     { icon: '💚', cssClass: 'se-regen',    label: 'Regen',    category: 'buff' },
  'atk-up':  { icon: '⚔',  cssClass: 'se-atk-up',  label: 'ATK↑',    category: 'buff' },
  'def-up':  { icon: '🛡', cssClass: 'se-def-up',  label: 'DEF↑',    category: 'buff' },
  'spd-up':  { icon: '💨', cssClass: 'se-spd-up',  label: 'SPD↑',    category: 'buff' },
  'atk-down':{ icon: '💢', cssClass: 'se-atk-down',label: 'ATK↓',    category: 'debuff' },
  'def-down':{ icon: '🩹', cssClass: 'se-def-down',label: 'DEF↓',    category: 'debuff' },
  'spd-down':{ icon: '🐌', cssClass: 'se-spd-down',label: 'SPD↓',    category: 'debuff' },
  freeze:    { icon: '❄️', cssClass: 'se-freeze',  label: 'Freeze',  category: 'debuff-ctrl' },
  bleed:     { icon: '🩸', cssClass: 'se-bleed',   label: 'Bleed',   category: 'debuff-dot' },
  blind:     { icon: '🌑', cssClass: 'se-blind',   label: 'Blind',   category: 'debuff-ctrl' },
  silence:   { icon: '🔇', cssClass: 'se-silence', label: 'Silence', category: 'debuff-ctrl' },
  curse:     { icon: '💀', cssClass: 'se-curse',   label: 'Curse',   category: 'debuff' },
};

// ── Pure utility functions ────────────────────────────────────────────

/**
 * Get metadata for a status effect type.
 * Returns a fallback if the type is unknown.
 * @param {string} type
 * @returns {{ icon: string, cssClass: string, label: string, category: string }}
 */
export function getStatusEffectMeta(type) {
  return STATUS_EFFECT_META[type] ?? {
    icon: '❓',
    cssClass: 'se-unknown',
    label: type,
    category: 'unknown',
  };
}

/**
 * Build a tooltip string for a status effect badge.
 * @param {{ type: string, name: string, duration: number, power?: number }} effect
 * @returns {string}
 */
export function buildEffectTooltip(effect) {
  const meta = getStatusEffectMeta(effect.type);
  const parts = [`${meta.label} (${effect.duration} turn${effect.duration !== 1 ? 's' : ''})`];
  if (effect.power && effect.power > 0) {
    const isDot = meta.category === 'debuff-dot';
    const isHot = effect.type === 'regen';
    if (isDot) parts.push(`-${effect.power} HP/turn`);
    else if (isHot) parts.push(`+${effect.power} HP/turn`);
  }
  return parts.join(' · ');
}

/**
 * Render HTML for a single status effect badge.
 * @param {{ type: string, name: string, duration: number, power?: number }} effect
 * @returns {string} HTML string
 */
export function renderStatusBadge(effect) {
  const meta = getStatusEffectMeta(effect.type);
  const tooltip = buildEffectTooltip(effect);
  return (
    `<span class="status-badge ${meta.cssClass}" title="${escapeHtml(tooltip)}">` +
    `<span class="status-badge-icon">${meta.icon}</span>` +
    `<span class="status-badge-label">${escapeHtml(meta.label)}</span>` +
    `<span class="status-badge-duration">${effect.duration}</span>` +
    `</span>`
  );
}

/**
 * Render HTML for all active status effect badges on a combatant.
 * Returns an empty string if there are no active effects.
 * @param {Array<{ type: string, name: string, duration: number, power?: number }>} statusEffects
 * @returns {string} HTML string
 */
export function renderStatusEffects(statusEffects) {
  const effects = statusEffects ?? [];
  if (effects.length === 0) return '<span class="status-none">—</span>';
  return effects.map(renderStatusBadge).join('');
}

/**
 * Render a full status effects row for a combatant card in the combat HUD.
 * Includes the label and the badges in a container.
 * @param {Array<{ type: string, name: string, duration: number, power?: number }>} statusEffects
 * @returns {string} HTML string (two <div> elements for use in a .kv grid)
 */
export function renderStatusEffectsRow(statusEffects) {
  const badgesHtml = renderStatusEffects(statusEffects);
  return `<div class="status-row-label">Status</div><div class="status-badges-container">${badgesHtml}</div>`;
}

/**
 * Get the CSS styles needed for status effect badges.
 * Call once and inject into a <style> tag.
 * @returns {string}
 */
export function getStatusEffectStyles() {
  return `
/* ── Status Effect Badges ─────────────────────────────────── */
.status-badges-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  min-height: 24px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 5px;
  border-radius: 10px;
  font-size: 0.72em;
  font-weight: bold;
  cursor: default;
  border: 1px solid rgba(255,255,255,0.25);
  white-space: nowrap;
  user-select: none;
}

.status-badge-icon { font-size: 1.1em; line-height: 1; }
.status-badge-label { font-size: 0.95em; }
.status-badge-duration {
  font-size: 0.85em;
  opacity: 0.85;
  min-width: 12px;
  text-align: right;
}

.status-none {
  color: #888;
  font-size: 0.85em;
}

/* Category colours */
.se-poison   { background: #4a1a6a; color: #d97eff; border-color: #8a3abf; }
.se-burn     { background: #6a2a00; color: #ff9050; border-color: #bf5a20; }
.se-stun     { background: #5a5a00; color: #ffff60; border-color: #a0a000; }
.se-sleep    { background: #1a2a5a; color: #a0c0ff; border-color: #4060a0; }
.se-regen    { background: #0a4a1a; color: #60e880; border-color: #2a8a40; }
.se-atk-up   { background: #6a1a1a; color: #ff8080; border-color: #c04040; }
.se-def-up   { background: #1a3a6a; color: #80a0ff; border-color: #3060c0; }
.se-spd-up   { background: #1a4a4a; color: #60e0e0; border-color: #2090a0; }
.se-atk-down { background: #3a2a1a; color: #c09060; border-color: #806040; }
.se-def-down { background: #2a2a3a; color: #a0a0c0; border-color: #606080; }
.se-spd-down { background: #2a3a2a; color: #90b090; border-color: #508050; }
.se-unknown  { background: #2a2a2a; color: #c0c0c0; border-color: #606060; }

.status-row-label {
  grid-column: 1;
  color: #aaa;
  font-size: 0.9em;
  padding-top: 3px;
  white-space: nowrap;
}
`;
}

// ── Internal helpers ─────────────────────────────────────────────────

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
