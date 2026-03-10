// Provisions UI rendering module
// Created by Claude Opus 4.6 (Villager) on Day 343
// Lazy DOM access pattern: no top-level window/document references

import { PROVISIONS, COOKING_RECIPES, getProvisionBonuses } from './provisions.js';

const RARITY_COLORS = {
  Common: '#aaa',
  Uncommon: '#2ecc71',
  Rare: '#3498db',
  Epic: '#9b59b6',
};

const CATEGORY_ICONS = {
  food: '🍖',
  drink: '🧪',
};

function esc(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatEffect(effect) {
  const parts = [];
  if (effect.healInstant) parts.push(`+${effect.healInstant} HP`);
  if (effect.mpInstant) parts.push(`+${effect.mpInstant} MP`);
  if (effect.hpRegen) parts.push(`+${effect.hpRegen} HP/turn`);
  if (effect.mpRegen) parts.push(`+${effect.mpRegen} MP/turn`);
  if (effect.atkBoost) parts.push(`+${effect.atkBoost} ATK`);
  if (effect.defBoost) parts.push(`+${effect.defBoost} DEF`);
  if (effect.duration) parts.push(`${effect.duration} turns`);
  return parts.join(', ');
}

/**
 * Get provisions from the player inventory.
 * @param {Array} inventory - Player inventory array
 * @returns {Array} Provisions found in inventory with their data
 */
function getPlayerProvisions(inventory) {
  if (!inventory) return [];
  const results = [];
  for (const item of inventory) {
    const provData = PROVISIONS[item.id];
    if (provData && item.quantity > 0) {
      results.push({ ...provData, quantity: item.quantity });
    }
  }
  return results;
}

/**
 * Render the active buffs bar (usable from combat/exploration panels too).
 * @param {object} state - Current game state
 * @returns {string} HTML string for active buffs display
 */
export function renderProvisionBuffs(state) {
  const buffs = state?.provisionState?.activeBuffs || [];
  if (buffs.length === 0) return '';

  const bonuses = getProvisionBonuses(state);
  const buffCards = buffs.map((buff) => {
    const parts = [];
    if (buff.atkBoost) parts.push(`+${buff.atkBoost} ATK`);
    if (buff.defBoost) parts.push(`+${buff.defBoost} DEF`);
    if (buff.hpRegen) parts.push(`+${buff.hpRegen} HP/t`);
    if (buff.mpRegen) parts.push(`+${buff.mpRegen} MP/t`);
    return `<span class="provision-buff-chip" title="${esc(parts.join(', '))}">${esc(buff.name)} (${buff.turnsRemaining}t)</span>`;
  }).join('');

  let summaryParts = [];
  if (bonuses.atkBoost) summaryParts.push(`+${bonuses.atkBoost} ATK`);
  if (bonuses.defBoost) summaryParts.push(`+${bonuses.defBoost} DEF`);
  const summaryText = summaryParts.length > 0 ? ` — ${summaryParts.join(', ')}` : '';

  return `
    <div class="provision-buffs-bar">
      <span class="provision-buffs-label">🍖 Provisions${summaryText}:</span>
      ${buffCards}
    </div>
  `;
}

/**
 * Render the full provisions panel (opened via OPEN_PROVISIONS action).
 * @param {object} state - Current game state
 * @returns {string} HTML string
 */
export function renderProvisionsPanel(state) {
  const ui = state.provisionsUI || { tab: 'use', selectedProvision: null, message: null };
  const inventory = state.player?.inventory || [];
  const provisions = getPlayerProvisions(inventory);
  const buffs = state?.provisionState?.activeBuffs || [];

  const tabUseClass = ui.tab === 'use' ? 'provisions-tab active' : 'provisions-tab';
  const tabCookClass = ui.tab === 'cook' ? 'provisions-tab active' : 'provisions-tab';
  const tabBuffsClass = ui.tab === 'buffs' ? 'provisions-tab active' : 'provisions-tab';

  let contentHtml = '';
  if (ui.tab === 'use') {
    contentHtml = renderUseTab(provisions, ui.selectedProvision);
  } else if (ui.tab === 'cook') {
    contentHtml = renderCookTab(state);
  } else if (ui.tab === 'buffs') {
    contentHtml = renderBuffsTab(buffs);
  }

  const messageHtml = ui.message
    ? `<div class="provisions-message">${esc(ui.message)}</div>`
    : '';

  return `
    <div class="card provisions-panel">
      <h2>🍖 Provisions</h2>
      <p class="provisions-subtitle">Cook meals and consume provisions for combat buffs.</p>
      ${messageHtml}
      <div class="provisions-tabs">
        <button class="${tabUseClass}" data-provisions-tab="use">Use</button>
        <button class="${tabCookClass}" data-provisions-tab="cook">Cook</button>
        <button class="${tabBuffsClass}" data-provisions-tab="buffs">Active Buffs (${buffs.length})</button>
      </div>
      <div class="provisions-content">
        ${contentHtml}
      </div>
      <div class="buttons">
        <button id="btnCloseProvisions">Close</button>
      </div>
    </div>
  `;
}

function renderUseTab(provisions, selectedId) {
  if (provisions.length === 0) {
    return '<div class="provisions-empty">You have no provisions. Find or cook some!</div>';
  }

  const listHtml = provisions.map((prov) => {
    const isSelected = selectedId === prov.id;
    const rarityColor = RARITY_COLORS[prov.rarity] || '#aaa';
    const icon = CATEGORY_ICONS[prov.category] || '🍖';
    const effectText = formatEffect(prov.effect || {});

    return `
      <div class="provision-item${isSelected ? ' selected' : ''}" data-provision-id="${esc(prov.id)}">
        <div class="provision-item-header">
          <span class="provision-item-name" style="color:${rarityColor}">${icon} ${esc(prov.name)}</span>
          <span class="provision-item-rarity" style="color:${rarityColor}">[${esc(prov.rarity)}]</span>
          <span class="provision-item-qty">x${prov.quantity}</span>
        </div>
        <div class="provision-item-desc">${esc(prov.description)}</div>
        <div class="provision-item-effect">${esc(effectText)}</div>
        ${isSelected ? `<button class="provision-use-btn" data-use-provision="${esc(prov.id)}">Consume</button>` : ''}
      </div>
    `;
  }).join('');

  return `<div class="provision-list">${listHtml}</div>`;
}

function renderCookTab(state) {
  const inventory = state.player?.inventory || [];
  const playerLevel = state.player?.level || 1;

  if (COOKING_RECIPES.length === 0) {
    return '<div class="provisions-empty">No recipes available.</div>';
  }

  const recipesHtml = COOKING_RECIPES.map((recipe) => {
    const canCook = playerLevel >= recipe.requiredLevel;
    const ingredientsHtml = recipe.ingredients.map((ing) => {
      const item = inventory.find((i) => i.id === ing.itemId);
      const have = item ? item.quantity : 0;
      const enough = have >= ing.quantity;
      return `<span class="recipe-ingredient${enough ? ' has-enough' : ' not-enough'}">${esc(ing.itemId)} ${have}/${ing.quantity}</span>`;
    }).join(', ');

    const resultProv = PROVISIONS[recipe.result.itemId];
    const resultName = resultProv ? resultProv.name : recipe.result.itemId;

    const hasAllIngredients = recipe.ingredients.every((ing) => {
      const item = inventory.find((i) => i.id === ing.itemId);
      return item && item.quantity >= ing.quantity;
    });

    const canCookNow = canCook && hasAllIngredients;

    return `
      <div class="recipe-card${canCookNow ? '' : ' recipe-locked'}">
        <div class="recipe-header">
          <span class="recipe-name">${esc(recipe.name)}</span>
          <span class="recipe-level">${canCook ? '' : '🔒 '}Lv.${recipe.requiredLevel}</span>
        </div>
        <div class="recipe-desc">${esc(recipe.description)}</div>
        <div class="recipe-ingredients">Needs: ${ingredientsHtml}</div>
        <div class="recipe-result">Result: ${esc(resultName)} x${recipe.result.quantity}</div>
        <button class="recipe-cook-btn" data-cook-recipe="${esc(recipe.id)}" ${canCookNow ? '' : 'disabled'}>Cook</button>
      </div>
    `;
  }).join('');

  return `<div class="recipe-list">${recipesHtml}</div>`;
}

function renderBuffsTab(buffs) {
  if (buffs.length === 0) {
    return '<div class="provisions-empty">No active provision buffs.</div>';
  }

  const buffsHtml = buffs.map((buff) => {
    const parts = [];
    if (buff.atkBoost) parts.push(`+${buff.atkBoost} ATK`);
    if (buff.defBoost) parts.push(`+${buff.defBoost} DEF`);
    if (buff.hpRegen) parts.push(`+${buff.hpRegen} HP/turn`);
    if (buff.mpRegen) parts.push(`+${buff.mpRegen} MP/turn`);
    const effectText = parts.join(', ') || 'No stat bonuses';

    return `
      <div class="buff-card">
        <div class="buff-header">
          <span class="buff-name">🍖 ${esc(buff.name)}</span>
          <span class="buff-turns">${buff.turnsRemaining} turns left</span>
        </div>
        <div class="buff-effects">${esc(effectText)}</div>
      </div>
    `;
  }).join('');

  return `<div class="buff-list">${buffsHtml}</div>`;
}

/**
 * Attach event handlers for the provisions UI.
 * Uses lazy DOM access (safe for Node.js testing).
 * @param {Function} dispatch - Action dispatch function
 */
export function attachProvisionsHandlers(dispatch) {
  const doc = typeof document !== 'undefined' ? document : null;
  if (!doc) return;

  const closeBtn = doc.getElementById('btnCloseProvisions');
  if (closeBtn) closeBtn.onclick = () => dispatch({ type: 'CLOSE_PROVISIONS' });

  const tabs = doc.querySelectorAll('[data-provisions-tab]');
  tabs.forEach((tab) => {
    tab.onclick = () => dispatch({ type: 'PROVISIONS_SWITCH_TAB', tab: tab.dataset.provisionsTab });
  });

  const items = doc.querySelectorAll('[data-provision-id]');
  items.forEach((item) => {
    item.onclick = (e) => {
      if (e.target.closest('[data-use-provision]')) return;
      dispatch({ type: 'PROVISIONS_SELECT', provisionId: item.dataset.provisionId });
    };
  });

  const useBtns = doc.querySelectorAll('[data-use-provision]');
  useBtns.forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      dispatch({ type: 'USE_PROVISION', provisionId: btn.dataset.useProvision });
    };
  });

  const cookBtns = doc.querySelectorAll('[data-cook-recipe]');
  cookBtns.forEach((btn) => {
    btn.onclick = () => dispatch({ type: 'COOK_PROVISION', recipeId: btn.dataset.cookRecipe });
  });
}

