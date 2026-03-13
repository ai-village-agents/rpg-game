/**
 * Resource Gathering System UI
 * Renders gathering interface, progress bars, and skill panels
 */

import {
  GATHERING_SKILL,
  RESOURCE_RARITY,
  RESOURCE_NODES,
  GATHERING_TOOLS,
  getGatheringState,
  getSkillProgress,
  getEquippedTool,
  getGatheringProgress,
  getGatheringStats,
  getNodesForSkill,
  getAvailableNodes,
  getSkillLevelBonus,
  getDailyBonusStatus
} from './resource-gathering-system.js';

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

/**
 * Get icon for gathering skill
 */
function getSkillIcon(iconName) {
  const icons = {
    pickaxe: '\u26cf',
    leaf: '\ud83c\udf3f',
    axe: '\ud83e\ude93',
    knife: '\ud83d\udd2a'
  };
  return icons[iconName] || '\u2b50';
}

/**
 * Render gathering skill panel
 */
export function renderGatheringSkillPanel(state, options = {}) {
  const { selectedSkill = null } = options;
  const skills = Object.values(GATHERING_SKILL);
  const gatheringState = getGatheringState(state);

  let html = `
    <div class="gathering-skill-panel">
      <div class="panel-header">
        <h2>Gathering Skills</h2>
      </div>
      <div class="skills-grid">
        ${skills.map(skill => {
          const progress = getSkillProgress(state, skill.id);
          const tool = getEquippedTool(state, skill.id);
          const isSelected = selectedSkill === skill.id;
          return `
            <div class="skill-card ${isSelected ? 'selected' : ''}"
                 data-skill-id="${skill.id}"
                 style="border-color: ${skill.color}">
              <div class="skill-header">
                <span class="skill-icon" style="color: ${skill.color}">
                  ${getSkillIcon(skill.icon)}
                </span>
                <span class="skill-name">${escapeHtml(skill.name)}</span>
                <span class="skill-level">Lv. ${progress.level}</span>
              </div>
              <div class="skill-progress-bar">
                <div class="progress-fill" style="width: ${progress.progress * 100}%; background: ${skill.color}"></div>
              </div>
              <div class="skill-exp">
                ${progress.exp}/${progress.expToNext} EXP
              </div>
              <div class="equipped-tool">
                ${tool ? escapeHtml(tool.name) : 'No tool equipped'}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  return html;
}

/**
 * Render active gathering progress
 */
export function renderGatheringProgress(state) {
  const progress = getGatheringProgress(state);

  if (!progress.isGathering) {
    return '<div class="gathering-progress inactive">Not gathering</div>';
  }

  const node = RESOURCE_NODES[progress.nodeId];
  const percentComplete = Math.floor(progress.progress * 100);
  const remainingSecs = Math.ceil(progress.remaining / 1000);

  return `
    <div class="gathering-progress active">
      <div class="progress-header">
        <span class="node-name">${escapeHtml(progress.nodeName)}</span>
        <span class="time-remaining">${remainingSecs}s</span>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar">
          <div class="progress-fill ${progress.isComplete ? 'complete' : ''}"
               style="width: ${percentComplete}%; background: ${node?.skill.color || '#4CAF50'}">
          </div>
        </div>
        <span class="progress-percent">${percentComplete}%</span>
      </div>
      ${progress.isComplete ? `
        <button class="collect-btn">Collect Resources</button>
      ` : `
        <button class="cancel-btn">Cancel</button>
      `}
    </div>
  `;
}

/**
 * Render node selection panel
 */
export function renderNodeSelectionPanel(state, skillId, options = {}) {
  const { locationNodes = [] } = options;
  const skill = GATHERING_SKILL[skillId.toUpperCase()];
  const skillProgress = getSkillProgress(state, skillId);
  const allNodes = getNodesForSkill(skillId);

  let html = `
    <div class="node-selection-panel">
      <div class="panel-header" style="border-color: ${skill?.color || '#888'}">
        <span class="skill-icon">${getSkillIcon(skill?.icon)}</span>
        <h3>${escapeHtml(skill?.name || 'Unknown')} Nodes</h3>
        <span class="skill-level">Level ${skillProgress.level}</span>
      </div>
      <div class="nodes-list">
        ${allNodes.map(node => {
          const canGather = skillProgress.level >= node.requiredLevel;
          const isAvailable = locationNodes.some(ln => ln.nodeId === node.id && !ln.depleted);
          return `
            <div class="node-item ${canGather ? 'unlocked' : 'locked'} ${isAvailable ? 'available' : ''}"
                 data-node-id="${node.id}">
              <div class="node-info">
                <span class="node-name">${escapeHtml(node.name)}</span>
                <span class="node-level">Req: Lv.${node.requiredLevel}</span>
              </div>
              <div class="node-rewards">
                ${node.resources.slice(0, 2).map(r => `
                  <span class="resource-preview">${escapeHtml(r.id.replace(/_/g, ' '))}</span>
                `).join('')}
              </div>
              <div class="node-stats">
                <span class="gather-time">${(node.gatherTime / 1000).toFixed(1)}s</span>
                <span class="base-exp">+${node.baseExp} EXP</span>
              </div>
              ${canGather && isAvailable ? `
                <button class="gather-btn" data-node-id="${node.id}">Gather</button>
              ` : !canGather ? `
                <span class="locked-label">Locked</span>
              ` : `
                <span class="unavailable-label">Depleted</span>
              `}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  return html;
}

