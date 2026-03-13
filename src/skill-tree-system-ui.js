/**
 * Skill Tree System UI - Rendering functions for skill trees
 */

import {
  SKILL_TREES,
  SKILL_TIERS,
  SKILL_TYPES,
  getSkillWithEffects,
  getTreeSkills,
  canUnlockSkill,
  getActiveSkillBar,
  getPassiveBonuses,
  getSkillTreeSummary,
  getAllTrees,
  getAllTiers
} from './skill-tree-system.js';

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format number with commas
 */
function formatNumber(num) {
  return num.toLocaleString();
}

/**
 * Render skill node
 */
export function renderSkillNode(state, skillId, options = {}) {
  const { compact = false, showDetails = true } = options;
  const skillInfo = getSkillWithEffects(state, skillId);

  if (!skillInfo.found) {
    return '<div class="skill-node empty">Skill not found</div>';
  }

  const skill = skillInfo.skill;
  const currentRank = skillInfo.rank;
  const check = canUnlockSkill(state, skillId);
  const tier = Object.values(SKILL_TIERS).find(t => t.id === skill.tier);
  const tree = Object.values(SKILL_TREES).find(t => t.id === skill.tree);

  const statusClass = skillInfo.unlocked
    ? (currentRank >= skill.maxRanks ? 'maxed' : 'unlocked')
    : (check.canUnlock ? 'available' : 'locked');

  if (compact) {
    return `
      <div class="skill-node compact ${statusClass}" data-skill-id="${escapeHtml(skillId)}" style="border-color: ${tree?.color || '#666'}">
        <span class="skill-name">${escapeHtml(skill.name)}</span>
        <span class="skill-rank">${currentRank}/${skill.maxRanks}</span>
      </div>
    `;
  }

  const effectsList = showDetails ? Object.entries(skillInfo.effects || {}).map(([key, value]) => `
    <li>${escapeHtml(key.replace(/([A-Z])/g, ' $1').trim())}: ${value > 0 ? '+' : ''}${value}${key.includes('Percent') || key.includes('Chance') ? '%' : ''}</li>
  `).join('') : '';

  return `
    <div class="skill-node ${statusClass}" data-skill-id="${escapeHtml(skillId)}" style="border-color: ${tree?.color || '#666'}">
      <div class="skill-header">
        <span class="skill-name">${escapeHtml(skill.name)}</span>
        <span class="skill-rank">${currentRank}/${skill.maxRanks}</span>
      </div>
      <div class="skill-tier">${escapeHtml(tier?.name || skill.tier)}</div>
      <div class="skill-type">${escapeHtml(SKILL_TYPES[skill.type.toUpperCase()]?.name || skill.type)}</div>
      <p class="skill-description">${escapeHtml(skill.description)}</p>
      ${showDetails && effectsList ? `<ul class="skill-effects">${effectsList}</ul>` : ''}
      <div class="skill-footer">
        ${!skillInfo.unlocked && check.canUnlock ? `<span class="cost">Cost: ${check.pointCost} points</span>` : ''}
        ${!skillInfo.unlocked && !check.canUnlock ? `<span class="locked-reason">${escapeHtml(check.reason)}</span>` : ''}
        ${skillInfo.unlocked && currentRank < skill.maxRanks ? `<span class="upgradeable">Upgrade available</span>` : ''}
      </div>
    </div>
  `;
}

/**
 * Render skill tooltip
 */
export function renderSkillTooltip(state, skillId) {
  const skillInfo = getSkillWithEffects(state, skillId);
  if (!skillInfo.found) {
    return '<div class="skill-tooltip">Skill not found</div>';
  }

  const skill = skillInfo.skill;
  const check = canUnlockSkill(state, skillId);

  const effectsList = Object.entries(skillInfo.effects || {}).map(([key, value]) => `
    <div class="effect-row">
      <span class="effect-name">${escapeHtml(key.replace(/([A-Z])/g, ' $1').trim())}</span>
      <span class="effect-value">${value > 0 ? '+' : ''}${value}</span>
    </div>
  `).join('');

  const prereqList = skill.prerequisites.map(prereqId => {
    const prereq = state.skillTrees.skillDefinitions[prereqId];
    const hasPrereq = (state.skillTrees.unlockedSkills[prereqId] || 0) > 0;
    return `<span class="prereq ${hasPrereq ? 'met' : 'unmet'}">${escapeHtml(prereq?.name || prereqId)}</span>`;
  }).join('');

  return `
    <div class="skill-tooltip">
      <h4 class="tooltip-title">${escapeHtml(skill.name)}</h4>
      <p class="tooltip-desc">${escapeHtml(skill.description)}</p>
      <div class="tooltip-rank">Rank: ${skillInfo.rank}/${skill.maxRanks}</div>
      ${effectsList ? `<div class="tooltip-effects"><h5>Effects:</h5>${effectsList}</div>` : ''}
      ${prereqList ? `<div class="tooltip-prereqs"><h5>Requires:</h5>${prereqList}</div>` : ''}
      ${!skillInfo.unlocked ? `<div class="tooltip-status ${check.canUnlock ? 'available' : 'locked'}">${check.canUnlock ? 'Click to unlock' : escapeHtml(check.reason)}</div>` : ''}
    </div>
  `;
}

