/**
 * Floating Text System
 * Shows animated damage/heal numbers that float upward during combat.
 * Numbers appear over the Player or Enemy card and drift up while fading out.
 */

/** @type {HTMLElement|null} */
let container = null;

/**
 * Ensure the floating-text overlay container exists in the DOM.
 * It's absolutely positioned over the #hud area.
 */
function ensureContainer() {
  if (container && document.body.contains(container)) return container;
  container = document.createElement('div');
  container.id = 'floating-text-container';
  container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;overflow:hidden;';
  document.body.appendChild(container);
  return container;
}

/**
 * Spawn a floating text element at the given screen position.
 * @param {object} opts
 * @param {string} opts.text - The text to display (e.g. "-12", "+8")
 * @param {'damage'|'heal'|'critical'|'miss'|'status'|'shield'} opts.type - Determines color/style
 * @param {'player'|'enemy'} opts.target - Which combat card to float over
 */
export function showFloatingText({ text, type = 'damage', target = 'enemy' }) {
  const cont = ensureContainer();

  // Find the target card element to position the text
  const cards = document.querySelectorAll('#hud .card');
  let targetCard = null;
  for (const card of cards) {
    const heading = card.querySelector('h2');
    if (!heading) continue;
    const headText = heading.textContent.trim().toLowerCase();
    if (target === 'player' && headText === 'player') {
      targetCard = card;
      break;
    }
    if (target === 'enemy' && headText === 'enemy') {
      targetCard = card;
      break;
    }
  }

  if (!targetCard) return; // Not in combat view

  const rect = targetCard.getBoundingClientRect();
  // Position randomly within the card horizontally, at vertical center
  const xOffset = rect.width * (0.2 + Math.random() * 0.6);
  const startX = rect.left + xOffset;
  const startY = rect.top + rect.height * 0.3 + Math.random() * rect.height * 0.3;

  const el = document.createElement('div');
  el.className = `floating-text floating-text--${type}`;
  el.textContent = text;
  el.style.left = `${startX}px`;
  el.style.top = `${startY}px`;

  cont.appendChild(el);

  // Remove element after animation completes
  el.addEventListener('animationend', () => el.remove());
  // Fallback removal after 1.5s in case animationend doesn't fire
  setTimeout(() => { if (el.parentNode) el.remove(); }, 1500);
}

/**
 * Parse combat log messages and trigger appropriate floating text.
 * Call this after combat state updates to show damage/heal numbers.
 * @param {string[]} currentLog - The current combat log array
 * @param {string[]} previousLog - The previous combat log array
 */
export function triggerFloatingTextFromLog(currentLog, previousLog) {
  if (!currentLog || !previousLog) return;
  const prevLen = previousLog.length;
  if (currentLog.length <= prevLen) return;

  // Only process new log entries
  const newEntries = currentLog.slice(prevLen);

  for (const entry of newEntries) {
    // Status effect damage (poison, burn, bleed) — check BEFORE generic damage
    const statusDmg = entry.match(/takes?\s+(\d+)\s+(?:poison|burn|bleed(?:ing)?)\s+damage/i);
    if (statusDmg) {
      const isPlayer = /you take/i.test(entry) || /hero takes/i.test(entry);
      showFloatingText({
        text: `-${parseInt(statusDmg[1], 10)}`,
        type: 'status',
        target: isPlayer ? 'player' : 'enemy'
      });
      continue;
    }

    // Enemy deals damage to player — check BEFORE generic damage
    const enemyDmg = entry.match(/slams?\s+you\s+for\s+(\d+)\s+damage/i);
    if (enemyDmg) {
      showFloatingText({
        text: `-${parseInt(enemyDmg[1], 10)}`,
        type: 'damage',
        target: 'player'
      });
      continue;
    }

    // Throw item damage — check before generic
    const throwDmg = entry.match(/throw\s+\w+.*for\s+(\d+)\s+.*damage/i);
    if (throwDmg) {
      showFloatingText({
        text: `-${parseInt(throwDmg[1], 10)}`,
        type: 'damage',
        target: 'enemy'
      });
      continue;
    }

    // Player deals damage to enemy (strike or ability)
    const playerDmg = entry.match(/(?:strike|takes?)\s+(?:for\s+)?(\d+)\s+(?:\w+\s+)?damage/i);
    if (playerDmg && (entry.includes('strike') || entry.includes('takes'))) {
      const amount = parseInt(playerDmg[1], 10);
      const isCrit = /critical/i.test(entry);
      showFloatingText({
        text: `-${amount}`,
        type: isCrit ? 'critical' : 'damage',
        target: 'enemy'
      });
      continue;
    }

    // Player heals (potion or other)
    const healMatch = entry.match(/heal\s+(\d+)\s+HP/i);
    if (healMatch) {
      showFloatingText({
        text: `+${parseInt(healMatch[1], 10)}`,
        type: 'heal',
        target: 'player'
      });
      continue;
    }

    // Miss
    if (/misses?/i.test(entry) && /attack/i.test(entry)) {
      showFloatingText({
        text: 'MISS',
        type: 'miss',
        target: /your/i.test(entry) ? 'enemy' : 'player'
      });
      continue;
    }

    // Shield break
    if (/shields?\s+broken/i.test(entry)) {
      showFloatingText({
        text: 'BREAK!',
        type: 'shield',
        target: 'enemy'
      });
      continue;
    }

    // Regeneration / healing over time
    const regenMatch = entry.match(/(?:regenerates?|heals?)\s+(\d+)\s+HP/i);
    if (regenMatch) {
      const isPlayer = !/enemy/i.test(entry);
      showFloatingText({
        text: `+${parseInt(regenMatch[1], 10)}`,
        type: 'heal',
        target: isPlayer ? 'player' : 'enemy'
      });
      continue;
    }
  }
}

/**
 * Get the CSS styles for floating text animations.
 * @returns {string}
 */
export function getFloatingTextStyles() {
  return `
    .floating-text {
      position: fixed;
      font-weight: 900;
      font-size: 1.4rem;
      text-shadow: 0 0 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.5);
      pointer-events: none;
      animation: floatUp 1.2s ease-out forwards;
      z-index: 10000;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      white-space: nowrap;
    }
    .floating-text--damage {
      color: #ff4444;
    }
    .floating-text--critical {
      color: #ff0000;
      font-size: 1.8rem;
      text-shadow: 0 0 6px rgba(255,0,0,0.7), 0 0 12px rgba(255,0,0,0.4);
    }
    .floating-text--heal {
      color: #44ff44;
    }
    .floating-text--miss {
      color: #999999;
      font-style: italic;
      font-size: 1.2rem;
    }
    .floating-text--status {
      color: #cc66ff;
    }
    .floating-text--shield {
      color: #ffcc00;
      font-size: 1.6rem;
      text-shadow: 0 0 6px rgba(255,204,0,0.7), 0 0 12px rgba(255,204,0,0.4);
    }
    @keyframes floatUp {
      0% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      20% {
        opacity: 1;
        transform: translateY(-15px) scale(1.1);
      }
      100% {
        opacity: 0;
        transform: translateY(-60px) scale(0.8);
      }
    }
  `;
}
