/**
 * Skill Chain System UI
 * UI components for creating and managing skill chains
 */

import {
  SKILL_ELEMENTS,
  SKILL_TYPES,
  CHAIN_BONUSES,
  CHAIN_RARITY,
  analyzeChain,
  getEffectiveCooldown,
  getEffectiveManaCost,
  getChainStats,
  canChain,
  getChainRecommendations
} from './skill-chain-system.js';

// Helper function to escape HTML
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Element icons
export const ELEMENT_ICONS = {
  [SKILL_ELEMENTS.FIRE]: '🔥',
  [SKILL_ELEMENTS.ICE]: '❄️',
  [SKILL_ELEMENTS.LIGHTNING]: '⚡',
  [SKILL_ELEMENTS.EARTH]: '🪨',
  [SKILL_ELEMENTS.WIND]: '💨',
  [SKILL_ELEMENTS.WATER]: '💧',
  [SKILL_ELEMENTS.LIGHT]: '✨',
  [SKILL_ELEMENTS.DARK]: '🌑',
  [SKILL_ELEMENTS.PHYSICAL]: '👊',
  [SKILL_ELEMENTS.ARCANE]: '🔮'
};

// Skill type icons
export const TYPE_ICONS = {
  [SKILL_TYPES.ATTACK]: '⚔️',
  [SKILL_TYPES.DEFENSE]: '🛡️',
  [SKILL_TYPES.BUFF]: '⬆️',
  [SKILL_TYPES.DEBUFF]: '⬇️',
  [SKILL_TYPES.HEAL]: '💚',
  [SKILL_TYPES.UTILITY]: '🔧'
};

