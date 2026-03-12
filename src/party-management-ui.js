/**
 * Party Management UI Components
 * Renders party roster, formation, and member details
 */

import {
  PARTY_ROLES,
  FORMATION,
  PARTY_MEMBERS,
  MAX_PARTY_SIZE,
  getPartyMemberData,
  getPartySize,
  getAvailableSlots,
  getMembersByPosition,
  getActiveParty,
  getPartyBuffStats,
} from './party-management.js';

/**
 * Get CSS styles for party management UI
 * @returns {string} CSS styles
 */
export function getPartyStyles() {
  return `
.party-panel {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid #0f3460;
  border-radius: 10px;
  padding: 15px;
}

.party-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #333;
}

.party-header h2 {
  margin: 0;
  font-size: 18px;
  color: #e8e8e8;
}

.party-slots {
  font-size: 12px;
  color: #888;
}

.party-roster {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.party-member-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #333;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.party-member-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: #444;
}

.party-member-card.front-row {
  border-left: 3px solid #f88;
}

.party-member-card.back-row {
  border-left: 3px solid #88f;
}

.member-portrait {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2a2a4e 0%, #1a1a2e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  border: 2px solid #4a4a7e;
}

.member-info {
  flex: 1;
}

.member-name {
  font-size: 14px;
  font-weight: bold;
  color: #e8e8e8;
  margin-bottom: 2px;
}

.member-title {
  font-size: 11px;
  color: #888;
}

.member-role {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  text-transform: uppercase;
  margin-top: 4px;
}

.member-role.tank { background: rgba(255, 136, 136, 0.2); color: #f88; }
.member-role.dps { background: rgba(255, 200, 100, 0.2); color: #fc8; }
.member-role.healer { background: rgba(100, 255, 100, 0.2); color: #8f8; }
.member-role.support { background: rgba(136, 136, 255, 0.2); color: #88f; }

.member-stats {
  display: flex;
  gap: 15px;
}

.member-stat {
  text-align: center;
}

.stat-value {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
}

.stat-label {
  font-size: 10px;
  color: #666;
}

.member-hp-bar {
  width: 60px;
  height: 6px;
  background: #333;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 4px;
}

.member-hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #4a8 0%, #8f8 100%);
  transition: width 0.3s ease;
}

.member-hp-fill.low { background: linear-gradient(90deg, #a44 0%, #f88 100%); }
.member-hp-fill.medium { background: linear-gradient(90deg, #a84 0%, #fc8 100%); }

.member-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.member-btn {
  padding: 4px 8px;
  font-size: 10px;
  border: 1px solid #444;
  border-radius: 4px;
  background: rgba(100, 100, 100, 0.2);
  color: #aaa;
  cursor: pointer;
  transition: all 0.2s ease;
}

.member-btn:hover {
  background: rgba(100, 100, 100, 0.4);
  color: #fff;
}

.member-btn.dismiss { color: #f88; border-color: #a44; }
.member-btn.dismiss:hover { background: rgba(200, 100, 100, 0.3); }

/* Formation View */
.formation-container {
  padding: 15px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin-top: 15px;
}

.formation-title {
  font-size: 12px;
  color: #888;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.formation-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.formation-row {
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  min-height: 80px;
}

.formation-row.front { border-top: 2px solid #f88; }
.formation-row.back { border-top: 2px solid #88f; }

.formation-row-label {
  font-size: 10px;
  color: #666;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.formation-members {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.formation-member {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.formation-member:hover {
  background: rgba(255, 255, 255, 0.2);
}

.formation-member-icon {
  font-size: 16px;
}

/* Recruit Panel */
.recruit-panel {
  margin-top: 15px;
}

.recruit-title {
  font-size: 14px;
  color: #e8e8e8;
  margin-bottom: 10px;
}

.recruit-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recruit-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: rgba(100, 150, 200, 0.1);
  border: 1px solid #456;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.recruit-card:hover {
  background: rgba(100, 150, 200, 0.2);
  border-color: #68a;
}

.recruit-card.unavailable {
  opacity: 0.5;
  cursor: not-allowed;
}

.recruit-portrait {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(100, 100, 150, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.recruit-info {
  flex: 1;
}

.recruit-name {
  font-size: 13px;
  font-weight: bold;
  color: #ddd;
}

.recruit-desc {
  font-size: 10px;
  color: #888;
}

.recruit-btn {
  padding: 6px 12px;
  background: #4a8;
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 11px;
  cursor: pointer;
}

.recruit-btn:hover {
  background: #5b9;
}

.recruit-btn:disabled {
  background: #444;
  cursor: not-allowed;
}

/* Party Buffs */
.party-buffs {
  display: flex;
  gap: 6px;
  margin-top: 10px;
}

.party-buff {
  padding: 4px 8px;
  background: rgba(100, 200, 100, 0.2);
  border-radius: 4px;
  font-size: 11px;
  color: #8f8;
}

/* Level display */
.party-level {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 6px;
  margin-bottom: 15px;
}

.party-level-badge {
  font-size: 14px;
  font-weight: bold;
  color: #ffd700;
}

.party-xp-bar {
  flex: 1;
  height: 6px;
  background: #333;
  border-radius: 3px;
  overflow: hidden;
}

.party-xp-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd700 0%, #ffaa00 100%);
  transition: width 0.3s ease;
}
`;
}

