/**
 * Party System UI
 * Display party members, formations, and management
 */

import {
  PARTY_ROLES,
  FORMATIONS,
  SYNERGIES,
  getPartySummary,
  getPartyBuffs,
  getPartyLeader,
  getMembersByRole,
  isPartyReady
} from './party-system.js';

// HTML escape utility
function escapeHtml(text) {
  if (typeof text !== 'string') return String(text);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Format health bar
function formatHealthBar(current, max, width = 100) {
  const percent = max > 0 ? Math.round((current / max) * 100) : 0;
  const fillWidth = Math.round((percent / 100) * width);

  let color = '#4CAF50';
  if (percent < 25) color = '#f44336';
  else if (percent < 50) color = '#FFC107';

  return `
    <div class="health-bar" style="width: ${width}px">
      <div class="health-fill" style="width: ${fillWidth}px; background: ${color}"></div>
      <span class="health-text">${current}/${max}</span>
    </div>
  `;
}

// Render party member card
export function renderPartyMemberCard(member, isLeader = false) {
  const role = PARTY_ROLES[member.role];
  const roleIcon = role?.icon || '❓';
  const roleName = role?.name || 'Unassigned';

  const hpBar = formatHealthBar(member.stats.hp, member.stats.maxHp);
  const mpBar = formatHealthBar(member.stats.mp, member.stats.maxMp, 60);

  return `
    <div class="party-member-card ${member.stats.hp <= 0 ? 'dead' : ''}" data-member-id="${escapeHtml(member.id)}">
      <div class="member-header">
        <span class="member-name">${escapeHtml(member.name)}</span>
        ${isLeader ? '<span class="leader-badge">👑</span>' : ''}
      </div>
      <div class="member-class">
        Lv.${member.level} ${escapeHtml(member.classType)}
      </div>
      <div class="member-role">
        <span class="role-icon">${roleIcon}</span>
        <span class="role-name">${escapeHtml(roleName)}</span>
      </div>
      <div class="member-stats">
        <div class="stat-row">
          <span class="stat-label">HP</span>
          ${hpBar}
        </div>
        <div class="stat-row">
          <span class="stat-label">MP</span>
          ${mpBar}
        </div>
      </div>
      <div class="member-attributes">
        <span class="attr">ATK: ${member.stats.attack}</span>
        <span class="attr">DEF: ${member.stats.defense}</span>
        <span class="attr">SPD: ${member.stats.speed}</span>
      </div>
    </div>
  `;
}

// Render party roster
export function renderPartyRoster(state) {
  if (state.members.length === 0) {
    return `
      <div class="party-roster empty">
        <p class="empty-message">No party members</p>
        <p class="empty-hint">Add members to form a party</p>
      </div>
    `;
  }

  const memberCards = state.members.map(member =>
    renderPartyMemberCard(member, member.id === state.leader)
  ).join('');

  return `
    <div class="party-roster">
      <div class="roster-header">
        <span class="roster-title">Party Members</span>
        <span class="roster-count">${state.members.length}/${state.maxSize}</span>
      </div>
      <div class="member-cards">
        ${memberCards}
      </div>
    </div>
  `;
}

// Render formation grid
export function renderFormationGrid(state) {
  const formation = FORMATIONS[state.formation];
  if (!formation) {
    return '<div class="formation-grid error">Invalid formation</div>';
  }

  // Create a 3x3 grid
  const grid = Array(3).fill(null).map(() => Array(3).fill(null));

  // Place members in grid
  for (const member of state.members) {
    if (member.position) {
      const { row, col } = member.position;
      if (row >= 0 && row < 3 && col >= 0 && col < 3) {
        grid[row][col] = member;
      }
    }
  }

  const gridHtml = grid.map((row, rowIndex) => {
    const cells = row.map((cell, colIndex) => {
      if (cell) {
        const role = PARTY_ROLES[cell.role];
        return `
          <div class="formation-cell occupied" data-row="${rowIndex}" data-col="${colIndex}">
            <span class="cell-icon">${role?.icon || '👤'}</span>
            <span class="cell-name">${escapeHtml(cell.name.substring(0, 6))}</span>
          </div>
        `;
      }
      return `
        <div class="formation-cell empty" data-row="${rowIndex}" data-col="${colIndex}">
          <span class="cell-empty">+</span>
        </div>
      `;
    }).join('');

    return `<div class="formation-row">${cells}</div>`;
  }).join('');

  return `
    <div class="formation-grid">
      <div class="formation-header">
        <span class="formation-name">${escapeHtml(formation.name)} Formation</span>
      </div>
      <div class="formation-cells">
        ${gridHtml}
      </div>
      <div class="formation-legend">
        <span class="legend-front">Front</span>
        <span class="legend-back">Back</span>
      </div>
    </div>
  `;
}

// Render formation selector
export function renderFormationSelector(state) {
  const options = Object.entries(FORMATIONS).map(([key, formation]) => {
    const isActive = key === state.formation;
    const bonuses = Object.entries(formation.bonuses)
      .map(([stat, value]) => {
        const sign = value >= 0 ? '+' : '';
        return `${stat}: ${sign}${Math.round(value * 100)}%`;
      })
      .join(', ');

    return `
      <div class="formation-option ${isActive ? 'active' : ''}" data-formation="${escapeHtml(key)}">
        <div class="formation-option-name">${escapeHtml(formation.name)}</div>
        <div class="formation-option-bonuses">${escapeHtml(bonuses)}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="formation-selector">
      <div class="selector-header">Select Formation</div>
      <div class="formation-options">
        ${options}
      </div>
    </div>
  `;
}

// Render role assignment
export function renderRoleAssignment(state) {
  const roleOptions = Object.entries(PARTY_ROLES).map(([key, role]) => {
    const members = getMembersByRole(state, key);
    return `
      <div class="role-row">
        <div class="role-info">
          <span class="role-icon">${role.icon}</span>
          <span class="role-name">${escapeHtml(role.name)}</span>
        </div>
        <div class="role-members">
          ${members.length > 0 ?
            members.map(m => `<span class="role-member">${escapeHtml(m.name)}</span>`).join('') :
            '<span class="no-members">None</span>'
          }
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="role-assignment">
      <div class="assignment-header">Role Assignment</div>
      <div class="role-rows">
        ${roleOptions}
      </div>
    </div>
  `;
}

// Render synergies
export function renderPartySynergies(state) {
  if (state.activeSynergies.length === 0) {
    return `
      <div class="party-synergies empty">
        <span class="no-synergies">No active synergies</span>
      </div>
    `;
  }

  const synergyItems = state.activeSynergies.map(synergyId => {
    const synergy = SYNERGIES[synergyId];
    if (!synergy) return '';

    const bonuses = Object.entries(synergy.bonus)
      .map(([stat, value]) => `+${Math.round(value * 100)}% ${stat}`)
      .join(', ');

    return `
      <div class="synergy-item">
        <span class="synergy-name">${escapeHtml(synergy.name)}</span>
        <span class="synergy-bonus">${escapeHtml(bonuses)}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="party-synergies">
      <div class="synergies-header">Active Synergies</div>
      <div class="synergy-list">
        ${synergyItems}
      </div>
    </div>
  `;
}

// Render party buffs
export function renderPartyBuffs(state) {
  const buffs = getPartyBuffs(state);

  if (buffs.length === 0) {
    return '<div class="party-buffs empty">No active buffs</div>';
  }

  const buffItems = buffs.map(buff => {
    const remainingSec = Math.ceil(buff.remainingTime / 1000);
    return `
      <div class="buff-item">
        <span class="buff-name">${escapeHtml(buff.name)}</span>
        <span class="buff-timer">${remainingSec}s</span>
      </div>
    `;
  }).join('');

  return `
    <div class="party-buffs">
      <div class="buffs-header">Party Buffs</div>
      <div class="buff-list">
        ${buffItems}
      </div>
    </div>
  `;
}

// Render party status bar
export function renderPartyStatusBar(state) {
  const summary = getPartySummary(state);
  const ready = isPartyReady(state);

  return `
    <div class="party-status-bar ${ready.ready ? 'ready' : 'not-ready'}">
      <div class="status-left">
        <span class="party-size">${summary.memberCount}/${summary.maxSize} Members</span>
        <span class="party-formation">${escapeHtml(summary.formationName)}</span>
      </div>
      <div class="status-center">
        <span class="avg-level">Avg Lv. ${summary.stats.avgLevel}</span>
      </div>
      <div class="status-right">
        <span class="ready-status">
          ${ready.ready ? '✅ Ready' : '❌ Not Ready'}
        </span>
      </div>
    </div>
  `;
}

// Render full party panel
export function renderPartyPanel(state) {
  return `
    <div class="party-panel">
      <div class="party-panel-header">
        <h2>⚔️ Party</h2>
      </div>
      ${renderPartyStatusBar(state)}
      <div class="party-panel-content">
        <div class="party-main">
          ${renderPartyRoster(state)}
        </div>
        <div class="party-sidebar">
          ${renderFormationGrid(state)}
          ${renderPartySynergies(state)}
          ${renderPartyBuffs(state)}
        </div>
      </div>
    </div>
  `;
}

// Render compact party display
export function renderCompactParty(state) {
  const memberIcons = state.members.map(member => {
    const role = PARTY_ROLES[member.role];
    const hpPercent = member.stats.maxHp > 0 ? Math.round((member.stats.hp / member.stats.maxHp) * 100) : 0;
    const isLow = hpPercent < 30;

    return `
      <div class="compact-member ${isLow ? 'low-hp' : ''}" title="${escapeHtml(member.name)}">
        <span class="compact-icon">${role?.icon || '👤'}</span>
        <span class="compact-hp">${hpPercent}%</span>
      </div>
    `;
  }).join('');

  return `
    <div class="compact-party">
      <div class="compact-members">
        ${memberIcons}
      </div>
      <div class="compact-empty">
        ${Array(state.maxSize - state.members.length).fill('<span class="empty-slot">+</span>').join('')}
      </div>
    </div>
  `;
}

// Generate party CSS styles
export function getPartyStyles() {
  return `
    .party-panel {
      background: #1a1a2e;
      border: 2px solid #16213e;
      border-radius: 8px;
      padding: 16px;
      color: #eee;
    }

    .party-panel-header h2 {
      margin: 0 0 16px 0;
      color: #fff;
      font-size: 1.5rem;
    }

    .party-status-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #16213e;
      border-radius: 6px;
      margin-bottom: 16px;
    }

    .party-status-bar.ready {
      border-left: 3px solid #4CAF50;
    }

    .party-status-bar.not-ready {
      border-left: 3px solid #f44336;
    }

    .party-member-card {
      background: #16213e;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 8px;
    }

    .party-member-card.dead {
      opacity: 0.5;
      filter: grayscale(70%);
    }

    .member-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .member-name {
      font-weight: bold;
      color: #fff;
    }

    .leader-badge {
      font-size: 1.2rem;
    }

    .member-class {
      color: #888;
      font-size: 0.9rem;
      margin-bottom: 8px;
    }

    .member-role {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
    }

    .role-icon {
      font-size: 1.2rem;
    }

    .health-bar {
      position: relative;
      height: 12px;
      background: #0f0f23;
      border-radius: 6px;
      overflow: hidden;
    }

    .health-fill {
      height: 100%;
      transition: width 0.3s;
    }

    .health-text {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 0.7rem;
      line-height: 12px;
      color: #fff;
      text-shadow: 1px 1px 1px #000;
    }

    .stat-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .stat-label {
      width: 25px;
      font-size: 0.8rem;
      color: #888;
    }

    .member-attributes {
      display: flex;
      gap: 12px;
      font-size: 0.8rem;
      color: #aaa;
      margin-top: 8px;
    }

    .formation-grid {
      background: #16213e;
      border-radius: 6px;
      padding: 12px;
    }

    .formation-cells {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .formation-row {
      display: flex;
      justify-content: center;
      gap: 4px;
    }

    .formation-cell {
      width: 60px;
      height: 60px;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .formation-cell.occupied {
      background: #2a2a4e;
      border: 1px solid #4a4a7e;
    }

    .formation-cell.empty {
      background: #0f0f23;
      border: 1px dashed #333;
      cursor: pointer;
    }

    .cell-icon {
      font-size: 1.5rem;
    }

    .cell-name {
      font-size: 0.7rem;
      color: #aaa;
    }

    .synergy-item {
      display: flex;
      justify-content: space-between;
      padding: 8px;
      background: #0f0f23;
      border-radius: 4px;
      margin-bottom: 4px;
    }

    .synergy-name {
      color: #8BC34A;
    }

    .synergy-bonus {
      color: #888;
      font-size: 0.9rem;
    }

    .formation-option {
      padding: 8px 12px;
      background: #0f0f23;
      border-radius: 4px;
      margin-bottom: 4px;
      cursor: pointer;
    }

    .formation-option.active {
      border: 1px solid #4CAF50;
      background: #1a2a1a;
    }

    .compact-party {
      display: flex;
      gap: 8px;
    }

    .compact-member {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4px;
      background: #16213e;
      border-radius: 4px;
    }

    .compact-member.low-hp {
      border: 1px solid #f44336;
    }

    .compact-hp {
      font-size: 0.7rem;
      color: #888;
    }

    .empty-slot {
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f0f23;
      border: 1px dashed #333;
      border-radius: 4px;
      color: #555;
    }
  `;
}
