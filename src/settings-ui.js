/**
 * Settings UI Module
 * Renders settings panel with controls for audio, display, and gameplay options.
 */

import { getDefaultSettings } from './settings.js';

/**
 * HTML-escape a string
 * @param {string} s - String to escape
 * @returns {string} Escaped string
 */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Render a slider control
 * @param {string} id - Control ID
 * @param {string} label - Display label
 * @param {number} value - Current value (0-1)
 * @param {boolean} disabled - Whether control is disabled
 * @returns {string} HTML string
 */
export function renderSlider(id, label, value, disabled = false) {
  const percent = Math.round(value * 100);
  return `
    <div class="setting-row">
      <label for="${esc(id)}">${esc(label)}</label>
      <input type="range" id="${esc(id)}" 
             min="0" max="100" value="${percent}" 
             ${disabled ? 'disabled' : ''}
             class="setting-slider">
      <span class="setting-value">${percent}%</span>
    </div>
  `;
}

/**
 * Render a checkbox control
 * @param {string} id - Control ID
 * @param {string} label - Display label
 * @param {boolean} checked - Current state
 * @returns {string} HTML string
 */
export function renderCheckbox(id, label, checked) {
  return `
    <div class="setting-row">
      <label for="${esc(id)}">${esc(label)}</label>
      <input type="checkbox" id="${esc(id)}" 
             ${checked ? 'checked' : ''}
             class="setting-checkbox">
    </div>
  `;
}

/**
 * Render a section header
 * @param {string} title - Section title
 * @param {string} icon - Emoji icon
 * @returns {string} HTML string
 */
export function renderSectionHeader(title, icon) {
  return `<div class="settings-section-header">${icon} ${esc(title)}</div>`;
}

/**
 * Render the full settings panel
 * @param {Object} settings - Current settings object
 * @returns {string} HTML string
 */
export function renderSettingsPanel(settings) {
  const defaults = getDefaultSettings();
  const s = settings || defaults;
  
  const audioSection = `
    ${renderSectionHeader('Audio', '🔊')}
    ${renderCheckbox('setting-muted', 'Mute All Audio', s.audio?.muted ?? false)}
    ${renderSlider('setting-master-volume', 'Master Volume', s.audio?.masterVolume ?? 0.7, s.audio?.muted)}
    ${renderSlider('setting-sfx-volume', 'Sound Effects', s.audio?.sfxVolume ?? 1.0, s.audio?.muted)}
    ${renderSlider('setting-music-volume', 'Music', s.audio?.musicVolume ?? 0.5, s.audio?.muted)}
  `;
  
  const displaySection = `
    ${renderSectionHeader('Display', '🖥️')}
    ${renderCheckbox('setting-damage-numbers', 'Show Damage Numbers', s.display?.showDamageNumbers ?? true)}
    ${renderCheckbox('setting-status-icons', 'Show Status Icons', s.display?.showStatusIcons ?? true)}
    ${renderCheckbox('setting-compact-log', 'Compact Combat Log', s.display?.compactLog ?? false)}
  `;
  
  const gameplaySection = `
    ${renderSectionHeader('Gameplay', '🎮')}
    ${renderCheckbox('setting-auto-save', 'Auto-Save on Room Change', s.gameplay?.autoSave ?? true)}
    ${renderCheckbox('setting-confirm-flee', 'Confirm Before Fleeing', s.gameplay?.confirmFlee ?? true)}
    ${renderCheckbox('setting-tutorial-hints', 'Show Tutorial Hints', s.gameplay?.showTutorialHints ?? true)}
  `;
  
  return `
    <div class="settings-panel card">
      <h2>⚙️ Settings</h2>
      ${audioSection}
      ${displaySection}
      ${gameplaySection}
      <div class="settings-actions">
        <button id="btnCloseSettings">✕ Close Settings</button>
        <button id="btnResetSettings" class="secondary">Reset to Defaults</button>
      </div>
    </div>
  `;
}

/**
 * Get CSS styles for the settings panel
 * @returns {string} CSS string
 */
export function getSettingsStyles() {
  return `
    .settings-panel {
      max-width: 450px;
      padding: 16px;
    }
    .settings-panel h2 {
      margin: 0 0 16px 0;
      border-bottom: 2px solid #555;
      padding-bottom: 8px;
    }
    .settings-section-header {
      font-weight: bold;
      margin: 16px 0 8px 0;
      font-size: 1.1em;
      color: #aaa;
    }
    .settings-section-header:first-of-type {
      margin-top: 0;
    }
    .setting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dotted #333;
    }
    .setting-row label {
      flex: 1;
      color: #ccc;
    }
    .setting-slider {
      width: 120px;
      margin: 0 8px;
    }
    .setting-value {
      width: 40px;
      text-align: right;
      font-family: monospace;
      color: #fff;
    }
    .setting-checkbox {
      width: 20px;
      height: 20px;
    }
    .settings-actions {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #555;
      text-align: center;
    }
    .settings-actions button.secondary {
      background: #444;
      color: #ccc;
    }
    .settings-actions button.secondary:hover {
      background: #555;
    }
    #btnCloseSettings {
      background: #3a7bd5;
      color: #fff;
      border: none;
      padding: 8px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1em;
      margin-right: 8px;
    }
    #btnCloseSettings:hover {
      background: #2a5fb5;
    }
    input[type="range"]:disabled {
      opacity: 0.5;
    }
  `;
}

/**
 * Attach event handlers for settings controls
 * @param {Object} settings - Current settings
 * @param {Function} onUpdate - Callback when setting changes (path, value)
 * @param {Function} onReset - Callback when reset button clicked
 */
export function attachSettingsHandlers(settings, onUpdate, onReset) {
  // Audio mute toggle
  const muteEl = document.getElementById('setting-muted');
  if (muteEl) {
    muteEl.onchange = () => {
      onUpdate('audio.muted', muteEl.checked);
    };
  }
  
  // Volume sliders
  const sliderMap = {
    'setting-master-volume': 'audio.masterVolume',
    'setting-sfx-volume': 'audio.sfxVolume',
    'setting-music-volume': 'audio.musicVolume',
  };
  
  for (const [id, path] of Object.entries(sliderMap)) {
    const el = document.getElementById(id);
    if (el) {
      el.oninput = () => {
        const valueSpan = el.nextElementSibling;
        if (valueSpan) valueSpan.textContent = el.value + '%';
      };
      el.onchange = () => {
        onUpdate(path, parseInt(el.value, 10) / 100);
      };
    }
  }
  
  // Display checkboxes
  const checkboxMap = {
    'setting-damage-numbers': 'display.showDamageNumbers',
    'setting-status-icons': 'display.showStatusIcons',
    'setting-compact-log': 'display.compactLog',
    'setting-auto-save': 'gameplay.autoSave',
    'setting-confirm-flee': 'gameplay.confirmFlee',
    'setting-tutorial-hints': 'gameplay.showTutorialHints',
  };
  
  for (const [id, path] of Object.entries(checkboxMap)) {
    const el = document.getElementById(id);
    if (el) {
      el.onchange = () => {
        onUpdate(path, el.checked);
      };
    }
  }
  
  // Reset button
  const resetBtn = document.getElementById('btnResetSettings');
  if (resetBtn) {
    resetBtn.onclick = onReset;
  }
}
