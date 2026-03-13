/**
 * Cooking System UI
 * Rendering functions for cooking interface
 */

import {
  INGREDIENT_TYPES,
  RECIPE_DIFFICULTY,
  FOOD_QUALITY,
  FOOD_BUFFS,
  COOKING_METHODS,
  BASE_RECIPES,
  getKnownRecipes,
  getIngredients,
  getCookingStats,
  getActiveBuff,
  getCookingHistory,
  hasIngredients
} from './cooking-system.js';

/**
 * Escape HTML to prevent XSS
 */
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
 * Format time duration
 */
function formatDuration(seconds) {
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
  if (seconds >= 60) {
    return `${Math.floor(seconds / 60)}m`;
  }
  return `${seconds}s`;
}

/**
 * Render main cooking panel
 */
export function renderCookingPanel(state) {
  const stats = getCookingStats(state);
  const activeBuff = getActiveBuff(state);

  return `
    <div class="cooking-panel">
      <div class="cooking-header">
        <h2>Cooking</h2>
        <div class="cooking-level">
          <span class="level">Level ${stats.level}</span>
          <div class="exp-bar">
            <div class="exp-fill" style="width: ${(stats.exp / stats.expToNext) * 100}%"></div>
          </div>
          <span class="exp-text">${stats.exp}/${stats.expToNext} XP</span>
        </div>
      </div>
      ${activeBuff.active ? renderActiveBuff(activeBuff) : ''}
      <div class="cooking-tabs">
        <button class="tab active" data-tab="recipes">Recipes</button>
        <button class="tab" data-tab="ingredients">Ingredients</button>
        <button class="tab" data-tab="history">History</button>
      </div>
      <div class="cooking-content">
        ${renderRecipeList(state)}
      </div>
    </div>
  `;
}

/**
 * Render active food buff
 */
export function renderActiveBuff(buffInfo) {
  if (!buffInfo.active) {
    return '<div class="no-buff">No active food buff</div>';
  }

  const buff = buffInfo.buff;
  const timeRemaining = Math.floor(buffInfo.timeRemaining / 1000);

  return `
    <div class="active-buff">
      <div class="buff-icon">&#127860;</div>
      <div class="buff-info">
        <span class="buff-name">${escapeHtml(buff.name)}</span>
        <span class="buff-source">from ${escapeHtml(buff.fromDish)}</span>
      </div>
      <div class="buff-effect">
        <span class="buff-amount">+${buff.amount} ${escapeHtml(buff.stat)}</span>
        <span class="buff-time">${formatDuration(timeRemaining)}</span>
      </div>
    </div>
  `;
}

/**
 * Render recipe list
 */
export function renderRecipeList(state) {
  const recipes = getKnownRecipes(state);

  if (recipes.length === 0) {
    return '<div class="no-recipes">No recipes known</div>';
  }

  return `
    <div class="recipe-list">
      ${recipes.map(recipe => renderRecipeCard(recipe)).join('')}
    </div>
  `;
}

/**
 * Render single recipe card
 */
export function renderRecipeCard(recipe) {
  const difficulty = RECIPE_DIFFICULTY[recipe.difficulty.toUpperCase()] || RECIPE_DIFFICULTY.SIMPLE;
  const method = COOKING_METHODS[recipe.method.toUpperCase()] || COOKING_METHODS.RAW;
  const canCook = recipe.canCook;

  return `
    <div class="recipe-card ${canCook ? 'can-cook' : 'missing-ingredients'}">
      <div class="recipe-header">
        <h3 class="recipe-name">${escapeHtml(recipe.name)}</h3>
        <span class="recipe-difficulty ${difficulty.id}">${escapeHtml(difficulty.name)}</span>
      </div>
      <div class="recipe-method">
        <span>Method: ${escapeHtml(method.name)}</span>
      </div>
      <div class="recipe-ingredients">
        ${recipe.ingredients.map(ing => `
          <span class="ingredient ${recipe.missing?.some(m => m.type === ing.type) ? 'missing' : ''}">
            ${escapeHtml(INGREDIENT_TYPES[ing.type.toUpperCase()]?.name || ing.type)} x${ing.amount}
          </span>
        `).join('')}
      </div>
      <div class="recipe-buff">
        <span class="buff-type">${escapeHtml(FOOD_BUFFS[recipe.buff.toUpperCase()]?.name || recipe.buff)}</span>
        <span class="buff-value">+${recipe.buffAmount}</span>
        <span class="buff-duration">${formatDuration(recipe.duration)}</span>
      </div>
      <div class="recipe-exp">
        <span>${recipe.exp} XP</span>
      </div>
      <button class="cook-btn" ${canCook ? '' : 'disabled'}>
        ${canCook ? 'Cook' : 'Missing Ingredients'}
      </button>
    </div>
  `;
}

