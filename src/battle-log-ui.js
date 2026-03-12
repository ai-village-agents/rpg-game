/**
 * Battle Log UI Renderer
 * Provides HTML snippets for displaying recent combat log entries.
 */

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const ICONS = {
  'attack': '⚔️',
  'damage-dealt': '⚔️',
  'ability': '🔥',
  'damage-received': '💔',
  'heal': '💚',
  'status-applied': '💫',
  'status-expired': '💫',
  'item-used': '📦',
  'victory': '🏆',
  'defeat': '💀',
  'turn-start': '⏳',
  'turn-end': '⌛',
};

export const COLOR_MAP = {
  'attack': '#e05c5c',
  'damage-dealt': '#e05c5c',
  'damage-received': '#c0392b',
  'ability': '#5b8dee',
  'heal': '#27ae60',
  'status-applied': '#f39c12',
  'status-expired': '#7f8c8d',
  'item-used': '#16a085',
  'victory': '#f1c40f',
  'defeat': '#6c3a3a',
  'turn-start': '#555e6e',
  'turn-end': '#555e6e',
};

function asNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value && typeof value === 'object') {
    if (typeof value.amount === 'number') return value.amount;
    if (typeof value.damage === 'number') return value.damage;
    if (typeof value.value === 'number') return value.value;
  }
  return 0;
}

function renderEntry(entry) {
  const icon = ICONS[entry.type] ?? '•';
  const message = escapeHtml(entry.message ?? '');
  const turn = entry.turn ?? 0;
  const timestamp = typeof entry.timestamp === 'number'
    ? new Date(entry.timestamp).toLocaleTimeString()
    : '';
  const color = COLOR_MAP[entry.type] ?? '#5d6677';

  return `
    <div class="battle-log-entry" data-type="${escapeHtml(entry.type ?? '')}" style="border-left: 3px solid ${color};">
      <span class="entry-icon">${icon}</span>
      <div class="entry-body">
        <div class="entry-meta">
          <span class="entry-turn">Turn ${turn}</span>
          ${timestamp ? `<span class="entry-time">${escapeHtml(timestamp)}</span>` : ''}
        </div>
        <div class="entry-message">${message}</div>
      </div>
    </div>
  `;
}

function buildDamageSummary(list) {
  let dealt = 0;
  let received = 0;
  let healed = 0;

  for (const entry of list) {
    switch (entry?.type) {
      case 'attack':
      case 'damage-dealt':
        dealt += asNumber(entry.details);
        break;
      case 'damage-received':
        received += asNumber(entry.details);
        break;
      case 'heal':
        healed += asNumber(entry.details);
        break;
      default:
        break;
    }
  }

  if (dealt === 0 && received === 0 && healed === 0) return '';

  return `
    <div class="bl-damage-summary">
      <span class="bl-dmg-badge bl-dmg-dealt">Dealt ${dealt}</span>
      <span class="bl-dmg-badge bl-dmg-recv">Received ${received}</span>
      <span class="bl-dmg-badge bl-dmg-heal">Healed ${healed}</span>
    </div>
  `;
}

function groupEntriesByTurn(entries) {
  const grouped = new Map();
  for (const entry of entries) {
    const turn = Number.isInteger(entry?.turn) ? entry.turn : 0;
    if (!grouped.has(turn)) grouped.set(turn, []);
    grouped.get(turn).push(entry);
  }
  return new Map([...grouped.entries()].sort((a, b) => a[0] - b[0]));
}

