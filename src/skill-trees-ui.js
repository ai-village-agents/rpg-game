/**
 * Skill Tree UI Components
 * Renders skill tree displays and interactions
 */

import {
  SKILL_TREES,
  SKILL_TYPES,
  TREE_CATEGORIES,
  getSkillTreeData,
  getSkillData,
  getSkillRank,
  isSkillUnlocked,
  canUnlockSkill,
  getSkillEffect,
  getAllUnlockedSkills,
  getTreeProgress,
  calculatePassiveBonuses,
} from './skill-trees.js';

/**
 * Get CSS styles for skill trees UI
 * @returns {string} CSS styles
 */
export function getSkillTreeStyles() {
  return `
.skill-tree-container {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid #0f3460;
  border-radius: 10px;
  padding: 15px;
}

.skill-tree-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #333;
}

.skill-tree-icon {
  font-size: 28px;
}

.skill-tree-title {
  flex: 1;
}

.skill-tree-title h2 {
  margin: 0;
  font-size: 18px;
  color: #e8e8e8;
}

.skill-tree-title p {
  margin: 0;
  font-size: 11px;
  color: #888;
}

.skill-points-display {
  font-size: 14px;
  color: #ffd700;
  padding: 6px 12px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.skill-tree-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  position: relative;
  min-height: 300px;
}

.skill-node {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid;
}

.skill-node.locked {
  background: rgba(60, 60, 60, 0.3);
  border-color: #444;
  opacity: 0.5;
}

.skill-node.available {
  background: rgba(100, 180, 100, 0.2);
  border-color: #4a8;
  animation: pulse-available 2s infinite;
}

@keyframes pulse-available {
  0%, 100% { box-shadow: 0 0 5px rgba(68, 170, 136, 0.3); }
  50% { box-shadow: 0 0 15px rgba(68, 170, 136, 0.6); }
}

.skill-node.unlocked {
  background: rgba(100, 200, 100, 0.25);
  border-color: #8f8;
}

.skill-node.maxed {
  background: rgba(255, 215, 0, 0.2);
  border-color: #ffd700;
}

.skill-node:hover {
  transform: scale(1.1);
  z-index: 10;
}

.skill-node-icon {
  font-size: 22px;
  line-height: 1;
}

.skill-node-rank {
  position: absolute;
  bottom: -5px;
  right: -5px;
  background: #222;
  color: #fff;
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 8px;
  min-width: 16px;
  text-align: center;
}

.skill-node-rank.maxed {
  background: #ffd700;
  color: #000;
}

.skill-node-cost {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #4a8;
  color: #fff;
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 4px;
}

/* Skill connections */
.skill-connection {
  position: absolute;
  background: #444;
  z-index: 0;
}

.skill-connection.active {
  background: #4a8;
}

.skill-connection.horizontal {
  height: 2px;
}

.skill-connection.vertical {
  width: 2px;
}

/* Skill tooltip */
.skill-tooltip {
  position: absolute;
  bottom: 110%;
  left: 50%;
  transform: translateX(-50%);
  background: #1a1a2e;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 10px;
  min-width: 200px;
  z-index: 100;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.skill-node:hover .skill-tooltip {
  opacity: 1;
}

.skill-tooltip-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.skill-tooltip-name {
  font-weight: bold;
  color: #e8e8e8;
  font-size: 13px;
}

.skill-tooltip-type {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 4px;
  text-transform: uppercase;
}

.skill-tooltip-type.active { background: #a44; }
.skill-tooltip-type.passive { background: #448; }
.skill-tooltip-type.buff { background: #484; }
.skill-tooltip-type.ultimate { background: #a4a; }

.skill-tooltip-desc {
  font-size: 11px;
  color: #aaa;
  margin-bottom: 8px;
}

.skill-tooltip-effects {
  font-size: 10px;
  color: #8f8;
  padding: 6px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.skill-tooltip-requirements {
  margin-top: 8px;
  font-size: 10px;
  color: #f88;
}

/* Tree tabs */
.skill-tree-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 15px;
}

.skill-tree-tab {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #333;
  border-radius: 6px 6px 0 0;
  background: rgba(50, 50, 50, 0.3);
  color: #888;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  font-size: 12px;
}

.skill-tree-tab:hover {
  background: rgba(100, 100, 100, 0.3);
  color: #ccc;
}

.skill-tree-tab.active {
  background: rgba(100, 180, 100, 0.2);
  border-color: #4a8;
  color: #8f8;
}

.skill-tree-tab-icon {
  font-size: 16px;
  margin-bottom: 2px;
}

/* Progress bar */
.tree-progress-bar {
  height: 6px;
  background: #333;
  border-radius: 3px;
  margin-top: 10px;
  overflow: hidden;
}

.tree-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4a8 0%, #8f8 100%);
  transition: width 0.3s ease;
}

/* Passive bonuses display */
.passive-bonuses {
  margin-top: 15px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
}

.passive-bonuses-title {
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.passive-bonus-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.passive-bonus-item {
  font-size: 10px;
  padding: 3px 8px;
  background: rgba(100, 200, 100, 0.15);
  color: #8f8;
  border-radius: 4px;
}

/* Unlock notification */
.skill-unlock-notice {
  padding: 10px 15px;
  background: linear-gradient(135deg, #1a2a1a 0%, #0a1a0a 100%);
  border: 1px solid #4a8;
  border-radius: 6px;
  text-align: center;
  animation: skill-unlock 0.5s ease-out;
}

@keyframes skill-unlock {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

.skill-unlock-notice .unlock-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.skill-unlock-notice .unlock-text {
  font-size: 13px;
  font-weight: bold;
  color: #8f8;
}

.skill-unlock-notice .unlock-rank {
  font-size: 11px;
  color: #aaa;
}
`;
}

