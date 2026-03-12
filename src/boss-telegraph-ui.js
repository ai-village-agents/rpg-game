import { predictEnemyTelegraph, getBossPhaseWarning, URGENCY_LEVELS } from './boss-telegraph.js';

function esc(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function getBossTelegraphStyles() {
  return `
    .boss-telegraph-panel {
      background: #1a1a2e;
      border: 2px solid #4a4a8e;
      border-radius: 8px;
      padding: 12px;
      margin-top: 8px;
      font-family: monospace;
      position: relative;
    }
    .telegraph-urgency-low { border-color: #4CAF50; }
    .telegraph-urgency-medium { border-color: #FFC107; }
    .telegraph-urgency-high { border-color: #FF9800; }
    .telegraph-urgency-extreme {
      border-color: #f44336;
      animation: telegraph-pulse 1.4s ease-in-out infinite;
    }
    @keyframes telegraph-pulse {
      0%, 100% { box-shadow: none; }
      50% { box-shadow: 0 0 8px #f44336; }
    }
    @media (prefers-reduced-motion: reduce) {
      .telegraph-urgency-extreme { animation: none; }
    }
    .telegraph-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .telegraph-icon { font-size: 1.8em; }
    .telegraph-label { font-weight: bold; font-size: 1.0em; color: #eee; }
    .telegraph-description { font-size: 0.85em; color: #bbb; margin-top: 4px; }
    .telegraph-phase-warning {
      background: rgba(255,200,0,0.15);
      border: 1px solid #FFC107;
      border-radius: 4px;
      padding: 6px;
      margin-top: 8px;
      font-size: 0.85em;
      color: #FFC107;
    }
    .boss-phase-bar-container { margin-top: 8px; }
    .boss-phase-bar-bg {
      height: 8px;
      background: #33334a;
      border-radius: 4px;
      overflow: hidden;
      position: relative;
    }
    .boss-phase-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #f44336, #FF9800);
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    .boss-phase-marker {
      position: absolute;
      top: 0;
      width: 2px;
      height: 100%;
      background: #FFC107;
      opacity: 0.8;
    }
    .telegraph-urgency-badge {
      display: inline-block;
      font-size: 0.75em;
      padding: 2px 8px;
      border-radius: 10px;
      margin-left: 8px;
      font-weight: bold;
    }
  `;
}

function getUrgencyBadge(urgency) {
  const palette = {
    [URGENCY_LEVELS.LOW]: { bg: '#4CAF5033', color: '#4CAF50' },
    [URGENCY_LEVELS.MEDIUM]: { bg: '#FFC10733', color: '#FFC107' },
    [URGENCY_LEVELS.HIGH]: { bg: '#FF980033', color: '#FF9800' },
    [URGENCY_LEVELS.EXTREME]: { bg: '#f4433633', color: '#f44336' },
  };
  const styles = palette[urgency] ?? palette[URGENCY_LEVELS.MEDIUM];
  return `<span class="telegraph-urgency-badge" style="background:${styles.bg};color:${styles.color};">${esc(String(urgency).toUpperCase())}</span>`;
}

function renderBossPhaseInfo(enemy) {
  if (!enemy?.isBoss) return '';
  const phases = Array.isArray(enemy.phases) ? enemy.phases : [];
  if (!phases.length) return '';
  const currentPhase = enemy.currentPhase ?? 1;
  const currentPhaseInfo = phases.find((phase) => phase.phase === currentPhase) ?? phases[0];
  const phaseName = currentPhaseInfo?.name ?? 'Unknown';
  const totalPhases = phases.length;

  const hpValue = enemy.hp ?? enemy.currentHp ?? 0;
  const maxHp = enemy.maxHp ?? 1;
  const hpPercent = maxHp > 0 ? (hpValue / maxHp) * 100 : 0;
  const markers = phases
    .map((phase) => `<div class="boss-phase-marker" style="left:${Math.round(phase.hpThreshold * 100)}%"></div>`)
    .join('');

  const phaseWarning = getBossPhaseWarning(enemy);

  return `
    <div class="boss-phase-info">Phase ${esc(String(currentPhase))} of ${esc(String(totalPhases))}: ${esc(phaseName)}</div>
    <div class="boss-phase-bar-container">
      <div style="font-size:0.75em;color:#bbb;margin-bottom:4px;">Boss HP</div>
      <div class="boss-phase-bar-bg">
        <div class="boss-phase-bar-fill" style="width:${Math.max(0, Math.min(100, hpPercent)).toFixed(1)}%"></div>
        ${markers}
      </div>
    </div>
    ${phaseWarning ? `<div class="telegraph-phase-warning">⚠️ ${esc(phaseWarning.message)}</div>` : ''}
  `;
}

export function renderBossTelegraphPanel(state) {
  if (state?.phase !== 'player-turn') return '';
  if (!state.enemy || state.enemy.hp <= 0) return '';

  const telegraph = predictEnemyTelegraph(state.enemy, state.rngSeed ?? 1);
  if (!telegraph) return '';

  const urgencyClass = `telegraph-urgency-${telegraph.urgency}`;
  const urgencyBadge = getUrgencyBadge(telegraph.urgency);

  return `
    <div class="boss-telegraph-panel ${urgencyClass}">
      <div class="telegraph-header">
        <div class="telegraph-icon">🔮</div>
        <div class="telegraph-label">Enemy Intent</div>
        ${urgencyBadge}
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <div class="telegraph-icon">${esc(telegraph.icon)}</div>
        <div class="telegraph-label">${esc(telegraph.label)}</div>
      </div>
      <div class="telegraph-description">${esc(telegraph.description)}</div>
      ${renderBossPhaseInfo(state.enemy)}
    </div>
  `;
}
