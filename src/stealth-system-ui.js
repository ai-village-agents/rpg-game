/**
 * Stealth System UI
 * Rendering functions for stealth interface
 */

import {
  STEALTH_STATES,
  DETECTION_TYPES,
  COVER_LEVELS,
  NOISE_LEVELS,
  LIGHT_LEVELS,
  AMBUSH_BONUSES,
  getStealthStatus,
  getStealthStats,
  calculateDetection,
  calculateAmbushBonus,
  canEnterStealth
} from './stealth-system.js';

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
 * Render stealth panel
 */
export function renderStealthPanel(state) {
  const status = getStealthStatus(state);

  return `
    <div class="stealth-panel">
      <div class="stealth-header">
        <h3>Stealth</h3>
        <span class="stealth-indicator ${status.isStealthed ? 'active' : 'inactive'}">
          ${status.isStealthed ? '&#128065; Stealthed' : '&#128064; Visible'}
        </span>
      </div>
      ${status.isStealthed ? renderStealthActive(status) : renderStealthInactive(state)}
      ${renderSuspicionMeter(status.suspicionLevel)}
      ${renderEnvironment(status)}
    </div>
  `;
}

/**
 * Render active stealth info
 */
export function renderStealthActive(status) {
  return `
    <div class="stealth-active">
      <div class="stealth-level">
        <span class="label">Stealth Level</span>
        <div class="level-bar">
          <div class="level-fill" style="width: ${status.stealthLevel}%"></div>
        </div>
        <span class="value">${status.stealthLevel}/100</span>
      </div>
      <div class="stealth-state ${status.stealthState.id}">
        <span>${escapeHtml(status.stealthState.name)}</span>
        <span class="mod">${status.stealthState.detectionMod}% detection</span>
      </div>
      <button class="exit-stealth-btn">Exit Stealth</button>
    </div>
  `;
}

/**
 * Render inactive stealth info
 */
export function renderStealthInactive(state) {
  const canStealth = canEnterStealth(state);

  return `
    <div class="stealth-inactive">
      <p>Not currently stealthed</p>
      <button class="enter-stealth-btn" ${canStealth.canEnter ? '' : 'disabled'}>
        ${canStealth.canEnter ? 'Enter Stealth' : escapeHtml(canStealth.reason)}
      </button>
    </div>
  `;
}

/**
 * Render suspicion meter
 */
export function renderSuspicionMeter(suspicionLevel) {
  let alertClass = 'low';
  if (suspicionLevel >= 75) alertClass = 'critical';
  else if (suspicionLevel >= 50) alertClass = 'high';
  else if (suspicionLevel >= 25) alertClass = 'medium';

  return `
    <div class="suspicion-meter ${alertClass}">
      <span class="label">Suspicion</span>
      <div class="meter-bar">
        <div class="meter-fill" style="width: ${suspicionLevel}%"></div>
      </div>
      <span class="value">${suspicionLevel}%</span>
      ${suspicionLevel >= 100 ? '<span class="alert-icon">&#9888;</span>' : ''}
    </div>
  `;
}

/**
 * Render environment info
 */
export function renderEnvironment(status) {
  return `
    <div class="stealth-environment">
      <div class="env-item">
        <span class="label">Cover</span>
        <span class="value">${escapeHtml(status.cover.name)}</span>
        <span class="bonus">+${status.cover.bonus}%</span>
      </div>
      <div class="env-item">
        <span class="label">Noise</span>
        <span class="value">${escapeHtml(status.noiseLevel)}</span>
      </div>
      <div class="env-item">
        <span class="label">Light</span>
        <span class="value">${escapeHtml(status.lightLevel || 'normal')}</span>
      </div>
    </div>
  `;
}

/**
 * Render cover selector
 */
