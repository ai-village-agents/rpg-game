/**
 * Combat HP/MP Bar Rendering
 * Pure functions that return HTML/CSS strings for combat HUD bars.
 */

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function clamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function getHealthClass(percent) {
  if (percent > 60) return 'rpg-bar-fill--healthy';
  if (percent >= 30) return 'rpg-bar-fill--caution';
  return 'rpg-bar-fill--danger';
}

function getFillClass(colorScheme, percent) {
  switch (colorScheme) {
    case 'mana':
      return 'rpg-bar-fill--mana';
    case 'shield':
      return 'rpg-bar-fill--shield';
    case 'xp':
      return 'rpg-bar-fill--xp';
    case 'health':
    default:
      return getHealthClass(percent);
  }
}

/**
 * Render a single HP/MP bar.
 * @param {number} current - Current value
 * @param {number} max - Maximum value
 * @param {object} options - Rendering options
 * @returns {string} HTML string
 */
export function renderHpBar(current, max, options = {}) {
  const {
    label = '',
    showText = true,
    colorScheme = 'health',
    animate = true
  } = options;

  const safeMax = Number.isFinite(max) ? max : 0;
  const safeCurrent = Number.isFinite(current) ? current : 0;
  const percent = safeMax > 0 ? clamp((safeCurrent / safeMax) * 100, 0, 100) : 0;
  const fillClass = getFillClass(colorScheme, percent);
  const transitionStyle = animate ? '' : ' transition: none;';
  const text = showText ? `${safeCurrent} / ${safeMax}` : '';
  const labelHtml = label ? `<div class="rpg-bar-label">${escapeHtml(label)}</div>` : '';
  const textHtml = showText ? `<div class="rpg-bar-text">${escapeHtml(text)}</div>` : '';

  return `
    ${labelHtml}
    <div class="rpg-bar-container">
      <div class="rpg-bar-fill ${fillClass}" style="width: ${percent}%;${transitionStyle}"></div>
      ${textHtml}
    </div>
  `;
}

/**
 * Render HP/MP/Shield section for a combat entity.
 * @param {object} entity - Combat entity
 * @param {object} options - Rendering options
 * @returns {string} HTML string
 */
export function renderCombatHpSection(entity, options = {}) {
  if (!entity || typeof entity !== 'object') return '';

  const { isPlayer = false } = options;
  const wrapperClass = isPlayer ? 'combat-hp-section is-player' : 'combat-hp-section';

  let html = `<div class="${wrapperClass}">`;

  const hp = renderHpBar(entity.hp ?? 0, entity.maxHp ?? 0, {
    label: 'HP',
    colorScheme: 'health'
  });
  html += hp;

  if (entity.mp != null || entity.maxMp != null) {
    html += renderHpBar(entity.mp ?? 0, entity.maxMp ?? 0, {
      label: 'MP',
      colorScheme: 'mana'
    });
  }

  const shieldCurrent = entity.shield ?? entity.shields ?? null;
  const shieldMax = entity.maxShield ?? entity.maxShields ?? null;

  if (shieldCurrent != null || shieldMax != null) {
    html += renderHpBar(shieldCurrent ?? 0, shieldMax ?? 0, {
      label: 'Shield',
      colorScheme: 'shield'
    });
  }

  html += '</div>';
  return html;
}

/**
 * Get CSS styles for combat HP/MP bars.
 * @returns {string} CSS string
 */
export function getCombatHpBarStyles() {
  return `
    .rpg-bar-container {
      height: 22px;
      background: #333;
      border-radius: 4px;
      position: relative;
      overflow: hidden;
      margin: 4px 0;
    }
    .rpg-bar-fill {
      height: 100%;
      transition: width 0.4s ease;
      border-radius: 4px;
    }
    .rpg-bar-text {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      text-shadow: 0 1px 2px rgba(0,0,0,0.7);
      font-size: 0.85rem;
      font-weight: bold;
      pointer-events: none;
    }
    .rpg-bar-label {
      font-size: 0.75rem;
      color: #aaa;
      margin-bottom: 2px;
    }
    .rpg-bar-fill--healthy { background: #44bb44; }
    .rpg-bar-fill--caution { background: #ddaa00; }
    .rpg-bar-fill--danger {
      background: #dd4444;
      animation: rpg-danger-pulse 1.2s ease-in-out infinite;
    }
    .rpg-bar-fill--mana { background: #4488ff; }
    .rpg-bar-fill--shield { background: #ffcc00; }
    .rpg-bar-fill--xp { background: #aa66ff; }
    @keyframes rpg-danger-pulse {
      0%, 100% { filter: brightness(1); }
      50% { filter: brightness(1.15); }
    }
  `;
}
