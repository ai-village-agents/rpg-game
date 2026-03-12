/**
 * Timed Hits UI Components
 * Renders timing indicators, feedback, and animations
 */

import {
  TIMING_RATING,
  HIT_TYPE,
  getChallengeProgress,
  getOptimalPosition,
  getTimingFeedback,
  getRatingColor,
  isSuccessfulTiming,
} from './timed-hits.js';

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Get type-specific icon
 * @param {string} type - Hit type
 * @returns {string} Icon character
 */
function getTypeIcon(type) {
  switch (type) {
    case HIT_TYPE.ATTACK:
      return '\u2694'; // Crossed swords
    case HIT_TYPE.DEFEND:
      return '\u26E8'; // Shield
    case HIT_TYPE.COUNTER:
      return '\u21BA'; // Counterclockwise arrow
    case HIT_TYPE.CHARGE:
      return '\u26A1'; // Lightning
    default:
      return '\u25CF'; // Circle
  }
}

/**
 * Get rating icon
 * @param {string} rating - Timing rating
 * @returns {string} Icon character
 */
function getRatingIcon(rating) {
  switch (rating) {
    case TIMING_RATING.PERFECT:
      return '\u2605'; // Star
    case TIMING_RATING.GOOD:
      return '\u2713'; // Check
    case TIMING_RATING.OK:
      return '\u25CB'; // Circle
    case TIMING_RATING.MISS:
    default:
      return '\u2717'; // X
  }
}

/**
 * Render the timing bar indicator
 * @param {Object} challenge - Active challenge
 * @param {number} currentTime - Current timestamp
 * @returns {string} HTML string
 */
export function renderTimingBar(challenge, currentTime) {
  if (!challenge) return '';

  const progress = getChallengeProgress(challenge, currentTime);
  const optimalPos = getOptimalPosition(challenge);
  const typeIcon = getTypeIcon(challenge.type);

  // Calculate window widths as percentages
  const windowWidth = (challenge.windows.ok / challenge.duration) * 100 * 2;
  const goodWidth = (challenge.windows.good / challenge.duration) * 100 * 2;
  const perfectWidth = (challenge.windows.perfect / challenge.duration) * 100 * 2;

  return `
    <div class="timed-hit-bar" data-type="${escapeHtml(challenge.type)}">
      <div class="timing-track">
        <div class="timing-zone zone-ok" style="left: ${optimalPos - windowWidth/2}%; width: ${windowWidth}%"></div>
        <div class="timing-zone zone-good" style="left: ${optimalPos - goodWidth/2}%; width: ${goodWidth}%"></div>
        <div class="timing-zone zone-perfect" style="left: ${optimalPos - perfectWidth/2}%; width: ${perfectWidth}%"></div>
        <div class="timing-target" style="left: ${optimalPos}%">
          <span class="target-icon">${typeIcon}</span>
        </div>
        <div class="timing-cursor" style="left: ${progress}%"></div>
      </div>
      <div class="timing-prompt">
        <span class="prompt-text">Press SPACE!</span>
      </div>
    </div>
  `.trim();
}

/**
 * Render timing result feedback
 * @param {string} rating - Timing rating
 * @param {string} type - Hit type
 * @param {number} bonus - Bonus multiplier
 * @returns {string} HTML string
 */
export function renderTimingResult(rating, type = HIT_TYPE.ATTACK, bonus = 1) {
  const feedback = getTimingFeedback(rating, type);
  const color = getRatingColor(rating);
  const icon = getRatingIcon(rating);
  const isSuccess = isSuccessfulTiming(rating);

  const bonusText = type === HIT_TYPE.ATTACK
    ? (bonus > 1 ? `x${bonus.toFixed(2)} damage!` : '')
    : (bonus < 1 ? `${Math.round((1 - bonus) * 100)}% blocked!` : '');

  return `
    <div class="timed-hit-result ${rating}" style="--rating-color: ${color}">
      <span class="result-icon">${icon}</span>
      <span class="result-text">${escapeHtml(feedback)}</span>
      ${bonusText ? `<span class="result-bonus">${escapeHtml(bonusText)}</span>` : ''}
    </div>
  `.trim();
}

/**
 * Render rating badge
 * @param {string} rating - Timing rating
 * @returns {string} HTML string
 */
export function renderRatingBadge(rating) {
  const color = getRatingColor(rating);
  const icon = getRatingIcon(rating);
  const label = rating.charAt(0).toUpperCase() + rating.slice(1);

  return `
    <span class="timing-badge ${rating}" style="--badge-color: ${color}">
      ${icon} ${escapeHtml(label)}
    </span>
  `.trim();
}