/**
 * Render party roster panel
 * @param {Object} state - Party state
 * @returns {string} HTML string
 */
export function renderPartyPanel(state) {
  const size = getPartySize(state);
  const slots = getAvailableSlots(state);
  const xpPercent = (state.partyXp / (state.partyLevel * 100)) * 100;

  const membersHtml = state.members.map(member => 
    renderMemberCard(member, state)
  ).join('');

  const buffsHtml = state.partyBuffs.length > 0
    ? `<div class="party-buffs">${state.partyBuffs.map(b => 
        `<span class="party-buff">${escapeHtml(b.name || b.id)}</span>`
      ).join('')}</div>`
    : '';

  return `
    <div class="party-panel">
      <div class="party-header">
        <h2>\uD83D\uDC65 Party</h2>
        <div class="party-slots">${size}/${MAX_PARTY_SIZE - 1} members</div>
      </div>
      <div class="party-level">
        <span class="party-level-badge">Lv. ${state.partyLevel}</span>
        <div class="party-xp-bar">
          <div class="party-xp-fill" style="width: ${xpPercent}%"></div>
        </div>
      </div>
      ${buffsHtml}
      <div class="party-roster">
        ${membersHtml || '<div style="color: #888; text-align: center; padding: 20px;">No party members</div>'}
      </div>
    </div>
  `.trim();
}

/**
 * Render individual member card
 * @param {Object} member - Member instance
 * @param {Object} state - Party state
 * @returns {string} HTML string
 */
function renderMemberCard(member, state) {
  const data = getPartyMemberData(member.id);
  if (!data) return '';

  const position = state.formation[member.id] || FORMATION.BACK;
  const positionClass = position === FORMATION.FRONT ? 'front-row' : 'back-row';
  const hpPercent = (member.hp / member.maxHp) * 100;
  const hpClass = hpPercent < 25 ? 'low' : hpPercent < 50 ? 'medium' : '';

  return `
    <div class="party-member-card ${positionClass}" data-member="${escapeHtml(member.id)}">
      <div class="member-portrait">${escapeHtml(data.portrait)}</div>
      <div class="member-info">
        <div class="member-name">${escapeHtml(data.name)}</div>
        <div class="member-title">${escapeHtml(data.title)}</div>
        <span class="member-role ${data.role}">${data.role}</span>
      </div>
      <div class="member-stats">
        <div class="member-stat">
          <div class="stat-value">${member.stats.attack}</div>
          <div class="stat-label">ATK</div>
        </div>
        <div class="member-stat">
          <div class="stat-value">${member.stats.defense}</div>
          <div class="stat-label">DEF</div>
        </div>
        <div class="member-stat">
          <div class="stat-value">${member.hp}/${member.maxHp}</div>
          <div class="stat-label">HP</div>
          <div class="member-hp-bar">
            <div class="member-hp-fill ${hpClass}" style="width: ${hpPercent}%"></div>
          </div>
        </div>
      </div>
      <div class="member-actions">
        <button class="member-btn" data-action="swap" data-member="${escapeHtml(member.id)}">Swap</button>
        <button class="member-btn dismiss" data-action="dismiss" data-member="${escapeHtml(member.id)}">Dismiss</button>
      </div>
    </div>
  `;
}

/**
 * Render formation view
 * @param {Object} state - Party state
 * @returns {string} HTML string
 */
export function renderFormationView(state) {
  const frontMembers = getMembersByPosition(state, FORMATION.FRONT);
  const backMembers = getMembersByPosition(state, FORMATION.BACK);

  const renderFormationMember = (member) => {
    const data = getPartyMemberData(member.id);
    if (!data) return '';
    return `
      <div class="formation-member" data-member="${escapeHtml(member.id)}">
        <span class="formation-member-icon">${escapeHtml(data.portrait)}</span>
        <span>${escapeHtml(data.name)}</span>
      </div>
    `;
  };

  return `
    <div class="formation-container">
      <div class="formation-title">Formation</div>
      <div class="formation-grid">
        <div class="formation-row front">
          <div class="formation-row-label">\u2694\uFE0F Front Row</div>
          <div class="formation-members">
            ${frontMembers.map(renderFormationMember).join('') || '<span style="color: #666; font-size: 11px;">Empty</span>'}
          </div>
        </div>
        <div class="formation-row back">
          <div class="formation-row-label">\uD83D\uDEE1\uFE0F Back Row</div>
          <div class="formation-members">
            ${backMembers.map(renderFormationMember).join('') || '<span style="color: #666; font-size: 11px;">Empty</span>'}
          </div>
        </div>
      </div>
    </div>
  `.trim();
}

