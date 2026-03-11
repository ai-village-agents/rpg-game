/**
 * UI Themes Module
 * Color palettes for different visual themes
 */

export const THEMES = {
  midnight: {
    id: 'midnight',
    name: 'Midnight (Default)',
    colors: {
      bg: '#0b1020',
      panel: '#121a33',
      text: '#e8eeff',
      muted: '#a7b3da',
      accent: '#7aa2ff',
      bad: '#ff6b6b',
      good: '#57d38c',
      gradientStart: '#4a6cf7',
      gradientEnd: '#7aa2ff',
    },
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    colors: {
      bg: '#0d1a0d',
      panel: '#152415',
      text: '#e8ffe8',
      muted: '#a7daa7',
      accent: '#7aff7a',
      bad: '#ff6b6b',
      good: '#57d38c',
      gradientStart: '#2d8a4e',
      gradientEnd: '#7aff7a',
    },
  },
  crimson: {
    id: 'crimson',
    name: 'Crimson',
    colors: {
      bg: '#1a0d0d',
      panel: '#251515',
      text: '#ffe8e8',
      muted: '#daa7a7',
      accent: '#ff7a7a',
      bad: '#ff6b6b',
      good: '#57d38c',
      gradientStart: '#c44a4a',
      gradientEnd: '#ff7a7a',
    },
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    colors: {
      bg: '#0d1a1a',
      panel: '#152525',
      text: '#e8ffff',
      muted: '#a7dada',
      accent: '#7affff',
      bad: '#ff6b6b',
      good: '#57d38c',
      gradientStart: '#2a7a8a',
      gradientEnd: '#7affff',
    },
  },
  light: {
    id: 'light',
    name: 'Light Mode',
    colors: {
      bg: '#f5f5f5',
      panel: '#ffffff',
      text: '#1a1a2e',
      muted: '#666680',
      accent: '#3366cc',
      bad: '#cc3333',
      good: '#339944',
      gradientStart: '#4488dd',
      gradientEnd: '#3366cc',
    },
  },
};

export const DEFAULT_THEME = 'midnight';

/**
 * Apply a theme to the document
 * @param {string} themeId - Theme ID to apply
 */
export function applyTheme(themeId) {
  if (typeof document === 'undefined') return;
  const theme = THEMES[themeId] || THEMES[DEFAULT_THEME];
  const root = document.documentElement;
  
  for (const [key, value] of Object.entries(theme.colors)) {
    // Convert camelCase to kebab-case for CSS variables
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    root.style.setProperty(`--${cssKey}`, value);
  }
}

/**
 * Get list of available themes for UI
 * @returns {Array<{id: string, name: string}>}
 */
export function getThemeList() {
  return Object.values(THEMES).map(t => ({ id: t.id, name: t.name }));
}