/**
 * Render sequence progress indicator
 * @param {number} current - Current hit number
 * @param {number} total - Total hits in sequence
 * @param {Array} results - Results so far
 * @returns {string} HTML string
 */
export function renderSequenceProgress(current, total, results = []) {
  const dots = [];

  for (let i = 0; i < total; i++) {
    let dotClass = 'pending';
    let dotIcon = '\u25CB'; // Empty circle

    if (i < results.length) {
      const result = results[i];
      dotClass = result.rating;
      dotIcon = getRatingIcon(result.rating);
    } else if (i === current) {
      dotClass = 'active';
      dotIcon = '\u25CF'; // Filled circle
    }

    dots.push(`<span class="sequence-dot ${dotClass}">${dotIcon}</span>`);
  }

  return `
    <div class="timed-hit-sequence">
      <span class="sequence-label">Hit ${current + 1}/${total}</span>
      <div class="sequence-dots">${dots.join('')}</div>
    </div>
  `.trim();
}

/**
 * Render sequence summary
 * @param {Object} summary - Sequence calculation result
 * @returns {string} HTML string
 */
export function renderSequenceSummary(summary) {
  if (!summary) return '';

  const perfectIcon = '\u2605';
  const bonusPercent = Math.round((summary.totalBonus - 1) * 100);

  return `
    <div class="sequence-summary ${summary.allPerfect ? 'all-perfect' : ''}">
      <div class="summary-header">
        <span class="summary-title">Combo Complete!</span>
        ${summary.allPerfect ? `<span class="all-perfect-badge">${perfectIcon} All Perfect!</span>` : ''}
      </div>
      <div class="summary-stats">
        <span class="stat">Hits: ${summary.hitCount}</span>
        <span class="stat">Perfect: ${summary.perfectCount}</span>
        <span class="stat bonus">Bonus: +${bonusPercent}%</span>
      </div>
    </div>
  `.trim();
}

/**
 * Render quick-time event prompt
 * @param {string} type - Hit type
 * @param {string} key - Key to press (default: SPACE)
 * @returns {string} HTML string
 */
export function renderQTEPrompt(type = HIT_TYPE.ATTACK, key = 'SPACE') {
  const icon = getTypeIcon(type);
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

  return `
    <div class="qte-prompt ${type}">
      <div class="qte-icon">${icon}</div>
      <div class="qte-key">${escapeHtml(key)}</div>
      <div class="qte-label">${escapeHtml(typeLabel)}!</div>
    </div>
  `.trim();
}

/**
 * Render compact timing indicator for HUD
 * @param {Object} challenge - Active challenge
 * @param {number} currentTime - Current timestamp
 * @returns {string} HTML string
 */
export function renderCompactIndicator(challenge, currentTime) {
  if (!challenge) return '';

  const progress = getChallengeProgress(challenge, currentTime);
  const optimalPos = getOptimalPosition(challenge);
  const isNearOptimal = Math.abs(progress - optimalPos) < 10;

  return `
    <div class="timing-compact ${isNearOptimal ? 'near-optimal' : ''}">
      <div class="compact-track">
        <div class="compact-target" style="left: ${optimalPos}%"></div>
        <div class="compact-cursor" style="left: ${progress}%"></div>
      </div>
    </div>
  `.trim();
}

/**
 * Get CSS styles for timed hits UI
 * @returns {string} CSS string
 */
