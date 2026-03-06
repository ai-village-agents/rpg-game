/**
 * Boss UI Module - Phase-aware health bar and visual effects
 * Displays boss health with phase segments, transition animations, and ability indicators
 */

import { getCurrentPhase, getPhaseName, getBossHpSegments, isBoss } from './boss.js';

/**
 * Creates the boss health bar container element
 * @param {Object} boss - Boss encounter state
 * @returns {string} HTML string for boss health bar
 */
export function createBossHealthBar(boss) {
  if (!boss || !isBoss(boss)) {
    return '';
  }
  
  const currentPhase = getCurrentPhase(boss);
  const phaseName = getPhaseName(boss);
  const hpPercent = Math.max(0, Math.min(100, (boss.hp / boss.maxHp) * 100));
  const segments = getBossHpSegments(boss);
  
  // Build phase segment markers
  let segmentMarkers = '';
  for (const segment of segments) {
    if (segment.threshold > 0 && segment.threshold < 100) {
      segmentMarkers += `<div class="boss-hp-segment" style="left: ${segment.threshold}%;" data-phase="${segment.phase}"></div>`;
    }
  }
  
  // Determine health bar color based on HP percentage
  let hpColorClass = 'boss-hp-high';
  if (hpPercent <= 25) {
    hpColorClass = 'boss-hp-critical';
  } else if (hpPercent <= 50) {
    hpColorClass = 'boss-hp-low';
  } else if (hpPercent <= 75) {
    hpColorClass = 'boss-hp-medium';
  }
  
  return `
    <div class="boss-health-container" data-boss-id="${boss.id}">
      <div class="boss-name-plate">
        <span class="boss-name">${boss.name}</span>
        <span class="boss-phase-indicator">Phase ${currentPhase}: ${phaseName}</span>
      </div>
      <div class="boss-hp-bar-container">
        <div class="boss-hp-bar ${hpColorClass}" style="width: ${hpPercent}%;">
          <div class="boss-hp-fill-effect"></div>
        </div>
        ${segmentMarkers}
        <div class="boss-hp-text">${boss.hp} / ${boss.maxHp}</div>
      </div>
      <div class="boss-status-indicators">
        ${renderBossStatusEffects(boss)}
      </div>
    </div>
  `;
}

/**
 * Renders boss status effect icons
 * @param {Object} boss - Boss encounter state
 * @returns {string} HTML string for status effects
 */
export function renderBossStatusEffects(boss) {
  if (!boss.statusEffects || boss.statusEffects.length === 0) {
    return '';
  }
  
  const effectIcons = {
    'poison': '☠',
    'burn': '🔥',
    'stun': '💫',
    'sleep': '💤',
    'atk-down': '💢',
    'def-down': '🩹',
    'spd-down': '🐌'
  };
  
  return boss.statusEffects.map(effect => {
    const icon = effectIcons[effect.type] || '❓';
    return `<span class="boss-status-icon" data-effect="${effect.type}" title="${effect.type} (${effect.duration} turns)">${icon}</span>`;
  }).join('');
}

/**
 * Creates phase transition overlay effect
 * @param {Object} boss - Boss encounter state
 * @param {number} newPhase - The phase being transitioned to
 * @returns {string} HTML string for transition overlay
 */
export function createPhaseTransitionOverlay(boss, newPhase) {
  const phaseData = boss.phases.find(p => p.phase === newPhase);
  const dialogue = phaseData?.dialogue || `${boss.name} enters a new phase!`;
  
  return `
    <div class="boss-phase-transition-overlay" data-phase="${newPhase}">
      <div class="boss-transition-flash"></div>
      <div class="boss-transition-content">
        <div class="boss-transition-phase">Phase ${newPhase}</div>
        <div class="boss-transition-name">${phaseData?.name || 'Unknown Phase'}</div>
        <div class="boss-transition-dialogue">"${dialogue}"</div>
      </div>
    </div>
  `;
}

/**
 * Creates ability announcement element
 * @param {Object} boss - Boss encounter state
 * @param {Object} ability - The ability being used
 * @returns {string} HTML string for ability announcement
 */
export function createAbilityAnnouncement(boss, ability) {
  if (!ability) return '';
  
  const elementIcons = {
    'fire': '🔥',
    'ice': '❄️',
    'lightning': '⚡',
    'shadow': '🌑',
    'physical': '⚔️',
    'nature': '🌿',
    'holy': '✨'
  };
  
  const elementIcon = elementIcons[ability.element] || '💥';
  
  return `
    <div class="boss-ability-announcement" data-ability="${ability.id}">
      <span class="ability-icon">${elementIcon}</span>
      <span class="ability-name">${ability.name}</span>
      ${ability.description ? `<span class="ability-desc">${ability.description}</span>` : ''}
    </div>
  `;
}