/**
 * Render tool selection panel
 */
export function renderToolSelectionPanel(state, skillId) {
  const skill = GATHERING_SKILL[skillId.toUpperCase()];
  const equippedTool = getEquippedTool(state, skillId);
  const tools = Object.values(GATHERING_TOOLS).filter(t => t.skill.id === skillId);

  let html = `
    <div class="tool-selection-panel">
      <div class="panel-header">
        <h3>${escapeHtml(skill?.name || 'Unknown')} Tools</h3>
      </div>
      <div class="tools-list">
        ${tools.map(tool => {
          const isEquipped = equippedTool?.id === tool.id;
          return `
            <div class="tool-item ${isEquipped ? 'equipped' : ''}"
                 data-tool-id="${tool.id}">
              <div class="tool-info">
                <span class="tool-name">${escapeHtml(tool.name)}</span>
                ${isEquipped ? '<span class="equipped-badge">Equipped</span>' : ''}
              </div>
              <div class="tool-stats">
                ${tool.speedBonus > 0 ? `
                  <span class="stat speed">+${Math.round(tool.speedBonus * 100)}% Speed</span>
                ` : ''}
                ${tool.yieldBonus > 0 ? `
                  <span class="stat yield">+${Math.round(tool.yieldBonus * 100)}% Yield</span>
                ` : ''}
                ${tool.rareChanceBonus > 0 ? `
                  <span class="stat rare">+${Math.round(tool.rareChanceBonus * 100)}% Rare</span>
                ` : ''}
                ${tool.speedBonus === 0 && tool.yieldBonus === 0 && tool.rareChanceBonus === 0 ? `
                  <span class="stat basic">Basic Tool</span>
                ` : ''}
              </div>
              ${!isEquipped ? `
                <button class="equip-btn" data-tool-id="${tool.id}">Equip</button>
              ` : `
                <button class="unequip-btn" data-skill-id="${skillId}">Unequip</button>
              `}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  return html;
}

/**
 * Render gathering result notification
 */