/**
 * Render skill tree tabs
 * @param {string} activeTree - Currently active tree
 * @returns {string} HTML string
 */
export function renderSkillTreeTabs(activeTree) {
  const tabs = Object.values(TREE_CATEGORIES).map(cat => {
    const tree = SKILL_TREES[cat];
    if (!tree) return '';
    
    const isActive = cat === activeTree;
    
    return `
      <div class="skill-tree-tab ${isActive ? 'active' : ''}" data-tree="${cat}">
        <div class="skill-tree-tab-icon">${escapeHtml(tree.icon)}</div>
        ${escapeHtml(tree.name)}
      </div>
    `;
  }).join('');
  
  return `<div class="skill-tree-tabs">${tabs}</div>`;
}

/**
 * Render skill tree display
 * @param {Object} state - Skill tree state
 * @param {string} treeCategory - Tree to display
 * @returns {string} HTML string
 */
export function renderSkillTree(state, treeCategory) {
  const tree = getSkillTreeData(treeCategory);
  if (!tree) {
    return `<div class="skill-tree-container">Tree not found</div>`;
  }
  
  const progress = getTreeProgress(state, treeCategory);
  const skillNodes = Object.values(tree.skills).map(skill => 
    renderSkillNode(state, treeCategory, skill)
  ).join('');
  
  return `
    <div class="skill-tree-container" style="border-color: ${tree.color}40">
      <div class="skill-tree-header">
        <span class="skill-tree-icon">${escapeHtml(tree.icon)}</span>
        <div class="skill-tree-title">
          <h2>${escapeHtml(tree.name)}</h2>
          <p>${escapeHtml(tree.description)}</p>
        </div>
        <div class="skill-points-display">
          \uD83D\uDD39 ${state?.skillPoints || 0} Points
        </div>
      </div>
      <div class="skill-tree-grid">
        ${skillNodes}
      </div>
      <div class="tree-progress-bar">
        <div class="tree-progress-fill" style="width: ${progress.percentComplete}%"></div>
      </div>
    </div>
  `.trim();
}

/**
 * Render skill node
 * @param {Object} state - Skill tree state
 * @param {string} treeCategory - Tree category
 * @param {Object} skill - Skill data
 * @returns {string} HTML string
 */
