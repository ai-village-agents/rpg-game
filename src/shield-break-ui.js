import { ELEMENT_ICONS } from './shield-break.js';

export function renderShieldDisplay(enemy) {
  if (!enemy) return '';

  const maxShields = enemy.maxShields || 0;
  const currentShields = enemy.isBroken ? 0 : (enemy.currentShields || 0);
  const fullCount = Math.max(0, Math.min(maxShields, currentShields));
  const emptyCount = Math.max(0, maxShields - fullCount);

  const fullIcons = '🛡'.repeat(fullCount);
  const emptyIcons = '○'.repeat(emptyCount);

  return `<div class="shield-display">${fullIcons}${emptyIcons}</div>`;
}

export function renderWeaknessIcons(weaknesses) {
  if (!weaknesses || weaknesses.length === 0) return '';

  const icons = weaknesses
    .map((type) => {
      const icon = ELEMENT_ICONS[type] || '';
      return `<span class="weakness-icon">${icon}</span>`;
    })
    .join('');

  return icons;
}

export function renderBreakState(enemy) {
  if (!enemy || !enemy.isBroken) return '';

  const turns = enemy.breakTurnsRemaining ?? 0;

  return (
    `<div class="break-state-display break-active">` +
    `💥 BROKEN <span>Recovers in ${turns} turn(s)</span>` +
    `</div>`
  );
}

export function getShieldIconClass(type) {
  if (type === 'full') return 'shield-full';
  if (type === 'empty') return 'shield-empty';
  if (type === 'broken') return 'shield-broken';
  return 'shield-full';
}

export function animateShieldBreak(enemy) {
  return enemy && enemy.isBroken ? 'shield-break-animation' : '';
}

export function renderShieldBreakHUD(enemy) {
  if (!enemy) return '';

  const shields = renderShieldDisplay(enemy);
  const weaknesses = renderWeaknessIcons(enemy.weaknesses || []);
  const breakState = renderBreakState(enemy);

  return (
    `<div class="shield-break-hud">` +
    `${shields}` +
    `${weaknesses}` +
    `${breakState}` +
    `</div>`
  );
}
