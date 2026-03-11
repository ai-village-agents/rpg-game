/**
 * Talent System UI - Renders the talent tree interface
 */

import { TALENTS, TALENT_CATEGORIES, TIER_REQUIREMENTS, getTalentValue, getTalentDescription, getTalentsByCategory } from './data/talents.js';
import { getTalentRank, canAllocateTalent, canDeallocateTalent, isTierUnlocked, arePrerequisitesMet } from './talents.js';

/**
 * Render the talent tree screen
 */
export function renderTalentTree(state) {
  const talentState = state.player?.talents;
  if (!talentState) {
    return `<div class="talent-tree-container">
      <h2>⭐ Talent Tree</h2>
      <p>Talents not available yet.</p>
      <div class="talent-actions">
        <button data-action="CLOSE_TALENTS">Close</button>
      </div>
    </div>`;
  }

  const categories = Object.values(TALENT_CATEGORIES);
  
  let html = `<div class="talent-tree-container">
    <div class="talent-header">
      <h2>⭐ Talent Tree</h2>
      <div class="talent-points-display">
        <span class="available-points">Available Points: <strong>${talentState.availablePoints}</strong></span>
        <span class="total-spent">Total Spent: ${talentState.totalPointsSpent}</span>
      </div>
    </div>
    <div class="talent-controls">
      <select class="talent-sort">
        <option value="name">Name</option>
        <option value="tier">Tier</option>
        <option value="points">Points Invested</option>
      </select>
      <input type="text" class="talent-filter" placeholder="Filter by name..." />
      <button class="talent-filter-apply">Apply Filter</button>
      <button class="talent-filter-clear">Clear Filter</button>
    </div>
    
    <div class="talent-categories">`;

  for (const category of categories) {
    html += renderCategory(category, talentState);
  }

  html += `</div>
    
    <div class="talent-actions">
      <button data-action="RESET_TALENTS" ${talentState.totalPointsSpent === 0 ? 'disabled' : ''}>Reset All Talents</button>
      <button data-action="CLOSE_TALENTS">Close</button>
    </div>
  </div>`;

  return html;
}

/**
 * Render a single talent category
 */
function renderCategory(category, talentState) {
  const talents = getTalentsByCategory(category.id);
  const pointsInCategory = talentState.categoryPoints[category.id] || 0;
  
  // Group talents by tier
  const tiers = {
    1: talents.filter(t => t.tier === 1),
    2: talents.filter(t => t.tier === 2),
    3: talents.filter(t => t.tier === 3)
  };

  let html = `<div class="talent-category" style="border-color: ${category.color}">
    <div class="category-header" style="background-color: ${category.color}">
      <h3>${category.name}</h3>
      <span class="category-points">${pointsInCategory} points</span>
    </div>
    <p class="category-description">${category.description}</p>`;

  for (let tier = 1; tier <= 3; tier++) {
    const tierTalents = tiers[tier];
    const tierUnlocked = pointsInCategory >= TIER_REQUIREMENTS[tier];
    const tierReq = TIER_REQUIREMENTS[tier];
    
    html += `<div class="talent-tier ${tierUnlocked ? 'unlocked' : 'locked'}">
      <div class="tier-header">
        <span class="tier-label">Tier ${tier}</span>
        ${tier > 1 ? `<span class="tier-requirement">(${tierReq} points required)</span>` : ''}
      </div>
      <div class="tier-talents">`;
    
    for (const talent of tierTalents) {
      html += renderTalent(talent, talentState);
    }
    
    html += `</div></div>`;
  }

  html += `</div>`;
  return html;
}

/**
 * Render a single talent node
 */