function renderSkillNode(state, treeCategory, skill) {
  const rank = getSkillRank(state, treeCategory, skill.id);
  const isUnlocked = rank > 0;
  const isMaxed = rank >= skill.maxRank;
  const check = canUnlockSkill(state, treeCategory, skill.id);
  const canLearn = check.canUnlock;
  
  let nodeClass = 'locked';
  if (isMaxed) nodeClass = 'maxed';
  else if (isUnlocked) nodeClass = 'unlocked';
  else if (canLearn) nodeClass = 'available';
  
  const effect = skill.effects[rank > 0 ? rank - 1 : 0];
  const nextEffect = rank < skill.maxRank ? skill.effects[rank] : null;
  
  const gridColumn = skill.position.x + 1;
  const gridRow = skill.position.y + 1;
  
  return `
    <div class="skill-node ${nodeClass}" 
         data-skill="${skill.id}" 
         data-tree="${treeCategory}"
         style="grid-column: ${gridColumn}; grid-row: ${gridRow};">
      <span class="skill-node-icon">${escapeHtml(skill.icon)}</span>
      <span class="skill-node-rank ${isMaxed ? 'maxed' : ''}">${rank}/${skill.maxRank}</span>
      ${canLearn ? `<span class="skill-node-cost">${skill.cost}</span>` : ''}
      ${renderSkillTooltip(skill, rank, effect, nextEffect, check)}
    </div>
  `;
}

/**
 * Render skill tooltip
 * @param {Object} skill - Skill data
 * @param {number} rank - Current rank
 * @param {Object} effect - Current effect
 * @param {Object} nextEffect - Next rank effect
 * @param {Object} check - Can unlock check result
 * @returns {string} HTML string
 */
function renderSkillTooltip(skill, rank, effect, nextEffect, check) {
  const typeClass = skill.type;
  const effectText = formatSkillEffect(effect);
  const nextText = nextEffect ? `Next: ${formatSkillEffect(nextEffect)}` : 'MAX RANK';
  
  let reqText = '';
  if (!check.canUnlock && check.reason === 'missing_prerequisite') {
    reqText = `<div class="skill-tooltip-requirements">Requires: ${check.missingSkill}</div>`;
  } else if (!check.canUnlock && check.reason === 'insufficient_points') {
    reqText = `<div class="skill-tooltip-requirements">Need more skill points</div>`;
  }
  
  return `
    <div class="skill-tooltip">
      <div class="skill-tooltip-header">
        <span class="skill-tooltip-name">${escapeHtml(skill.name)}</span>
        <span class="skill-tooltip-type ${typeClass}">${skill.type}</span>
      </div>
      <div class="skill-tooltip-desc">${escapeHtml(skill.description)}</div>
      <div class="skill-tooltip-effects">
        ${rank > 0 ? `Current: ${effectText}` : effectText}
        ${rank > 0 && rank < skill.maxRank ? `<br>${nextText}` : ''}
      </div>
      ${reqText}
    </div>
  `;
}

/**
 * Format skill effect for display
 * @param {Object} effect - Effect data
 * @returns {string} Formatted effect text
 */
function formatSkillEffect(effect) {
  if (!effect) return '';
  
  const parts = [];
  
  if (effect.damage) parts.push(`${effect.damage} dmg`);
  if (effect.healing) parts.push(`${effect.healing} heal`);
  if (effect.mpCost) parts.push(`${effect.mpCost} MP`);
  if (effect.element) parts.push(effect.element);
  if (effect.targets === 'all') parts.push('AoE');
  if (effect.targets === 'party') parts.push('Party');
  if (effect.duration) parts.push(`${effect.duration}T`);
  if (effect.attackBonus) parts.push(`+${Math.round(effect.attackBonus * 100)}% ATK`);
  if (effect.defenseBonus) parts.push(`+${effect.defenseBonus} DEF`);
  if (effect.speedBonus) parts.push(`+${effect.speedBonus} SPD`);
  if (effect.critBonus) parts.push(`+${Math.round(effect.critBonus * 100)}% Crit`);
  if (effect.critChance) parts.push(`+${Math.round(effect.critChance * 100)}% Crit`);
  if (effect.freezeChance) parts.push(`${Math.round(effect.freezeChance * 100)}% Freeze`);
  if (effect.damageReduction) parts.push(`-${Math.round(effect.damageReduction * 100)}% Dmg`);
  if (effect.mpBonus) parts.push(`+${effect.mpBonus} MP`);
  if (effect.mpRegen) parts.push(`+${effect.mpRegen} MP/turn`);
  if (effect.regenAmount) parts.push(`+${effect.regenAmount} HP/turn`);
  
  return parts.join(', ') || 'No effect';
}

