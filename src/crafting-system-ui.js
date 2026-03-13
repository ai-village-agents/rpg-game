/**
 * Crafting System UI Components
 * UI for crafting items from recipes
 */

import {
  CRAFTING_CATEGORIES,
  QUALITY_LEVELS,
  WORKSTATIONS,
  getKnownRecipes,
  getRecipesByCategory,
  hasIngredients,
  getMissingIngredients,
  getSkillLevel,
  calculateSuccessChance,
  getCraftingProgress,
  getCraftingStats,
  getCraftableRecipes
} from './crafting-system.js';

// HTML escape helper
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Render crafting panel
export function renderCraftingPanel(state, registry, inventory = {}, itemData = {}) {
  const progress = getCraftingProgress(state);

  return `
    <div class="crafting-panel">
      <div class="crafting-header">
        <h2>Crafting</h2>
        ${renderSkillLevels(state)}
      </div>

      <div class="crafting-categories">
        ${renderCategoryTabs(state)}
      </div>

      <div class="crafting-content">
        <div class="recipe-list">
          ${renderRecipeList(state, registry, inventory, itemData)}
        </div>
        <div class="crafting-sidebar">
          ${progress.active
            ? renderCraftingProgress(state, registry, itemData)
            : renderRecipeDetails(state, registry, inventory, itemData)}
        </div>
      </div>

      <div class="crafting-queue">
        ${renderCraftingQueue(state, registry, itemData)}
      </div>
    </div>
  `;
}

// Render skill levels
function renderSkillLevels(state) {
  const skills = Object.keys(CRAFTING_CATEGORIES).map(cat => {
    const level = getSkillLevel(state, cat);
    const info = CRAFTING_CATEGORIES[cat];
    return `<span class="skill-badge" title="${escapeHtml(info.name)}">${info.icon} ${level}</span>`;
  }).join('');

  return `<div class="skill-levels">${skills}</div>`;
}

// Render category tabs
function renderCategoryTabs(state) {
  return Object.entries(CRAFTING_CATEGORIES).map(([key, cat]) => {
    const count = state.knownRecipes.length; // Simplified
    return `
      <button class="category-tab" data-category="${escapeHtml(key)}" title="${escapeHtml(cat.description)}">
        <span class="tab-icon">${cat.icon}</span>
        <span class="tab-name">${escapeHtml(cat.name)}</span>
      </button>
    `;
  }).join('');
}

// Render recipe list
function renderRecipeList(state, registry, inventory, itemData) {
  const recipes = getKnownRecipes(state, registry);

  if (recipes.length === 0) {
    return '<p class="no-recipes">No recipes known. Find recipe scrolls or discover new recipes!</p>';
  }

  const items = recipes.map(recipe => {
    const canCraft = hasIngredients(recipe, inventory);
    const skillLevel = getSkillLevel(state, recipe.category);
    const hasSkill = skillLevel >= recipe.requiredLevel;
    const catInfo = CRAFTING_CATEGORIES[recipe.category];
    const outputName = itemData[recipe.output.itemId]?.name || recipe.output.itemId;

    return `
      <div class="recipe-item ${canCraft && hasSkill ? 'craftable' : 'unavailable'}"
           data-recipe-id="${escapeHtml(recipe.id)}">
        <span class="recipe-category">${catInfo?.icon || '?'}</span>
        <div class="recipe-info">
          <span class="recipe-name">${escapeHtml(recipe.name)}</span>
          <span class="recipe-output">Creates: ${escapeHtml(outputName)} x${recipe.output.quantity}</span>
        </div>
        <div class="recipe-status">
          ${!hasSkill ? `<span class="level-req">Lv${recipe.requiredLevel}</span>` : ''}
          ${canCraft ? '<span class="can-craft">Ready</span>' : '<span class="missing-mats">Missing</span>'}
        </div>
      </div>
    `;
  }).join('');

  return `<div class="recipe-list-items">${items}</div>`;
}