export function renderCoverSelector(currentCover) {
  return `
    <div class="cover-selector">
      <h4>Select Cover</h4>
      <div class="cover-options">
        ${Object.values(COVER_LEVELS).map(cover => `
          <button class="cover-option ${currentCover === cover.id ? 'selected' : ''}"
                  data-cover="${cover.id}">
            <span class="cover-name">${escapeHtml(cover.name)}</span>
            <span class="cover-bonus">+${cover.bonus}%</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render light level selector
 */
export function renderLightSelector(currentLight) {
  return `
    <div class="light-selector">
      <h4>Light Level</h4>
      <div class="light-options">
        ${Object.values(LIGHT_LEVELS).map(light => `
          <button class="light-option ${currentLight === light.id ? 'selected' : ''}"
                  data-light="${light.id}">
            <span class="light-name">${escapeHtml(light.name)}</span>
            <span class="light-bonus">${light.stealthBonus >= 0 ? '+' : ''}${light.stealthBonus}%</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render detection preview
 */
export function renderDetectionPreview(state, detecterStats) {
  const detection = calculateDetection(state, detecterStats);

  return `
    <div class="detection-preview">
      <h4>Detection Chance</h4>
      <div class="detection-bar">
        <div class="detection-fill ${detection.chance > 50 ? 'dangerous' : 'safe'}"
             style="width: ${detection.chance}%"></div>
      </div>
      <span class="detection-value">${detection.chance}%</span>
      ${detection.detected ? '<span class="detected-warning">Will be detected!</span>' : ''}
    </div>
  `;
}

/**
 * Render ambush preview
 */
export function renderAmbushPreview(state, targetAwareness) {
  const ambush = calculateAmbushBonus(state, targetAwareness);

  if (!ambush.canAmbush) {
    return `
      <div class="ambush-preview unavailable">
        <span>Cannot perform ambush</span>
      </div>
    `;
  }

  return `
    <div class="ambush-preview available ${ambush.ambushType}">
      <h4>${escapeHtml(ambush.bonus.name)}</h4>
      <div class="ambush-bonuses">
        <span class="damage-bonus">x${ambush.bonus.damageBonus} Damage</span>
        <span class="crit-bonus">+${ambush.bonus.critBonus}% Crit</span>
      </div>
    </div>
  `;
}

/**
 * Render ambush types reference
 */
export function renderAmbushTypes() {
  return `
    <div class="ambush-types">
      <h4>Ambush Types</h4>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Damage</th>
            <th>Crit Bonus</th>
          </tr>
        </thead>
        <tbody>
          ${Object.values(AMBUSH_BONUSES).map(ambush => `
            <tr class="${ambush.id}">
              <td>${escapeHtml(ambush.name)}</td>
              <td>x${ambush.damageBonus}</td>
              <td>+${ambush.critBonus}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Render stealth states reference
 */
export function renderStealthStates() {
  return `
    <div class="stealth-states">
      <h4>Stealth States</h4>
      <ul>
        ${Object.values(STEALTH_STATES).map(s => `
          <li class="${s.id}">
            <span class="state-name">${escapeHtml(s.name)}</span>
            <span class="state-mod">${s.detectionMod}% detection</span>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

/**
 * Render detection types
 */
export function renderDetectionTypes() {
  return `
    <div class="detection-types">
      <h4>Detection Methods</h4>
      <ul>
        ${Object.values(DETECTION_TYPES).map(d => `
          <li>
            <span class="type-name">${escapeHtml(d.name)}</span>
            <span class="type-range">Range: ${d.range}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

/**
 * Render stealth stats
 */
export function renderStealthStats(state) {
  const stats = getStealthStats(state);

  return `
    <div class="stealth-stats">
      <h4>Statistics</h4>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-value">${stats.successfulSneaks}</span>
          <span class="stat-label">Successful Sneaks</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.ambushes}</span>
          <span class="stat-label">Ambushes</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.timesDetected}</span>
          <span class="stat-label">Times Detected</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render compact stealth indicator
 */
export function renderCompactStealth(state) {
  const status = getStealthStatus(state);

  return `
    <div class="stealth-compact ${status.isStealthed ? 'active' : 'inactive'}">
      <span class="icon">${status.isStealthed ? '&#128065;' : '&#128064;'}</span>
      ${status.isStealthed 
        ? `<span class="level">${status.stealthLevel}</span>`
        : ''
      }
    </div>
  `;
}

/**
 * Render alert notification
 */
export function renderAlertNotification(alertLevel) {
  const notifications = {
    suspicious: { icon: '&#10067;', text: 'Enemy is suspicious', class: 'suspicious' },
    searching: { icon: '&#128269;', text: 'Enemy is searching', class: 'searching' },
    alert: { icon: '&#9888;', text: 'ALERT! Enemy knows your position!', class: 'alert' }
  };

  const notif = notifications[alertLevel] || notifications.suspicious;

  return `
    <div class="alert-notification ${notif.class}">
      <span class="alert-icon">${notif.icon}</span>
      <span class="alert-text">${notif.text}</span>
    </div>
  `;
}

/**
 * Render noise level indicator
 */
export function renderNoiseIndicator(noiseLevel) {
  const noise = NOISE_LEVELS[noiseLevel.toUpperCase()] || NOISE_LEVELS.NORMAL;
  const bars = Math.ceil((noise.penalty / 100) * 5);

  return `
    <div class="noise-indicator ${noise.id}">
      <span class="noise-label">${escapeHtml(noise.name)}</span>
      <div class="noise-bars">
        ${Array(5).fill(0).map((_, i) => `
          <div class="noise-bar ${i < bars ? 'active' : ''}"></div>
        `).join('')}
      </div>
    </div>
  `;
}