/**
 * Get CSS styles for the provisions UI.
 * @returns {string} CSS string
 */
export function getProvisionsStyles() {
  return `
    .provisions-panel { position: relative; }
    .provisions-subtitle { font-style: italic; color: #aaa; margin: 4px 0 8px; font-size: 0.9em; }
    .provisions-message { background: #2a3a2a; border-left: 3px solid #2ecc71; padding: 6px 10px; margin: 6px 0; font-size: 0.9em; }
    .provisions-tabs { display: flex; gap: 4px; margin: 8px 0; }
    .provisions-tab { padding: 6px 14px; border: 1px solid #555; background: #1a1a2e; color: #ccc; cursor: pointer; border-radius: 4px 4px 0 0; }
    .provisions-tab.active { background: #2a2a4e; color: #fff; border-bottom-color: #2a2a4e; }
    .provisions-content { min-height: 120px; }
    .provisions-empty { color: #888; font-style: italic; padding: 20px; text-align: center; }
    .provision-list { display: flex; flex-direction: column; gap: 6px; }
    .provision-item { padding: 8px 10px; border: 1px solid #444; border-radius: 4px; cursor: pointer; transition: border-color 0.2s; }
    .provision-item:hover { border-color: #888; }
    .provision-item.selected { border-color: #2ecc71; background: #1a2a1a; }
    .provision-item-header { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .provision-item-name { font-weight: bold; }
    .provision-item-rarity { font-size: 0.8em; }
    .provision-item-qty { margin-left: auto; font-weight: bold; color: #ccc; }
    .provision-item-desc { color: #aaa; font-size: 0.85em; margin: 2px 0; }
    .provision-item-effect { color: #7bed9f; font-size: 0.85em; }
    .provision-use-btn { margin-top: 6px; padding: 4px 16px; background: #2ecc71; color: #000; border: none; border-radius: 3px; cursor: pointer; font-weight: bold; }
    .provision-use-btn:hover { background: #27ae60; }
    .recipe-list { display: flex; flex-direction: column; gap: 8px; }
    .recipe-card { padding: 8px 10px; border: 1px solid #444; border-radius: 4px; }
    .recipe-card.recipe-locked { opacity: 0.6; }
    .recipe-header { display: flex; justify-content: space-between; align-items: center; }
    .recipe-name { font-weight: bold; color: #f0c040; }
    .recipe-level { font-size: 0.85em; color: #aaa; }
    .recipe-desc { color: #aaa; font-size: 0.85em; margin: 2px 0; }
    .recipe-ingredients { font-size: 0.85em; margin: 4px 0; }
    .recipe-ingredient.has-enough { color: #2ecc71; }
    .recipe-ingredient.not-enough { color: #e74c3c; }
    .recipe-result { font-size: 0.85em; color: #7bed9f; margin: 2px 0; }
    .recipe-cook-btn { margin-top: 4px; padding: 4px 14px; background: #f0c040; color: #000; border: none; border-radius: 3px; cursor: pointer; font-weight: bold; }
    .recipe-cook-btn:hover:not(:disabled) { background: #d4a830; }
    .recipe-cook-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .buff-list { display: flex; flex-direction: column; gap: 6px; }
    .buff-card { padding: 8px 10px; border: 1px solid #444; border-radius: 4px; background: #1a2a1a; }
    .buff-header { display: flex; justify-content: space-between; align-items: center; }
    .buff-name { font-weight: bold; color: #2ecc71; }
    .buff-turns { font-size: 0.85em; color: #f0c040; }
    .buff-effects { color: #7bed9f; font-size: 0.85em; margin-top: 2px; }
    .provision-buffs-bar { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; padding: 4px 8px; background: #1a2a1a; border-radius: 4px; margin: 4px 0; }
    .provision-buffs-label { font-size: 0.85em; color: #2ecc71; font-weight: bold; }
    .provision-buff-chip { font-size: 0.8em; background: #2a3a2a; border: 1px solid #2ecc71; border-radius: 12px; padding: 2px 8px; color: #7bed9f; }
  `;
}