/**
 * Updates the boss health bar in the DOM
 * @param {Object} boss - Boss encounter state
 * @param {boolean} animate - Whether to animate the change
 */
export function updateBossHealthBar(boss, animate = true) {
  const container = document.querySelector(`.boss-health-container[data-boss-id="${boss.id}"]`);
  if (!container) return;
  
  const hpBar = container.querySelector('.boss-hp-bar');
  const hpText = container.querySelector('.boss-hp-text');
  const phaseIndicator = container.querySelector('.boss-phase-indicator');
  
  const hpPercent = Math.max(0, Math.min(100, (boss.hp / boss.maxHp) * 100));
  
  // Update HP bar width
  if (animate) {
    hpBar.style.transition = 'width 0.5s ease-out';
  } else {
    hpBar.style.transition = 'none';
  }
  hpBar.style.width = `${hpPercent}%`;
  
  // Update HP text
  hpText.textContent = `${boss.hp} / ${boss.maxHp}`;
  
  // Update phase indicator
  const currentPhase = getCurrentPhase(boss);
  const phaseName = getPhaseName(boss);
  phaseIndicator.textContent = `Phase ${currentPhase}: ${phaseName}`;
  
  // Update color class
  hpBar.classList.remove('boss-hp-high', 'boss-hp-medium', 'boss-hp-low', 'boss-hp-critical');
  if (hpPercent <= 25) {
    hpBar.classList.add('boss-hp-critical');
  } else if (hpPercent <= 50) {
    hpBar.classList.add('boss-hp-low');
  } else if (hpPercent <= 75) {
    hpBar.classList.add('boss-hp-medium');
  } else {
    hpBar.classList.add('boss-hp-high');
  }
  
  // Update status effects
  const statusContainer = container.querySelector('.boss-status-indicators');
  if (statusContainer) {
    statusContainer.innerHTML = renderBossStatusEffects(boss);
  }
}

/**
 * Triggers phase transition visual effect
 * @param {Object} boss - Boss encounter state
 * @param {number} newPhase - The phase being transitioned to
 * @param {function} onComplete - Callback when transition ends
 */
export function triggerPhaseTransition(boss, newPhase, onComplete) {
  const overlay = createPhaseTransitionOverlay(boss, newPhase);
  const overlayElement = document.createElement('div');
  overlayElement.innerHTML = overlay;
  const overlayNode = overlayElement.firstElementChild;
  
  document.body.appendChild(overlayNode);
  
  // Trigger animation
  requestAnimationFrame(() => {
    overlayNode.classList.add('active');
  });
  
  // Remove after animation
  setTimeout(() => {
    overlayNode.classList.add('fade-out');
    setTimeout(() => {
      overlayNode.remove();
      if (onComplete) onComplete();
    }, 500);
  }, 2500);
}

/**
 * Shows boss ability being used
 * @param {Object} boss - Boss encounter state
 * @param {Object} ability - The ability being used
 */
export function showBossAbility(boss, ability) {
  const announcement = createAbilityAnnouncement(boss, ability);
  const announcementElement = document.createElement('div');
  announcementElement.innerHTML = announcement;
  const announcementNode = announcementElement.firstElementChild;
  
  const combatArea = document.querySelector('.combat-area') || document.body;
  combatArea.appendChild(announcementNode);
  
  // Animate in
  requestAnimationFrame(() => {
    announcementNode.classList.add('active');
  });
  
  // Remove after display
  setTimeout(() => {
    announcementNode.classList.add('fade-out');
    setTimeout(() => {
      announcementNode.remove();
    }, 300);
  }, 1500);
}

/**
 * Creates damage number popup for boss
 * @param {number} damage - Amount of damage dealt
 * @param {boolean} isCritical - Whether it was a critical hit
 * @param {string} element - Element type of the damage
 * @returns {string} HTML string for damage popup
 */
export function createBossDamagePopup(damage, isCritical = false, element = null) {
  const elementColors = {
    'fire': '#ff6b35',
    'ice': '#35b7ff',
    'lightning': '#ffeb3b',
    'shadow': '#9c27b0',
    'physical': '#ffffff',
    'nature': '#4caf50',
    'holy': '#fff59d'
  };
  
  const color = elementColors[element] || '#ff4444';
  const critClass = isCritical ? 'critical' : '';
  
  return `
    <div class="boss-damage-popup ${critClass}" style="color: ${color};">
      ${isCritical ? 'CRIT! ' : ''}${damage}
    </div>
  `;
}

/**
 * Gets CSS styles for boss UI components
 * @returns {string} CSS string
 */
