/**
 * Recipe Discovery System UI
 * UI components for recipe discovery and experimentation
 */

import {
  INGREDIENT_CATEGORIES,
  INGREDIENT_RARITY,
  RECIPE_CATEGORIES,
  DISCOVERY_DIFFICULTY,
  getDiscoveredRecipes,
  getDiscoveryProgress,
  getDiscoveryStats,
  getRecipeHints,
  getRecentExperiments,
  hasTriedCombination,
  getFavoriteIngredients
} from './recipe-discovery-system.js';

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

// Category icons
export const CATEGORY_ICONS = {
  [RECIPE_CATEGORIES.POTION]: '🧪',
  [RECIPE_CATEGORIES.WEAPON]: '⚔️',
  [RECIPE_CATEGORIES.ARMOR]: '🛡️',
  [RECIPE_CATEGORIES.ACCESSORY]: '💍',
  [RECIPE_CATEGORIES.CONSUMABLE]: '🍖',
  [RECIPE_CATEGORIES.ENCHANTMENT]: '✨',
  [RECIPE_CATEGORIES.TOOL]: '🔧',
  [RECIPE_CATEGORIES.SPECIAL]: '⭐'
};

// Ingredient category icons
export const INGREDIENT_ICONS = {
  [INGREDIENT_CATEGORIES.HERB]: '🌿',
  [INGREDIENT_CATEGORIES.MINERAL]: '💎',
  [INGREDIENT_CATEGORIES.ESSENCE]: '✨',
  [INGREDIENT_CATEGORIES.CREATURE]: '🦴',
  [INGREDIENT_CATEGORIES.FOOD]: '🍎',
  [INGREDIENT_CATEGORIES.METAL]: '⚙️',
  [INGREDIENT_CATEGORIES.WOOD]: '🪵',
  [INGREDIENT_CATEGORIES.CLOTH]: '🧵',
  [INGREDIENT_CATEGORIES.GEM]: '💠',
  [INGREDIENT_CATEGORIES.ARCANE]: '🔮'
};

// Render main discovery panel
export function renderDiscoveryPanel(state, registry, availableIngredients = []) {
  const progress = getDiscoveryProgress(state, registry);
  const stats = getDiscoveryStats(state);

  return `
    <div class="discovery-panel">
      <div class="discovery-header">
        <h2>🔬 Recipe Discovery</h2>
        <div class="discovery-summary">
          <span class="level-badge">Level ${stats.discoveryLevel}</span>
          <span class="progress-text">${progress.discovered}/${progress.total} Recipes</span>
        </div>
      </div>

      <div class="xp-bar">
        <div class="xp-fill" style="width: ${stats.levelProgress}%"></div>
        <span class="xp-text">${stats.progressToNextLevel}/${stats.xpNeeded} XP</span>
      </div>

      <div class="discovery-tabs">
        <button class="tab-btn active" data-tab="experiment">Experiment</button>
        <button class="tab-btn" data-tab="recipes">Recipes</button>
        <button class="tab-btn" data-tab="hints">Hints</button>
        <button class="tab-btn" data-tab="log">Log</button>
      </div>

      <div class="discovery-content">
        ${renderExperimentTab(state, availableIngredients)}
      </div>
    </div>
  `;
}