function renderTalent(talent, talentState) {
  const currentRank = getTalentRank(talentState, talent.id);
  const isMaxed = currentRank >= talent.maxRank;
  const { canAllocate, reason: allocateReason } = canAllocateTalent(talentState, talent.id);
  const { canDeallocate, reason: deallocateReason } = canDeallocateTalent(talentState, talent.id);
  const tierUnlocked = isTierUnlocked(talentState, talent.id);
  const prereqsMet = currentRank > 0 || arePrerequisitesMet(talentState, talent.id);
  
  // Determine talent state for styling
  let talentClass = 'talent-node';
  if (isMaxed) {
    talentClass += ' maxed';
  } else if (currentRank > 0) {
    talentClass += ' partial';
  } else if (canAllocate) {
    talentClass += ' available';
  } else if (!tierUnlocked) {
    talentClass += ' tier-locked';
  } else if (!prereqsMet) {
    talentClass += ' prereq-locked';
  } else {
    talentClass += ' unavailable';
  }

  const description = getTalentDescription(talent.id, Math.max(1, currentRank));
  const nextRankDesc = currentRank < talent.maxRank ? 
    getTalentDescription(talent.id, currentRank + 1) : null;

  // Get prerequisite names
  let prereqDisplay = '';
  if (talent.prerequisites.length > 0) {
    const prereqNames = talent.prerequisites.map(id => TALENTS[id]?.name || id).join(', ');
    prereqDisplay = `<div class="talent-prereqs">Requires: ${prereqNames}</div>`;
  }

  return `<div class="${talentClass}" data-talent-id="${talent.id}">
    <div class="talent-name">${talent.name}</div>
    <div class="talent-rank">${currentRank}/${talent.maxRank}</div>
    <div class="talent-description">${description}</div>
    ${nextRankDesc && !isMaxed ? `<div class="talent-next">Next rank: ${nextRankDesc}</div>` : ''}
    ${prereqDisplay}
    <div class="talent-buttons">
      <button 
        data-action="ALLOCATE_TALENT" 
        data-talent="${talent.id}"
        ${!canAllocate ? 'disabled' : ''}
        title="${allocateReason || 'Add point'}">+</button>
      <button 
        data-action="DEALLOCATE_TALENT" 
        data-talent="${talent.id}"
        ${!canDeallocate ? 'disabled' : ''}
        title="${deallocateReason || 'Remove point'}">−</button>
    </div>
    ${!canAllocate && allocateReason ? `<div class="talent-reason">${allocateReason}</div>` : ''}
  </div>`;
}

/**
 * Render a compact talent summary for the character screen
 */
export function renderTalentSummary(talentState) {
  if (!talentState || talentState.totalPointsSpent === 0) {
    return `<div class="talent-summary">
      <h4>⭐ Talents</h4>
      <p>No talents allocated</p>
      <button data-action="VIEW_TALENTS">Open Talent Tree</button>
    </div>`;
  }

  let html = `<div class="talent-summary">
    <h4>⭐ Talents (${talentState.totalPointsSpent} points spent)</h4>
    <div class="summary-categories">`;

  for (const [categoryId, points] of Object.entries(talentState.categoryPoints)) {
    if (points > 0) {
      const category = TALENT_CATEGORIES[categoryId];
      html += `<span class="summary-category" style="color: ${category.color}">${category.name}: ${points}</span>`;
    }
  }

  html += `</div>
    ${talentState.availablePoints > 0 ? 
      `<div class="points-available">⭐ ${talentState.availablePoints} points available!</div>` : ''}
    <button data-action="VIEW_TALENTS">Open Talent Tree</button>
  </div>`;

  return html;
}

/**
 * Render talent bonuses for combat/stats display
 */
