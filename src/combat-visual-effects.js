/**
 * Combat Visual Effects System
 * 
 * Adds screen shake, flash overlays, and particle effects during combat
 * to enhance the game feel and provide better visual feedback.
 * 
 * All effects are CSS-based and respect the reduced-motion preference.
 */

/** @type {HTMLElement|null} */
let overlayContainer = null;

/** @type {HTMLElement|null} */
let particleContainer = null;

/** Whether reduced motion is preferred */
let reducedMotion = false;

/**
 * Initialize the visual effects system.
 * Creates overlay containers and checks motion preferences.
 */
export function initVisualEffects() {
  if (typeof document === 'undefined') return;
  
  reducedMotion = document.documentElement.classList.contains('reduced-motion') ||
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // Flash overlay container
  if (!overlayContainer || !document.body.contains(overlayContainer)) {
    overlayContainer = document.createElement('div');
    overlayContainer.id = 'vfx-overlay';
    overlayContainer.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;' +
      'pointer-events:none;z-index:9998;opacity:0;transition:opacity 0.08s ease;';
    document.body.appendChild(overlayContainer);
  }

  // Particle container
  if (!particleContainer || !document.body.contains(particleContainer)) {
    particleContainer = document.createElement('div');
    particleContainer.id = 'vfx-particles';
    particleContainer.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;' +
      'pointer-events:none;z-index:9997;overflow:hidden;';
    document.body.appendChild(particleContainer);
  }

  // Inject keyframes if not already present
  if (!document.getElementById('vfx-styles')) {
    const style = document.createElement('style');
    style.id = 'vfx-styles';
    style.textContent = `
      @keyframes vfx-shake-sm {
        0%, 100% { transform: translate(0, 0); }
        10% { transform: translate(-2px, 1px); }
        20% { transform: translate(3px, -1px); }
        30% { transform: translate(-1px, 2px); }
        40% { transform: translate(2px, -2px); }
        50% { transform: translate(-3px, 0px); }
        60% { transform: translate(1px, 1px); }
        70% { transform: translate(-2px, -1px); }
        80% { transform: translate(3px, 0px); }
        90% { transform: translate(-1px, -2px); }
      }
      @keyframes vfx-shake-lg {
        0%, 100% { transform: translate(0, 0); }
        10% { transform: translate(-5px, 3px); }
        20% { transform: translate(6px, -2px); }
        30% { transform: translate(-3px, 5px); }
        40% { transform: translate(4px, -4px); }
        50% { transform: translate(-6px, 1px); }
        60% { transform: translate(3px, 3px); }
        70% { transform: translate(-4px, -2px); }
        80% { transform: translate(5px, -1px); }
        90% { transform: translate(-2px, -4px); }
      }
      @keyframes vfx-particle-rise {
        0% { transform: translate(0, 0) scale(1); opacity: 1; }
        100% { transform: translate(var(--vfx-dx, 0px), var(--vfx-dy, -40px)) scale(0.3); opacity: 0; }
      }
      @keyframes vfx-particle-burst {
        0% { transform: translate(0, 0) scale(0.5); opacity: 1; }
        50% { opacity: 0.8; }
        100% { transform: translate(var(--vfx-dx, 20px), var(--vfx-dy, -20px)) scale(0); opacity: 0; }
      }
      @keyframes vfx-sparkle {
        0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
        50% { opacity: 1; transform: scale(1) rotate(180deg); }
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Trigger a screen shake effect.
 * @param {'small'|'large'} intensity - Shake intensity
 * @param {number} [duration=300] - Duration in ms
 */
export function screenShake(intensity = 'small', duration = 300) {
  if (reducedMotion || typeof document === 'undefined') return;
  
  const app = document.querySelector('.app') || document.body;
  const animName = intensity === 'large' ? 'vfx-shake-lg' : 'vfx-shake-sm';
  
  app.style.animation = `${animName} ${duration}ms ease-in-out`;
  
  const cleanup = () => {
    app.style.animation = '';
  };
  setTimeout(cleanup, duration);
}

/**
 * Trigger a flash overlay effect.
 * @param {string} color - CSS color for the flash
 * @param {number} [duration=150] - Duration in ms
 */
export function flashScreen(color = 'rgba(255, 100, 100, 0.15)', duration = 150) {
  if (reducedMotion || !overlayContainer) return;
  
  overlayContainer.style.backgroundColor = color;
  overlayContainer.style.opacity = '1';
  
  setTimeout(() => {
    overlayContainer.style.opacity = '0';
  }, duration);
}

/**
 * Spawn particle effects at a target location.
 * @param {object} opts
 * @param {'enemy'|'player'} opts.target - Which combat card to target
 * @param {'hit'|'critical'|'heal'|'shield'|'fire'|'ice'|'lightning'|'holy'|'shadow'|'nature'} opts.type
 * @param {number} [opts.count=8] - Number of particles
 */
export function spawnParticles({ target = 'enemy', type = 'hit', count = 8 }) {
  if (reducedMotion || !particleContainer || typeof document === 'undefined') return;

  // Find target card position
  const cards = document.querySelectorAll('#hud .card');
  let targetCard = null;
  for (const card of cards) {
    const heading = card.querySelector('h2');
    if (!heading) continue;
    const headText = heading.textContent.trim().toLowerCase();
    if (target === 'player' && headText === 'player') { targetCard = card; break; }
    if (target === 'enemy' && headText !== 'player') { targetCard = card; break; }
  }

  if (!targetCard) return;

  const rect = targetCard.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const config = getParticleConfig(type);

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const dist = 30 + Math.random() * 50;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const size = config.minSize + Math.random() * (config.maxSize - config.minSize);

    p.style.cssText =
      `position:fixed;left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;` +
      `border-radius:${config.shape === 'circle' ? '50%' : config.shape === 'diamond' ? '2px' : '50%'};` +
      `background:${config.colors[i % config.colors.length]};` +
      `--vfx-dx:${dx}px;--vfx-dy:${dy}px;` +
      `animation:vfx-particle-burst ${config.duration}ms ease-out forwards;` +
      `pointer-events:none;z-index:9997;` +
      `box-shadow:0 0 ${config.glow}px ${config.colors[i % config.colors.length]};` +
      (config.shape === 'diamond' ? `transform:rotate(45deg);` : '');

    particleContainer.appendChild(p);
    setTimeout(() => p.remove(), config.duration + 50);
  }
}

/**
 * Get particle configuration based on effect type.
 * @param {string} type
 * @returns {object}
 */
function getParticleConfig(type) {
  const configs = {
    hit: {
      colors: ['#fff', '#ddd', '#bbb', '#ff9'],
      minSize: 3, maxSize: 7, duration: 400, glow: 3, shape: 'circle'
    },
    critical: {
      colors: ['#ff4', '#ff0', '#fa0', '#f80', '#fff'],
      minSize: 4, maxSize: 10, duration: 600, glow: 6, shape: 'diamond'
    },
    heal: {
      colors: ['#4f8', '#2d8', '#6fa', '#8fc'],
      minSize: 3, maxSize: 6, duration: 500, glow: 4, shape: 'circle'
    },
    shield: {
      colors: ['#48f', '#68f', '#8af', '#adf'],
      minSize: 3, maxSize: 6, duration: 400, glow: 4, shape: 'diamond'
    },
    fire: {
      colors: ['#f40', '#f80', '#fc0', '#fa0', '#ff6'],
      minSize: 4, maxSize: 9, duration: 500, glow: 6, shape: 'circle'
    },
    ice: {
      colors: ['#8df', '#aef', '#cff', '#68f'],
      minSize: 3, maxSize: 7, duration: 600, glow: 5, shape: 'diamond'
    },
    lightning: {
      colors: ['#ff0', '#ffa', '#fff', '#fd4'],
      minSize: 2, maxSize: 6, duration: 300, glow: 8, shape: 'circle'
    },
    holy: {
      colors: ['#ffe', '#ffd', '#ffa', '#fff'],
      minSize: 3, maxSize: 8, duration: 600, glow: 6, shape: 'circle'
    },
    shadow: {
      colors: ['#a4f', '#84c', '#62a', '#c6f'],
      minSize: 4, maxSize: 8, duration: 500, glow: 4, shape: 'circle'
    },
    nature: {
      colors: ['#4d4', '#6a4', '#8c4', '#4b2'],
      minSize: 3, maxSize: 7, duration: 500, glow: 3, shape: 'circle'
    }
  };

  return configs[type] || configs.hit;
}

/**
 * Play a combined visual effect for a combat action.
 * @param {object} opts
 * @param {'attack'|'critical'|'heal'|'block'|'miss'|'elementalAttack'} opts.action
 * @param {'player'|'enemy'} opts.target - Who is being affected
 * @param {string} [opts.element] - Element type for elemental attacks
 */
export function playCombatEffect({ action, target = 'enemy', element = null }) {
  if (reducedMotion || typeof document === 'undefined') return;

  initVisualEffects();

  switch (action) {
    case 'attack':
      screenShake('small', 200);
      flashScreen('rgba(255, 255, 255, 0.08)', 100);
      spawnParticles({ target, type: 'hit', count: 6 });
      break;

    case 'critical':
      screenShake('large', 350);
      flashScreen('rgba(255, 200, 50, 0.15)', 200);
      spawnParticles({ target, type: 'critical', count: 12 });
      break;

    case 'heal':
      flashScreen('rgba(80, 200, 120, 0.1)', 200);
      spawnParticles({ target, type: 'heal', count: 8 });
      break;

    case 'block':
      screenShake('small', 150);
      flashScreen('rgba(100, 150, 255, 0.1)', 120);
      spawnParticles({ target, type: 'shield', count: 6 });
      break;

    case 'miss':
      // Subtle effect for misses — just a small particle puff
      spawnParticles({ target, type: 'hit', count: 3 });
      break;

    case 'elementalAttack':
      screenShake('small', 250);
      if (element) {
        const flashColors = {
          fire: 'rgba(255, 100, 30, 0.12)',
          ice: 'rgba(100, 180, 255, 0.12)',
          lightning: 'rgba(255, 240, 50, 0.12)',
          holy: 'rgba(255, 240, 200, 0.12)',
          shadow: 'rgba(140, 60, 200, 0.12)',
          nature: 'rgba(80, 200, 80, 0.12)',
        };
        flashScreen(flashColors[element] || 'rgba(255, 255, 255, 0.08)', 180);
        spawnParticles({ target, type: element, count: 10 });
      } else {
        flashScreen('rgba(255, 255, 255, 0.08)', 150);
        spawnParticles({ target, type: 'hit', count: 8 });
      }
      break;

    default:
      break;
  }
}

/**
 * Spawn sparkle effects (for level up, item acquisition, etc.)
 * @param {object} opts
 * @param {number} opts.x - Center X position
 * @param {number} opts.y - Center Y position
 * @param {number} [opts.count=6] - Number of sparkles
 * @param {string} [opts.color='#ffd700'] - Sparkle color
 */
export function spawnSparkles({ x, y, count = 6, color = '#ffd700' }) {
  if (reducedMotion || !particleContainer || typeof document === 'undefined') return;

  for (let i = 0; i < count; i++) {
    const sparkle = document.createElement('div');
    const angle = (Math.PI * 2 * i) / count;
    const dist = 20 + Math.random() * 40;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const delay = Math.random() * 300;

    sparkle.textContent = '✦';
    sparkle.style.cssText =
      `position:fixed;left:${x}px;top:${y}px;font-size:${10 + Math.random() * 8}px;` +
      `color:${color};pointer-events:none;z-index:9997;` +
      `--vfx-dx:${dx}px;--vfx-dy:${dy}px;` +
      `animation:vfx-sparkle ${600 + Math.random() * 400}ms ease-in-out ${delay}ms forwards;` +
      `text-shadow:0 0 6px ${color};`;

    particleContainer.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 1200);
  }
}
