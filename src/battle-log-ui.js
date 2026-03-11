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

export function renderBattleLogPanel(entries, maxVisible = 8) {
  const list = Array.isArray(entries) ? entries : [];
  const latestTurn = list.reduce((max, entry) => Math.max(max, entry?.turn ?? 0), 0);
  const visible = list.slice(-Math.max(1, maxVisible)).reverse();

  const rows = visible.map((entry) => {
    const icon = ICONS[entry.type] ?? '•';
    const message = escapeHtml(entry.message ?? '');
    const turn = entry.turn ?? 0;
    const timestamp = typeof entry.timestamp === 'number'
      ? new Date(entry.timestamp).toLocaleTimeString()
      : '';

    return `
      <div class="battle-log-entry">
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
  }).join('');

  const content = rows || '<div class="battle-log-empty">No events recorded.</div>';

  return `
    <div class="battle-log-panel">
      <div class="battle-log-header">
        <div class="battle-log-title">Combat Log</div>
        <div class="battle-log-turn">Turn ${latestTurn}</div>
      </div>
      <div class="battle-log-entries">
        ${content}
      </div>
    </div>
  `;
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
  `;
}