// Render recipe details
function renderRecipeDetails(state, registry, inventory, itemData, selectedRecipeId = null) {
  if (!selectedRecipeId) {
    return '<p class="select-recipe">Select a recipe to view details</p>';
  }

  const recipe = registry.recipes[selectedRecipeId];
  if (!recipe) return '';

  const canCraft = hasIngredients(recipe, inventory);
  const missing = getMissingIngredients(recipe, inventory);
  const successChance = calculateSuccessChance(state, recipe);
  const catInfo = CRAFTING_CATEGORIES[recipe.category];
  const outputName = itemData[recipe.output.itemId]?.name || recipe.output.itemId;

  const ingredients = recipe.ingredients.map(ing => {
    const name = itemData[ing.itemId]?.name || ing.itemId;
    const available = inventory[ing.itemId] || 0;
    const hasEnough = available >= ing.quantity;

    return `
      <div class="ingredient ${hasEnough ? 'available' : 'missing'}">
        <span class="ing-name">${escapeHtml(name)}</span>
        <span class="ing-qty">${available}/${ing.quantity}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="recipe-details">
      <h3>${escapeHtml(recipe.name)}</h3>
      <div class="recipe-meta">
        <span>${catInfo?.icon} ${escapeHtml(catInfo?.name)}</span>
        <span>Level: ${recipe.requiredLevel}</span>
        <span>Time: ${(recipe.craftTime / 1000).toFixed(1)}s</span>
      </div>

      <div class="ingredients-section">
        <h4>Ingredients</h4>
        ${ingredients}
      </div>

      <div class="output-section">
        <h4>Output</h4>
        <span>${escapeHtml(outputName)} x${recipe.output.quantity}</span>
      </div>

      <div class="success-section">
        <div class="success-bar">
          <div class="success-fill" style="width: ${successChance}%"></div>
          <span class="success-text">${successChance}% Success</span>
        </div>
      </div>

      <button class="btn-craft" data-action="craft" data-recipe="${escapeHtml(recipe.id)}"
              ${!canCraft ? 'disabled' : ''}>
        ${canCraft ? 'Craft Item' : 'Missing Materials'}
      </button>
    </div>
  `;
}

// Render crafting progress
function renderCraftingProgress(state, registry, itemData) {
  const progress = getCraftingProgress(state);
  if (!progress.active) return '';

  const recipe = registry.recipes[progress.recipeId];
  if (!recipe) return '';

  const outputName = itemData[recipe.output.itemId]?.name || recipe.output.itemId;

  return `
    <div class="crafting-progress">
      <h4>Crafting in Progress</h4>
      <div class="progress-item">
        <span class="item-name">${escapeHtml(recipe.name)}</span>
        <span class="item-output">Creating: ${escapeHtml(outputName)}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progress.progress}%"></div>
        <span class="progress-text">${progress.progress}%</span>
      </div>
      <div class="progress-meta">
        <span>Time remaining: ${Math.ceil(progress.remaining / 1000)}s</span>
        <span>Success chance: ${progress.successChance}%</span>
      </div>
      <button class="btn-cancel" data-action="cancel">Cancel</button>
    </div>
  `;
}

// Render crafting queue
function renderCraftingQueue(state, registry, itemData) {
  if (state.craftingQueue.length === 0) {
    return '<p class="empty-queue">Queue is empty</p>';
  }

  const items = state.craftingQueue.map((item, index) => {
    const recipe = registry.recipes[item.recipeId];
    if (!recipe) return '';

    return `
      <div class="queue-item" data-index="${index}">
        <span class="queue-name">${escapeHtml(recipe.name)}</span>
        <button class="btn-remove-queue" data-action="remove-queue">×</button>
      </div>
    `;
  }).join('');

  return `
    <div class="queue-section">
      <div class="queue-header">
        <h4>Queue (${state.craftingQueue.length})</h4>
        <button class="btn-clear-queue" data-action="clear-queue">Clear</button>
      </div>
      <div class="queue-items">${items}</div>
    </div>
  `;
}

// Render crafting result notification
export function renderCraftingResult(result, recipe, itemData = {}) {
  const outputName = itemData[recipe?.output?.itemId]?.name || recipe?.output?.itemId || 'Item';
  const qualityInfo = result.quality ? QUALITY_LEVELS[result.quality] : null;

  if (!result.craftSuccess) {
    return `
      <div class="craft-result failure">
        <span class="result-icon">❌</span>
        <div class="result-content">
          <span class="result-title">Crafting Failed!</span>
          <span class="result-exp">+${result.experienceGained} XP (partial)</span>
        </div>
      </div>
    `;
  }

  return `
    <div class="craft-result success ${result.critical ? 'critical' : ''}">
      <span class="result-icon">${result.critical ? '⭐' : '✅'}</span>
      <div class="result-content">
        <span class="result-title">${result.critical ? 'Critical Success!' : 'Success!'}</span>
        <span class="result-item" style="color: ${qualityInfo?.color || '#FFF'}">
          ${escapeHtml(outputName)} x${result.output.quantity}
          ${qualityInfo ? `(${escapeHtml(qualityInfo.name)})` : ''}
        </span>
        <span class="result-exp">+${result.experienceGained} XP</span>
      </div>
    </div>
  `;
}

// Render stats panel
export function renderCraftingStatsPanel(state) {
  const stats = getCraftingStats(state);

  return `
    <div class="crafting-stats-panel">
      <h4>Crafting Statistics</h4>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-value">${stats.totalCrafts}</span>
          <span class="stat-label">Total Crafts</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.successRate}%</span>
          <span class="stat-label">Success Rate</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.criticalRate}%</span>
          <span class="stat-label">Critical Rate</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.totalRecipesKnown}</span>
          <span class="stat-label">Recipes Known</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.totalDiscoveries}</span>
          <span class="stat-label">Discoveries</span>
        </div>
      </div>
    </div>
  `;
}

// Render workstation panel
export function renderWorkstationPanel(workstationId) {
  const workstation = WORKSTATIONS[workstationId?.toUpperCase()];
  if (!workstation) {
    return '<p>Unknown workstation</p>';
  }

  const categories = workstation.categories.map(cat => {
    const info = CRAFTING_CATEGORIES[cat];
    return `<span class="ws-category">${info?.icon} ${escapeHtml(info?.name)}</span>`;
  }).join('');

  return `
    <div class="workstation-panel">
      <div class="workstation-header">
        <span class="ws-icon">${workstation.icon}</span>
        <h3>${escapeHtml(workstation.name)}</h3>
      </div>
      <div class="workstation-categories">
        <span>Supports: </span>${categories}
      </div>
    </div>
  `;
}

// Render discovery panel
export function renderDiscoveryPanel(state, itemData = {}) {
  if (state.discoveries.length === 0) {
    return '<p class="no-discoveries">No recipes discovered yet. Experiment with ingredients!</p>';
  }

  const discoveries = state.discoveries.map(d => {
    const date = new Date(d.discoveredAt).toLocaleDateString();
    return `
      <div class="discovery-item">
        <span class="discovery-recipe">${escapeHtml(d.recipeId)}</span>
        <span class="discovery-date">Discovered: ${date}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="discovery-panel">
      <h4>Discovered Recipes (${state.discoveries.length})</h4>
      <div class="discovery-list">${discoveries}</div>
    </div>
  `;
}

// Get crafting styles
export function getCraftingStyles() {
  return `
    .crafting-panel { background: #2a2a2a; border-radius: 12px; padding: 20px; }
    .crafting-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .skill-levels { display: flex; gap: 10px; }
    .skill-badge { background: #444; padding: 4px 8px; border-radius: 4px; font-size: 12px; }

    .crafting-categories { display: flex; gap: 5px; margin-bottom: 15px; overflow-x: auto; }
    .category-tab { padding: 8px 12px; background: #444; border: none; border-radius: 6px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .category-tab.active { background: #666; }
    .tab-icon { font-size: 20px; }
    .tab-name { font-size: 11px; }

    .crafting-content { display: grid; grid-template-columns: 1fr 300px; gap: 15px; }
    .recipe-list-items { max-height: 400px; overflow-y: auto; }
    .recipe-item { display: flex; align-items: center; gap: 10px; padding: 10px; background: #333; border-radius: 6px; margin-bottom: 8px; cursor: pointer; }
    .recipe-item.unavailable { opacity: 0.6; }
    .recipe-item:hover { background: #444; }
    .recipe-category { font-size: 20px; }
    .recipe-info { flex: 1; }
    .recipe-name { display: block; font-weight: bold; }
    .recipe-output { font-size: 12px; color: #888; }
    .can-craft { color: #4CAF50; font-size: 12px; }
    .missing-mats { color: #f44336; font-size: 12px; }
    .level-req { color: #ff9800; font-size: 12px; margin-right: 8px; }

    .recipe-details { background: #333; padding: 15px; border-radius: 8px; }
    .recipe-meta { display: flex; gap: 15px; color: #888; font-size: 13px; margin: 10px 0; }
    .ingredients-section, .output-section { margin: 15px 0; }
    .ingredient { display: flex; justify-content: space-between; padding: 5px 8px; background: #444; border-radius: 4px; margin-bottom: 5px; }
    .ingredient.missing { color: #f44336; }
    .ingredient.available { color: #4CAF50; }

    .success-bar { position: relative; height: 24px; background: #444; border-radius: 4px; overflow: hidden; }
    .success-fill { height: 100%; background: linear-gradient(90deg, #f44336, #ff9800, #4CAF50); }
    .success-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-weight: bold; }

    .btn-craft { width: 100%; padding: 12px; background: #4CAF50; border: none; border-radius: 6px; color: white; font-weight: bold; cursor: pointer; margin-top: 15px; }
    .btn-craft:disabled { background: #666; cursor: not-allowed; }

    .crafting-progress { background: #333; padding: 15px; border-radius: 8px; }
    .progress-bar { position: relative; height: 30px; background: #444; border-radius: 4px; overflow: hidden; margin: 15px 0; }
    .progress-fill { height: 100%; background: #2196F3; transition: width 0.3s; }
    .progress-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
    .btn-cancel { padding: 8px 16px; background: #f44336; border: none; border-radius: 4px; color: white; cursor: pointer; }

    .queue-section { margin-top: 15px; padding: 15px; background: #333; border-radius: 8px; }
    .queue-header { display: flex; justify-content: space-between; align-items: center; }
    .queue-item { display: flex; justify-content: space-between; padding: 8px; background: #444; border-radius: 4px; margin-top: 8px; }
    .btn-remove-queue { background: none; border: none; color: #f44336; cursor: pointer; font-size: 16px; }
    .btn-clear-queue { padding: 4px 8px; background: #666; border: none; border-radius: 4px; color: white; cursor: pointer; }

    .craft-result { display: flex; align-items: center; gap: 10px; padding: 15px; border-radius: 8px; }
    .craft-result.success { background: #1b5e20; }
    .craft-result.failure { background: #b71c1c; }
    .craft-result.critical { background: #4a148c; border: 2px solid gold; }
    .result-icon { font-size: 24px; }
    .result-content { display: flex; flex-direction: column; gap: 4px; }
    .result-title { font-weight: bold; }
    .result-exp { font-size: 12px; color: #8BC34A; }

    .crafting-stats-panel { background: #333; padding: 15px; border-radius: 8px; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px; }
    .stat-item { text-align: center; }
    .stat-value { display: block; font-size: 18px; font-weight: bold; }
    .stat-label { font-size: 11px; color: #888; }

    .workstation-panel { background: #333; padding: 15px; border-radius: 8px; }
    .workstation-header { display: flex; align-items: center; gap: 10px; }
    .ws-icon { font-size: 32px; }
    .workstation-categories { margin-top: 10px; }
    .ws-category { margin-right: 10px; }
  `;
}