export function renderBattleLogPanel(entries, maxVisibleOrOptions = 8) {
  const list = Array.isArray(entries) ? entries : [];
  const latestTurn = list.reduce((max, entry) => Math.max(max, entry?.turn ?? 0), 0);
  const options = typeof maxVisibleOrOptions === 'object' && maxVisibleOrOptions !== null
    ? maxVisibleOrOptions
    : { maxVisible: maxVisibleOrOptions };
  const {
    maxVisible = 8,
    grouped = false,
    showSummary = true,
    activeFilters = [],
  } = options;

  const summaryHtml = showSummary ? buildDamageSummary(list) : '';

  const filtered = Array.isArray(activeFilters) && activeFilters.length > 0
    ? list.filter((entry) => activeFilters.includes(entry?.type))
    : list;
  const limited = filtered.slice(-Math.max(1, maxVisible));

  let content = '';
  if (grouped) {
    const groupedEntries = groupEntriesByTurn(limited);
    content = [...groupedEntries.entries()].map(([turn, turnEntries]) => `
      <details class="bl-turn-group" open>
        <summary class="bl-turn-summary">Turn ${turn} · ${turnEntries.length}</summary>
        <div class="bl-turn-entries">
          ${turnEntries.map((entry) => renderEntry(entry)).join('')}
        </div>
      </details>
    `).join('');
  } else {
    const visible = [...limited].reverse();
    content = visible.map((entry) => renderEntry(entry)).join('');
  }

  const rows = content || '<div class="battle-log-empty">No events recorded.</div>';

  return `
    <div class="battle-log-panel">
      <div class="battle-log-header">
        <div class="battle-log-title">Combat Log</div>
        <div class="battle-log-turn">Turn ${latestTurn}</div>
      </div>
      ${summaryHtml}
      <div class="battle-log-entries">
        ${rows}
      </div>
    </div>
  `;
}

export function renderFilterBar(activeFilters = [], availableTypes = []) {
  const active = new Set(activeFilters);
  const buttons = availableTypes.map((type) => {
    const classes = ['bl-filter-btn'];
    if (active.has(type)) classes.push('bl-filter-active');
    return `<button class="${classes.join(' ')}" data-filter-type="${escapeHtml(type)}">${escapeHtml(type)}</button>`;
  }).join('');

  return `<div class="bl-filter-bar">${buttons}</div>`;
}

export function getBattleLogStyles() {
  return `
    .battle-log-panel {
      background: linear-gradient(145deg, rgba(10, 14, 24, 0.95), rgba(18, 24, 34, 0.9));
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 10px 12px;
      color: #e6e8ef;
      max-width: 520px;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
    }
    .battle-log-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: 12px;
      color: #8fb7ff;
      margin-bottom: 8px;
    }
    .battle-log-title {
      font-weight: 700;
    }
    .battle-log-turn {
      background: rgba(143, 183, 255, 0.12);
      color: #b8d4ff;
      padding: 2px 8px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 11px;
    }
    .battle-log-entries {
      max-height: 200px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding-right: 6px;
    }
    .battle-log-entry {
      display: grid;
      grid-template-columns: 22px 1fr;
      gap: 8px;
      padding: 6px 8px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.04);
      border-radius: 8px;
      align-items: center;
    }
    .battle-log-entry:hover {
      border-color: rgba(143, 183, 255, 0.35);
      background: rgba(143, 183, 255, 0.05);
    }
    .entry-icon {
      font-size: 16px;
      text-align: center;
    }
    .entry-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .entry-meta {
      display: flex;
      gap: 8px;
      font-size: 11px;
      color: #9fb4d1;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }
    .entry-message {
      font-size: 13px;
      line-height: 1.3;
    }
    .battle-log-empty {
      color: #7a8598;
      text-align: center;
      padding: 20px 0;
      font-size: 13px;
    }
    .bl-turn-group {
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 8px;
      margin-bottom: 4px;
    }
    .bl-turn-summary {
      cursor: pointer;
      padding: 5px 8px;
      font-size: 12px;
      color: #9fb4d1;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      list-style: none;
      user-select: none;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .bl-turn-summary::-webkit-details-marker {
      display: none;
    }
    .bl-turn-group[open] .bl-turn-summary {
      color: #8fb7ff;
    }
    .bl-turn-entries {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 6px 8px 8px;
    }
    .bl-damage-summary {
      display: flex;
      gap: 8px;
      padding: 4px 8px 8px;
      flex-wrap: wrap;
    }
    .bl-dmg-badge {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 999px;
      font-weight: 700;
    }
    .bl-dmg-dealt {
      background: rgba(224,92,92,0.15);
      color: #e05c5c;
    }
    .bl-dmg-recv {
      background: rgba(192,57,43,0.15);
      color: #e07070;
    }
    .bl-dmg-heal {
      background: rgba(39,174,96,0.15);
      color: #27ae60;
    }
    .bl-filter-btn {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.04);
      color: #9fb4d1;
      cursor: pointer;
    }
    .bl-filter-active {
      background: rgba(143,183,255,0.18);
      color: #8fb7ff;
      border-color: #8fb7ff;
    }
  `;
}
