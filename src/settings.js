/**
 * Settings Module
 * Manages user preferences like audio volume, display options, etc.
 * Settings persist to localStorage separately from game saves.
 */

const STORAGE_KEY = 'aiVillageRpgSettings';

/**
 * Default settings values
 * @returns {Object} Default settings object
 */
export function getDefaultSettings() {
  return {
    audio: {
      masterVolume: 0.7,
      sfxVolume: 1.0,
      musicVolume: 0.5,
      muted: false,
    },
    display: {
      showDamageNumbers: true,
      showStatusIcons: true,
      compactLog: false,
    },
    gameplay: {
      autoSave: true,
      confirmFlee: true,
      showTutorialHints: true,
    },
  };
}

/**
 * Load settings from localStorage
 * @returns {Object} Settings object (merged with defaults for any missing keys)
 */
export function loadSettings() {
  const defaults = getDefaultSettings();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    // Deep merge with defaults to handle missing keys
    return deepMerge(defaults, parsed);
  } catch {
    return defaults;
  }
}

/**
 * Save settings to localStorage
 * @param {Object} settings - Settings object to save
 */
export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

/**
 * Update a specific setting path
 * @param {Object} settings - Current settings
 * @param {string} path - Dot-notation path (e.g., 'audio.masterVolume')
 * @param {*} value - New value
 * @returns {Object} New settings object with updated value
 */
export function updateSetting(settings, path, value) {
  const parts = path.split('.');
  const result = { ...settings };
  let current = result;
  
  for (let i = 0; i < parts.length - 1; i++) {
    current[parts[i]] = { ...current[parts[i]] };
    current = current[parts[i]];
  }
  
  current[parts[parts.length - 1]] = value;
  return result;
}

/**
 * Get a setting value by path
 * @param {Object} settings - Settings object
 * @param {string} path - Dot-notation path (e.g., 'audio.masterVolume')
 * @returns {*} Setting value or undefined
 */
export function getSetting(settings, path) {
  const parts = path.split('.');
  let current = settings;
  
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  
  return current;
}

/**
 * Reset settings to defaults
 * @returns {Object} Default settings
 */
export function resetSettings() {
  const defaults = getDefaultSettings();
  saveSettings(defaults);
  return defaults;
}

/**
 * Deep merge two objects (target wins on conflicts)
 * @param {Object} base - Base object
 * @param {Object} override - Override object
 * @returns {Object} Merged object
 */
function deepMerge(base, override) {
  const result = { ...base };
  
  for (const key of Object.keys(override)) {
    if (
      typeof base[key] === 'object' &&
      base[key] !== null &&
      typeof override[key] === 'object' &&
      override[key] !== null &&
      !Array.isArray(base[key])
    ) {
      result[key] = deepMerge(base[key], override[key]);
    } else {
      result[key] = override[key];
    }
  }
  
  return result;
}