/**
 * Render recruit panel
 * @param {Object} state - Party state
 * @param {Object} gameState - Game state for availability checks
 * @returns {string} HTML string
 */
export function renderRecruitPanel(state, gameState = null) {
  const availableSlots = getAvailableSlots(state);
  
  const recruitCards = Object.values(PARTY_MEMBERS).map(member => {
    const isRecruited = state.recruited.includes(member.id);
    const isInParty = state.members.some(m => m.id === member.id);
    
    let available = true;
    let statusText = '';

    if (isInParty) {
      available = false;
      statusText = 'In Party';
    } else if (isRecruited && !isInParty) {
      statusText = 'Available';
    } else if (member.recruitQuestId && gameState) {
      const completed = gameState.questState?.completedQuests || [];
      if (!completed.includes(member.recruitQuestId)) {
        available = false;
        statusText = 'Quest Required';
      }
    }

    if (availableSlots <= 0 && available && !isRecruited) {
      available = false;
      statusText = 'Party Full';
    }

    return `
      <div class="recruit-card ${!available ? 'unavailable' : ''}" data-member="${escapeHtml(member.id)}">
        <div class="recruit-portrait">${escapeHtml(member.portrait)}</div>
        <div class="recruit-info">
          <div class="recruit-name">${escapeHtml(member.name)} - ${escapeHtml(member.title)}</div>
          <div class="recruit-desc">${escapeHtml(member.description)}</div>
        </div>
        <button class="recruit-btn" ${!available ? 'disabled' : ''} data-action="${isRecruited && !isInParty ? 'rejoin' : 'recruit'}" data-member="${escapeHtml(member.id)}">
          ${statusText || (isRecruited ? 'Rejoin' : 'Recruit')}
        </button>
      </div>
    `;
  }).join('');

  return `
    <div class="recruit-panel">
      <div class="recruit-title">Available Recruits</div>
      <div class="recruit-list">
        ${recruitCards}
      </div>
    </div>
  `.trim();
}

/**
 * Render party member detail view
 * @param {Object} member - Member instance
 * @returns {string} HTML string
 */
export function renderMemberDetail(member) {
  const data = getPartyMemberData(member.id);
  if (!data) {
    return '<div class="member-detail">Member not found</div>';
  }

  const hpPercent = (member.hp / member.maxHp) * 100;
  
  const abilitiesHtml = data.abilities.map(a => 
    `<span class="ability-tag">${escapeHtml(a)}</span>`
  ).join('');

  return `
    <div class="member-detail">
      <div class="member-detail-header">
        <div class="member-portrait large">${escapeHtml(data.portrait)}</div>
        <div class="member-detail-info">
          <h3>${escapeHtml(data.name)}</h3>
          <div class="member-title">${escapeHtml(data.title)}</div>
          <span class="member-role ${data.role}">${data.role}</span>
        </div>
      </div>
      <p class="member-description">${escapeHtml(data.description)}</p>
      <div class="member-detail-stats">
        <div class="detail-stat">
          <span class="detail-stat-label">Level</span>
          <span class="detail-stat-value">${member.level}</span>
        </div>
        <div class="detail-stat">
          <span class="detail-stat-label">HP</span>
          <span class="detail-stat-value">${member.hp}/${member.maxHp}</span>
        </div>
        <div class="detail-stat">
          <span class="detail-stat-label">Attack</span>
          <span class="detail-stat-value">${member.stats.attack}</span>
        </div>
        <div class="detail-stat">
          <span class="detail-stat-label">Defense</span>
          <span class="detail-stat-value">${member.stats.defense}</span>
        </div>
        <div class="detail-stat">
          <span class="detail-stat-label">Speed</span>
          <span class="detail-stat-value">${member.stats.speed}</span>
        </div>
      </div>
      <div class="member-abilities">
        <div class="abilities-title">Abilities</div>
        <div class="abilities-list">${abilitiesHtml}</div>
      </div>
    </div>
  `.trim();
}

/**
 * Render compact party HUD
 * @param {Object} state - Party state
 * @returns {string} HTML string
 */
export function renderPartyHud(state) {
  const activeMembers = getActiveParty(state);
  
  if (activeMembers.length === 0) {
    return '';
  }

  const membersHtml = activeMembers.map(member => {
    const data = getPartyMemberData(member.id);
    if (!data) return '';
    
    const hpPercent = (member.hp / member.maxHp) * 100;
    const hpClass = hpPercent < 25 ? 'low' : hpPercent < 50 ? 'medium' : '';
    
    return `
      <div class="party-hud-member">
        <span class="hud-member-icon">${escapeHtml(data.portrait)}</span>
        <div class="hud-member-hp">
          <div class="hud-hp-fill ${hpClass}" style="width: ${hpPercent}%"></div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="party-hud">
      ${membersHtml}
    </div>
  `.trim();
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