export function renderTalentBonuses(bonuses) {
  const activeBonus = [];
  
  // Combat bonuses
  if (bonuses.physicalDamage > 0) activeBonus.push(`⚔️ +${bonuses.physicalDamage}% Physical Damage`);
  if (bonuses.critChance > 0) activeBonus.push(`🎯 +${bonuses.critChance}% Crit Chance`);
  if (bonuses.critDamage > 0) activeBonus.push(`💥 +${bonuses.critDamage}% Crit Damage`);
  if (bonuses.spd > 0) activeBonus.push(`💨 +${bonuses.spd} Speed`);
  if (bonuses.armorPen > 0) activeBonus.push(`🗡️ ${bonuses.armorPen}% Armor Pen`);
  if (bonuses.doubleStrike > 0) activeBonus.push(`⚡ ${bonuses.doubleStrike}% Double Strike`);
  if (bonuses.executeDamage > 0) activeBonus.push(`☠️ +${bonuses.executeDamage}% Execute Damage`);
  
  // Defense bonuses
  if (bonuses.def > 0) activeBonus.push(`🛡️ +${bonuses.def} Defense`);
  if (bonuses.maxHp > 0) activeBonus.push(`❤️ +${bonuses.maxHp}% Max HP`);
  if (bonuses.dodge > 0) activeBonus.push(`🌀 ${bonuses.dodge}% Dodge`);
  if (bonuses.damageReduction > 0) activeBonus.push(`🔰 ${bonuses.damageReduction}% Damage Reduction`);
  if (bonuses.hpRegen > 0) activeBonus.push(`💚 ${bonuses.hpRegen}% HP Regen/turn`);
  if (bonuses.counterChance > 0) activeBonus.push(`↩️ ${bonuses.counterChance}% Counter`);
  if (bonuses.lowHpResist > 0) activeBonus.push(`🔥 ${bonuses.lowHpResist}% Low HP Resist`);
  
  // Magic bonuses
  if (bonuses.magicDamage > 0) activeBonus.push(`✨ +${bonuses.magicDamage}% Magic Damage`);
  if (bonuses.maxMp > 0) activeBonus.push(`💙 +${bonuses.maxMp}% Max MP`);
  if (bonuses.mpCostReduction > 0) activeBonus.push(`📘 ${bonuses.mpCostReduction}% MP Cost Reduction`);
  if (bonuses.elementalDamage > 0) activeBonus.push(`🔮 +${bonuses.elementalDamage}% Elemental Damage`);
  if (bonuses.mpRegen > 0) activeBonus.push(`💧 +${bonuses.mpRegen} MP Regen/turn`);
  if (bonuses.magicPen > 0) activeBonus.push(`⚡ ${bonuses.magicPen}% Magic Pen`);
  if (bonuses.freeSpellChance > 0) activeBonus.push(`🌟 ${bonuses.freeSpellChance}% Free Cast`);
  
  // Utility bonuses
  if (bonuses.goldBonus > 0) activeBonus.push(`💰 +${bonuses.goldBonus}% Gold`);
  if (bonuses.xpBonus > 0) activeBonus.push(`📈 +${bonuses.xpBonus}% XP`);
  if (bonuses.itemDropRate > 0) activeBonus.push(`🎁 +${bonuses.itemDropRate}% Item Drop`);
  if (bonuses.shopDiscount > 0) activeBonus.push(`🏷️ ${bonuses.shopDiscount}% Shop Discount`);
  if (bonuses.rareItemChance > 0) activeBonus.push(`💎 ${bonuses.rareItemChance}% Rare Find`);
  
  if (activeBonus.length === 0) {
    return '';
  }
  
  return `<div class="talent-bonuses">
    <h5>Talent Bonuses:</h5>
    <ul>${activeBonus.map(b => `<li>${b}</li>`).join('')}</ul>
  </div>`;
}

/**
 * Get CSS styles for the talent tree
 */
