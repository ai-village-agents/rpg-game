/**
 * Combat Log Formatter Module
 * Classifies and formats combat log entries with icons and colors
 * for improved readability during gameplay.
 */

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Log entry type definitions with icons and CSS classes
 */
const LOG_TYPES = {
  'defeat':          { icon: '\u{1F480}', cssClass: 'log-defeat' },
  'victory':         { icon: '\u{1F3C6}', cssClass: 'log-victory' },
  'flee':            { icon: '\u{1F3C3}', cssClass: 'log-flee' },
  'healing':         { icon: '\u{1F49A}', cssClass: 'log-healing' },
  'shield':          { icon: '\u{1F6E1}', cssClass: 'log-shield' },
  'companion':       { icon: '\u{1F91D}', cssClass: 'log-companion' },
  'item':            { icon: '\u{1F9EA}', cssClass: 'log-item' },
  'status-effect':   { icon: '\u26A1',    cssClass: 'log-status' },
  'damage-dealt':    { icon: '\u2694\uFE0F', cssClass: 'log-damage-dealt' },
  'damage-received': { icon: '\u{1F4A5}', cssClass: 'log-damage-received' },
  'ability':         { icon: '\u2728',    cssClass: 'log-ability' },
  'info':            { icon: '\u{1F4CB}', cssClass: 'log-info' }
};

/**
 * Player-context patterns that indicate the player is dealing damage
 */
const PLAYER_DAMAGE_PATTERNS = [
  /^you\b/i,
  /^player\b/i,
  /^your\b/i
];

/**
 * Classify a combat log entry by its content
 * @param {string} line - Raw log text
 * @returns {{ type: string, icon: string, cssClass: string }}
 */
export function classifyLogEntry(line) {
  if (typeof line !== 'string') {
    return { type: 'info', ...LOG_TYPES['info'] };
  }

  const lower = line.toLowerCase();

  // Defeat / death
  if (/\bdefeat(ed)?\b|\bslain\b|\bdied\b|\bhas been defeated\b|\bfallen\b|\bkilled\b/i.test(lower)) {
    // Check if it's the player being defeated or the enemy
    if (/^you\b|^player\b|^your\b/i.test(lower) && /\bdefeat|slain|died|fallen/i.test(lower)) {
      return { type: 'defeat', ...LOG_TYPES['defeat'] };
    }
    // Enemy defeated = victory
    if (/\bdefeated\b|\bslain\b|\bvanquished\b/i.test(lower) && !/^you\b/i.test(lower)) {
      return { type: 'victory', ...LOG_TYPES['victory'] };
    }
    return { type: 'defeat', ...LOG_TYPES['defeat'] };
  }

  // Victory / level up
  if (/\bvictory\b|\bwon\b|\bvanquish/i.test(lower) || /\blevel up\b|\bleveled up\b/i.test(lower)) {
    return { type: 'victory', ...LOG_TYPES['victory'] };
  }

  // Flee / escape
  if (/\bflee\b|\bfled\b|\bescaped?\b|\bran away\b|\bretreated?\b/i.test(lower)) {
    return { type: 'flee', ...LOG_TYPES['flee'] };
  }

  // Companion (checked before healing so "ally heals" is classified as companion)
  if (/\bcompanion\b|\bally\b|\ballies\b/i.test(lower)) {
    return { type: 'companion', ...LOG_TYPES['companion'] };
  }

  // Healing
  if (/\bheal[s]?\b|\brestored?\b|\bregenerat/i.test(lower) || /\brecover[s]?\b/i.test(lower)) {
    return { type: 'healing', ...LOG_TYPES['healing'] };
  }

  // Shield / break
  if (/\bshield\b|\bbreak\b|\bshatter/i.test(lower) || /\bblock(ed|s)?\b/i.test(lower)) {
    return { type: 'shield', ...LOG_TYPES['shield'] };
  }

  // Item / potion use
  if (/\bpotion\b|\buses?\b.*\bitem\b|\bconsum/i.test(lower) || /\bdrink[s]?\b.*\bpotion\b/i.test(lower)) {
    return { type: 'item', ...LOG_TYPES['item'] };
  }

  // Status effects
  if (/\bpoison(ed)?\b|\bburn(ed|ing|s)?\b|\bstun(ned|s)?\b|\bfroz(en|e)\b|\bbleed(ing|s)?\b|\bstatus\b|\bweaken/i.test(lower)) {
    return { type: 'status-effect', ...LOG_TYPES['status-effect'] };
  }

  // Ability / spell (checked before damage so "special attack" -> ability)
  if (/\bcasts?\b|\bability\b|\bspell\b|\bspecial\b|\bpower\b/i.test(lower)) {
    return { type: 'ability', ...LOG_TYPES['ability'] };
  }

  // Damage - determine if dealt or received
  if (/\battack[s]?\b|\bstrike[s]?\b|\bhit[s]?\b|\bdeal[s]?\b|\bdamage\b/i.test(lower)) {
    // Check if player is dealing damage
    const isPlayerAction = PLAYER_DAMAGE_PATTERNS.some(p => p.test(lower));
    if (isPlayerAction) {
      return { type: 'damage-dealt', ...LOG_TYPES['damage-dealt'] };
    }
    return { type: 'damage-received', ...LOG_TYPES['damage-received'] };
  }

  // Default
  return { type: 'info', ...LOG_TYPES['info'] };
}

/**
 * Format a single log entry as HTML with icon and styling
 * @param {string} line - Raw log text
 * @returns {string} HTML string
 */
export function formatLogEntryHtml(line) {
  const { icon, cssClass } = classifyLogEntry(line);
  const escaped = escapeHtml(line);
  return `<div class="logLine ${cssClass}"><span class="log-icon">${icon}</span> ${escaped}</div>`;
}

/**
 * Render a formatted combat log from an array of log entries
 * @param {string[]} logEntries - Array of log strings (newest first)
 * @param {number} maxEntries - Maximum entries to render (default 50)
 * @returns {string} HTML string of all formatted entries
 */
export function renderFormattedLog(logEntries, maxEntries = 50) {
  if (!Array.isArray(logEntries)) return '';
  return logEntries
    .slice(0, maxEntries)
    .map(line => formatLogEntryHtml(line))
    .join('');
}

/**
 * Get CSS styles for the formatted combat log
 * @returns {string} CSS string
 */
export function getLogStyles() {
  return `
    .log-damage-dealt { color: #4CAF50; }
    .log-damage-received { color: #f44336; }
    .log-healing { color: #2196F3; }
    .log-status { color: #FF9800; }
    .log-shield { color: #9C27B0; }
    .log-ability { color: #E91E63; }
    .log-flee { color: #FFC107; }
    .log-victory { color: #FFD700; font-weight: bold; }
    .log-defeat { color: #B71C1C; font-weight: bold; }
    .log-companion { color: #00BCD4; }
    .log-item { color: #8BC34A; }
    .log-info { color: #9E9E9E; }
    .log-icon {
      margin-right: 6px;
      font-size: 0.9em;
      display: inline-block;
      width: 1.2em;
      text-align: center;
    }
    .logLine {
      padding: 3px 4px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      transition: background 0.2s;
    }
    .logLine:hover {
      background: rgba(255,255,255,0.05);
    }
  `;
}