export function renderGatheringResult(result) {
  if (!result.completed) {
    return '';
  }

  return `
    <div class="gathering-result">
      <div class="result-header">
        <span class="title">Gathered!</span>
        <span class="exp-gained">+${result.exp} EXP</span>
      </div>
      <div class="gathered-items">
        ${result.gathered.map(item => `
          <div class="gathered-item">
            <span class="item-name">${escapeHtml(item.id.replace(/_/g, ' '))}</span>
            <span class="item-amount">x${item.amount}</span>
          </div>
        `).join('')}
        ${result.gathered.length === 0 ? '<div class="no-items">Nothing found</div>' : ''}
      </div>
      ${result.leveledUp ? `
        <div class="level-up-notice">
          Level Up! Now level ${result.newLevel}
        </div>
      ` : ''}
      ${result.depleted ? `
        <div class="depleted-notice">
          Node depleted - will respawn later
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render gathering statistics panel
 */
export function renderGatheringStats(state) {
  const stats = getGatheringStats(state);
  const dailyBonus = getDailyBonusStatus(state);

  const skills = Object.values(GATHERING_SKILL);

  let html = `
    <div class="gathering-stats-panel">
      <div class="panel-header">
        <h2>Gathering Statistics</h2>
      </div>

      <div class="daily-bonus ${dailyBonus.available ? 'available' : 'used'}">
        <span class="bonus-label">Daily Bonus:</span>
        ${dailyBonus.available ? `
          <span class="bonus-status">Available! (2x rewards)</span>
          <button class="use-bonus-btn">Activate</button>
        ` : `
          <span class="bonus-status">Used today</span>
        `}
      </div>

      <div class="skills-stats">
        ${skills.map(skill => {
          const skillStats = stats.skills[skill.id];
          const bonus = getSkillLevelBonus(skillStats?.level || 1);
          return `
            <div class="skill-stat-card" style="border-color: ${skill.color}">
              <div class="stat-header">
                <span class="skill-icon">${getSkillIcon(skill.icon)}</span>
                <span class="skill-name">${escapeHtml(skill.name)}</span>
              </div>
              <div class="stat-details">
                <div class="stat-row">
                  <span class="label">Level:</span>
                  <span class="value">${skillStats?.level || 1}</span>
                </div>
                <div class="stat-row">
                  <span class="label">Experience:</span>
                  <span class="value">${skillStats?.exp || 0}/${skillStats?.expToNext || 100}</span>
                </div>
                <div class="stat-row">
                  <span class="label">Speed Bonus:</span>
                  <span class="value">+${Math.round(bonus.speedBonus * 100)}%</span>
                </div>
                <div class="stat-row">
                  <span class="label">Yield Bonus:</span>
                  <span class="value">+${Math.round(bonus.yieldBonus * 100)}%</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="total-gathered">
        <h3>Total Resources Gathered</h3>
        <div class="resource-list">
          ${Object.entries(stats.totalGathered).slice(0, 20).map(([resourceId, amount]) => `
            <div class="resource-entry">
              <span class="resource-name">${escapeHtml(resourceId.replace(/_/g, ' '))}</span>
              <span class="resource-amount">x${amount}</span>
            </div>
          `).join('')}
          ${Object.keys(stats.totalGathered).length === 0 ?
            '<div class="no-resources">No resources gathered yet</div>' : ''}
        </div>
        <div class="total-unique">
          ${stats.totalUniqueResources} unique resources discovered
        </div>
      </div>
    </div>
  `;

  return html;
}

/**
 * Render gathering log
 */
export function renderGatheringLog(state, options = {}) {
  const { limit = 10 } = options;
  const stats = getGatheringStats(state);
  const recentGathers = stats.recentGathers.slice(-limit).reverse();

  if (recentGathers.length === 0) {
    return '<div class="gathering-log empty">No recent gathering activity</div>';
  }

  return `
    <div class="gathering-log">
      <h3>Recent Activity</h3>
      <div class="log-entries">
        ${recentGathers.map(entry => {
          const node = RESOURCE_NODES[entry.nodeId];
          const time = new Date(entry.timestamp).toLocaleTimeString();
          return `
            <div class="log-entry">
              <div class="entry-header">
                <span class="node-name">${escapeHtml(node?.name || 'Unknown')}</span>
                <span class="timestamp">${time}</span>
              </div>
              <div class="entry-items">
                ${entry.gathered.map(item => `
                  <span class="item">${escapeHtml(item.id.replace(/_/g, ' '))} x${item.amount}</span>
                `).join(', ')}
                ${entry.gathered.length === 0 ? '<span class="item empty">Nothing</span>' : ''}
              </div>
              <div class="entry-exp">+${entry.exp} EXP</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Render node tooltip
 */
export function renderNodeTooltip(nodeId) {
  const node = RESOURCE_NODES[nodeId];
  if (!node) return '';

  return `
    <div class="node-tooltip">
      <div class="tooltip-header" style="color: ${node.skill.color}">
        ${escapeHtml(node.name)}
      </div>
      <div class="tooltip-skill">
        ${getSkillIcon(node.skill.icon)} ${escapeHtml(node.skill.name)} Lv.${node.requiredLevel}
      </div>
      <div class="tooltip-time">
        Gather Time: ${(node.gatherTime / 1000).toFixed(1)}s
      </div>
      <div class="tooltip-exp">
        Experience: +${node.baseExp}
      </div>
      <div class="tooltip-resources">
        <div class="resources-header">Possible Resources:</div>
        ${node.resources.map(r => `
          <div class="resource-row">
            <span class="name">${escapeHtml(r.id.replace(/_/g, ' '))}</span>
            <span class="chance">${Math.round(r.chance * 100)}%</span>
            <span class="amount">${r.minAmount}-${r.maxAmount}</span>
          </div>
        `).join('')}
      </div>
      <div class="tooltip-deplete">
        Deplete Chance: ${Math.round(node.depleteChance * 100)}%
      </div>
    </div>
  `;
}

/**
 * Render tool tooltip
 */
export function renderToolTooltip(toolId) {
  const tool = GATHERING_TOOLS[toolId];
  if (!tool) return '';

  return `
    <div class="tool-tooltip">
      <div class="tooltip-header">${escapeHtml(tool.name)}</div>
      <div class="tooltip-skill" style="color: ${tool.skill.color}">
        ${getSkillIcon(tool.skill.icon)} ${escapeHtml(tool.skill.name)}
      </div>
      <div class="tooltip-stats">
        <div class="stat-row">
          <span class="label">Speed Bonus:</span>
          <span class="value ${tool.speedBonus > 0 ? 'positive' : ''}">
            +${Math.round(tool.speedBonus * 100)}%
          </span>
        </div>
        <div class="stat-row">
          <span class="label">Yield Bonus:</span>
          <span class="value ${tool.yieldBonus > 0 ? 'positive' : ''}">
            +${Math.round(tool.yieldBonus * 100)}%
          </span>
        </div>
        <div class="stat-row">
          <span class="label">Rare Chance:</span>
          <span class="value ${tool.rareChanceBonus > 0 ? 'positive' : ''}">
            +${Math.round(tool.rareChanceBonus * 100)}%
          </span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render world map gathering overlay
 */
export function renderGatheringMapOverlay(state, locationId, nodes = []) {
  return `
    <div class="gathering-map-overlay">
      <div class="overlay-header">
        <h4>Gathering Nodes</h4>
        <span class="node-count">${nodes.length} nodes</span>
      </div>
      <div class="nodes-on-map">
        ${nodes.map(nodeData => {
          const node = RESOURCE_NODES[nodeData.nodeId];
          return `
            <div class="map-node ${nodeData.depleted ? 'depleted' : 'active'}"
                 data-instance-id="${nodeData.instanceId}"
                 style="border-color: ${node?.skill.color || '#888'}">
              <span class="node-icon">${getSkillIcon(node?.skill.icon)}</span>
              <span class="node-name">${escapeHtml(node?.name || 'Unknown')}</span>
              ${nodeData.depleted ? '<span class="depleted-indicator">Depleted</span>' : ''}
            </div>
          `;
        }).join('')}
        ${nodes.length === 0 ? '<div class="no-nodes">No gathering nodes here</div>' : ''}
      </div>
    </div>
  `;
}

/**
 * Get CSS styles for gathering system
 */
export function getGatheringStyles() {
  return `
    .gathering-skill-panel {
      background: #1a1a2e;
      border-radius: 8px;
      padding: 16px;
      color: #fff;
    }

    .skills-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .skill-card {
      background: #2a2a4e;
      border-radius: 8px;
      padding: 12px;
      border-left: 4px solid;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .skill-card:hover {
      transform: translateY(-2px);
    }

    .skill-card.selected {
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
    }

    .skill-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .skill-icon {
      font-size: 24px;
    }

    .skill-level {
      margin-left: auto;
      font-weight: bold;
    }

    .skill-progress-bar {
      height: 8px;
      background: #1a1a2e;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 4px;
    }

    .progress-fill {
      height: 100%;
      transition: width 0.3s;
    }

    .gathering-progress {
      background: #2a2a4e;
      border-radius: 8px;
      padding: 16px;
    }

    .gathering-progress.inactive {
      opacity: 0.6;
      text-align: center;
    }

    .progress-bar-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .progress-bar {
      flex: 1;
      height: 20px;
      background: #1a1a2e;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill.complete {
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .node-item {
      display: flex;
      align-items: center;
      padding: 12px;
      background: #2a2a4e;
      border-radius: 4px;
      margin-bottom: 8px;
      gap: 12px;
    }

    .node-item.locked {
      opacity: 0.5;
    }

    .node-item.available {
      border-left: 4px solid #4CAF50;
    }

    .gathering-result {
      background: linear-gradient(135deg, #1a3a1a, #2a4a2a);
      border-radius: 8px;
      padding: 16px;
      border: 2px solid #4CAF50;
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .gathered-item {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .level-up-notice {
      margin-top: 12px;
      padding: 8px;
      background: #FFD700;
      color: #000;
      border-radius: 4px;
      text-align: center;
      font-weight: bold;
    }

    .depleted-notice {
      margin-top: 8px;
      color: #ff6b6b;
      font-size: 12px;
    }

    .tool-item {
      display: flex;
      align-items: center;
      padding: 12px;
      background: #2a2a4e;
      border-radius: 4px;
      margin-bottom: 8px;
      gap: 12px;
    }

    .tool-item.equipped {
      border: 2px solid #4CAF50;
    }

    .tool-stats .stat {
      display: inline-block;
      padding: 2px 6px;
      background: rgba(76, 175, 80, 0.2);
      border-radius: 4px;
      font-size: 12px;
      margin-right: 4px;
    }

    .daily-bonus {
      padding: 12px;
      background: #2a2a4e;
      border-radius: 8px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .daily-bonus.available {
      background: linear-gradient(135deg, #3a3a1e, #4a4a2e);
      border: 2px solid #FFD700;
    }

    .node-tooltip, .tool-tooltip {
      background: #1a1a2e;
      border: 1px solid #444;
      border-radius: 4px;
      padding: 12px;
      max-width: 300px;
    }

    .tooltip-header {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 8px;
    }

    .resources-header {
      margin-top: 8px;
      font-weight: bold;
    }

    .resource-row {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
      font-size: 12px;
    }

    .stat-row .value.positive {
      color: #4CAF50;
    }
  `;
}