// Render the main skill chain panel
export function renderSkillChainPanel(state, availableSkills = []) {
  const stats = getChainStats(state);

  return `
    <div class="skill-chain-panel">
      <div class="chain-header">
        <h2>⛓️ Skill Chains</h2>
        <div class="chain-summary">
          <span class="chain-count">${state.savedChains.length}/${state.maxSavedChains} Chains</span>
          <span class="slot-count">🔓 ${state.unlockedSlots} Slots</span>
        </div>
      </div>

      <div class="chain-tabs">
        <button class="tab-btn active" data-tab="saved">Saved Chains</button>
        <button class="tab-btn" data-tab="create">Create New</button>
        <button class="tab-btn" data-tab="stats">Statistics</button>
      </div>

      <div class="chain-content">
        ${renderSavedChains(state)}
      </div>

      ${state.activeChain ? `
        <div class="active-chain-bar">
          <span class="active-label">Active:</span>
          <span class="active-name" style="color: ${state.activeChain.rarity.color}">
            ${escapeHtml(state.activeChain.name)}
          </span>
          <button class="execute-btn" data-chain-id="${escapeHtml(state.activeChain.id)}">
            Execute Chain
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

// Render saved chains list
export function renderSavedChains(state) {
  if (state.savedChains.length === 0) {
    return `
      <div class="no-chains">
        <p>No saved chains yet.</p>
        <p>Create your first skill chain to unleash powerful combos!</p>
      </div>
    `;
  }

  return `
    <div class="saved-chains-list">
      ${state.savedChains.map(chain => renderChainCard(chain, state.activeChain?.id === chain.id)).join('')}
    </div>
  `;
}

// Render a single chain card
export function renderChainCard(chain, isActive = false) {
  const effectiveMana = getEffectiveManaCost(chain);
  const effectiveCooldown = getEffectiveCooldown(chain);

  return `
    <div class="chain-card ${isActive ? 'active' : ''}" data-chain-id="${escapeHtml(chain.id)}">
      <div class="chain-card-header">
        <span class="chain-rarity" style="color: ${chain.rarity.color}">
          ${chain.rarity.name}
        </span>
        <span class="chain-name">${escapeHtml(chain.name)}</span>
        ${isActive ? '<span class="active-badge">Active</span>' : ''}
      </div>

      <div class="chain-skills">
        ${chain.skills.map((skill, i) => `
          <div class="chain-skill-node">
            <span class="skill-icon">${ELEMENT_ICONS[skill.element] || '❓'}</span>
            <span class="skill-name">${escapeHtml(skill.name)}</span>
          </div>
          ${i < chain.skills.length - 1 ? '<span class="chain-arrow">→</span>' : ''}
        `).join('')}
      </div>

      <div class="chain-stats">
        <span class="stat">🔗 ${chain.length} skills</span>
        <span class="stat">✨ ${chain.synergyCount} synergies</span>
        <span class="stat">💠 ${effectiveMana} mana</span>
        <span class="stat">⏱️ ${effectiveCooldown}s CD</span>
      </div>

      <div class="chain-bonuses">
        ${Object.entries(chain.bonuses)
          .filter(([key, val]) => val > 0 && key !== 'lengthBonus')
          .slice(0, 3)
          .map(([key, val]) => `
            <span class="bonus-tag">+${Math.round(val * 100)}% ${CHAIN_BONUSES[key]?.name || key}</span>
          `).join('')}
      </div>

      <div class="chain-actions">
        <button class="set-active-btn" data-chain-id="${escapeHtml(chain.id)}">
          ${isActive ? '✓ Active' : 'Set Active'}
        </button>
        <button class="delete-btn" data-chain-id="${escapeHtml(chain.id)}">🗑️</button>
      </div>
    </div>
  `;
}

// Render chain creation interface
export function renderChainCreator(availableSkills, selectedSkills = []) {
  const analysis = selectedSkills.length >= 2 ? analyzeChain(selectedSkills) : null;
  const recommendations = getChainRecommendations(selectedSkills, availableSkills);

  return `
    <div class="chain-creator">
      <h3>Create New Chain</h3>

      <div class="selected-skills">
        <div class="skills-track">
          ${Array(6).fill(null).map((_, i) => {
            const skill = selectedSkills[i];
            return `
              <div class="skill-slot ${skill ? 'filled' : 'empty'}" data-slot="${i}">
                ${skill ? `
                  <span class="slot-icon">${ELEMENT_ICONS[skill.element]}</span>
                  <span class="slot-name">${escapeHtml(skill.name)}</span>
                  <button class="remove-skill-btn" data-slot="${i}">×</button>
                ` : `
                  <span class="slot-placeholder">${i + 1}</span>
                `}
              </div>
              ${i < 5 ? '<span class="slot-connector">→</span>' : ''}
            `;
          }).join('')}
        </div>
      </div>

      ${analysis ? renderChainPreview(analysis) : `
        <div class="chain-preview-placeholder">
          Add at least 2 skills to see chain analysis
        </div>
      `}

      <div class="available-skills">
        <h4>Available Skills</h4>
        <div class="skill-grid">
          ${recommendations.map(skill => renderSkillOption(skill, selectedSkills)).join('')}
        </div>
      </div>

      <div class="creator-actions">
        <input type="text" class="chain-name-input" placeholder="Chain name..." />
        <button class="save-chain-btn" ${selectedSkills.length < 2 ? 'disabled' : ''}>
          Save Chain
        </button>
        <button class="clear-btn">Clear</button>
      </div>
    </div>
  `;
}

// Render chain preview with analysis
export function renderChainPreview(analysis) {
  return `
    <div class="chain-preview">
      <div class="preview-header" style="border-color: ${analysis.rarity.color}">
        <span class="rarity-badge" style="background: ${analysis.rarity.color}">
          ${analysis.rarity.name}
        </span>
        ${analysis.isPerfect ? '<span class="perfect-badge">⭐ Perfect Chain!</span>' : ''}
      </div>

      <div class="preview-stats">
        <div class="stat-row">
          <span>Synergies:</span>
          <span class="value positive">+${analysis.synergyCount}</span>
        </div>
        <div class="stat-row">
          <span>Conflicts:</span>
          <span class="value ${analysis.conflictCount > 0 ? 'negative' : ''}">${analysis.conflictCount}</span>
        </div>
        <div class="stat-row">
          <span>Total Mana:</span>
          <span class="value">${analysis.totalManaCost}</span>
        </div>
        <div class="stat-row">
          <span>Cooldown:</span>
          <span class="value">${analysis.totalCooldown}s</span>
        </div>
      </div>

      <div class="preview-bonuses">
        <h5>Bonuses</h5>
        ${Object.entries(analysis.bonuses)
          .filter(([key, val]) => val > 0)
          .map(([key, val]) => `
            <div class="bonus-row">
              <span>${CHAIN_BONUSES[key]?.name || key}:</span>
              <span class="bonus-value">+${Math.round(val * 100)}%</span>
            </div>
          `).join('')}
      </div>

      ${analysis.specialCombos.length > 0 ? `
        <div class="special-combos">
          <h5>Special Combos</h5>
          ${analysis.specialCombos.map(combo => `
            <div class="combo-badge">${escapeHtml(combo.name)}</div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

// Render a skill option in the creator
export function renderSkillOption(skill, selectedSkills) {
  const isSelected = selectedSkills.some(s => s.id === skill.id);
  const recommendation = skill.recommendation || 'neutral';

  return `
    <div class="skill-option ${isSelected ? 'selected' : ''} ${recommendation}"
         data-skill-id="${escapeHtml(skill.id)}">
      <div class="skill-header">
        <span class="element-icon">${ELEMENT_ICONS[skill.element] || '❓'}</span>
        <span class="type-icon">${TYPE_ICONS[skill.type] || '❓'}</span>
      </div>
      <span class="skill-name">${escapeHtml(skill.name)}</span>
      <div class="skill-cost">
        <span>💠 ${skill.manaCost}</span>
        <span>⏱️ ${skill.cooldown}s</span>
      </div>
      ${recommendation === 'synergy' ? '<span class="synergy-indicator">✨</span>' : ''}
      ${recommendation === 'conflict' ? '<span class="conflict-indicator">⚠️</span>' : ''}
    </div>
  `;
}

// Render chain execution result
export function renderExecutionResult(execution) {
  return `
    <div class="execution-result">
      <div class="result-header">
        <span class="result-icon">⛓️</span>
        <span class="result-title">Chain Executed!</span>
        ${execution.wasPerfect ? '<span class="perfect-badge">⭐ Perfect!</span>' : ''}
      </div>

      <div class="skills-executed">
        ${execution.skills.map(name => `<span class="skill-tag">${escapeHtml(name)}</span>`).join(' → ')}
      </div>

      <div class="result-stats">
        <div class="stat-row">
          <span>Total Damage:</span>
          <span class="damage-value">${execution.damage}</span>
        </div>
        <div class="stat-row">
          <span>Mana Used:</span>
          <span>${execution.manaCost}</span>
        </div>
      </div>

      ${execution.specialCombos.length > 0 ? `
        <div class="triggered-combos">
          <span>Combos Triggered:</span>
          ${execution.specialCombos.map(c => `<span class="combo-tag">${escapeHtml(c.name)}</span>`).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

// Render chain statistics panel
export function renderChainStatsPanel(state) {
  const stats = getChainStats(state);

  return `
    <div class="chain-stats-panel">
      <h3>📊 Chain Statistics</h3>

      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">${stats.chainsExecuted}</span>
          <span class="stat-label">Chains Executed</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${stats.perfectChains}</span>
          <span class="stat-label">Perfect Chains</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${stats.longestChain}</span>
          <span class="stat-label">Longest Chain</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${stats.totalDamageBonus}</span>
          <span class="stat-label">Bonus Damage Dealt</span>
        </div>
      </div>

      <div class="rarity-breakdown">
        <h4>Chains by Rarity</h4>
        <div class="rarity-bars">
          ${Object.entries(stats.rarityBreakdown).map(([rarity, count]) => `
            <div class="rarity-row">
              <span class="rarity-name" style="color: ${CHAIN_RARITY[rarity.toUpperCase()]?.color || '#888'}">
                ${rarity}
              </span>
              <div class="rarity-bar">
                <div class="bar-fill" style="width: ${Math.min(100, count * 20)}%; background: ${CHAIN_RARITY[rarity.toUpperCase()]?.color || '#888'}"></div>
              </div>
              <span class="rarity-count">${count}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// Render chain synergy guide
export function renderSynergyGuide() {
  return `
    <div class="synergy-guide">
      <h4>Element Synergies</h4>
      <p>Chain skills with matching elements for bonus effects!</p>

      <div class="synergy-grid">
        ${Object.entries(ELEMENT_ICONS).map(([element, icon]) => `
          <div class="element-card">
            <span class="element-icon">${icon}</span>
            <span class="element-name">${element}</span>
          </div>
        `).join('')}
      </div>

      <div class="synergy-tips">
        <h5>Tips</h5>
        <ul>
          <li>🔥 Fire synergizes with 💨 Wind and 🪨 Earth</li>
          <li>❄️ Ice synergizes with 💧 Water and 💨 Wind</li>
          <li>⚡ Lightning synergizes with 💧 Water and 💨 Wind</li>
          <li>Avoid conflicting elements like 🔥 Fire + 💧 Water</li>
        </ul>
      </div>
    </div>
  `;
}

// Render mini chain display (for HUD)
export function renderMiniChainDisplay(activeChain) {
  if (!activeChain) {
    return `<div class="mini-chain empty">No active chain</div>`;
  }

  return `
    <div class="mini-chain">
      <span class="chain-rarity-dot" style="background: ${activeChain.rarity.color}"></span>
      <span class="chain-name">${escapeHtml(activeChain.name)}</span>
      <span class="chain-skills-preview">
        ${activeChain.skills.slice(0, 3).map(s => ELEMENT_ICONS[s.element]).join('')}
        ${activeChain.skills.length > 3 ? '...' : ''}
      </span>
    </div>
  `;
}

// Render delete confirmation
export function renderDeleteConfirmation(chain) {
  return `
    <div class="delete-confirmation">
      <h4>Delete Chain?</h4>
      <p>Are you sure you want to delete <strong style="color: ${chain.rarity.color}">${escapeHtml(chain.name)}</strong>?</p>
      <p class="warning">This action cannot be undone.</p>
      <div class="confirmation-buttons">
        <button class="confirm-delete-btn" data-chain-id="${escapeHtml(chain.id)}">Delete</button>
        <button class="cancel-btn">Cancel</button>
      </div>
    </div>
  `;
}

// Export styles
export const SKILL_CHAIN_STYLES = `
  .skill-chain-panel {
    background: #1a1a2e;
    border-radius: 12px;
    padding: 20px;
    color: #fff;
    font-family: sans-serif;
  }

  .chain-card {
    background: #2a2a4a;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
    transition: transform 0.2s;
  }

  .chain-card:hover {
    transform: translateY(-2px);
  }

  .chain-card.active {
    border: 2px solid #4CAF50;
  }

  .chain-skills {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 12px 0;
    overflow-x: auto;
  }

  .chain-skill-node {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px;
    background: #3a3a5a;
    border-radius: 8px;
    min-width: 60px;
  }

  .chain-arrow {
    color: #888;
    font-size: 20px;
  }

  .skill-slot {
    width: 80px;
    height: 80px;
    border: 2px dashed #555;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .skill-slot.filled {
    border-style: solid;
    border-color: #4CAF50;
    background: #2a2a4a;
  }

  .skill-option {
    padding: 12px;
    background: #2a2a4a;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .skill-option.synergy {
    border-left: 3px solid #4CAF50;
  }

  .skill-option.conflict {
    border-left: 3px solid #F44336;
  }

  .skill-option.selected {
    opacity: 0.5;
    pointer-events: none;
  }

  .execution-result {
    background: linear-gradient(135deg, #1a1a2e 0%, #2a2a4a 100%);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from { transform: translateY(-20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .bonus-tag {
    background: rgba(76, 175, 80, 0.2);
    color: #4CAF50;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    margin-right: 4px;
  }
`;