export function getTimedHitsStyles() {
  return `
    .timed-hit-bar {
      padding: 16px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 8px;
      border: 2px solid #333;
    }

    .timing-track {
      position: relative;
      height: 40px;
      background: #222;
      border-radius: 20px;
      overflow: hidden;
    }

    .timing-zone {
      position: absolute;
      top: 0;
      bottom: 0;
      border-radius: 20px;
    }

    .zone-ok {
      background: rgba(255, 255, 0, 0.2);
    }

    .zone-good {
      background: rgba(0, 255, 0, 0.3);
    }

    .zone-perfect {
      background: rgba(255, 215, 0, 0.5);
    }

    .timing-target {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 32px;
      height: 32px;
      background: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
      z-index: 1;
    }

    .target-icon {
      font-size: 18px;
    }

    .timing-cursor {
      position: absolute;
      top: 4px;
      bottom: 4px;
      width: 6px;
      background: linear-gradient(180deg, #f00, #f80);
      border-radius: 3px;
      transform: translateX(-50%);
      box-shadow: 0 0 8px rgba(255, 0, 0, 0.6);
      transition: left 16ms linear;
    }

    .timing-prompt {
      margin-top: 12px;
      text-align: center;
    }

    .prompt-text {
      font-size: 1.2em;
      font-weight: bold;
      color: #fff;
      animation: pulse-prompt 0.5s infinite;
    }

    .timed-hit-result {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 20px;
      border-radius: 8px;
      background: linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%);
      border: 2px solid var(--rating-color);
      animation: result-pop 0.3s ease-out;
    }

    .result-icon {
      font-size: 1.5em;
      color: var(--rating-color);
    }

    .result-text {
      flex: 1;
      font-weight: bold;
    }

    .result-bonus {
      color: var(--rating-color);
      font-weight: bold;
    }

    .timed-hit-result.perfect {
      background: linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(0,0,0,0.4) 100%);
      animation: result-pop 0.3s ease-out, glow-gold 1s infinite;
    }

    .timing-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 4px;
      background: rgba(0,0,0,0.4);
      border: 1px solid var(--badge-color);
      color: var(--badge-color);
      font-size: 0.85em;
      font-weight: bold;
    }

    .timed-hit-sequence {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      background: rgba(0,0,0,0.3);
      border-radius: 6px;
    }

    .sequence-label {
      color: #aaa;
      font-size: 0.9em;
    }

    .sequence-dots {
      display: flex;
      gap: 8px;
    }

    .sequence-dot {
      font-size: 1.2em;
      transition: transform 0.2s;
    }

    .sequence-dot.active {
      color: #fff;
      animation: pulse-dot 0.5s infinite;
    }

    .sequence-dot.perfect { color: #ffd700; }
    .sequence-dot.good { color: #00ff00; }
    .sequence-dot.ok { color: #ffff00; }
    .sequence-dot.miss { color: #ff4444; }

    .sequence-summary {
      padding: 16px;
      background: linear-gradient(135deg, #234 0%, #345 100%);
      border-radius: 8px;
      border: 2px solid #4af;
    }

    .sequence-summary.all-perfect {
      background: linear-gradient(135deg, #432 0%, #643 100%);
      border-color: #ffd700;
      animation: glow-gold 1.5s infinite;
    }

    .summary-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .summary-title {
      font-size: 1.2em;
      font-weight: bold;
    }

    .all-perfect-badge {
      color: #ffd700;
      font-weight: bold;
    }

    .summary-stats {
      display: flex;
      gap: 16px;
    }

    .summary-stats .stat {
      color: #aaa;
    }

    .summary-stats .stat.bonus {
      color: #4f4;
      font-weight: bold;
    }

    .qte-prompt {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 20px;
      background: rgba(0,0,0,0.7);
      border-radius: 12px;
      animation: qte-appear 0.2s ease-out;
    }

    .qte-icon {
      font-size: 2em;
    }

    .qte-key {
      font-size: 1.4em;
      font-weight: bold;
      padding: 8px 20px;
      background: #333;
      border: 3px solid #fff;
      border-radius: 8px;
      animation: key-pulse 0.4s infinite;
    }

    .qte-label {
      font-size: 1.1em;
      color: #aaa;
    }

    .timing-compact {
      display: inline-block;
      width: 60px;
      padding: 4px;
      background: rgba(0,0,0,0.4);
      border-radius: 4px;
    }

    .compact-track {
      position: relative;
      height: 8px;
      background: #333;
      border-radius: 4px;
    }

    .compact-target {
      position: absolute;
      top: -2px;
      width: 4px;
      height: 12px;
      background: #fff;
      transform: translateX(-50%);
    }

    .compact-cursor {
      position: absolute;
      top: 0;
      width: 4px;
      height: 100%;
      background: #f44;
      transform: translateX(-50%);
      transition: left 16ms linear;
    }

    .timing-compact.near-optimal .compact-cursor {
      background: #4f4;
      box-shadow: 0 0 6px #4f4;
    }

    @keyframes pulse-prompt {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.05); }
    }

    @keyframes result-pop {
      0% { transform: scale(0.8); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }

    @keyframes glow-gold {
      0%, 100% { box-shadow: 0 0 10px rgba(255, 215, 0, 0.5); }
      50% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.8); }
    }

    @keyframes pulse-dot {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.3); }
    }

    @keyframes qte-appear {
      0% { transform: scale(0.5); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }

    @keyframes key-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
  `.trim();
}