/**
 * Render recipe detail view
 */
export function renderRecipeDetail(state, recipeId) {
  const recipeKey = recipeId.toUpperCase();
  const recipe = BASE_RECIPES[recipeKey];
  
  if (!recipe) {
    return '<div class="recipe-not-found">Recipe not found</div>';
  }

  const ingredientCheck = hasIngredients(state, recipeId);
  const difficulty = RECIPE_DIFFICULTY[recipe.difficulty.toUpperCase()];
  const method = COOKING_METHODS[recipe.method.toUpperCase()];
  const buffType = FOOD_BUFFS[recipe.buff.toUpperCase()];

  return `
    <div class="recipe-detail">
      <h2 class="recipe-name">${escapeHtml(recipe.name)}</h2>
      <div class="recipe-meta">
        <span class="difficulty ${difficulty.id}">${escapeHtml(difficulty.name)}</span>
        <span class="method">${escapeHtml(method.name)}</span>
        <span class="exp">${recipe.exp} XP</span>
      </div>
      <div class="recipe-ingredients-detail">
        <h3>Ingredients</h3>
        <ul>
          ${recipe.ingredients.map(ing => {
            const missing = ingredientCheck.missing.find(m => m.type === ing.type);
            const typeInfo = INGREDIENT_TYPES[ing.type.toUpperCase()];
            return `
              <li class="${missing ? 'missing' : 'have'}">
                ${escapeHtml(typeInfo?.name || ing.type)} x${ing.amount}
                ${missing ? `<span class="need">(have ${missing.have})</span>` : '<span class="check">&#10003;</span>'}
              </li>
            `;
          }).join('')}
        </ul>
      </div>
      <div class="recipe-buff-detail">
        <h3>Effect</h3>
        <p>${escapeHtml(buffType?.name || recipe.buff)}: +${recipe.buffAmount}</p>
        <p>Duration: ${formatDuration(recipe.duration)}</p>
      </div>
      <div class="quality-chances">
        <h3>Quality Chances</h3>
        ${Object.values(FOOD_QUALITY).map(q => `
          <div class="quality-row">
            <span class="quality-name" style="color: ${q.color}">${escapeHtml(q.name)}</span>
            <span class="quality-mult">x${q.buffMultiplier}</span>
          </div>
        `).join('')}
      </div>
      <button class="cook-btn-large" ${ingredientCheck.hasAll ? '' : 'disabled'}>
        ${ingredientCheck.hasAll ? 'Cook Now' : 'Missing Ingredients'}
      </button>
    </div>
  `;
}

/**
 * Render ingredient inventory
 */