/**
 * Render passive bonuses display
 * @param {Object} state - Skill tree state
 * @returns {string} HTML string
 */
export function renderPassiveBonuses(state) {
  const bonuses = calculatePassiveBonuses(state);
  
  if (Object.keys(bonuses).length === 0) {
    return '';
  }
  
  const bonusItems = Object.entries(bonuses).map(([key, value]) => {
    const displayValue = value < 1 ? `+${Math.round(value * 100)}%` : `+${value}`;
    return `<span class="passive-bonus-item">${formatBonusName(key)} ${displayValue}</span>`;
  }).join('');
  
  return `
    <div class="passive-bonuses">
      <div class="passive-bonuses-title">Passive Bonuses</div>
      <div class="passive-bonus-list">${bonusItems}</div>
    </div>
  `.trim();
}

/**
 * Format bonus name for display
 * @param {string} key - Bonus key
 * @returns {string} Formatted name
 */
function formatBonusName(key) {
  const names = {
    defenseBonus: 'DEF',
    speedBonus: 'SPD',
    mpBonus: 'Max MP',
    attackPercent: 'ATK',
    critChance: 'Crit',
    mpRegen: 'MP Regen',
  };
  return names[key] || key;
}

/**
 * Render skill unlock notification
 * @param {string} skillName - Skill name
 * @param {number} newRank - New rank
 * @param {number} maxRank - Max rank
 * @returns {string} HTML string
 */
export function renderSkillUnlockNotice(skillName, newRank, maxRank) {
  const isMax = newRank >= maxRank;
  
  return `
    <div class="skill-unlock-notice">
      <div class="unlock-icon">${isMax ? '\u2B50' : '\u2728'}</div>
      <div class="unlock-text">${escapeHtml(skillName)} ${isMax ? 'Mastered!' : 'Unlocked!'}</div>
      <div class="unlock-rank">Rank ${newRank}/${maxRank}</div>
    </div>
  `.trim();
}

/**
 * Render skill list for combat
 * @param {Object} state - Skill tree state
 * @returns {string} HTML string
 */
export function renderCombatSkillList(state) {
  const skills = getAllUnlockedSkills(state).filter(s => 
    s.skill.type === SKILL_TYPES.ACTIVE || s.skill.type === SKILL_TYPES.ULTIMATE
  );
  
  if (skills.length === 0) {
    return `<div class="combat-skills">No skills available</div>`;
  }
  
  const skillButtons = skills.map(s => `
    <button class="combat-skill-btn" 
            data-skill="${s.skillId}" 
            data-tree="${s.treeCategory}"
            data-cost="${s.effect.mpCost || 0}">
      <span class="skill-icon">${escapeHtml(s.skill.icon)}</span>
      <span class="skill-name">${escapeHtml(s.skill.name)}</span>
      <span class="skill-cost">${s.effect.mpCost || 0} MP</span>
    </button>
  `).join('');
  
  return `<div class="combat-skills">${skillButtons}</div>`;
}

/**
 * Render all trees summary
 * @param {Object} state - Skill tree state
 * @returns {string} HTML string
 */
export function renderTreesSummary(state) {
  const summaries = Object.values(TREE_CATEGORIES).map(cat => {
    const tree = SKILL_TREES[cat];
    if (!tree) return '';
    
    const progress = getTreeProgress(state, cat);
    
    return `
      <div class="tree-summary-item">
        <span class="tree-icon">${escapeHtml(tree.icon)}</span>
        <span class="tree-name">${escapeHtml(tree.name)}</span>
        <span class="tree-progress">${progress.currentRanks}/${progress.totalRanks}</span>
      </div>
    `;
  }).join('');
  
  return `<div class="trees-summary">${summaries}</div>`;
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
