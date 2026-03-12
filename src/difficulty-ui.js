/**
 * Difficulty Settings UI Module
 * Renders difficulty selection panel for settings and character creation.
 * Created by Claude Opus 4.5 (Day 345)
 */

import {
  DIFFICULTY_LEVELS,
  DEFAULT_DIFFICULTY,
  getAllDifficultyLevels,
  getDifficultyName,
  getDifficultyDescription,
  getDifficultyIcon,
  getDifficultyColor,
  getDifficultyMultipliers,
} from './difficulty.js';

/**
 * Render the difficulty selection panel
 * @param {string} currentDifficulty - Currently selected difficulty
 * @param {Object} options - Rendering options
 * @param {boolean} options.showMultipliers - Whether to show stat multipliers
 * @param {boolean} options.compact - Use compact layout
 * @returns {string} HTML string
 */
export function renderDifficultyPanel(currentDifficulty, options = {}) {
  const { showMultipliers = true, compact = false } = options;
  const levels = getAllDifficultyLevels();
  const current = currentDifficulty || DEFAULT_DIFFICULTY;

  if (compact) {
    return renderCompactDifficultyPanel(current, levels);
  }

  const levelCards = levels.map(level => {
    const isSelected = level.id === current;
    const icon = getDifficultyIcon(level.id);
    const color = getDifficultyColor(level.id);
    const multipliers = level.multipliers;

    let multiplierHtml = '';
    if (showMultipliers) {
      const formatMult = (val, label, invert = false) => {
        const display = Math.round(val * 100);
        const isNeutral = display === 100;
        const isGood = invert ? display < 100 : display > 100;
        const isBad = invert ? display > 100 : display < 100;
        const colorClass = isNeutral ? 'neutral' : (isGood ? 'good' : 'bad');
        return `<span class="diff-mult ${colorClass}">${label}: ${display}%</span>`;
      };

      multiplierHtml = `
        <div class="diff-multipliers">
          ${formatMult(multipliers.enemyDamage, 'Enemy Dmg', true)}
          ${formatMult(multipliers.enemyHp, 'Enemy HP', true)}
          ${formatMult(multipliers.xpReward, 'XP Reward')}
          ${formatMult(multipliers.goldReward, 'Gold Reward')}
        </div>
      `;
    }

    return `
      <div class="diff-card ${isSelected ? 'selected' : ''}" 
           data-difficulty="${level.id}"
           style="--diff-color: ${color};">
        <div class="diff-header">
          <span class="diff-icon">${icon}</span>
          <span class="diff-name" style="color: ${color};">${level.name}</span>
          ${isSelected ? '<span class="diff-selected-badge">✓ Selected</span>' : ''}
        </div>
        <p class="diff-desc">${level.description}</p>
        ${multiplierHtml}
        ${!isSelected ? `<button class="diff-select-btn" data-difficulty="${level.id}">Select</button>` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="difficulty-panel">
      <h3 class="diff-title">Game Difficulty</h3>
      <p class="diff-subtitle">Choose your challenge level. This can be changed later in Settings.</p>
      <div class="diff-cards">
        ${levelCards}
      </div>
    </div>
  `;
}

/**
 * Render a compact difficulty selector (for settings menu)
 * @param {string} current - Current difficulty
 * @param {Array} levels - All difficulty levels
 * @returns {string} HTML string
 */
function renderCompactDifficultyPanel(current, levels) {
  const options = levels.map(level => {
    const icon = getDifficultyIcon(level.id);
    const selected = level.id === current ? 'selected' : '';
    return `<option value="${level.id}" ${selected}>${icon} ${level.name}</option>`;
  }).join('');

  const currentLevel = levels.find(l => l.id === current) || levels[1];
  const currentColor = getDifficultyColor(current);
  const currentIcon = getDifficultyIcon(current);

  return `
    <div class="difficulty-compact">
      <div class="diff-compact-row">
        <label for="difficultySelect">Difficulty:</label>
        <select id="difficultySelect" class="diff-select">
          ${options}
        </select>
      </div>
      <div class="diff-compact-preview" style="border-color: ${currentColor};">
        <span class="diff-compact-icon">${currentIcon}</span>
        <span class="diff-compact-desc">${currentLevel.description}</span>
      </div>
    </div>
  `;
}

/**
 * Render difficulty indicator for HUD/status display
 * @param {string} difficulty - Current difficulty
 * @returns {string} HTML string
 */
export function renderDifficultyIndicator(difficulty) {
  const icon = getDifficultyIcon(difficulty);
  const name = getDifficultyName(difficulty);
  const color = getDifficultyColor(difficulty);

  return `<span class="diff-indicator" style="color: ${color};" title="Difficulty: ${name}">${icon} ${name}</span>`;
}

/**
 * Get CSS styles for difficulty UI components
 * @returns {string} CSS string
 */
export function getDifficultyStyles() {
  return `
    .difficulty-panel {
      padding: 16px;
    }

    .diff-title {
      margin: 0 0 4px 0;
      color: #fff;
      font-size: 1.2em;
    }

    .diff-subtitle {
      margin: 0 0 16px 0;
      color: #888;
      font-size: 0.9em;
    }

    .diff-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .diff-card {
      background: #1a1a2e;
      border: 2px solid #333;
      border-radius: 8px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .diff-card:hover {
      border-color: var(--diff-color, #666);
      background: #252540;
    }

    .diff-card.selected {
      border-color: var(--diff-color, #4f4);
      background: #202038;
      box-shadow: 0 0 8px var(--diff-color, #4f4);
    }

    .diff-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .diff-icon {
      font-size: 1.4em;
    }

    .diff-name {
      font-weight: bold;
      font-size: 1.1em;
    }

    .diff-selected-badge {
      margin-left: auto;
      background: #4f4;
      color: #000;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.75em;
      font-weight: bold;
    }

    .diff-desc {
      color: #aaa;
      font-size: 0.85em;
      margin: 0 0 8px 0;
      line-height: 1.4;
    }

    .diff-multipliers {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 8px;
    }

    .diff-mult {
      font-size: 0.75em;
      padding: 2px 6px;
      border-radius: 3px;
      background: #333;
    }

    .diff-mult.good {
      color: #4f4;
      background: rgba(68, 255, 68, 0.15);
    }

    .diff-mult.bad {
      color: #f44;
      background: rgba(255, 68, 68, 0.15);
    }

    .diff-mult.neutral {
      color: #888;
    }

    .diff-select-btn {
      width: 100%;
      padding: 8px;
      background: var(--diff-color, #444);
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      transition: opacity 0.2s;
    }

    .diff-select-btn:hover {
      opacity: 0.85;
    }

    /* Compact styles for settings */
    .difficulty-compact {
      margin: 8px 0;
    }

    .diff-compact-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .diff-compact-row label {
      color: #ccc;
      font-weight: bold;
    }

    .diff-select {
      padding: 6px 12px;
      background: #2a2a3e;
      color: #fff;
      border: 1px solid #444;
      border-radius: 4px;
      font-size: 1em;
      cursor: pointer;
    }

    .diff-compact-preview {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px;
      background: #1a1a2e;
      border: 1px solid #444;
      border-radius: 4px;
    }

    .diff-compact-icon {
      font-size: 1.2em;
    }

    .diff-compact-desc {
      color: #aaa;
      font-size: 0.85em;
      line-height: 1.3;
    }

    /* Indicator for HUD */
    .diff-indicator {
      font-size: 0.85em;
      padding: 2px 6px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 3px;
    }
  `;
}

/**
 * Attach event handlers for difficulty selection
 * @param {Function} onDifficultyChange - Callback when difficulty changes
 */
export function attachDifficultyHandlers(onDifficultyChange) {
  // Handle card clicks
  document.querySelectorAll('.diff-card').forEach(card => {
    card.addEventListener('click', () => {
      const difficulty = card.dataset.difficulty;
      if (difficulty && onDifficultyChange) {
        onDifficultyChange(difficulty);
      }
    });
  });

  // Handle select button clicks
  document.querySelectorAll('.diff-select-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const difficulty = btn.dataset.difficulty;
      if (difficulty && onDifficultyChange) {
        onDifficultyChange(difficulty);
      }
    });
  });

  // Handle dropdown change (compact mode)
  const select = document.getElementById('difficultySelect');
  if (select) {
    select.addEventListener('change', () => {
      if (onDifficultyChange) {
        onDifficultyChange(select.value);
      }
    });
  }
}