export function getBossUIStyles() {
  return `
    .boss-health-container {
      position: relative;
      width: 100%;
      max-width: 400px;
      margin: 10px auto;
      padding: 10px;
      background: linear-gradient(180deg, #1a0a0a 0%, #2d1515 100%);
      border: 2px solid #8b0000;
      border-radius: 8px;
      box-shadow: 0 0 15px rgba(139, 0, 0, 0.5);
    }
    
    .boss-name-plate {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .boss-name {
      font-size: 18px;
      font-weight: bold;
      color: #ff4444;
      text-shadow: 0 0 5px #ff0000;
    }
    
    .boss-phase-indicator {
      font-size: 12px;
      color: #ffcc00;
      font-style: italic;
    }
    
    .boss-hp-bar-container {
      position: relative;
      height: 24px;
      background: #1a1a1a;
      border: 1px solid #444;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .boss-hp-bar {
      position: absolute;
      height: 100%;
      transition: width 0.5s ease-out;
      border-radius: 3px;
    }
    
    .boss-hp-high { background: linear-gradient(180deg, #44ff44 0%, #22aa22 100%); }
    .boss-hp-medium { background: linear-gradient(180deg, #ffff44 0%, #aaaa22 100%); }
    .boss-hp-low { background: linear-gradient(180deg, #ff8844 0%, #aa5522 100%); }
    .boss-hp-critical { background: linear-gradient(180deg, #ff4444 0%, #aa2222 100%); animation: pulse 0.5s infinite; }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    
    .boss-hp-fill-effect {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 50%;
      background: linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%);
    }
    
    .boss-hp-segment {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #ffcc00;
      z-index: 10;
    }
    
    .boss-hp-text {
      position: absolute;
      width: 100%;
      text-align: center;
      line-height: 24px;
      font-size: 14px;
      font-weight: bold;
      color: #fff;
      text-shadow: 1px 1px 2px #000;
      z-index: 20;
    }
    
    .boss-status-indicators {
      display: flex;
      gap: 5px;
      margin-top: 5px;
      min-height: 24px;
    }
    
    .boss-status-icon {
      font-size: 16px;
      cursor: help;
    }
    
    .boss-phase-transition-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.5s ease;
    }
    
    .boss-phase-transition-overlay.active {
      opacity: 1;
    }
    
    .boss-phase-transition-overlay.fade-out {
      opacity: 0;
    }
    
    .boss-transition-flash {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: white;
      animation: flash 0.3s ease-out;
    }
    
    @keyframes flash {
      0% { opacity: 1; }
      100% { opacity: 0; }
    }
    
    .boss-transition-content {
      text-align: center;
      animation: slideIn 0.5s ease-out;
    }
    
    @keyframes slideIn {
      0% { transform: translateY(-50px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
    
    .boss-transition-phase {
      font-size: 24px;
      color: #ff4444;
      text-transform: uppercase;
      letter-spacing: 5px;
    }
    
    .boss-transition-name {
      font-size: 36px;
      color: #ffcc00;
      font-weight: bold;
      margin: 10px 0;
      text-shadow: 0 0 20px rgba(255, 204, 0, 0.5);
    }
    
    .boss-transition-dialogue {
      font-size: 18px;
      color: #aaa;
      font-style: italic;
      max-width: 500px;
    }
    
    .boss-ability-announcement {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.8);
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid #ff4444;
      border-radius: 10px;
      padding: 15px 25px;
      text-align: center;
      opacity: 0;
      transition: all 0.3s ease;
      z-index: 100;
    }
    
    .boss-ability-announcement.active {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    
    .boss-ability-announcement.fade-out {
      opacity: 0;
      transform: translate(-50%, -50%) scale(1.2);
    }
    
    .boss-ability-announcement .ability-icon {
      font-size: 32px;
      display: block;
      margin-bottom: 5px;
    }
    
    .boss-ability-announcement .ability-name {
      font-size: 20px;
      font-weight: bold;
      color: #ff4444;
      display: block;
    }
    
    .boss-ability-announcement .ability-desc {
      font-size: 12px;
      color: #aaa;
      display: block;
      margin-top: 5px;
    }
    
    .boss-damage-popup {
      position: absolute;
      font-size: 24px;
      font-weight: bold;
      text-shadow: 2px 2px 4px #000;
      animation: damageFloat 1s ease-out forwards;
      pointer-events: none;
    }
    
    .boss-damage-popup.critical {
      font-size: 32px;
      animation: criticalFloat 1s ease-out forwards;
    }
    
    @keyframes damageFloat {
      0% { transform: translateY(0); opacity: 1; }
      100% { transform: translateY(-50px); opacity: 0; }
    }
    
    @keyframes criticalFloat {
      0% { transform: translateY(0) scale(1); opacity: 1; }
      50% { transform: translateY(-25px) scale(1.3); }
      100% { transform: translateY(-60px) scale(1); opacity: 0; }
    }
  `;
}

export default {
  createBossHealthBar,
  renderBossStatusEffects,
  createPhaseTransitionOverlay,
  createAbilityAnnouncement,
  updateBossHealthBar,
  triggerPhaseTransition,
  showBossAbility,
  createBossDamagePopup,
  getBossUIStyles
};