export function getTalentTreeStyles() {
  return `
    .talent-tree-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .talent-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .talent-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      margin: 0 0 20px 0;
    }
    
    .talent-controls select,
    .talent-controls input {
      background: rgba(0, 0, 0, 0.6);
      color: #f5f7ff;
      border: 1px solid #555;
      padding: 6px 10px;
      border-radius: 4px;
      min-height: 34px;
    }
    
    .talent-controls select:focus,
    .talent-controls input:focus {
      outline: none;
      border-color: #f1c40f;
      box-shadow: 0 0 0 2px rgba(241, 196, 15, 0.15);
    }
    
    .talent-controls button {
      border: 1px solid rgba(255,255,255,0.15);
      background: rgba(255,255,255,0.08);
      color: #f5f7ff;
      padding: 8px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
    }
    
    .talent-controls button:hover {
      border-color: rgba(122,162,255,0.55);
    }
    
    .talent-controls button:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    
    .talent-points-display {
      font-size: 1.1em;
    }
    
    .available-points {
      color: #f1c40f;
      margin-right: 20px;
    }
    
    .talent-categories {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }
    
    .talent-category {
      border: 2px solid;
      border-radius: 8px;
      overflow: hidden;
      background: rgba(0,0,0,0.3);
    }
    
    .category-header {
      padding: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .category-header h3 {
      margin: 0;
      color: white;
    }
    
    .category-description {
      padding: 5px 10px;
      font-size: 0.9em;
      color: #aaa;
    }
    
    .talent-tier {
      padding: 10px;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    
    .talent-tier.locked {
      opacity: 0.6;
    }
    
    .tier-header {
      display: flex;
      gap: 10px;
      margin-bottom: 8px;
    }
    
    .tier-label {
      font-weight: bold;
      color: #f1c40f;
    }
    
    .tier-requirement {
      color: #888;
      font-size: 0.9em;
    }
    
    .tier-talents {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .talent-node {
      padding: 10px;
      border: 1px solid #444;
      border-radius: 5px;
      background: rgba(0,0,0,0.4);
      position: relative;
    }
    
    .talent-node.maxed {
      border-color: #f1c40f;
      background: rgba(241, 196, 15, 0.1);
    }
    
    .talent-node.partial {
      border-color: #3498db;
      background: rgba(52, 152, 219, 0.1);
    }
    
    .talent-node.available {
      border-color: #2ecc71;
    }
    
    .talent-node.tier-locked,
    .talent-node.prereq-locked,
    .talent-node.unavailable {
      opacity: 0.5;
    }
    
    .talent-name {
      font-weight: bold;
      font-size: 1.1em;
    }
    
    .talent-rank {
      position: absolute;
      top: 10px;
      right: 10px;
      font-weight: bold;
      color: #f1c40f;
    }
    
    .talent-description {
      margin-top: 5px;
      color: #ccc;
    }
    
    .talent-next {
      margin-top: 5px;
      color: #3498db;
      font-size: 0.9em;
    }
    
    .talent-prereqs {
      margin-top: 5px;
      color: #e67e22;
      font-size: 0.85em;
    }
    
    .talent-buttons {
      margin-top: 10px;
      display: flex;
      gap: 5px;
    }
    
    .talent-buttons button {
      width: 30px;
      height: 30px;
      font-size: 1.2em;
      font-weight: bold;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .talent-buttons button:not(:disabled) {
      background: #2ecc71;
      color: white;
    }
    
    .talent-buttons button:disabled {
      background: #555;
      color: #888;
      cursor: not-allowed;
    }
    
    .talent-reason {
      margin-top: 5px;
      color: #e74c3c;
      font-size: 0.85em;
    }
    
    .talent-actions {
      margin-top: 20px;
      display: flex;
      gap: 10px;
      justify-content: center;
    }
    
    .talent-actions button {
      padding: 10px 20px;
      font-size: 1em;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
    
    .talent-summary {
      padding: 10px;
      border: 1px solid #444;
      border-radius: 5px;
      margin-top: 10px;
    }
    
    .summary-categories {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }
    
    .points-available {
      color: #f1c40f;
      font-weight: bold;
      margin-top: 5px;
    }
    
    .talent-bonuses {
      padding: 10px;
      background: rgba(0,0,0,0.2);
      border-radius: 5px;
      margin-top: 10px;
    }
    
    .talent-bonuses h5 {
      margin: 0 0 5px 0;
      color: #f1c40f;
    }
    
    .talent-bonuses ul {
      margin: 0;
      padding-left: 20px;
    }
    
    .talent-bonuses li {
      color: #ccc;
      font-size: 0.9em;
    }
  `;
}

export function attachTalentHandlers(container, dispatch) {
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'ALLOCATE_TALENT') {
      const talentId = btn.dataset.talent;
      if (talentId) dispatch({ type: 'ALLOCATE_TALENT', talentId });
    } else if (action === 'DEALLOCATE_TALENT') {
      const talentId = btn.dataset.talent;
      if (talentId) dispatch({ type: 'DEALLOCATE_TALENT', talentId });
    } else if (action === 'RESET_TALENTS') {
      dispatch({ type: 'RESET_TALENTS' });
    } else if (action === 'CLOSE_TALENTS') {
      dispatch({ type: 'CLOSE_TALENTS' });
    }
  });
}