// Render experiment tab
export function renderExperimentTab(state, availableIngredients, selectedIngredients = []) {
  return `
    <div class="experiment-tab">
      <div class="workbench">
        <h3>🧪 Experimentation Workbench</h3>
        <div class="ingredient-slots">
          ${Array(5).fill(null).map((_, i) => {
            const ingredient = selectedIngredients[i];
            return `
              <div class="ingredient-slot ${ingredient ? 'filled' : 'empty'}" data-slot="${i}">
                ${ingredient ? `
                  <span class="slot-icon">${INGREDIENT_ICONS[ingredient.category] || '❓'}</span>
                  <span class="slot-name">${escapeHtml(ingredient.name)}</span>
                  <button class="remove-ingredient-btn" data-slot="${i}">×</button>
                ` : `
                  <span class="slot-placeholder">+</span>
                `}
              </div>
            `;
          }).join('')}
        </div>

        <div class="workbench-actions">
          <button class="experiment-btn" ${selectedIngredients.length < 2 ? 'disabled' : ''}>
            🔬 Experiment
          </button>
          <button class="clear-workbench-btn">Clear</button>
        </div>

        ${selectedIngredients.length >= 2 && hasTriedCombination(state, selectedIngredients.map(i => i.id)) ? `
          <div class="already-tried-warning">
            ⚠️ You've already tried this combination
          </div>
        ` : ''}
      </div>

      <div class="available-ingredients">
        <h4>Available Ingredients</h4>
        <div class="ingredient-filters">
          <button class="filter-btn active" data-category="all">All</button>
          ${Object.entries(INGREDIENT_CATEGORIES).slice(0, 5).map(([key, cat]) => `
            <button class="filter-btn" data-category="${cat}">
              ${INGREDIENT_ICONS[cat]}
            </button>
          `).join('')}
        </div>
        <div class="ingredient-grid">
          ${availableIngredients.map(ing => renderIngredientCard(ing, selectedIngredients)).join('')}
        </div>
      </div>
    </div>
  `;
}

// Render ingredient card
export function renderIngredientCard(ingredient, selectedIngredients = []) {
  const isSelected = selectedIngredients.some(s => s.id === ingredient.id);
  const rarityInfo = INGREDIENT_RARITY[ingredient.rarity?.toUpperCase()] || INGREDIENT_RARITY.COMMON;

  return `
    <div class="ingredient-card ${isSelected ? 'selected' : ''}"
         data-ingredient-id="${escapeHtml(ingredient.id)}"
         style="border-color: ${rarityInfo.color}">
      <span class="ingredient-icon">${INGREDIENT_ICONS[ingredient.category] || '❓'}</span>
      <span class="ingredient-name">${escapeHtml(ingredient.name)}</span>
      <span class="ingredient-rarity" style="color: ${rarityInfo.color}">
        ${rarityInfo.name}
      </span>
    </div>
  `;
}