export function renderIngredientInventory(state) {
  const ingredients = getIngredients(state);

  if (ingredients.length === 0) {
    return '<div class="no-ingredients">No ingredients in inventory</div>';
  }

  return `
    <div class="ingredient-inventory">
      <h3>Ingredients</h3>
      <div class="ingredient-grid">
        ${ingredients.map(ing => `
          <div class="ingredient-slot">
            <div class="ingredient-icon">${getIngredientIcon(ing.type)}</div>
            <span class="ingredient-name">${escapeHtml(ing.name)}</span>
            <span class="ingredient-amount">x${ing.amount}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Get ingredient icon
 */
function getIngredientIcon(type) {
  const icons = {
    meat: '&#127830;',
    fish: '&#128031;',
    vegetable: '&#129382;',
    fruit: '&#127815;',
    grain: '&#127806;',
    dairy: '&#129472;',
    spice: '&#127798;',
    herb: '&#127807;',
    sweetener: '&#127855;',
    liquid: '&#129346;'
  };
  return icons[type.toLowerCase()] || '&#127869;';
}

/**
 * Render cooking history
 */
export function renderCookingHistory(state) {
  const history = getCookingHistory(state);

  if (history.length === 0) {
    return '<div class="no-history">No dishes cooked yet</div>';
  }

  return `
    <div class="cooking-history">
      <h3>Recent Dishes</h3>
      <div class="history-list">
        ${history.map(dish => {
          const quality = FOOD_QUALITY[dish.quality.toUpperCase()] || FOOD_QUALITY.COMMON;
          return `
            <div class="history-item">
              <span class="dish-name" style="color: ${quality.color}">${escapeHtml(dish.name)}</span>
              <span class="dish-quality">${escapeHtml(quality.name)}</span>
              <span class="dish-time">${new Date(dish.cookedAt).toLocaleTimeString()}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Render cooking stats
 */
export function renderCookingStats(state) {
  const stats = getCookingStats(state);

  return `
    <div class="cooking-stats">
      <h3>Cooking Statistics</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-value">${stats.level}</span>
          <span class="stat-label">Level</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.recipesKnown}/${stats.totalRecipes}</span>
          <span class="stat-label">Recipes</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.dishesCooked}</span>
          <span class="stat-label">Dishes Cooked</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.perfectDishes}</span>
          <span class="stat-label">Perfect Dishes</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.failedAttempts}</span>
          <span class="stat-label">Failed Attempts</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render cooking result
 */
export function renderCookingResult(result) {
  if (!result.success && result.failed) {
    return `
      <div class="cooking-result failure">
        <div class="result-icon">&#128293;</div>
        <h3>Cooking Failed!</h3>
        <p>Your dish burned. Some ingredients were lost.</p>
      </div>
    `;
  }

  if (!result.success) {
    return `
      <div class="cooking-result error">
        <p>${escapeHtml(result.error)}</p>
      </div>
    `;
  }

  const dish = result.dish;
  const quality = FOOD_QUALITY[dish.quality.toUpperCase()] || FOOD_QUALITY.COMMON;

  return `
    <div class="cooking-result success">
      <div class="result-icon">&#127860;</div>
      <h3 style="color: ${quality.color}">${escapeHtml(quality.name)} ${escapeHtml(dish.name)}</h3>
      <div class="result-details">
        <p class="buff-info">${escapeHtml(FOOD_BUFFS[dish.buff.toUpperCase()]?.name || dish.buff)}: +${dish.buffAmount}</p>
        <p class="duration-info">Duration: ${formatDuration(dish.duration)}</p>
        <p class="exp-info">+${result.expGained} XP</p>
        ${result.leveledUp ? `<p class="level-up">Level Up! Now level ${result.newLevel}!</p>` : ''}
      </div>
      <button class="consume-btn">Consume Now</button>
      <button class="save-btn">Save for Later</button>
    </div>
  `;
}

/**
 * Render quality indicator
 */
export function renderQualityIndicator(qualityId) {
  const quality = FOOD_QUALITY[qualityId.toUpperCase()] || FOOD_QUALITY.COMMON;
  
  return `
    <span class="quality-indicator" style="color: ${quality.color}">
      ${escapeHtml(quality.name)}
    </span>
  `;
}

/**
 * Render compact cooking status
 */
export function renderCompactCookingStatus(state) {
  const stats = getCookingStats(state);
  const activeBuff = getActiveBuff(state);

  return `
    <div class="cooking-status-compact">
      <span class="cooking-level">Cooking Lv.${stats.level}</span>
      ${activeBuff.active 
        ? `<span class="buff-active" title="${escapeHtml(activeBuff.buff.name)}">&#127860;</span>`
        : ''
      }
    </div>
  `;
}

/**
 * Render all ingredient types
 */
export function renderIngredientTypes() {
  return `
    <div class="ingredient-types">
      <h3>Ingredient Types</h3>
      <div class="type-grid">
        ${Object.values(INGREDIENT_TYPES).map(type => `
          <div class="type-item">
            <span class="type-icon">${getIngredientIcon(type.id)}</span>
            <span class="type-name">${escapeHtml(type.name)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render cooking method descriptions
 */
export function renderCookingMethods() {
  return `
    <div class="cooking-methods">
      <h3>Cooking Methods</h3>
      <ul>
        ${Object.values(COOKING_METHODS).map(method => `
          <li>
            <span class="method-name">${escapeHtml(method.name)}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}