/**
 * Render skill tree
 */
export function renderSkillTree(state, treeId) {
  const treeData = getTreeSkills(state, treeId);
  if (!treeData.tree) {
    return '<div class="skill-tree empty">Tree not found</div>';
  }

  const tree = treeData.tree;

  // Group skills by tier
  const skillsByTier = {};
  for (const tier of Object.values(SKILL_TIERS)) {
    skillsByTier[tier.id] = treeData.skills.filter(s => s.tier === tier.id);
  }

  const tiers = Object.values(SKILL_TIERS).map(tier => {
    const tierSkills = skillsByTier[tier.id] || [];
    if (tierSkills.length === 0) return '';

    const skillNodes = tierSkills.map(skill => renderSkillNode(state, skill.id)).join('');

    return `
      <div class="skill-tier-row" data-tier="${tier.id}">
        <div class="tier-label">${escapeHtml(tier.name)}</div>
        <div class="tier-skills">${skillNodes}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="skill-tree" data-tree="${treeId}" style="border-color: ${tree.color}">
      <div class="tree-header" style="background-color: ${tree.color}">
        <span class="tree-icon">${tree.icon}</span>
        <h3 class="tree-name">${escapeHtml(tree.name)}</h3>
        <span class="tree-progress">${treeData.unlockedCount}/${treeData.skillCount} skills</span>
      </div>
      <div class="tree-body">
        ${tiers}
      </div>
      <div class="tree-footer">
        <span class="points-spent">Points in tree: ${treeData.progress}</span>
      </div>
    </div>
  `;
}

/**
 * Render tree selector tabs
 */
export function renderTreeTabs(selectedTreeId = null) {
  const trees = getAllTrees();

  const tabs = trees.map(tree => `
    <button class="tree-tab ${selectedTreeId === tree.id ? 'active' : ''}"
            data-tree="${tree.id}"
            style="--tree-color: ${tree.color}">
      <span class="tab-icon">${tree.icon}</span>
      <span class="tab-name">${escapeHtml(tree.name)}</span>
    </button>
  `).join('');

  return `<div class="tree-tabs">${tabs}</div>`;
}

/**
 * Render skill points display
 */
export function renderSkillPointsDisplay(state) {
  const summary = getSkillTreeSummary(state);

  return `
    <div class="skill-points-display">
      <div class="points-available">
        <span class="label">Available Points</span>
        <span class="value">${formatNumber(summary.availablePoints)}</span>
      </div>
      <div class="points-spent">
        <span class="label">Total Spent</span>
        <span class="value">${formatNumber(summary.totalPointsSpent)}</span>
      </div>
      <div class="skills-unlocked">
        <span class="label">Skills Unlocked</span>
        <span class="value">${summary.totalSkillsUnlocked}</span>
      </div>
    </div>
  `;
}

/**
 * Render active skill bar
 */
export function renderActiveSkillBar(state) {
  const slots = getActiveSkillBar(state);

  const slotHtml = slots.map((skill, index) => {
    if (!skill) {
      return `
        <div class="skill-slot empty" data-slot="${index}">
          <span class="slot-number">${index}</span>
        </div>
      `;
    }

    const tree = Object.values(SKILL_TREES).find(t => t.id === skill.tree);

    return `
      <div class="skill-slot filled" data-slot="${index}" data-skill-id="${escapeHtml(skill.id)}" style="border-color: ${tree?.color || '#666'}">
        <span class="slot-number">${index}</span>
        <span class="skill-name">${escapeHtml(skill.name)}</span>
        <span class="skill-rank">R${skill.rank}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="active-skill-bar">
      <div class="bar-label">Active Skills</div>
      <div class="skill-slots">${slotHtml}</div>
    </div>
  `;
}

/**
 * Render passive bonuses summary
 */
export function renderPassiveBonuses(state) {
  const bonuses = getPassiveBonuses(state);
  const entries = Object.entries(bonuses);

  if (entries.length === 0) {
    return `
      <div class="passive-bonuses empty">
        <p>No passive bonuses active. Unlock passive skills to gain bonuses!</p>
      </div>
    `;
  }

  const bonusList = entries.map(([key, value]) => `
    <div class="bonus-row">
      <span class="bonus-name">${escapeHtml(key.replace(/([A-Z])/g, ' $1').trim())}</span>
      <span class="bonus-value">${value > 0 ? '+' : ''}${value}</span>
    </div>
  `).join('');

  return `
    <div class="passive-bonuses">
      <h4>Passive Bonuses</h4>
      ${bonusList}
    </div>
  `;
}

/**
 * Render tier legend
 */
export function renderTierLegend() {
  const tiers = getAllTiers();

  const tierItems = tiers.map(tier => `
    <div class="tier-item">
      <span class="tier-name">${escapeHtml(tier.name)}</span>
      <span class="tier-cost">Cost: ${tier.pointCost}</span>
      <span class="tier-req">Requires: ${tier.requiredTreePoints} tree points</span>
    </div>
  `).join('');

  return `
    <div class="tier-legend">
      <h4>Skill Tiers</h4>
      ${tierItems}
    </div>
  `;
}

/**
 * Render tree progress bars
 */
export function renderTreeProgress(state) {
  const summary = getSkillTreeSummary(state);

  const bars = summary.trees.map(tree => `
    <div class="tree-progress-row">
      <span class="tree-icon">${tree.icon}</span>
      <span class="tree-name">${escapeHtml(tree.name)}</span>
      <div class="progress-bar" style="--tree-color: ${tree.color}">
        <div class="progress-fill" style="width: ${Math.min(100, tree.progress)}%"></div>
      </div>
      <span class="progress-value">${tree.progress} pts</span>
    </div>
  `).join('');

  return `
    <div class="tree-progress-summary">
      <h4>Tree Progress</h4>
      ${bars}
    </div>
  `;
}

/**
 * Render reset confirmation dialog
 */
export function renderResetDialog(treeId = null) {
  const isFullReset = !treeId;
  const tree = treeId ? Object.values(SKILL_TREES).find(t => t.id === treeId) : null;

  return `
    <div class="reset-dialog">
      <h3>Reset ${isFullReset ? 'All Skills' : `${escapeHtml(tree?.name || treeId)} Tree`}?</h3>
      <p class="warning">This will refund all skill points ${isFullReset ? 'from all trees' : 'in this tree'}.</p>
      <div class="dialog-buttons">
        <button class="btn cancel" data-action="cancel-reset">Cancel</button>
        <button class="btn danger confirm" data-action="confirm-reset" data-tree="${treeId || 'all'}">Reset</button>
      </div>
    </div>
  `;
}

/**
 * Render skill unlock notification
 */
export function renderSkillUnlockNotification(skill, newRank, isNewUnlock) {
  const tree = Object.values(SKILL_TREES).find(t => t.id === skill.tree);

  return `
    <div class="skill-notification ${isNewUnlock ? 'new-unlock' : 'rank-up'}" style="border-color: ${tree?.color || '#666'}">
      <div class="notification-icon">${isNewUnlock ? '🎉' : '⬆️'}</div>
      <div class="notification-content">
        <span class="notification-title">${isNewUnlock ? 'Skill Unlocked!' : 'Skill Upgraded!'}</span>
        <span class="skill-name">${escapeHtml(skill.name)}</span>
        <span class="skill-rank">Rank ${newRank}/${skill.maxRanks}</span>
      </div>
    </div>
  `;
}

/**
 * Render full skill tree page
 */
export function renderSkillTreePage(state, selectedTreeId = 'combat') {
  const treeHtml = renderSkillTree(state, selectedTreeId);

  return `
    <div class="skill-tree-page">
      <header class="page-header">
        <h1>⚔️ Skill Trees</h1>
        ${renderSkillPointsDisplay(state)}
      </header>

      <div class="page-content">
        ${renderTreeTabs(selectedTreeId)}

        <div class="main-area">
          ${treeHtml}
        </div>

        <aside class="sidebar">
          ${renderActiveSkillBar(state)}
          ${renderPassiveBonuses(state)}
          ${renderTreeProgress(state)}
          ${renderTierLegend()}

          <div class="reset-buttons">
            <button class="btn reset-tree" data-action="reset-tree" data-tree="${selectedTreeId}">Reset ${escapeHtml(SKILL_TREES[selectedTreeId.toUpperCase()]?.name || selectedTreeId)} Tree</button>
            <button class="btn reset-all danger" data-action="reset-all">Reset All Trees</button>
          </div>
        </aside>
      </div>
    </div>
  `;
}

/**
 * Render compact skill summary (for character sheet)
 */
export function renderCompactSkillSummary(state) {
  const summary = getSkillTreeSummary(state);

  const treeItems = summary.trees.map(tree => `
    <span class="tree-mini" style="color: ${tree.color}">${tree.icon} ${tree.unlockedCount}</span>
  `).join('');

  return `
    <div class="compact-skill-summary">
      <span class="total-skills">${summary.totalSkillsUnlocked} skills</span>
      <span class="available-points">${summary.availablePoints} pts</span>
      <div class="tree-breakdown">${treeItems}</div>
    </div>
  `;
}