// Render discovered recipes tab
export function renderRecipesTab(state, registry) {
  const discovered = getDiscoveredRecipes(state, registry);
  const progress = getDiscoveryProgress(state, registry);

  if (discovered.length === 0) {
    return `
      <div class="recipes-tab empty">
        <p>No recipes discovered yet.</p>
        <p>Start experimenting to discover new recipes!</p>
      </div>
    `;
  }

  // Group by category
  const byCategory = {};
  for (const recipe of discovered) {
    if (!byCategory[recipe.category]) {
      byCategory[recipe.category] = [];
    }
    byCategory[recipe.category].push(recipe);
  }

  return `
    <div class="recipes-tab">
      <div class="progress-bar-large">
        <div class="progress-fill" style="width: ${progress.percentage}%"></div>
        <span class="progress-label">${progress.percentage}% Complete</span>
      </div>

      ${Object.entries(byCategory).map(([category, recipes]) => `
        <div class="recipe-category">
          <h4>${CATEGORY_ICONS[category] || '📦'} ${category}</h4>
          <div class="recipe-list">
            ${recipes.map(recipe => renderRecipeCard(recipe)).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Render a recipe card
export function renderRecipeCard(recipe) {
  const difficultyInfo = DISCOVERY_DIFFICULTY[recipe.difficulty?.toUpperCase()] || {};

  return `
    <div class="recipe-card" data-recipe-id="${escapeHtml(recipe.id)}">
      <div class="recipe-header">
        <span class="recipe-icon">${CATEGORY_ICONS[recipe.category] || '📦'}</span>
        <span class="recipe-name">${escapeHtml(recipe.name)}</span>
        <span class="recipe-difficulty">${difficultyInfo.name || 'Unknown'}</span>
      </div>
      <div class="recipe-ingredients">
        ${recipe.ingredients.map(ing => `
          <span class="recipe-ingredient">${escapeHtml(ing)}</span>
        `).join(' + ')}
      </div>
      <div class="recipe-result">
        → ${escapeHtml(recipe.result?.name || 'Unknown')}
      </div>
    </div>
  `;
}

// Render hints tab
export function renderHintsTab(state, registry) {
  const hintedRecipes = Object.keys(state.hints).filter(id => !state.discoveredRecipes.includes(id));

  return `
    <div class="hints-tab">
      <div class="hint-purchase">
        <h4>💡 Purchase Hints</h4>
        <p>Spend gold to reveal ingredients for undiscovered recipes.</p>
        <div class="hint-categories">
          ${Object.entries(RECIPE_CATEGORIES).map(([key, cat]) => `
            <button class="hint-category-btn" data-category="${cat}">
              ${CATEGORY_ICONS[cat]} ${cat}
              <span class="hint-cost">50g</span>
            </button>
          `).join('')}
        </div>
      </div>

      ${hintedRecipes.length > 0 ? `
        <div class="current-hints">
          <h4>📋 Current Hints</h4>
          ${hintedRecipes.map(recipeId => {
            const recipe = registry.recipes[recipeId];
            const hints = getRecipeHints(state, recipeId);
            if (!recipe) return '';
            return `
              <div class="hint-card">
                <span class="hint-category">${CATEGORY_ICONS[recipe.category]} ${recipe.category}</span>
                <div class="hint-ingredients">
                  ${recipe.ingredients.map(ing => `
                    <span class="hint-ingredient ${hints.includes(ing) ? 'revealed' : 'hidden'}">
                      ${hints.includes(ing) ? escapeHtml(ing) : '???'}
                    </span>
                  `).join(' + ')}
                </div>
                <span class="hint-progress">${hints.length}/${recipe.ingredients.length} revealed</span>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="no-hints">
          <p>No active hints. Purchase a hint to get started!</p>
        </div>
      `}
    </div>
  `;
}

// Render experiment log tab
export function renderLogTab(state) {
  const recent = getRecentExperiments(state, 20);
  const stats = getDiscoveryStats(state);

  return `
    <div class="log-tab">
      <div class="stats-summary">
        <div class="stat">
          <span class="stat-value">${stats.totalExperiments}</span>
          <span class="stat-label">Experiments</span>
        </div>
        <div class="stat">
          <span class="stat-value">${stats.successfulDiscoveries}</span>
          <span class="stat-label">Discoveries</span>
        </div>
        <div class="stat">
          <span class="stat-value">${stats.successRate}%</span>
          <span class="stat-label">Success Rate</span>
        </div>
      </div>

      <div class="experiment-log">
        <h4>📜 Recent Experiments</h4>
        ${recent.length > 0 ? `
          <div class="log-entries">
            ${recent.map(entry => `
              <div class="log-entry ${entry.success ? 'success' : 'failure'}">
                <span class="entry-status">${entry.success ? '✅' : '❌'}</span>
                <span class="entry-ingredients">${entry.ingredients.join(' + ')}</span>
                <span class="entry-time">${formatTime(entry.timestamp)}</span>
              </div>
            `).join('')}
          </div>
        ` : `
          <p>No experiments yet.</p>
        `}
      </div>
    </div>
  `;
}

// Render discovery result popup
export function renderDiscoveryResult(result) {
  if (result.isNewDiscovery) {
    return `
      <div class="discovery-result success">
        <div class="result-header">
          <span class="result-icon">🎉</span>
          <h3>New Recipe Discovered!</h3>
        </div>
        <div class="result-recipe">
          <span class="recipe-icon">${CATEGORY_ICONS[result.recipe.category]}</span>
          <span class="recipe-name">${escapeHtml(result.recipe.name)}</span>
        </div>
        <div class="result-xp">
          +${result.xpGained} Discovery XP
        </div>
        <button class="close-result-btn">Continue</button>
      </div>
    `;
  }

  if (result.alreadyKnown) {
    return `
      <div class="discovery-result known">
        <div class="result-header">
          <span class="result-icon">📖</span>
          <h3>Recipe Already Known</h3>
        </div>
        <p>You already know how to make ${escapeHtml(result.recipe.name)}.</p>
        <button class="close-result-btn">Continue</button>
      </div>
    `;
  }

  // Failed experiment
  return `
    <div class="discovery-result failure">
      <div class="result-header">
        <span class="result-icon">💨</span>
        <h3>Experiment Failed</h3>
      </div>
      <p>This combination didn't produce anything useful.</p>
      ${result.hints && result.hints.length > 0 ? `
        <div class="result-hints">
          <h4>💡 Hints</h4>
          ${result.hints.map(hint => `
            <div class="hint-item">
              <span>${CATEGORY_ICONS[hint.category]} ${hint.matchCount}/${hint.totalNeeded} ingredients match a ${hint.category} recipe</span>
              <span class="hint-temp ${hint.hintLevel}">${hint.hintLevel === 'warm' ? '🔥' : '❄️'}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
      <button class="close-result-btn">Try Again</button>
    </div>
  `;
}

// Render favorite ingredients
export function renderFavoriteIngredients(state, registry) {
  const favorites = getFavoriteIngredients(state, registry, 5);

  if (favorites.length === 0) {
    return `<div class="no-favorites">Discover recipes to see your favorite ingredients!</div>`;
  }

  return `
    <div class="favorite-ingredients">
      <h4>⭐ Favorite Ingredients</h4>
      <div class="favorites-list">
        ${favorites.map(fav => `
          <div class="favorite-item">
            <span class="fav-name">${escapeHtml(fav.ingredientId)}</span>
            <span class="fav-count">Used ${fav.count}x</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Render mini progress widget
export function renderMiniProgress(state, registry) {
  const progress = getDiscoveryProgress(state, registry);
  const stats = getDiscoveryStats(state);

  return `
    <div class="mini-discovery">
      <span class="mini-icon">🔬</span>
      <span class="mini-level">Lv.${stats.discoveryLevel}</span>
      <div class="mini-bar">
        <div class="mini-fill" style="width: ${progress.percentage}%"></div>
      </div>
      <span class="mini-count">${progress.discovered}/${progress.total}</span>
    </div>
  `;
}

// Helper: Format timestamp
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Export styles
export const DISCOVERY_STYLES = `
  .discovery-panel {
    background: #1a1a2e;
    border-radius: 12px;
    padding: 20px;
    color: #fff;
    font-family: sans-serif;
  }

  .workbench {
    background: #2a2a4a;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .ingredient-slots {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin: 16px 0;
  }

  .ingredient-slot {
    width: 80px;
    height: 80px;
    border: 2px dashed #555;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .ingredient-slot.filled {
    border-style: solid;
    border-color: #4CAF50;
    background: rgba(76, 175, 80, 0.1);
  }

  .ingredient-card {
    background: #2a2a4a;
    border: 2px solid #555;
    border-radius: 8px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
  }

  .ingredient-card:hover {
    transform: translateY(-2px);
    border-color: #888;
  }

  .ingredient-card.selected {
    opacity: 0.5;
    pointer-events: none;
  }

  .recipe-card {
    background: #2a2a4a;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 8px;
  }

  .discovery-result {
    background: linear-gradient(135deg, #1a1a2e 0%, #2a2a4a 100%);
    border-radius: 12px;
    padding: 24px;
    text-align: center;
  }

  .discovery-result.success {
    border: 2px solid #4CAF50;
  }

  .discovery-result.failure {
    border: 2px solid #F44336;
  }

  .hint-ingredient.hidden {
    background: #444;
    color: #888;
    padding: 4px 8px;
    border-radius: 4px;
  }

  .hint-ingredient.revealed {
    background: #4CAF50;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
  }

  .xp-bar {
    height: 20px;
    background: #333;
    border-radius: 10px;
    margin: 12px 0;
    position: relative;
    overflow: hidden;
  }

  .xp-fill {
    height: 100%;
    background: linear-gradient(90deg, #4CAF50, #8BC34A);
    border-radius: 10px;
    transition: width 0.3s;
  }

  .xp-text {
    position: absolute;
    width: 100%;
    text-align: center;
    line-height: 20px;
    font-size: 12px;
  }
`;
